'use client';

export default function CacheStatusPage() {
  return (
    <div className='flex flex-col w-full'>
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

          <div className='flex'>
            <div className='flex items-center'>
              <div
                className='border border-white rounded-[10px] p-2'
                style={{ borderWidth: '1px' }}
              >
                <span className='mr-2'>+</span>
                Add Contract
              </div>
            </div>
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mt-6'>
          {/* Total Contracts Card */}
          <div className='p-6 rounded-md' style={{ background: '#1A1919' }}>
            <h2 className='text-gray-300 font-medium'>Total Contracts</h2>
            <p className='text-3xl font-bold text-white mt-2'>1,234</p>
            <p className='text-[#B1B1B1] text-sm mt-1'>+180 from last month</p>
          </div>

          {/* Available Cache Space Card */}
          <div className='p-6 rounded-md' style={{ background: '#1A1919' }}>
            <h2 className='text-gray-300 font-medium'>Available Cache Space</h2>
            <p className='text-3xl font-bold text-white mt-2'>98%</p>
            <p className='text-[#B1B1B1] text-sm mt-1'>490mb/500mb</p>
          </div>
        </div>
      </div>

      {/* Metrics Section - Updated with new metrics */}
      <div className='w-full p-8 px-10 bg-black'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          {/* Average Bid Card */}
          <div className='p-6 rounded-md' style={{ background: '#1A1919' }}>
            <div className='flex justify-between mb-2'>
              <div>
                <h2 className='text-gray-300 font-medium'>Average Bid</h2>
                <p className='text-3xl font-bold text-white mt-1'>0.05 ETH</p>
                <p className='text-gray-500 text-sm mt-1'>
                  Average bid recorded during the period for the selected
                  contract size group
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

          {/* Cacher Manager Activity Card */}
          <div className='p-6 rounded-md' style={{ background: '#1A1919' }}>
            <div className='flex justify-between mb-2'>
              <div>
                <h2 className='text-gray-300 font-medium'>
                  Cacher Manager Activity
                </h2>
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
        </div>
      </div>
    </div>
  );
}
