'use client';

import CacheStatus from '@/components/CacheStatus';
import CacheAverageBid from '@/components/CacheAverageBid';
import CacheManagerActivity from '@/components/CacheManagerActivity';

export default function CacheStatusPage() {
  return (
    <div
      className='min-h-screen xl:h-screen flex flex-col overflow-auto xl:overflow-hidden bg-page'
      style={{
        paddingTop: 'var(--app-chrome-h, 56px)',
      }}
    >
      <div className='flex-shrink-0'>
        <CacheStatus />
      </div>

      {/* Metrics Section */}
      <div className='w-full page-gutter flex-1 xl:min-h-0 pb-6'>
        <div className='grid grid-cols-1 xl:grid-cols-2 gap-3 h-full xl:h-full'>
          <div className='min-h-[300px] xl:h-full xl:min-h-0'>
            <CacheAverageBid />
          </div>
          <div className='min-h-[300px] xl:h-full xl:min-h-0'>
            <CacheManagerActivity />
          </div>
        </div>
      </div>
    </div>
  );
}
