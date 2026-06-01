'use client';

import { ActivationEvent, CacheEvent } from '@/lib/prototype-mocks';
import { formatDate } from '@/utils/formatting';
import { Zap, Database } from 'lucide-react';

interface TimelineEntry {
  id: string;
  date: string;
  kind: 'activation' | 'cache';
  title: string;
  description: string;
  status?: 'success' | 'error';
}

interface Props {
  activationHistory: ActivationEvent[];
  cacheEvents: CacheEvent[];
}

export default function ContractHistoryTab({
  activationHistory,
  cacheEvents,
}: Props) {
  const entries: TimelineEntry[] = [
    ...activationHistory.map<TimelineEntry>((evt) => ({
      id: `act-${evt.id}`,
      date: evt.date,
      kind: 'activation',
      title:
        evt.status === 'success' ? 'Activation succeeded' : 'Activation failed',
      description:
        evt.status === 'success'
          ? `Consumed ${evt.valueConsumedEth} ETH · gas ${evt.gasUsed}`
          : evt.note ?? 'Reverted',
      status: evt.status,
    })),
    ...cacheEvents.map<TimelineEntry>((evt) => ({
      id: `cache-${evt.id}`,
      date: evt.date,
      kind: 'cache',
      title:
        evt.type === 'cached'
          ? 'Cached'
          : evt.type === 'evicted'
            ? 'Evicted'
            : 'Bid placed',
      description: evt.description,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (entries.length === 0) {
    return (
      <div className='rounded-lg border border-[#2C2E30] bg-black p-6 text-sm text-gray-400'>
        No history events recorded yet.
      </div>
    );
  }

  return (
    <div className='rounded-lg border border-[#2C2E30] bg-black p-6'>
      <ol className='relative border-l border-[#2C2E30] ml-3 space-y-6'>
        {entries.map((entry) => {
          const isActivation = entry.kind === 'activation';
          const Icon = isActivation ? Zap : Database;
          const tone = isActivation
            ? entry.status === 'error'
              ? 'bg-red-500'
              : 'bg-blue-500'
            : 'bg-emerald-500';
          return (
            <li key={entry.id} className='ml-4'>
              <span
                className={`absolute -left-[9px] flex h-4 w-4 items-center justify-center rounded-full ${tone}`}
              >
                <Icon className='h-2.5 w-2.5 text-white' />
              </span>
              <div className='flex items-center gap-2 text-sm font-medium'>
                {entry.title}
                <span className='text-[10px] uppercase tracking-wide text-gray-500'>
                  {entry.kind}
                </span>
              </div>
              <div className='text-xs text-gray-400 mt-1'>
                {entry.description}
              </div>
              <div className='text-[11px] text-gray-500 mt-1'>
                {formatDate(entry.date)}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
