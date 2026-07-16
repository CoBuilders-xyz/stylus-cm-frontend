import { useCallback, useMemo } from 'react';
import { type Abi } from 'viem';
import { useAccount, useReadContract } from 'wagmi';
import cacheManagerAutomationAbi from '@/config/abis/cacheManagerAutomation/CacheManagerAutomation.json';

/**
 * Shape of a single entry returned by `CacheManagerAutomation.getUserContracts`.
 * Order matches the tuple layout in the ABI:
 * `(address contractAddress, uint256 maxBid, bool enabled, bool autoActivate, uint256 maxActivationCost)`.
 */
export interface CMAUserContract {
  contractAddress: `0x${string}`;
  maxBid: bigint;
  enabled: boolean;
  autoActivate: boolean;
  maxActivationCost: bigint;
}

export interface UseUserCMAContractResult {
  /**
   * The connected user's CMA record for the given `contractAddress`, or `null`
   * when the contract is not registered under this user. `undefined` while the
   * read has not yet resolved.
   */
  data: CMAUserContract | null | undefined;
  /** Convenience — true when `data` exists (the contract is registered on-chain). */
  isRegistered: boolean;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Shape viem returns for each element of the `getUserContracts` array. The
 * ABI defines a struct with **named** fields, so viem decodes the tuples
 * as objects (not positional arrays) — matches how the existing
 * `AutomatedBiddingSection` code already accesses `c.contractAddress`,
 * `c.enabled`, etc.
 */
type CMAUserContractTuple = {
  contractAddress: `0x${string}`;
  maxBid: bigint;
  enabled: boolean;
  autoActivate: boolean;
  maxActivationCost: bigint;
};

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
    error,
    isLoading,
    refetch,
  } = useReadContract({
    address: cmaAddress,
    abi: cacheManagerAutomationAbi.abi as Abi,
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

  const data = useMemo<CMAUserContract | null | undefined>(() => {
    if (rawContracts == null) return undefined;
    if (contractAddress == null) return null;
    const tuples = rawContracts as readonly CMAUserContractTuple[];
    const target = contractAddress.toLowerCase();
    const match = tuples.find(
      (entry) => entry.contractAddress.toLowerCase() === target
    );
    if (!match) return null;
    return {
      contractAddress: match.contractAddress,
      maxBid: match.maxBid,
      enabled: match.enabled,
      autoActivate: match.autoActivate,
      maxActivationCost: match.maxActivationCost,
    };
  }, [rawContracts, contractAddress]);

  const refetchStable = useCallback(() => {
    refetch();
  }, [refetch]);

  return {
    data,
    isRegistered: data != null,
    isLoading,
    error: (error as Error | null) ?? null,
    refetch: refetchStable,
  };
}
