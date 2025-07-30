'use client';

import CacheStatus from '@/components/CacheStatus';
import CacheAverageBid from '@/components/CacheAverageBid';
import CacheManagerActivity from '@/components/CacheManagerActivity';

export default function CacheStatusPage() {
  return (
    <div
      style={{
        background:
          'linear-gradient(180deg, #116AAE -193.97%, #072C48 152.16%)',
      }}
    >
      <CacheStatus />

      {/* Metrics Section */}
      <div className='w-full p-8 px-10'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <CacheAverageBid />
          <CacheManagerActivity />
        </div>
      </div>
    </div>
  );
}
