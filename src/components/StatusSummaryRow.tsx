'use client';

import { BellRing, Database, Zap } from 'lucide-react';
import {
  ActivationInfo,
  activationDotClass,
  activationStatusLabel,
  activationSubLabel,
  activationTextClass,
  formatRelativeTime,
} from '@/lib/prototype-mocks';

interface Props {
  isCached: boolean;
  lastCachedAt?: string;
  activation: ActivationInfo;
  alertsCount?: number;
  onConfigureAlerts?: () => void;
  showAlerts?: boolean;
}

function Card({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className='rounded-lg border border-[#2C2E30] bg-[#0F0F0F] p-4 flex flex-col gap-1'>
      <div className='flex items-center gap-2 text-gray-400 text-[11px] uppercase tracking-wider'>
        <Icon className='h-3.5 w-3.5' />
        {label}
      </div>
      {children}
    </div>
  );
}

export default function StatusSummaryRow({
  isCached,
  lastCachedAt,
  activation,
  alertsCount = 0,
  onConfigureAlerts,
  showAlerts = true,
}: Props) {
  return (
    <div
      className={`grid grid-cols-1 ${
        showAlerts ? 'md:grid-cols-3' : 'md:grid-cols-2'
      } gap-3 mb-6`}
    >
      <Card icon={Database} label='Cache Status'>
        <div className='text-xl font-bold mt-0.5'>
          {isCached ? 'Cached' : 'Not Cached'}
        </div>
        {lastCachedAt && (
          <div className='text-xs text-gray-500'>
            Last cached {formatRelativeTime(lastCachedAt)}
          </div>
        )}
      </Card>

      <Card icon={Zap} label='Activation Status'>
        <div className='flex items-center gap-2 mt-0.5'>
          <span className='relative flex items-center justify-center'>
            {(activation.status === 'active' ||
              activation.status === 'expiring') && (
              <span
                aria-hidden
                className={`absolute inline-flex h-3 w-3 rounded-full opacity-50 animate-ping ${activationDotClass(
                  activation.status
                )}`}
              />
            )}
            <span
              className={`relative inline-block h-2.5 w-2.5 rounded-full ${activationDotClass(
                activation.status
              )}`}
            />
          </span>
          <span
            className={`text-xl font-bold ${activationTextClass(
              activation.status
            )}`}
          >
            {activationStatusLabel(activation)}
          </span>
        </div>
        <div className='text-xs text-gray-400'>
          {activationSubLabel(activation)}
        </div>
        {activation.lastActivatedAt && (
          <div className='text-xs text-gray-500'>
            Last activated {formatRelativeTime(activation.lastActivatedAt)}
          </div>
        )}
      </Card>

      {showAlerts && (
        <Card icon={BellRing} label='Alerts'>
          <div className='flex items-baseline gap-2 mt-0.5'>
            <span className='text-xl font-bold'>{alertsCount}</span>
            <span className='text-xs text-gray-400'>active</span>
          </div>
          <button
            className='mt-auto self-start text-xs text-[#2D99DD] hover:text-[#5ab2e5] font-medium'
            onClick={onConfigureAlerts}
          >
            Configure →
          </button>
        </Card>
      )}
    </div>
  );
}
