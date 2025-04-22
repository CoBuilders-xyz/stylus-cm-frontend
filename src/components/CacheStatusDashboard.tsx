import React from 'react';

const CacheStatusDashboard = () => {
  return (
    <div
      className='w-full p-8'
      style={{
        background:
          'linear-gradient(180deg, #116AAE -193.97%, #072C48 152.16%)',
      }}
    >
      <div className='flex justify-between'>
        <div className='flex flex-col'>
          <h1 className='text-2xl font-bold text-white'>Cache Status</h1>
          <p className='text-gray-300 mt-1'>
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
        <div className='bg-gray-900 p-6 rounded-md'>
          <h2 className='text-gray-300 font-medium'>Total Contracts</h2>
          <p className='text-4xl font-bold text-white mt-2'>1,234</p>
          <p className='text-green-500 text-sm mt-1'>+180 from last month</p>
        </div>

        {/* Available Cache Space Card */}
        <div className='bg-gray-900 p-6 rounded-md'>
          <h2 className='text-gray-300 font-medium'>Available Cache Space</h2>
          <p className='text-4xl font-bold text-white mt-2'>567</p>
          <p className='text-green-500 text-sm mt-1'>+23 from last week</p>
        </div>
      </div>
    </div>
  );
};

export default CacheStatusDashboard;
