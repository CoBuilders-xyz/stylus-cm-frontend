'use client';

import { formatEther } from 'viem';
import { AlertTriangle, ExternalLink, Loader2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { explorerTxUrl } from '@/utils/explorer';

export interface ExpiredActivationCardProps {
  message: string;
  isConnected: boolean;
  isSimulating: boolean;
  simulationError: Error | null;
  dataFee: bigint | undefined;
  isActivating: boolean;
  isChainMismatch: boolean;
  isSwitchingChain: boolean;
  chainName: string | undefined;
  onSwitchChain: () => void;
  txHash: `0x${string}` | undefined;
  chainId: number | undefined;
  onActivate: () => void;
}

export default function ExpiredActivationCard({
  message,
  isConnected,
  isSimulating,
  simulationError,
  dataFee,
  isActivating,
  isChainMismatch,
  isSwitchingChain,
  chainName,
  onSwitchChain,
  txHash,
  chainId,
  onActivate,
}: ExpiredActivationCardProps) {
  const txUrl = txHash ? explorerTxUrl(chainId, txHash) : null;
  const targetChainLabel = chainName ?? 'the selected network';
  // Nullish check on dataFee — 0n is a valid fee, not "missing".
  const hasDataFee = dataFee != null;
  const feeLabel = hasDataFee
    ? `${Number(formatEther(dataFee)).toFixed(6)} ETH`
    : null;
  // Any time we don't have a fee (still loading, simulation failed, or
  // wallet not yet connected), activation cannot proceed. Previously this
  // was `(!hasDataFee && !simulationError)`, which left the button
  // enabled on a simulation failure — clicking then dead-ended in the
  // error toast without actually retrying the simulation.
  const cannotActivate =
    !isConnected || isActivating || isChainMismatch || !hasDataFee;

  return (
    <div className='mt-3 rounded-md border border-amber-400/60 bg-amber-500/10 p-4'>
      <div className='flex items-start gap-2'>
        <AlertTriangle className='h-4 w-4 text-amber-300 mt-0.5 shrink-0' />
        <div className='flex-1'>
          <p className='text-sm font-medium text-amber-200'>{message}</p>
          {!isConnected && (
            <p className='text-xs text-amber-100/80 mt-1'>
              Connect your wallet to send the activation transaction.
            </p>
          )}
          {isConnected && isChainMismatch && (
            <p className='text-xs text-amber-100/80 mt-1'>
              Your wallet is on a different network. Switch to{' '}
              {targetChainLabel} to activate this contract.
            </p>
          )}
          {isConnected &&
            !isChainMismatch &&
            feeLabel &&
            !isActivating &&
            !txHash && (
              <p className='text-xs text-amber-100/80 mt-1'>
                Estimated activation fee: {feeLabel}. Excess value is refunded
                by the ArbWasm precompile.
              </p>
            )}
          {isConnected &&
            !isChainMismatch &&
            simulationError &&
            !hasDataFee && (
              <p className='text-xs text-red-300 mt-1'>
                Could not estimate the activation fee. Make sure your wallet
                has enough ETH on the correct chain and try again.
              </p>
            )}
          {txHash && (
            <p className='text-xs text-amber-100/80 mt-2'>
              {isActivating
                ? 'Waiting for the activation transaction to be confirmed…'
                : 'Activation transaction submitted.'}{' '}
              {txUrl ? (
                <a
                  href={txUrl}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='inline-flex items-center gap-1 text-[#2D99DD] hover:text-[#5ab2e5]'
                >
                  View on Arbiscan
                  <ExternalLink className='h-3 w-3' />
                </a>
              ) : null}
            </p>
          )}
          {isConnected && isChainMismatch ? (
            <Button
              type='button'
              onClick={onSwitchChain}
              disabled={isSwitchingChain}
              className='mt-3 bg-transparent border border-amber-300 text-amber-200 hover:bg-amber-500/10 inline-flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed'
            >
              {isSwitchingChain && (
                <Loader2 className='h-4 w-4 animate-spin' />
              )}
              {isSwitchingChain
                ? 'Switching network…'
                : `Switch to ${targetChainLabel}`}
            </Button>
          ) : (
            <Button
              type='button'
              onClick={onActivate}
              disabled={cannotActivate}
              className='mt-3 bg-transparent border border-amber-300 text-amber-200 hover:bg-amber-500/10 inline-flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed'
            >
              {isActivating ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                <Zap className='h-4 w-4' />
              )}
              {isActivating ? 'Activating…' : 'Activate now'}
              {!isActivating && isSimulating && (
                <Loader2 className='h-3 w-3 animate-spin' />
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
