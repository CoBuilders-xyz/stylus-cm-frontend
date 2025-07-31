'use client';

import CacheStatus from '@/components/CacheStatus';
import CacheAverageBid from '@/components/CacheAverageBid';
import CacheManagerActivity from '@/components/CacheManagerActivity';

export default function CacheStatusPage() {
  return (
    <div
      className='h-screen flex flex-col overflow-hidden pt-16'
      style={{
        background:
          'linear-gradient(180deg, #116AAE -193.97%, #072C48 152.16%)',
      }}
    >
      <div className='flex-shrink-0'>
        <CacheStatus />
      </div>

      {/* Metrics Section */}
      <div className='w-full px-10 flex-1 min-h-0 pb-10'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6 h-full'>
          <div className='h-full min-h-0'>
            <CacheAverageBid />
          </div>
          <div className='h-full min-h-0'>
            <CacheManagerActivity />
          </div>
        </div>
      </div>
    </div>
  );
}
