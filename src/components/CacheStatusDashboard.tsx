import React from 'react';

const CacheStatusDashboard = () => {
  return (
    <div className='w-full p-8 bg-page'>
      <div className='flex justify-between'>
        <div className='flex flex-col'>
          <h1 className='page-title'>Cache Status</h1>
          <p className='page-desc'>
            Monitor the status of contract caching across multiple chains
          </p>
        </div>

        <div className='flex'>
          <div className='flex items-center'>
            <div className='flex items-center h-8 px-[13px] border border-hairline rounded-lg text-[12.5px] text-ink-2'>
              <span className='me-2'>+</span>
              Add Contract
            </div>
          </div>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mt-6'>
        {/* Total Contracts Card */}
        <div className='app-card p-6'>
          <h2 className='tile-label'>Total Contracts</h2>
          <p className='stat-value mt-2'>1,234</p>
          <p className='text-ok-text text-xs mt-1'>+180 from last month</p>
        </div>

        {/* Available Cache Space Card */}
        <div className='app-card p-6'>
          <h2 className='tile-label'>Available Cache Space</h2>
          <p className='stat-value mt-2'>567</p>
          <p className='text-ok-text text-xs mt-1'>+23 from last week</p>
        </div>
      </div>
    </div>
  );
};

export default CacheStatusDashboard;
