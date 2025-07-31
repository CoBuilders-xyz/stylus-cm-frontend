'use client';

import CacheStatus from '@/components/CacheStatus';
import CacheAverageBid from '@/components/CacheAverageBid';
import CacheManagerActivity from '@/components/CacheManagerActivity';

export default function CacheStatusPage() {
  return (
    <div
      className='min-h-screen xl:h-screen flex flex-col pt-16 overflow-auto xl:overflow-hidden'
      style={{
        background:
          'linear-gradient(180deg, #116AAE -193.97%, #072C48 152.16%)',
      }}
    >
      <div className='flex-shrink-0'>
        <CacheStatus />
      </div>

      {/* Metrics Section */}
      <div className='w-full px-10 flex-1 xl:min-h-0 pb-10'>
        <div className='grid grid-cols-1 xl:grid-cols-2 gap-6 min-h-[500px] xl:h-full'>
          <div className='min-h-[500px] xl:h-full xl:min-h-0'>
            <CacheAverageBid />
          </div>
          <div className='min-h-[500px] xl:h-full xl:min-h-0'>
            <CacheManagerActivity />
          </div>
        </div>
      </div>
    </div>
  );
}
