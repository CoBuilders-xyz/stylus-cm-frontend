'use client';

import { ReactNode } from 'react';
import {
  ActivationInfo,
  activationDotClass,
  activationStatusLabel,
  activationSubLabel,
  activationTextClass,
} from '@/lib/activation';

interface ActivationHeroProps {
  info: ActivationInfo;
  /**
   * Right-hand slot. Mirrors `CacheHero`'s effective-bid column; on the
   * Activation tab this is where the "Activate now" control lives (or the
   * chain-switch fallback). Omitted on read-only views.
   */
  actionSlot?: ReactNode;
}

/**
 * Status hero for the Activation tab, matched visually to `CacheHero` so
 * both tabs share the same typographic hierarchy — big status text, small
 * uppercase eyebrow, muted subtext — and the two feel like one design.
 */
export default function ActivationHero({
  info,
  actionSlot,
}: ActivationHeroProps) {
  const { status } = info;
  const dotClass = activationDotClass(status);
  const textClass = activationTextClass(status);
  const showPulse = status === 'active' || status === 'expiring';
  // The one permitted gradient: a faint status wash over the bordered card.
  const statusWash =
    status === 'active'
      ? 'linear-gradient(180deg, rgba(12,163,12,0.06), transparent 70%)'
      : status === 'expiring'
        ? 'linear-gradient(180deg, rgba(250,178,25,0.06), transparent 70%)'
        : status === 'unknown'
          ? undefined
          : 'linear-gradient(180deg, rgba(208,59,59,0.06), transparent 70%)';
  const statusLabel = activationStatusLabel(info);
  const sub = activationSubLabel(info);

  return (
    <div
      className='relative overflow-hidden rounded-[10px] border border-hairline bg-surface-1 p-4 mb-4'
      style={statusWash ? { background: statusWash } : undefined}
    >
      <div className='flex flex-col @md/panel:flex-row @md/panel:items-start @md/panel:justify-between gap-4 @md/panel:gap-6'>
        <div className='flex items-center gap-3 min-w-0'>
          <span className='relative flex shrink-0 items-center justify-center'>
            {showPulse && (
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
            <div className='tile-label'>Activation Status</div>
            <div
              className={`text-[19px] font-semibold tracking-[-0.01em] ${textClass}`}
            >
              {statusLabel}
            </div>
            <div className='text-[12px] text-ink-3 mt-0.5 truncate'>{sub}</div>
          </div>
        </div>

        {actionSlot && (
          <div className='@md/panel:text-end border-t border-hairline @md/panel:border-0 pt-3 @md/panel:pt-0 flex @md/panel:justify-end'>
            {actionSlot}
          </div>
        )}
      </div>
    </div>
  );
}
