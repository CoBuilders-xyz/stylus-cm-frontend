import { useCallback, useEffect, useMemo, useRef } from 'react';
import { isAddress, type Abi } from 'viem';
import {
  useAccount,
  useChainId,
  useSimulateContract,
  useSwitchChain,
} from 'wagmi';
import cacheManagerAutomationAbi from '@/config/abis/cacheManagerAutomation/CacheManagerAutomation.json';
import { showErrorToast, showSuccessToast } from '@/components/Toast';
import { TransactionStatus, useWeb3 } from '@/hooks/useWeb3';

export interface UseConfigureAutoActivationParams {
  /** WASM contract whose CMA auto-activation config is being edited. */
  contractAddress: string | undefined;
  /** Chain the write must happen on. */
  targetChainId: number | undefined;
  /** CMA contract address on that chain (`Blockchain.cacheManagerAutomationAddress`). */
  cmaAddress: `0x${string}` | undefined;
  /**
   * Additional gate on top of the standard "address + chain + wallet OK"
   * checks. Callers set this to `false` while the form is pristine (no
   * unsaved edits) so we don't spam simulate calls with the same args
   * that will always succeed. Defaults to `true` for callers that don't
   * differentiate dirty vs pristine.
   */
  enabled?: boolean;
  /**
   * Whether the contract is already registered in the CMA. Drives the choice
   * of `insertContract` (first-time add, value 0) vs `updateContract`. The
   * caller derives this from any CMA-backed field on `Contract` being
   * non-default (`isAutomated`, `autoActivate`, non-null `maxBid`, etc.).
   */
  isRegistered: boolean;
  /**
   * Current bidding-side values to preserve. Both `updateContract` and
   * `insertContract` take all five fields atomically; if we don't echo the
   * live values back, we silently overwrite the user's bidding config.
   *
   * For an unregistered contract the tab passes `maxBid: 0n, enabled: false`
   * — bidding stays off by default. Once registered, the tab reads the
   * live values from the backend `Contract` and forwards them here.
   */
  currentMaxBid: bigint;
  currentBiddingEnabled: boolean;
  /** New values the user wants to persist. */
  autoActivate: boolean;
  maxActivationCost: bigint;
  /**
   * Fires once the tx is confirmed on-chain, after the success toast.
   * Use it to refetch the enriched contract detail so the tab reflects
   * the just-persisted config.
   */
  onConfirmed?: () => void;
}

export interface UseConfigureAutoActivationResult {
  isConnected: boolean;
  isChainMismatch: boolean;
  isSwitchingChain: boolean;
  switchToTarget: () => void;
  isSimulating: boolean;
  simulationError: Error | null;
  refetchSimulation: () => void;
  isSaving: boolean;
  isConfirmed: boolean;
  txHash: `0x${string}` | undefined;
  save: () => void;
  reset: () => void;
}

/**
 * Encapsulates the on-chain "configure auto-activation" flow: pick
 * `insertContract` vs `updateContract` on the CacheManagerAutomation
 * contract, simulate to catch reverts before the wallet prompt, guard
 * against wallet/chain mismatches, and translate wallet errors into
 * toasts. Shares its shape with `useActivateProgram` so the two hooks
 * feel like siblings from the tab's side (same ref-based confirmation
 * guard, same retry pattern on the error toast).
 *
 * The write is atomic on all five CMA fields — the caller is responsible
 * for echoing the current bidding fields back so we don't clobber the
 * user's `AutomatedBiddingSection` config. See COB-499.
 */
export function useConfigureAutoActivation({
  contractAddress,
  targetChainId,
  cmaAddress,
  isRegistered,
  currentMaxBid,
  currentBiddingEnabled,
  autoActivate,
  maxActivationCost,
  onConfirmed,
  enabled = true,
}: UseConfigureAutoActivationParams): UseConfigureAutoActivationResult {
  const { isConnected } = useAccount();
  const walletChainId = useChainId();
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain();
  const isChainMismatch =
    isConnected && targetChainId != null && walletChainId !== targetChainId;

  const isValidAddress =
    typeof contractAddress === 'string' && isAddress(contractAddress);

  const {
    writeContract,
    status,
    txHash,
    error: writeError,
    reset,
  } = useWeb3();

  const isSaving =
    status === TransactionStatus.PREPARING ||
    status === TransactionStatus.PENDING;
  const isConfirmed = status === TransactionStatus.SUCCESS;

  const functionName = isRegistered ? 'updateContract' : 'insertContract';
  const args = useMemo(() => {
    if (!isValidAddress) return undefined;
    return [
      contractAddress as `0x${string}`,
      currentMaxBid,
      currentBiddingEnabled,
      autoActivate,
      maxActivationCost,
    ] as const;
  }, [
    autoActivate,
    contractAddress,
    currentBiddingEnabled,
    currentMaxBid,
    isValidAddress,
    maxActivationCost,
  ]);

  const {
    error: simulationError,
    isLoading: isSimulating,
    refetch: refetchSimulation,
  } = useSimulateContract({
    address: cmaAddress,
    abi: cacheManagerAutomationAbi.abi as Abi,
    functionName,
    args: args as readonly unknown[] | undefined,
    // `insertContract` is payable; the caller is expected to have funded
    // their CMA balance via the Gas Tank surface. Sending 0 here means
    // "no additional funding in this tx" — the write goes through as
    // long as the user is registered or the CMA does not require a
    // minimum fund at insert time.
    value: BigInt(0),
    chainId: targetChainId,
    query: {
      enabled:
        enabled &&
        isConnected &&
        isValidAddress &&
        !isChainMismatch &&
        !isSaving &&
        !isConfirmed &&
        targetChainId != null &&
        cmaAddress != null,
    },
  });

  const switchToTarget = useCallback(() => {
    if (targetChainId == null) {
      showErrorToast({
        message: 'Target network is not set yet. Try again in a moment.',
      });
      return;
    }
    switchChain({ chainId: targetChainId });
  }, [switchChain, targetChainId]);

  const save = useCallback(() => {
    if (!isConnected) {
      showErrorToast({
        message: 'Connect your wallet to save this configuration.',
      });
      return;
    }
    if (isChainMismatch) {
      switchToTarget();
      return;
    }
    if (!isValidAddress || cmaAddress == null || args == null) {
      showErrorToast({
        message: 'Configuration is not ready yet. Try again in a moment.',
      });
      return;
    }
    writeContract({
      address: cmaAddress,
      abi: cacheManagerAutomationAbi.abi as Abi,
      functionName,
      args: args as readonly unknown[],
      value: BigInt(0),
      chainId: targetChainId,
    });
  }, [
    args,
    cmaAddress,
    functionName,
    isChainMismatch,
    isConnected,
    isValidAddress,
    switchToTarget,
    targetChainId,
    writeContract,
  ]);

  // Same ref-based guards used in `useActivateProgram` — the parent may
  // pass an inline `onConfirmed`, and the retry surface on the error
  // toast needs to always reach the freshest `save` closure.
  const onConfirmedRef = useRef(onConfirmed);
  useEffect(() => {
    onConfirmedRef.current = onConfirmed;
  }, [onConfirmed]);

  const saveRef = useRef<() => void>(() => {});
  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  const hasFiredConfirmationRef = useRef(false);
  useEffect(() => {
    if (isConfirmed) {
      if (hasFiredConfirmationRef.current) return;
      hasFiredConfirmationRef.current = true;
      showSuccessToast({ message: 'Auto-activation config saved.' });
      onConfirmedRef.current?.();
    } else {
      hasFiredConfirmationRef.current = false;
    }
  }, [isConfirmed]);

  useEffect(() => {
    if (!writeError) return;
    const message = writeError.message ?? '';
    const lower = message.toLowerCase();
    let display = 'Save failed. Please try again.';
    if (
      lower.includes('user rejected') ||
      lower.includes('user denied') ||
      lower.includes('rejected the request')
    ) {
      display = 'Save cancelled in wallet.';
    } else if (
      lower.includes('insufficient funds') ||
      lower.includes('insufficient balance') ||
      lower.includes('exceeds the balance')
    ) {
      display = 'Insufficient ETH to cover the gas fee.';
    } else if (lower.includes('network fee is extremely high')) {
      display = message;
    }
    showErrorToast({
      message: display,
      onRetry: () => saveRef.current(),
    });
    reset();
  }, [writeError, reset]);

  const refetchSimulationStable = useCallback(() => {
    refetchSimulation();
  }, [refetchSimulation]);

  return {
    isConnected,
    isChainMismatch,
    isSwitchingChain,
    switchToTarget,
    isSimulating,
    simulationError: simulationError ?? null,
    refetchSimulation: refetchSimulationStable,
    isSaving,
    isConfirmed,
    txHash,
    save,
    reset,
  };
}
