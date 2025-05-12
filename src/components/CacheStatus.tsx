'use client';

import React from 'react';
import { useCacheMetrics } from '@/hooks/useCacheMetrics';

export default function CacheStatus() {
  const {
    totalBytecodes,
    cacheStats,
    isLoadingTotalBytecodes,
    isLoadingCacheStats,
    errorTotalBytecodes,
    errorCacheStats,
    currentBlockchainId,
  } = useCacheMetrics();

  return (
    <div className='flex flex-col w-full pt-16'>
      <div
        className='w-full p-8 px-10'
        style={{
          background:
            'linear-gradient(180deg, #116AAE -193.97%, #072C48 152.16%)',
        }}
      >
        <div className='flex justify-between'>
          <div className='flex flex-col'>
            <h1 className='text-3xl font-bold text-white'>Cache Status</h1>
            <p className='text-gray-300 mt-1 opacity-60'>
              Monitor the status of contract caching across multiple chains
            </p>
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mt-6'>
          {/* Total Contracts Card */}
          <div className='p-6 rounded-md' style={{ background: '#1A1919' }}>
            <h2 className='text-gray-300 font-medium'>Total Contracts</h2>
            {isLoadingTotalBytecodes ? (
              <p className='text-white mt-2'>Loading...</p>
            ) : errorTotalBytecodes ? (
              <p className='text-red-500 mt-2'>Error loading data</p>
            ) : totalBytecodes ? (
              <>
                <p className='text-3xl font-bold text-white mt-2'>
                  {totalBytecodes.bytecodeCount.toLocaleString()}
                </p>
                <p className='text-[#B1B1B1] text-sm mt-1'>
                  {totalBytecodes.bytecodeCountDiffWithLastMonth > 0 ? '+' : ''}
                  {totalBytecodes.bytecodeCountDiffWithLastMonth.toLocaleString()}{' '}
                  from last month
                </p>
              </>
            ) : !currentBlockchainId ? (
              <p className='text-yellow-500 mt-2'>
                No blockchain selected or connected
              </p>
            ) : (
              <p className='text-white mt-2'>No data available</p>
            )}
          </div>

          {/* Available Cache Space Card */}
          <div className='p-6 rounded-md' style={{ background: '#1A1919' }}>
            <h2 className='text-gray-300 font-medium'>Available Cache Space</h2>
            {isLoadingCacheStats ? (
              <p className='text-white mt-2'>Loading...</p>
            ) : errorCacheStats ? (
              <p className='text-red-500 mt-2'>Error loading data</p>
            ) : cacheStats ? (
              <>
                <p className='text-3xl font-bold text-white mt-2'>
                  {(100 - cacheStats.cacheFilledPercentage).toFixed(2)}%
                </p>
                <p className='text-[#B1B1B1] text-sm mt-1'>
                  {cacheStats.queueSizeMB.toFixed(2)}
                  mb/
                  {cacheStats.cacheSizeMB.toFixed(2)}mb
                </p>
              </>
            ) : !currentBlockchainId ? (
              <p className='text-yellow-500 mt-2'>
                No blockchain selected or connected
              </p>
            ) : (
              <p className='text-white mt-2'>No data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
