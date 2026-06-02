'use client';

import { useState } from 'react';
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
  MOCK_AUTO_ACTIVATION_DEFAULT,
  PROTOTYPE_ACTIVATION_TOAST,
  PROTOTYPE_AUTO_ACTIVATION_TOAST,
  activationDotClass,
  activationStatusLabel,
  activationSubLabel,
} from '@/lib/prototype-mocks';
import { formatDate } from '@/utils/formatting';

interface Props {
  activation: ActivationInfo;
  history: ActivationEvent[];
  chainId?: number;
  onActivate: () => void;
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
}: Props) {
  const [autoEnabled, setAutoEnabled] = useState(
    MOCK_AUTO_ACTIVATION_DEFAULT.enabled
  );
  const [maxCost, setMaxCost] = useState(
    String(MOCK_AUTO_ACTIVATION_DEFAULT.maxActivationCostEth)
  );

  const isActive = activation.status === 'active';

  const handleSaveAuto = () => {
    toast.success(PROTOTYPE_AUTO_ACTIVATION_TOAST);
  };

  return (
    <div className='space-y-6'>
      <div className='rounded-lg border border-[#2C2E30] bg-black p-6'>
        <div className='flex items-start justify-between gap-4 flex-wrap'>
          <div className='flex items-center gap-3'>
            <span className='relative mt-1 flex shrink-0 items-center justify-center'>
              {(activation.status === 'active' ||
                activation.status === 'expiring') && (
                <span
                  aria-hidden
                  className={`absolute inline-flex h-4 w-4 rounded-full opacity-50 animate-ping ${activationDotClass(
                    activation.status
                  )}`}
                />
              )}
              <span
                className={`relative inline-block h-3 w-3 rounded-full ${activationDotClass(
                  activation.status
                )}`}
              />
            </span>
            <div>
              <div className='text-xs uppercase tracking-wide text-gray-400'>
                Activation
              </div>
              <div className='text-2xl font-bold'>
                {activationStatusLabel(activation)}
              </div>
              <div className='text-sm text-gray-400 mt-1'>
                {activationSubLabel(activation)}
              </div>
            </div>
          </div>

          {isActive ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    disabled
                    className='bg-gray-700 text-white opacity-60 cursor-not-allowed flex items-center gap-2'
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
              onClick={() => {
                onActivate();
                toast.success(PROTOTYPE_ACTIVATION_TOAST);
              }}
              className='bg-[#335CD7] hover:bg-[#2a4cb8] text-white flex items-center gap-2'
            >
              <Zap className='h-4 w-4' />
              Activate now
            </Button>
          )}
        </div>
      </div>

      <div className='rounded-lg border border-[#2C2E30] bg-black p-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h3 className='text-lg font-medium'>Auto-activation</h3>
            <p className='text-gray-400 text-sm'>
              Automatically re-activate this contract before it expires.
            </p>
          </div>
          <SwitchPrimitive.Root
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
          <label className='block text-sm mb-1'>
            Max activation cost (ETH)
          </label>
          <Input
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

      <div className='rounded-lg border border-[#2C2E30] bg-black p-6'>
        <h3 className='text-lg font-medium mb-3'>Activation history</h3>
        {history.length === 0 ? (
          <p className='text-sm text-gray-400'>
            No activation events recorded for this contract yet.
          </p>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead className='text-gray-400'>
                <tr className='border-b border-[#2C2E30]'>
                  <th className='text-left py-2 pr-4 font-medium'>Date</th>
                  <th className='text-left py-2 pr-4 font-medium'>Status</th>
                  <th className='text-left py-2 pr-4 font-medium'>Tx hash</th>
                  <th className='text-left py-2 pr-4 font-medium'>
                    Value consumed
                  </th>
                  <th className='text-left py-2 pr-4 font-medium'>Gas used</th>
                </tr>
              </thead>
              <tbody>
                {history.map((evt) => {
                  const url = explorerTx(chainId, evt.txHash);
                  return (
                    <tr
                      key={evt.id}
                      className='border-b border-[#2C2E30] last:border-0'
                    >
                      <td className='py-2 pr-4 whitespace-nowrap'>
                        {formatDate(evt.date)}
                      </td>
                      <td className='py-2 pr-4'>
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
                          {evt.status}
                        </span>
                        {evt.note && (
                          <div className='text-[10px] text-gray-500 mt-0.5'>
                            {evt.note}
                          </div>
                        )}
                      </td>
                      <td className='py-2 pr-4 font-mono text-xs'>
                        {url ? (
                          <a
                            href={url}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='text-blue-400 hover:text-blue-300 inline-flex items-center gap-1'
                          >
                            {truncate(evt.txHash)}
                            <ExternalLink className='h-3 w-3' />
                          </a>
                        ) : (
                          truncate(evt.txHash)
                        )}
                      </td>
                      <td className='py-2 pr-4'>{evt.valueConsumedEth} ETH</td>
                      <td className='py-2 pr-4'>{evt.gasUsed}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
