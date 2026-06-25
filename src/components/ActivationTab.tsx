'use client';

import { useId, useState } from 'react';
import { toast } from 'sonner';
import { Zap, ExternalLink } from 'lucide-react';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ActivationEvent,
  ActivationInfo,
  DEFAULT_AUTO_ACTIVATION,
  activationDotClass,
  activationStatusLabel,
  activationSubLabel,
  activationTextClass,
} from '@/lib/activation';
import { formatDate } from '@/utils/formatting';

interface Props {
  activation: ActivationInfo;
  history: ActivationEvent[];
  chainId?: number;
  onActivate?: () => void;
  readOnly?: boolean;
}

const explorerTx = (chainId: number | undefined, hash: string) => {
  if (chainId === 42161) return `https://arbiscan.io/tx/${hash}`;
  if (chainId === 421614) return `https://sepolia.arbiscan.io/tx/${hash}`;
  return null;
};

const truncate = (hash: string) =>
  hash.length > 14 ? `${hash.slice(0, 8)}…${hash.slice(-6)}` : hash;

export default function ActivationTab({
  activation,
  history,
  chainId,
  onActivate,
  readOnly = false,
}: Props) {
  const autoActivationLabelId = useId();
  const maxCostId = useId();
  const [autoEnabled, setAutoEnabled] = useState(DEFAULT_AUTO_ACTIVATION.enabled);
  const [maxCost, setMaxCost] = useState(
    String(DEFAULT_AUTO_ACTIVATION.maxActivationCostEth)
  );

  const isActive = activation.status === 'active';

  const handleSaveAuto = () => {
    toast('Auto-activation wiring is coming soon.');
  };

  return (
    <div className='space-y-6'>
      <div
        className={`relative overflow-hidden rounded-lg border border-[#2C2E30] bg-gradient-to-br p-6 ${
          activation.status === 'active'
            ? 'from-green-500/5 to-transparent'
            : activation.status === 'expiring'
              ? 'from-amber-500/8 to-transparent'
              : 'from-red-500/8 to-transparent'
        }`}
      >
        <div className='flex items-start justify-between gap-4 flex-wrap'>
          <div className='flex items-center gap-4'>
            <span className='relative flex shrink-0 items-center justify-center'>
              {(activation.status === 'active' ||
                activation.status === 'expiring') && (
                <span
                  aria-hidden
                  className={`absolute inline-flex h-5 w-5 rounded-full opacity-50 animate-ping ${activationDotClass(
                    activation.status
                  )}`}
                />
              )}
              <span
                className={`relative inline-block h-3.5 w-3.5 rounded-full ${activationDotClass(
                  activation.status
                )}`}
              />
            </span>
            <div>
              <div className='text-[11px] uppercase tracking-wider text-gray-500 font-medium'>
                Activation
              </div>
              <div
                className={`text-3xl font-bold ${activationTextClass(
                  activation.status
                )}`}
              >
                {activationStatusLabel(activation)}
              </div>
              <div className='text-sm text-gray-400 mt-0.5'>
                {activationSubLabel(activation)}
              </div>
            </div>
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

      {!readOnly && (
      <div className='rounded-lg border border-[#2C2E30] bg-black p-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h3 id={autoActivationLabelId} className='text-lg font-medium'>
              Auto-activation
            </h3>
            <p className='text-gray-400 text-sm'>
              Automatically re-activate this contract before it expires.
            </p>
          </div>
          <SwitchPrimitive.Root
            aria-labelledby={autoActivationLabelId}
            checked={autoEnabled}
            onCheckedChange={setAutoEnabled}
            className={cn(
              'inline-flex h-[26px] w-[48px] shrink-0 items-center rounded-full border-transparent transition-all outline-none',
              'data-[state=unchecked]:border data-[state=unchecked]:border-[#73777A] data-[state=unchecked]:bg-[#2C2E30]',
              'data-[state=checked]:border-0 data-[state=checked]:bg-[#335CD7]'
            )}
          >
            <SwitchPrimitive.Thumb
              className={cn(
                'pointer-events-none block h-[20px] w-[20px] rounded-full bg-white shadow-lg ring-0 transition-transform',
                'data-[state=checked]:translate-x-[24px] data-[state=unchecked]:translate-x-0.5'
              )}
            />
          </SwitchPrimitive.Root>
        </div>

        <div className='mt-5'>
          <label htmlFor={maxCostId} className='block text-sm mb-1'>
            Max activation cost (ETH)
          </label>
          <Input
            id={maxCostId}
            type='number'
            step='0.0001'
            value={maxCost}
            onChange={(e) => setMaxCost(e.target.value)}
            disabled={!autoEnabled}
            className={cn(
              'bg-[#1A1919] text-white border border-gray-700 rounded-md p-2 w-full max-w-xs',
              !autoEnabled && 'opacity-50 cursor-not-allowed'
            )}
          />
          <p className='text-xs text-gray-400 mt-1'>
            Pulled from your escrow balance when an automatic activation runs.
          </p>
        </div>

        <div className='mt-5'>
          <Button
            onClick={handleSaveAuto}
            className='bg-black border border-white text-white hover:bg-gray-900'
          >
            Save settings
          </Button>
        </div>
      </div>
      )}

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
                const url = explorerTx(chainId, evt.txHash);
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
                        <span className='capitalize'>{evt.status}</span>
                      </span>
                      <span className='text-xs text-gray-400 whitespace-nowrap'>
                        {formatDate(evt.date)}
                      </span>
                    </div>
                    {evt.note && (
                      <div className='text-[11px] text-gray-500 mb-2'>
                        {evt.note}
                      </div>
                    )}
                    <div className='grid grid-cols-2 gap-2 text-xs mb-2'>
                      <div>
                        <div className='text-[10px] uppercase tracking-wider text-gray-500'>
                          Value
                        </div>
                        <div className='text-gray-200 tabular-nums'>
                          {evt.valueConsumedEth} ETH
                        </div>
                      </div>
                      <div>
                        <div className='text-[10px] uppercase tracking-wider text-gray-500'>
                          Gas
                        </div>
                        <div className='text-gray-200 tabular-nums'>
                          {Number(evt.gasUsed).toLocaleString()}
                        </div>
                      </div>
                    </div>
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
                    Status
                  </th>
                  <th className='text-left py-2 px-2 text-[11px] uppercase tracking-wider font-medium text-gray-500'>
                    Tx hash
                  </th>
                  <th className='text-right py-2 px-2 text-[11px] uppercase tracking-wider font-medium text-gray-500'>
                    Value
                  </th>
                  <th className='text-right py-2 px-2 text-[11px] uppercase tracking-wider font-medium text-gray-500'>
                    Gas
                  </th>
                </tr>
              </thead>
              <tbody>
                {history.map((evt) => {
                  const url = explorerTx(chainId, evt.txHash);
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
                          <span className='capitalize'>{evt.status}</span>
                        </span>
                        {evt.note && (
                          <div className='text-[10px] text-gray-500 mt-0.5'>
                            {evt.note}
                          </div>
                        )}
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
                      <td className='py-3 px-2 text-right tabular-nums text-gray-300'>
                        {evt.valueConsumedEth} ETH
                      </td>
                      <td className='py-3 px-2 text-right tabular-nums text-gray-400'>
                        {Number(evt.gasUsed).toLocaleString()}
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
