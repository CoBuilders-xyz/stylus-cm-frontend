'use client';

import CacheStatus from '@/components/CacheStatus';
import CacheAverageBid from '@/components/CacheAverageBid';
import CacheManagerActivity from '@/components/CacheManagerActivity';

export default function CacheStatusPage() {
  return (
    <div
      className='pt-22 min-h-screen flex flex-col'
      style={{
        background:
          'linear-gradient(180deg, #116AAE -193.97%, #072C48 152.16%)',
      }}
    >
      <CacheStatus />

      {/* Metrics Section */}
      <div className='w-full p-2 px-10 flex-1 mb-3'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6 h-full'>
          <div className='h-full'>
            <CacheAverageBid />
          </div>
          <div className='h-full'>
            <CacheManagerActivity />
          </div>
        </div>
      </div>
    </div>
  );
}
