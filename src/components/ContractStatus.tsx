import React from 'react';
import { formatDate, formatRoundedEth } from '@/utils/formatting';
import { formatEther } from 'viem';

interface ContractStatusProps {
  isLoading: boolean;
  isCached?: boolean;
  bidBlockTimestamp?: string;
  effectiveBid?: string;
  lastBid?: string;
  viewType?: 'explore-contracts' | 'my-contracts';
}

export function ContractStatus({
  isLoading,
  isCached,
  bidBlockTimestamp,
  effectiveBid,
  lastBid,
}: ContractStatusProps) {
  if (isLoading) {
    return (
      <div className='grid grid-cols-2 gap-4 mb-6'>
        {/* Cache Status Loading State */}
        <div className='border border-[#2C2E30] rounded-md p-4'>
          <div className='text-gray-400 text-sm'>Cache Status</div>
          <div className='h-6 bg-gray-700 rounded w-24 mt-1 mb-1 animate-pulse'></div>
          <div className='h-3 bg-gray-700 rounded w-40 mb-0.5 animate-pulse'></div>
        </div>

        {/* Effective Bid Loading State */}
        <div className='border border-[#2C2E30] rounded-md p-4'>
          <div className='text-gray-400 text-sm'>Effective Bid</div>
          <div className='h-6 bg-gray-700 rounded w-24 mt-1 mb-1 animate-pulse'></div>
          <div className='h-3 bg-gray-700 rounded w-32 mb-0.5 animate-pulse'></div>
        </div>
      </div>
    );
  }

  // For explore-contracts view, use default value if effectiveBid is not provided
  const displayEffectiveBid = effectiveBid || '';

  return (
    <div className='grid grid-cols-2 gap-4 mb-6'>
      {/* Cache Status */}
      <div className='border border-[#2C2E30] rounded-md p-4'>
        <div className='text-gray-400 text-sm'>Cache Status</div>
        <div className='text-xl font-bold'>
          {isCached ? 'Cached' : 'Not Cached'}
        </div>
        <div className='text-xs text-gray-400'>
          Last Cached {formatDate(bidBlockTimestamp || '')}
        </div>
      </div>

      {/* Effective Bid */}
      <div className='border border-[#2C2E30] rounded-md p-4'>
        <div className='text-gray-400 text-sm'>Effective Bid</div>
        <div className='text-xl font-bold'>
          {displayEffectiveBid
            ? formatRoundedEth(formatEther(BigInt(displayEffectiveBid))) +
              ' ETH'
            : 'N/A'}
        </div>
        <div className='text-xs text-gray-400'>
          Bid:{' '}
          {lastBid
            ? formatRoundedEth(formatEther(BigInt(lastBid))) + ' ETH'
            : 'N/A'}
        </div>
      </div>
    </div>
  );
}

export default ContractStatus;
