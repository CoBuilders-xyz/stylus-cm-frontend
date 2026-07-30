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

  return (
    <div className='app-card relative overflow-hidden p-6 mb-6'>
      <div className='flex flex-col @md/panel:flex-row @md/panel:items-start @md/panel:justify-between gap-4 @md/panel:gap-6'>
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
            <div className='tile-label'>
              Cache Status
            </div>
            <div className={`stat-value ${textClass}`}>
              {statusLabel}
            </div>
            <div className='text-[12.5px] text-ink-3 mt-0.5 truncate'>{sub}</div>
          </div>
        </div>

        <div className='@md/panel:text-right border-t border-hairline @md/panel:border-0 pt-3 @md/panel:pt-0'>
          <div className='tile-label'>
            Effective Bid
          </div>
          <div className='stat-value'>
            {eff ? `${eff} ETH` : '—'}
          </div>
          {bid && (
            <div className='text-[12.5px] text-ink-3 mt-0.5 num'>
              bid {bid} ETH
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
