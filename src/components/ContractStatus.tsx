import React from 'react';
import { formatDate, formatRoundedEth, formatDuration } from '@/utils/formatting';
import { encodeFunctionData, formatEther } from 'viem';
import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useProgramTimeLeft } from '@/hooks/useProgramTimeLeft';
import { Button } from '@/components/ui/button';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { ARB_WASM_ABI, ARB_WASM_PRECOMPILE } from '@/config/abis/arbWasm/arbWasm';
import { showErrorToast, showSuccessToast } from '@/components/Toast';
// import { useWeb3, TransactionStatus } from '@/hooks/useWeb3';

interface ContractStatusProps {
  isLoading: boolean;
  isCached?: boolean;
  bidBlockTimestamp?: string;
  effectiveBid?: string;
  lastBid?: string;
  viewType?: 'explore-contracts' | 'my-contracts';
  contractAddress?: string;
}

export function ContractStatus({
  isLoading,
  isCached,
  bidBlockTimestamp,
  effectiveBid,
  lastBid,
  viewType = 'explore-contracts',
  contractAddress,
}: ContractStatusProps) {
  // Time left only relevant for my-contracts
  const { isLoading: isTLLoading, state: tlState, seconds } = useProgramTimeLeft(
    viewType === 'my-contracts' ? contractAddress : undefined
  );
  const publicClient = usePublicClient();
  const { address: userAddress, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [isTxBusy, setIsTxBusy] = React.useState(false);
  // Determine button disabled state and tooltip
  const computeActivationState = () => {
    // Default: disabled with generic reason
    let disabled = true;
    let reason: string | undefined = 'Time left unavailable';

    if (isTLLoading) {
      return { disabled: true, reason: 'Checking time left…' };
    }

    if (tlState === 'ok' && seconds !== null) {
      if (seconds > 0) {
        return {
          disabled: true,
          reason: 'Contract is active. Activation available once time left is 0.',
        };
      }
      return { disabled: false, reason: undefined };
    }

    if (tlState === 'expired') {
      return { disabled: false, reason: undefined };
    }

    return { disabled, reason };
  };

  const isMy = viewType === 'my-contracts';

  async function handleActivate() {
    if (!contractAddress) return;
    if (!publicClient) return;
    if (!isConnected || !userAddress) {
      showErrorToast({ message: 'Please connect your wallet to activate the program.' });
      return;
    }

    let requiredWei: bigint | null = null;

    try {
      // Low-level call with 0 value to fetch raw revert data (avoid decode step)
      const data = encodeFunctionData({
        abi: ARB_WASM_ABI,
        functionName: 'activateProgram',
        args: [contractAddress as `0x${string}`],
      });
      await publicClient.call({
        to: ARB_WASM_PRECOMPILE,
        data,
        value: BigInt(0),
        account: userAddress,
      });
      // If call succeeds with 0 value, then no value required
      requiredWei = BigInt(0);
    } catch (err) {
      // Extract raw revert data from nested error structure
      const tryExtractData = (e: any, depth = 0): string | null => {
        if (!e || depth > 6) return null;
        if (typeof e.data === 'string' && e.data.startsWith('0x')) return e.data;
        if (typeof e?.cause?.data === 'string' && e.cause.data.startsWith('0x'))
          return e.cause.data;
        if (typeof e?.shortMessage === 'string') {
          const m = e.shortMessage.match(/data:\s*"(0x[0-9a-fA-F]+)"/);
          if (m) return m[1];
        }
        if (typeof e?.message === 'string') {
          const m = e.message.match(/data:\s*"(0x[0-9a-fA-F]+)"/);
          if (m) return m[1];
        }
        return tryExtractData(e.cause, depth + 1);
      };

      const revertData = tryExtractData(err);
      if (revertData) {
        try {
          const hex = revertData.replace(/^0x/, '');
          const lastWord = hex.slice(-64) || hex; // last 32 bytes
          requiredWei = BigInt('0x' + lastWord);
        } catch (_) {
          // ignore, will fall back below
        }
      }

      // Fallback: parse decimal from message if present
      if (requiredWei === null) {
        const message = (err as Error).message || '';
        const decMatch = message.match(/(\d{3,})/);
        if (decMatch) {
          try {
            requiredWei = BigInt(decMatch[1]);
          } catch (_) {}
        }
      }
    }

    if (requiredWei === null) {
      showErrorToast({ message: 'Could not determine the required activation value.' });
      return;
    }

    const requiredEth = formatEther(requiredWei);

    showSuccessToast({ message: `Preparing activation with ${requiredEth} ETH…` });

    try {
      if (!walletClient) {
        showErrorToast({ message: 'No wallet client available. Please reconnect your wallet.' });
        return;
      }
      setIsTxBusy(true);
      // Simulate again with the required value to produce an exact request
      const { request } = await publicClient.simulateContract({
        address: ARB_WASM_PRECOMPILE,
        abi: ARB_WASM_ABI,
        functionName: 'activateProgram',
        account: userAddress,
        args: [contractAddress as `0x${string}`],
        value: requiredWei,
      });

      // Execute via the connected wallet (MetaMask), which will prompt the user
      const txHash = await walletClient.writeContract(request);
      showSuccessToast({ message: `Transaction sent: ${txHash}` });
    } catch (e) {
      console.error('Activation failed:', e);
      showErrorToast({ message: (e as Error).message || 'Activation failed' });
    } finally {
      setIsTxBusy(false);
    }
  }

  if (isLoading) {
    return (
      <div className='flex gap-4 mb-6 items-stretch'>
        {isMy && (() => {
          const { disabled, reason } = computeActivationState();
          return (
            <div className='border border-[#2C2E30] rounded-md p-4 basis-1/3'>
              <div className='h-full flex items-center justify-between gap-4'>
                <div className='flex flex-col'>
                  <div className='text-gray-400 text-sm'>Time Left</div>
                  <div className='h-6 bg-gray-700 rounded w-24 mt-1 mb-1 animate-pulse'></div>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className='inline-flex'>
                      <Button
                        className='px-4 py-2 bg-black text-white border border-[#2C2E30] hover:bg-gray-900 rounded-md'
                        disabled={disabled}
                        onClick={() => {}}
                      >
                        Activate
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {disabled && reason && (
                    <TooltipContent>
                      <p>{reason}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </div>
            </div>
          );
        })()}

        <div className={`border border-[#2C2E30] rounded-md p-4 ${isMy ? 'basis-1/3' : 'flex-1'}`}>
          <div className='text-gray-400 text-sm'>Cache Status</div>
          <div className='h-6 bg-gray-700 rounded w-24 mt-1 mb-1 animate-pulse'></div>
          <div className='h-3 bg-gray-700 rounded w-40 mb-0.5 animate-pulse'></div>
        </div>

        <div className={`border border-[#2C2E30] rounded-md p-4 ${isMy ? 'basis-1/3' : 'flex-1'}`}>
          <div className='text-gray-400 text-sm'>Effective Bid</div>
          <div className='h-6 bg-gray-700 rounded w-24 mt-1 mb-1 animate-pulse'></div>
          <div className='h-3 bg-gray-700 rounded w-32 mb-0.5 animate-pulse'></div>
        </div>
      </div>
    );
  }

  // For explore-contracts view, use default value if effectiveBid is not provided
  const displayEffectiveBid = effectiveBid || '';

  return (
    <div className='flex gap-4 mb-6 items-stretch'>
      {/* Time Left (first column when available) */}
      {isMy && (() => {
        const { disabled, reason } = computeActivationState();
        return (
          <div className='border border-[#2C2E30] rounded-md p-4 basis-1/3'>
            <div className='h-full flex items-center justify-between gap-4'>
              <div className='flex flex-col'>
                <div className='text-gray-400 text-sm'>Time Left</div>
                {isTLLoading ? (
                  <div className='h-6 bg-gray-700 rounded w-24 mt-1 mb-1 animate-pulse'></div>
                ) : tlState === 'ok' && seconds !== null ? (
                  <div className='text-xl font-bold'>{formatDuration(seconds)}</div>
                ) : tlState === 'expired' ? (
                  <>
                    <div className='text-yellow-400 font-semibold'>Expired</div>
                    <div className='text-xs text-gray-400'>No active time remaining.</div>
                  </>
                ) : (
                  <div className='text-xl font-bold'>N/A</div>
                )}
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className='inline-flex'>
                    <Button
                      className='px-4 py-2 bg-black text-white border border-[#2C2E30] hover:bg-gray-900 rounded-md'
                      disabled={disabled || isTxBusy}
                      onClick={handleActivate}
                    >
                      {isTxBusy ? 'Activating…' : 'Activate'}
                    </Button>
                  </span>
                </TooltipTrigger>
                {disabled && reason && (
                  <TooltipContent>
                    <p>{reason}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </div>
          </div>
        );
      })()}

      {/* Cache Status */}
      <div className={`border border-[#2C2E30] rounded-md p-4 ${isMy ? 'basis-1/3' : 'flex-1'}`}>
        <div className='text-gray-400 text-sm'>Cache Status</div>
        <div className='text-xl font-bold'>
          {isCached ? 'Cached' : 'Not Cached'}
        </div>
        <div className='text-xs text-gray-400'>
          Last Cached {formatDate(bidBlockTimestamp || '')}
        </div>
      </div>

      {/* Effective Bid */}
      <div className={`border border-[#2C2E30] rounded-md p-4 ${isMy ? 'basis-1/3' : 'flex-1'}`}>
        <div className='text-gray-400 text-sm flex items-center gap-2'>
          Effective Bid
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className='w-4 h-4 cursor-help' />
            </TooltipTrigger>
            <TooltipContent>
              <p className='max-w-xs'>
                <strong>Bids decay over time.</strong>
                <br />
                The effective bid is reduced by a <em>decay penalty</em>,
                calculated as:
                <br />
                <code>decayPenalty = decayRate × timeCached</code>
                <br />
                The longer a contract stays cached, the lower its effective bid
                becomes.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
        <div className='text-xl font-bold'>
          {displayEffectiveBid
            ? formatRoundedEth(formatEther(BigInt(displayEffectiveBid))) +
              ' ETH'
            : 'N/A'}
        </div>
        <div className='text-xs text-gray-400'>
          Bid:{' '}
          {lastBid
            ? formatRoundedEth(formatEther(BigInt(lastBid))) + ' ETH'
            : 'N/A'}
        </div>
      </div>
    </div>
  );
}

export default ContractStatus;
