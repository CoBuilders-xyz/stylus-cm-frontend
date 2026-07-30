'use client';

import { formatEther } from 'viem';
import { formatRoundedEth } from '@/utils/formatting';
import { formatRelativeTime } from '@/lib/activation';

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
  const dotClass = isCached ? 'bg-ok' : 'bg-crit';
  const textClass = isCached ? 'text-ok-text' : 'text-crit-text';
  const statusLabel = isCached ? 'Cached' : 'Not Cached';
  const sub = bidBlockTimestamp
    ? `Last cached ${formatRelativeTime(bidBlockTimestamp)}`
    : 'No cache history yet';

  const eff = effectiveBid
    ? formatRoundedEth(formatEther(BigInt(effectiveBid)))
    : null;
  const bid = lastBid ? formatRoundedEth(formatEther(BigInt(lastBid))) : null;
  const statusWash = isCached
    ? 'linear-gradient(180deg, rgba(12,163,12,0.06), transparent 70%)'
    : 'linear-gradient(180deg, rgba(208,59,59,0.06), transparent 70%)';

  return (
    <div
      className='relative overflow-hidden rounded-[10px] border border-hairline bg-surface-1 p-4 mb-4'
      style={{ background: statusWash }}
    >
      <div className='grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 @md/panel:gap-6'>
        <div className='flex items-center gap-3 min-w-0'>
          <span className='relative flex shrink-0 items-center justify-center'>
            {isCached && (
              <span
                aria-hidden
                className={`absolute inline-flex h-4 w-4 rounded-full opacity-50 animate-ping ${dotClass}`}
              />
            )}
            <span
              className={`relative inline-block h-2.5 w-2.5 rounded-full ${dotClass}`}
            />
          </span>
          <div className='min-w-0'>
            <div className='tile-label'>Cache Status</div>
            <div
              className={`text-[19px] font-semibold tracking-[-0.01em] ${textClass}`}
            >
              {statusLabel}
            </div>
            <div className='text-[12px] text-ink-3 mt-0.5 truncate'>{sub}</div>
          </div>
        </div>

        <div className='text-end min-w-0'>
          <div className='tile-label'>Effective Bid</div>
          <div className='text-[19px] font-semibold tracking-[-0.01em] num whitespace-nowrap'>
            {eff ? `${eff} ETH` : '—'}
          </div>
          {bid && (
            <div className='text-[12px] text-ink-3 mt-0.5 num whitespace-nowrap'>
              bid {bid} ETH
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
