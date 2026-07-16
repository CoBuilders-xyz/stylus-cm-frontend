'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { parseEther } from 'viem';
import {
  useAccount,
  useChainId,
  useSimulateContract,
  useSwitchChain,
} from 'wagmi';
import {
  ARB_WASM_ABI,
  ARB_WASM_PRECOMPILE,
} from '@/config/abis/arbWasm/arbWasm';
import { showErrorToast, showSuccessToast } from '@/components/Toast';
import { TransactionStatus, useWeb3 } from '@/hooks/useWeb3';

/**
 * Over-pay used to discover the program's dataFee via `useSimulateContract`.
 * `ArbWasm.activateProgram` refunds excess value, so the actual charge is
 * the fee returned by the simulation — this value only has to be strictly
 * larger than the largest fee we expect to see in practice.
 */
export const ACTIVATION_SIMULATION_VALUE = parseEther('0.01');

export interface UseActivateProgramParams {
  /** Address of the WASM program to activate. Simulation waits until this is a valid 42-char address. */
  address: string | undefined;
  /** Chain the activation must happen on. Simulation waits until this is set. */
  targetChainId: number | undefined;
  /**
   * Additional gate on top of the internal "address + chain + wallet OK"
   * checks — set to `false` while the caller is not yet sure the program
   * needs activation (e.g. bytecode still loading in AddContract).
   */
  enabled?: boolean;
  /**
   * Fires once the activation transaction is confirmed on-chain, right
   * after the success toast. Use it to refetch anything derived from
   * `programTimeLeft` or the backend contract detail.
   */
  onConfirmed?: () => void;
}

export interface UseActivateProgramResult {
  isConnected: boolean;
  isChainMismatch: boolean;
  isSwitchingChain: boolean;
  switchToTarget: () => void;
  isSimulating: boolean;
  simulationError: Error | null;
  /** `undefined` while the simulation has not yet resolved. `0n` is a valid fee. */
  dataFee: bigint | undefined;
  isActivating: boolean;
  isConfirmed: boolean;
  txHash: `0x${string}` | undefined;
  activate: () => void;
  reset: () => void;
}

/**
 * Encapsulates the on-chain "activate this Stylus program" flow: simulate to
 * discover the ArbWasm dataFee, guard against wallet/chain mismatches, write
 * through the project-wide `useWeb3` wrapper, and translate the resulting
 * errors into user-facing toasts. Shared between the AddContract activation
 * card and the per-contract Activation tab so both surfaces stay in lockstep.
 *
 * The write drops `useWeb3`'s default 1M gasLimit because
 * `ArbWasm.activateProgram` compiles the WASM in-transaction and burns
 * 2-3M gas even for tiny programs (measured 2.28M on Arb Sepolia for a 6 KB
 * hello-world). The 500 gwei price ceiling from the default is preserved.
 */
export function useActivateProgram({
  address,
  targetChainId,
  enabled = true,
  onConfirmed,
}: UseActivateProgramParams): UseActivateProgramResult {
  const { isConnected } = useAccount();
  const walletChainId = useChainId();
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain();
  const isChainMismatch =
    isConnected && targetChainId != null && walletChainId !== targetChainId;

  const isValidAddress =
    typeof address === 'string' && address.length === 42;

  const {
    data: simulation,
    error: simulationError,
    isLoading: isSimulating,
  } = useSimulateContract({
    address: ARB_WASM_PRECOMPILE,
    abi: ARB_WASM_ABI,
    functionName: 'activateProgram',
    args: isValidAddress ? [address as `0x${string}`] : undefined,
    value: ACTIVATION_SIMULATION_VALUE,
    chainId: targetChainId,
    query: {
      enabled:
        enabled &&
        isConnected &&
        isValidAddress &&
        !isChainMismatch &&
        targetChainId != null,
    },
  });

  const dataFee = useMemo(() => {
    const result = simulation?.result as
      | readonly [number, bigint]
      | undefined;
    return result?.[1];
  }, [simulation]);

  const {
    writeContract,
    status,
    txHash,
    error: writeError,
    reset,
  } = useWeb3();

  const isActivating =
    status === TransactionStatus.PREPARING ||
    status === TransactionStatus.PENDING;
  const isConfirmed = status === TransactionStatus.SUCCESS;

  const switchToTarget = useCallback(() => {
    if (targetChainId != null) {
      switchChain({ chainId: targetChainId });
    }
  }, [switchChain, targetChainId]);

  const activate = useCallback(() => {
    if (!isConnected) {
      showErrorToast({
        message: 'Connect your wallet to activate this contract.',
      });
      return;
    }
    if (isChainMismatch) {
      // The UI surfaces a dedicated Switch button; guard the write path
      // just in case it gets invoked before the mismatch is resolved.
      switchToTarget();
      return;
    }
    if (!isValidAddress) {
      showErrorToast({
        message: 'Enter a valid contract address to activate.',
      });
      return;
    }
    // Nullish check rather than truthy so a legitimate 0n fee is not
    // treated as missing (the ArbWasm precompile can, in theory, return
    // a zero dataFee for a program that has already paid its allowance).
    if (dataFee == null) {
      showErrorToast({
        message:
          simulationError?.message ??
          'Unable to estimate the activation fee. Try again in a moment.',
      });
      return;
    }
    writeContract({
      address: ARB_WASM_PRECOMPILE,
      abi: ARB_WASM_ABI,
      functionName: 'activateProgram',
      args: [address as `0x${string}`],
      value: dataFee,
      chainId: targetChainId,
      gasProtection: { maxGasPriceGwei: 500 },
    });
  }, [
    address,
    dataFee,
    isChainMismatch,
    isConnected,
    isValidAddress,
    simulationError,
    switchToTarget,
    targetChainId,
    writeContract,
  ]);

  useEffect(() => {
    if (!isConfirmed) return;
    showSuccessToast({ message: 'Contract activated successfully.' });
    onConfirmed?.();
  }, [isConfirmed, onConfirmed]);

  useEffect(() => {
    if (!writeError) return;
    const message = writeError.message ?? '';
    const lower = message.toLowerCase();
    let display = 'Activation failed. Please try again.';
    if (
      lower.includes('user rejected') ||
      lower.includes('user denied') ||
      lower.includes('rejected the request')
    ) {
      display = 'Activation cancelled in wallet.';
    } else if (
      lower.includes('insufficient funds') ||
      lower.includes('insufficient balance') ||
      lower.includes('exceeds the balance')
    ) {
      display = 'Insufficient ETH to cover the activation fee.';
    } else if (lower.includes('network fee is extremely high')) {
      // Surface the gas-price-protection message from useWeb3 as-is.
      display = message;
    }
    showErrorToast({ message: display, onRetry: activate });
    reset();
    // `activate` changes on every render because it depends on `dataFee`;
    // including it here would re-fire the toast on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [writeError, reset]);

  return {
    isConnected,
    isChainMismatch,
    isSwitchingChain,
    switchToTarget,
    isSimulating,
    simulationError: simulationError ?? null,
    dataFee,
    isActivating,
    isConfirmed,
    txHash,
    activate,
    reset,
  };
}
