'use client';

import React from 'react';

export default function CacheAverageBid() {
  return (
    <div className='p-6 rounded-md' style={{ background: '#1A1919' }}>
      <div className='flex justify-between mb-2'>
        <div>
          <h2 className='text-gray-300 font-medium'>Average Bid</h2>
          <p className='text-3xl font-bold text-white mt-1'>0.05 ETH</p>
          <p className='text-gray-500 text-sm mt-1'>
            Average bid recorded during the period for the selected contract
            size group
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
      <div className='grid grid-cols-3 gap-1 mt-4 mb-4'>
        <button className='py-2 px-4 text-gray-400 text-sm border border-gray-700 rounded-l-md'>
          &lt;8 KB
        </button>
        <button className='py-2 px-4 text-gray-400 text-sm border border-gray-700'>
          8 KB to 16 KB
        </button>
        <button className='py-2 px-4 text-gray-400 text-sm border border-gray-700 rounded-r-md'>
          &gt;16 KB
        </button>
      </div>

      <div
        className='w-full rounded flex items-center justify-center'
        style={{ background: '#1E2A3B', height: '341px' }}
      >
        <div className='text-gray-500'>Average Bid Graph Placeholder</div>
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
