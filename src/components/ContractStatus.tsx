import React from 'react';
import { formatDate, formatRoundedEth } from '@/utils/formatting';
import { formatEther } from 'viem';
import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ContractStatusProps {
  isLoading: boolean;
  isCached?: boolean;
  bidBlockTimestamp?: string;
  effectiveBid?: string;
  lastBid?: string;
  viewType?: 'explore-contracts' | 'my-contracts';
}

export function ContractStatus({
  isLoading,
  isCached,
  bidBlockTimestamp,
  effectiveBid,
  lastBid,
}: ContractStatusProps) {
  if (isLoading) {
    return (
      <div className='grid grid-cols-2 gap-4 mb-6'>
        {/* Cache Status Loading State */}
        <div className='border border-hairline rounded-[10px] p-4'>
          <div className='tile-label'>Cache Status</div>
          <div className='h-6 bg-surface-3 rounded w-24 mt-1 mb-1 animate-pulse'></div>
          <div className='h-3 bg-surface-3 rounded w-40 mb-0.5 animate-pulse'></div>
        </div>

        {/* Effective Bid Loading State */}
        <div className='border border-hairline rounded-[10px] p-4'>
          <div className='tile-label'>Effective Bid</div>
          <div className='h-6 bg-surface-3 rounded w-24 mt-1 mb-1 animate-pulse'></div>
          <div className='h-3 bg-surface-3 rounded w-32 mb-0.5 animate-pulse'></div>
        </div>
      </div>
    );
  }

  // For explore-contracts view, use default value if effectiveBid is not provided
  const displayEffectiveBid = effectiveBid || '';

  return (
    <div className='grid grid-cols-2 gap-4 mb-6'>
      {/* Cache Status — the one permitted faint status wash */}
      <div
        className='border border-hairline rounded-[10px] p-4'
        style={{
          background: isCached
            ? 'linear-gradient(180deg, rgba(12,163,12,0.06), transparent 70%)'
            : 'linear-gradient(180deg, rgba(208,59,59,0.06), transparent 70%)',
        }}
      >
        <div className='tile-label'>Cache Status</div>
        <div
          className={`text-[19px] font-semibold tracking-[-0.01em] mt-1 flex items-center gap-2 ${
            isCached ? 'text-ok-text' : 'text-crit-text'
          }`}
        >
          <span
            aria-hidden
            className={`inline-block h-2 w-2 rounded-full ${
              isCached ? 'bg-ok' : 'bg-crit'
            }`}
          />
          {isCached ? 'Cached' : 'Not Cached'}
        </div>
        <div className='text-[11.5px] text-ink-3'>
          Last Cached {formatDate(bidBlockTimestamp || '')}
        </div>
      </div>

      {/* Effective Bid */}
      <div className='border border-hairline rounded-[10px] p-4'>
        <div className='tile-label flex items-center gap-2'>
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
        <div className='text-[19px] font-semibold tracking-[-0.01em] text-ink-1 num mt-1'>
          {displayEffectiveBid
            ? formatRoundedEth(formatEther(BigInt(displayEffectiveBid))) +
              ' ETH'
            : 'N/A'}
        </div>
        <div className='text-[11.5px] text-ink-3 num'>
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
