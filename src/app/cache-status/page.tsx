'use client';

import CacheStatus from '@/components/CacheStatus';
import CacheAverageBid from '@/components/CacheAverageBid';
import CacheManagerActivity from '@/components/CacheManagerActivity';

export default function CacheStatusPage() {
  return (
    <>
      <CacheStatus />

      {/* Metrics Section */}
      <div className='w-full p-8 px-10 bg-black'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <CacheAverageBid />
          <CacheManagerActivity />
        </div>
      </div>
    </>
  );
}
