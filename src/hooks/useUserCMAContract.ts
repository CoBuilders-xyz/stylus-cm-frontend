import { useCallback, useMemo } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { CACHE_MANAGER_AUTOMATION_ABI } from '@/config/abis/cacheManagerAutomation/cacheManagerAutomation';
import {
  findCMAContractConfig,
  type CMAContractConfig,
} from '@/lib/cma';

/**
 * Shape of a single entry returned by `CacheManagerAutomation.getUserContracts`
 * (CMA v2.0). Order matches the `ContractConfig` tuple layout in the ABI:
 * `(address contractAddress, bool biddingEnabled, bool autoActivate, uint256 maxBid, uint256 maxActivationCost)`.
 *
 * `biddingEnabled` replaces the v1 `enabled` field. It gates automated
 * bidding only; `autoActivate` independently gates activation.
 */
export type CMAUserContract = CMAContractConfig;

export interface UseUserCMAContractResult {
  /**
   * The connected user's CMA record for the given `contractAddress`, or `null`
   * when the contract is not registered under this user. `undefined` while the
   * read has not yet resolved.
   */
  data: CMAUserContract | null | undefined;
  /** Convenience — true when `data` exists (the contract is registered on-chain). */
  isRegistered: boolean;
  /**
   * CMA-enforced floor for the `maxBid` field on every write. `insertContract`
   * / `updateContract` revert with `InvalidBid()` when `maxBid` is below this
   * value, *even when `biddingEnabled === false`* — so Activation-first flows
   * must seed `maxBid` with this floor (nominal, never executes because
   * bidding is off) instead of `0n`. `undefined` while the read has not
   * resolved.
   */
  minMaxBidAmount: bigint | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Reads the connected user's per-contract config directly from the
 * CacheManagerAutomation contract, bypassing the backend indexer. Both the
 * Activation tab and `AutomatedBiddingSection` use this as the source of
 * truth for the fields they need to *preserve* when submitting an atomic
 * `updateContract` / `insertContract` write — the backend can lag by
 * ~1 min after a successful write, and reading through it would let one
 * tab clobber the just-submitted values of the other.
 *
 * The chain itself is authoritative and updates immediately on tx
 * confirmation, so consumers should call `refetch()` from their
 * `onConfirmed` callback to keep the local view in lockstep.
 *
 * The ABI defines `ContractConfig` with **named** components, so viem
 * decodes each tuple as an object (`c.contractAddress`, `c.biddingEnabled`,
 * ...). The name → position mapping lives in the ABI, which is why the ABI
 * must match the deployed CMA version exactly (see `src/lib/cma.test.ts`).
 */
export function useUserCMAContract({
  chainId,
  cmaAddress,
  contractAddress,
}: {
  chainId: number | undefined;
  cmaAddress: `0x${string}` | undefined;
  contractAddress: string | undefined;
}): UseUserCMAContractResult {
  const { address: userAddress, isConnected } = useAccount();

  const {
    data: rawContracts,
    error: contractsError,
    isLoading: isContractsLoading,
    refetch: refetchContracts,
  } = useReadContract({
    address: cmaAddress,
    abi: CACHE_MANAGER_AUTOMATION_ABI,
    functionName: 'getUserContracts',
    // `getUserContracts` reads via `msg.sender`, so we must pass the
    // connected wallet as `account` — otherwise the CMA sees the zero
    // address and returns an empty array.
    account: userAddress,
    chainId,
    query: {
      enabled:
        isConnected &&
        userAddress != null &&
        cmaAddress != null &&
        chainId != null,
    },
  });

  // Public CMA constant — independent of the connected wallet. Reads
  // through the same wagmi cache so parallel consumers of this hook
  // dedupe to a single RPC call.
  const {
    data: rawMinMaxBid,
    error: minMaxBidError,
    isLoading: isMinMaxBidLoading,
    refetch: refetchMinMaxBid,
  } = useReadContract({
    address: cmaAddress,
    abi: CACHE_MANAGER_AUTOMATION_ABI,
    functionName: 'minMaxBidAmount',
    chainId,
    query: {
      enabled: cmaAddress != null && chainId != null,
    },
  });
  const minMaxBidAmount =
    typeof rawMinMaxBid === 'bigint' ? rawMinMaxBid : undefined;

  const data = useMemo<CMAUserContract | null | undefined>(
    () =>
      findCMAContractConfig(
        rawContracts as readonly CMAContractConfig[] | undefined,
        contractAddress
      ),
    [rawContracts, contractAddress]
  );

  const refetchStable = useCallback(() => {
    refetchContracts();
    refetchMinMaxBid();
  }, [refetchContracts, refetchMinMaxBid]);

  return {
    data,
    isRegistered: data != null,
    minMaxBidAmount,
    // Combined so callers gate their skeleton / error UI on the whole
    // hook resolving, not just one of the two reads. Without this a
    // failure in `minMaxBidAmount` would leave the config editor
    // stuck on the skeleton forever with no path to recover.
    isLoading: isContractsLoading || isMinMaxBidLoading,
    error:
      (contractsError as Error | null) ??
      (minMaxBidError as Error | null) ??
      null,
    refetch: refetchStable,
  };
}
