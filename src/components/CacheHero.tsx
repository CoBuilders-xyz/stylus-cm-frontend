'use client';

import { formatEther } from 'viem';
import { formatRoundedEth } from '@/utils/formatting';
import { formatRelativeTime } from '@/lib/prototype-mocks';

interface CacheHeroProps {
  isCached: boolean;
  bidBlockTimestamp?: string;
  effectiveBid?: string;
  lastBid?: string;
}

export default function CacheHero({
  isCached,
  bidBlockTimestamp,
  effectiveBid,
  lastBid,
}: CacheHeroProps) {
  const dotClass = isCached ? 'bg-green-500' : 'bg-red-500';
  const textClass = isCached ? 'text-green-400' : 'text-red-400';
  const gradient = isCached
    ? 'from-green-500/5 to-transparent'
    : 'from-red-500/8 to-transparent';
  const statusLabel = isCached ? 'Cached' : 'Not Cached';
  const sub = bidBlockTimestamp
    ? `Last cached ${formatRelativeTime(bidBlockTimestamp)}`
    : 'No cache history yet';

  const eff = effectiveBid
    ? formatRoundedEth(formatEther(BigInt(effectiveBid)))
    : null;
  const bid = lastBid ? formatRoundedEth(formatEther(BigInt(lastBid))) : null;

  return (
    <div
      className={`relative overflow-hidden rounded-lg border border-[#2C2E30] bg-gradient-to-br ${gradient} p-6 mb-6`}
    >
      <div className='flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6'>
        <div className='flex items-center gap-4 min-w-0'>
          <span className='relative flex shrink-0 items-center justify-center'>
            {isCached && (
              <span
                aria-hidden
                className={`absolute inline-flex h-5 w-5 rounded-full opacity-50 animate-ping ${dotClass}`}
              />
            )}
            <span
              className={`relative inline-block h-3.5 w-3.5 rounded-full ${dotClass}`}
            />
          </span>
          <div className='min-w-0'>
            <div className='text-[11px] uppercase tracking-wider text-gray-500 font-medium'>
              Cache Status
            </div>
            <div className={`text-2xl sm:text-3xl font-bold ${textClass}`}>
              {statusLabel}
            </div>
            <div className='text-sm text-gray-400 mt-0.5 truncate'>{sub}</div>
          </div>
        </div>

        <div className='sm:text-right border-t border-[#2C2E30] sm:border-0 pt-3 sm:pt-0'>
          <div className='text-[11px] uppercase tracking-wider text-gray-500 font-medium'>
            Effective Bid
          </div>
          <div className='text-2xl sm:text-3xl font-bold text-white tabular-nums'>
            {eff ? `${eff} ETH` : '—'}
          </div>
          {bid && (
            <div className='text-sm text-gray-400 mt-0.5 tabular-nums'>
              bid {bid} ETH
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
