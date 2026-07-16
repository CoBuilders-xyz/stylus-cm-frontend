'use client';

import { formatEther } from 'viem';
import { Zap, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ActivationEvent,
  ActivationInfo,
  formatRelativeTime,
} from '@/lib/activation';
import ActivationBadge from '@/components/ActivationBadge';
import { formatDate } from '@/utils/formatting';
import { explorerTxUrl } from '@/utils/explorer';

interface Props {
  activation: ActivationInfo;
  history: ActivationEvent[];
  chainId?: number;
  onActivate?: () => void;
  readOnly?: boolean;
  /**
   * Persisted per-contract auto-activation config from the backend. Rendered
   * as a read-only summary here — the interactive editing surface (with
   * on-chain writes to `CacheManagerAutomation`) lands in COB-499.
   */
  autoActivate?: boolean;
  /** Max activation cost in wei (`null` = never configured). */
  maxActivationCost?: string | null;
  /** True while the parent is fetching the enriched contract detail. */
  isLoading?: boolean;
}

const truncate = (hash: string) =>
  hash.length > 14 ? `${hash.slice(0, 8)}…${hash.slice(-6)}` : hash;

function formatMaxActivationCost(wei: string | null | undefined): string {
  if (wei == null || wei === '') return '—';
  try {
    return `${formatEther(BigInt(wei))} ETH`;
  } catch {
    // Backend should always send a wei-formatted decimal string, but a
    // stray non-numeric value should not crash the whole tab.
    return '—';
  }
}

export default function ActivationTab({
  activation,
  history,
  chainId,
  onActivate,
  readOnly = false,
  autoActivate,
  maxActivationCost,
  isLoading = false,
}: Props) {
  const isActive = activation.status === 'active';

  if (isLoading) {
    return <ActivationTabSkeleton readOnly={readOnly} />;
  }

  return (
    <div className='space-y-6'>
      {/* Status header — the badge is the same component the contracts
          table uses on each row, so the visual language stays consistent. */}
      <div
        className={`relative overflow-hidden rounded-lg border border-[#2C2E30] bg-gradient-to-br p-6 ${
          activation.status === 'active'
            ? 'from-green-500/5 to-transparent'
            : activation.status === 'expiring'
              ? 'from-amber-500/8 to-transparent'
              : activation.status === 'error'
                ? 'from-red-500/8 to-transparent'
                : activation.status === 'unknown'
                  ? 'from-gray-500/8 to-transparent'
                  : 'from-red-500/8 to-transparent'
        }`}
      >
        <div className='flex items-start justify-between gap-4 flex-wrap'>
          <div className='flex items-start gap-4'>
            <ActivationBadge info={activation} />
            {activation.lastActivatedAt && (
              <div className='text-xs text-gray-500 self-end'>
                Last activated {formatRelativeTime(activation.lastActivatedAt)}
              </div>
            )}
          </div>

          {!readOnly &&
            (isActive ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button
                      disabled
                      className='bg-gray-800 text-gray-400 opacity-70 cursor-not-allowed flex items-center gap-2'
                    >
                      <Zap className='h-4 w-4' />
                      Activate now
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>Already active</TooltipContent>
              </Tooltip>
            ) : (
              <Button
                onClick={() => onActivate?.()}
                className='bg-[#335CD7] hover:bg-[#2a4cb8] text-white flex items-center gap-2 shadow-lg shadow-blue-500/20'
              >
                <Zap className='h-4 w-4' />
                Activate now
              </Button>
            ))}
        </div>
      </div>

      {/* Auto-activation — read-only for now. The editable version (switch
          + max cost input + on-chain write against CacheManagerAutomation)
          lives in COB-499. */}
      {!readOnly && (
        <div className='rounded-lg border border-[#2C2E30] bg-black p-6'>
          <div className='flex items-start justify-between gap-4 flex-wrap'>
            <div>
              <h3 className='text-lg font-medium'>Auto-activation</h3>
              <p className='text-gray-400 text-sm'>
                Automatically re-activate this contract before it expires.
              </p>
            </div>
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${
                autoActivate
                  ? 'border-green-500/40 bg-green-500/10 text-green-300'
                  : 'border-gray-600/60 bg-gray-500/10 text-gray-300'
              }`}
            >
              <span
                aria-hidden
                className={`inline-block h-1.5 w-1.5 rounded-full ${
                  autoActivate ? 'bg-green-400' : 'bg-gray-400'
                }`}
              />
              {autoActivate ? 'Enabled' : 'Disabled'}
            </span>
          </div>

          <dl className='mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm'>
            <div>
              <dt className='text-[11px] uppercase tracking-wider text-gray-500'>
                Max activation cost
              </dt>
              <dd className='mt-0.5 text-gray-100 tabular-nums'>
                {formatMaxActivationCost(maxActivationCost)}
              </dd>
            </div>
          </dl>

          <p className='mt-4 text-xs text-gray-500'>
            Configuration is coming soon. For now this reflects the value
            persisted from the on-chain events.
          </p>
        </div>
      )}

      {/* Activation history — indexed from the CacheManagerAutomation
          `ActivationPerformed` and `ActivationError` events by the backend. */}
      <div className='rounded-lg border border-[#2C2E30] bg-black p-6'>
        <h3 className='text-lg font-medium mb-3'>Activation history</h3>
        {history.length === 0 ? (
          <p className='text-sm text-gray-400'>
            No activation events recorded for this contract yet.
          </p>
        ) : (
          <>
            {/* Narrow-container card stack */}
            <ul className='@lg/panel:hidden flex flex-col gap-2'>
              {history.map((evt) => {
                const url = explorerTxUrl(chainId, evt.txHash);
                return (
                  <li
                    key={evt.id}
                    className='rounded-md border border-[#1f1f1f] p-3 text-sm'
                  >
                    <div className='flex items-center justify-between gap-3 mb-2'>
                      <span
                        className={`inline-flex items-center gap-2 text-xs ${
                          evt.status === 'success'
                            ? 'text-green-400'
                            : 'text-red-400'
                        }`}
                      >
                        <span
                          className={`inline-block h-2 w-2 rounded-full ${
                            evt.status === 'success'
                              ? 'bg-green-500'
                              : 'bg-red-500'
                          }`}
                        />
                        <span>
                          {evt.status === 'success'
                            ? 'Activated'
                            : 'Failed'}
                        </span>
                      </span>
                      <span className='text-xs text-gray-400 whitespace-nowrap'>
                        {formatDate(evt.date)}
                      </span>
                    </div>
                    {evt.note && (
                      <div className='text-[11px] text-red-300/80 mb-2'>
                        {evt.note}
                      </div>
                    )}
                    {evt.status === 'success' && evt.valueConsumedEth && (
                      <div className='mb-2'>
                        <div className='text-[10px] uppercase tracking-wider text-gray-500'>
                          Spent
                        </div>
                        <div className='text-gray-200 tabular-nums text-xs'>
                          {evt.valueConsumedEth} ETH
                        </div>
                      </div>
                    )}
                    <div className='text-[10px] uppercase tracking-wider text-gray-500'>
                      Tx hash
                    </div>
                    {url ? (
                      <a
                        href={url}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='font-mono text-xs text-[#2D99DD] hover:text-[#5ab2e5] inline-flex items-center gap-1'
                      >
                        {truncate(evt.txHash)}
                        <ExternalLink className='h-3 w-3' />
                      </a>
                    ) : (
                      <span className='font-mono text-xs text-gray-300'>
                        {truncate(evt.txHash)}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>

            {/* Wide-container full table */}
            <div className='hidden @lg/panel:block -mx-6 px-6 overflow-x-auto'>
              <table className='min-w-[560px] w-full text-sm'>
                <thead>
                  <tr className='border-b border-[#2C2E30]'>
                    <th className='text-left py-2 px-2 text-[11px] uppercase tracking-wider font-medium text-gray-500'>
                      Date
                    </th>
                    <th className='text-left py-2 px-2 text-[11px] uppercase tracking-wider font-medium text-gray-500'>
                      Event
                    </th>
                    <th className='text-right py-2 px-2 text-[11px] uppercase tracking-wider font-medium text-gray-500'>
                      Spent (ETH)
                    </th>
                    <th className='text-left py-2 px-2 text-[11px] uppercase tracking-wider font-medium text-gray-500'>
                      Tx
                    </th>
                    <th className='text-left py-2 px-2 text-[11px] uppercase tracking-wider font-medium text-gray-500'>
                      Reason
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((evt) => {
                    const url = explorerTxUrl(chainId, evt.txHash);
                    return (
                      <tr
                        key={evt.id}
                        className='border-b border-[#1f1f1f] last:border-0 hover:bg-white/[0.02] transition-colors'
                      >
                        <td className='py-3 px-2 whitespace-nowrap text-gray-300'>
                          {formatDate(evt.date)}
                        </td>
                        <td className='py-3 px-2'>
                          <span
                            className={`inline-flex items-center gap-2 ${
                              evt.status === 'success'
                                ? 'text-green-400'
                                : 'text-red-400'
                            }`}
                          >
                            <span
                              className={`inline-block h-2 w-2 rounded-full ${
                                evt.status === 'success'
                                  ? 'bg-green-500'
                                  : 'bg-red-500'
                              }`}
                            />
                            <span>
                              {evt.status === 'success'
                                ? 'Activated'
                                : 'Failed'}
                            </span>
                          </span>
                        </td>
                        <td className='py-3 px-2 text-right tabular-nums text-gray-300'>
                          {evt.status === 'success' && evt.valueConsumedEth
                            ? evt.valueConsumedEth
                            : '—'}
                        </td>
                        <td className='py-3 px-2 font-mono text-xs'>
                          {url ? (
                            <a
                              href={url}
                              target='_blank'
                              rel='noopener noreferrer'
                              className='text-[#2D99DD] hover:text-[#5ab2e5] inline-flex items-center gap-1'
                            >
                              {truncate(evt.txHash)}
                              <ExternalLink className='h-3 w-3' />
                            </a>
                          ) : (
                            truncate(evt.txHash)
                          )}
                        </td>
                        <td className='py-3 px-2 text-xs text-red-300/80 max-w-[220px] truncate'>
                          {evt.note ?? ''}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Skeleton mirroring the three main blocks of {@link ActivationTab} — status
 * header, auto-activation summary, and history — so the layout does not jump
 * once the enriched contract detail arrives.
 */
function ActivationTabSkeleton({ readOnly }: { readOnly: boolean }) {
  return (
    <div className='space-y-6 animate-pulse' aria-busy='true' aria-live='polite'>
      <div className='rounded-lg border border-[#2C2E30] bg-black p-6'>
        <div className='flex items-start justify-between gap-4 flex-wrap'>
          <div className='flex items-start gap-4'>
            <div className='h-3 w-3 rounded-full bg-gray-700 mt-1' />
            <div className='space-y-2'>
              <div className='h-4 w-24 rounded bg-gray-700' />
              <div className='h-3 w-40 rounded bg-gray-800' />
            </div>
          </div>
          {!readOnly && <div className='h-9 w-32 rounded bg-gray-700' />}
        </div>
      </div>

      {!readOnly && (
        <div className='rounded-lg border border-[#2C2E30] bg-black p-6 space-y-4'>
          <div className='flex items-start justify-between gap-4 flex-wrap'>
            <div className='space-y-2'>
              <div className='h-5 w-40 rounded bg-gray-700' />
              <div className='h-3 w-56 rounded bg-gray-800' />
            </div>
            <div className='h-6 w-20 rounded-full bg-gray-700' />
          </div>
          <div className='h-3 w-32 rounded bg-gray-800' />
          <div className='h-4 w-24 rounded bg-gray-700' />
        </div>
      )}

      <div className='rounded-lg border border-[#2C2E30] bg-black p-6 space-y-3'>
        <div className='h-5 w-40 rounded bg-gray-700' />
        <div className='h-4 w-full rounded bg-gray-800' />
        <div className='h-4 w-11/12 rounded bg-gray-800' />
        <div className='h-4 w-10/12 rounded bg-gray-800' />
      </div>
    </div>
  );
}
