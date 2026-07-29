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
  const gradient =
    status === 'active'
      ? 'from-green-500/5 to-transparent'
      : status === 'expiring'
        ? 'from-amber-500/8 to-transparent'
        : status === 'error'
          ? 'from-red-500/8 to-transparent'
          : status === 'unknown'
            ? 'from-gray-500/8 to-transparent'
            : 'from-red-500/8 to-transparent';
  const statusLabel = activationStatusLabel(info);
  const sub = activationSubLabel(info);

  return (
    <div
      className={`relative overflow-hidden rounded-lg border border-[#2C2E30] bg-gradient-to-br ${gradient} p-6 mb-6`}
    >
      <div className='flex flex-col @md/panel:flex-row @md/panel:items-start @md/panel:justify-between gap-4 @md/panel:gap-6'>
        <div className='flex items-center gap-4 min-w-0'>
          <span className='relative flex shrink-0 items-center justify-center'>
            {showPulse && (
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
              Activation Status
            </div>
            <div
              className={`text-2xl @md/panel:text-3xl font-bold ${textClass}`}
            >
              {statusLabel}
            </div>
            <div className='text-sm text-gray-400 mt-0.5 truncate'>{sub}</div>
          </div>
        </div>

        {actionSlot && (
          <div className='@md/panel:text-right border-t border-[#2C2E30] @md/panel:border-0 pt-3 @md/panel:pt-0 flex @md/panel:justify-end'>
            {actionSlot}
          </div>
        )}
      </div>
    </div>
  );
}
