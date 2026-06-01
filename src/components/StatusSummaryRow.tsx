'use client';

import { BellRing } from 'lucide-react';
import { formatDate } from '@/utils/formatting';
import {
  ActivationInfo,
  activationDotClass,
  activationLabel,
} from '@/lib/prototype-mocks';

interface Props {
  isCached: boolean;
  lastCachedAt?: string;
  activation: ActivationInfo;
  alertsCount: number;
  onConfigureAlerts?: () => void;
}

export default function StatusSummaryRow({
  isCached,
  lastCachedAt,
  activation,
  alertsCount,
  onConfigureAlerts,
}: Props) {
  return (
    <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
      <div className='border border-[#2C2E30] rounded-md p-4'>
        <div className='text-gray-400 text-xs uppercase tracking-wide'>
          Cache Status
        </div>
        <div className='text-xl font-bold mt-1'>
          {isCached ? 'Cached' : 'Not Cached'}
        </div>
        {lastCachedAt && (
          <div className='text-xs text-gray-400 mt-1'>
            Last cached {formatDate(lastCachedAt)}
          </div>
        )}
      </div>

      <div className='border border-[#2C2E30] rounded-md p-4'>
        <div className='text-gray-400 text-xs uppercase tracking-wide'>
          Activation Status
        </div>
        <div className='flex items-center gap-2 mt-1'>
          <span
            className={`inline-block h-2.5 w-2.5 rounded-full ${activationDotClass(
              activation.status
            )}`}
          />
          <span className='text-xl font-bold capitalize'>
            {activation.status}
          </span>
        </div>
        <div className='text-xs text-gray-400 mt-1'>
          {activationLabel(activation)}
        </div>
        {activation.lastActivatedAt && (
          <div className='text-xs text-gray-500 mt-1'>
            Last activated {formatDate(activation.lastActivatedAt)}
          </div>
        )}
      </div>

      <div className='border border-[#2C2E30] rounded-md p-4'>
        <div className='text-gray-400 text-xs uppercase tracking-wide'>
          Alerts
        </div>
        <div className='flex items-center gap-2 mt-1'>
          <BellRing className='h-4 w-4 text-gray-300' />
          <span className='text-xl font-bold'>{alertsCount}</span>
          <span className='text-xs text-gray-400'>active</span>
        </div>
        <button
          className='mt-2 text-xs text-blue-400 hover:text-blue-300 underline'
          onClick={onConfigureAlerts}
        >
          Configure
        </button>
      </div>
    </div>
  );
}
