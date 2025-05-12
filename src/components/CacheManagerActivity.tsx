'use client';

import React from 'react';

export default function CacheManagerActivity() {
  return (
    <div className='p-6 rounded-md' style={{ background: '#1A1919' }}>
      <div className='flex justify-between mb-2'>
        <div>
          <h2 className='text-gray-300 font-medium'>Cacher Manager Activity</h2>
          <p className='text-3xl font-bold text-white mt-1'>12,500</p>
          <p className='text-gray-500 text-sm mt-1'>
            Total contract interactions during the period
          </p>
        </div>

        <div className='flex flex-col'>
          <div className='grid grid-cols-4 gap-1 bg-gray-800 rounded-md overflow-hidden'>
            <button className='px-3 py-2 text-gray-400 text-sm hover:bg-gray-700'>
              D
            </button>
            <button className='px-3 py-2 text-gray-400 text-sm hover:bg-gray-700'>
              W
            </button>
            <button className='px-3 py-2 text-gray-400 text-sm hover:bg-gray-700'>
              M
            </button>
            <button className='px-3 py-2 text-gray-400 text-sm hover:bg-gray-700'>
              Y
            </button>
          </div>
        </div>
      </div>

      {/* Contract Size Filter */}
      <div className='grid grid-cols-3 gap-1 mt-4 mb-4 opacity-0 py-2 px-4 text-gray-400 text-sm border border-gray-700 rounded-l-md'>
        .
      </div>

      <div
        className='w-full mt-4 rounded flex items-center justify-center'
        style={{ background: '#1E2A3B', height: '341px' }}
      >
        <div className='text-gray-500'>
          Cacher Manager Activity Graph Placeholder
        </div>
      </div>

      {/* Months */}
      <div className='flex justify-between mt-2 text-xs text-gray-500'>
        <span>Jan</span>
        <span>Feb</span>
        <span>Mar</span>
        <span>Apr</span>
        <span>May</span>
        <span>Jun</span>
      </div>
    </div>
  );
}
