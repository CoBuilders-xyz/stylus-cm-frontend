'use client';

import React from 'react';
import { Contract } from '@/services/contractService';
import {
  formatEth,
  formatSize,
  formatDate,
  formatRiskLevel,
} from '@/utils/formatting';

interface ContractDetailsProps {
  contract: Contract;
  viewType?: 'explore-contracts' | 'my-contracts';
}

export default function ContractDetails({
  contract,
  viewType = 'explore-contracts',
}: ContractDetailsProps) {
  return (
    <div className='text-white'>
      <h3 className='text-xl font-bold mb-4'>
        {contract.name || contract.address}
      </h3>

      <div className='space-y-4'>
        <div>
          <p className='text-gray-400'>Address</p>
          <p className='font-mono'>{contract.address}</p>
        </div>

        <div>
          <p className='text-gray-400'>Current Bid</p>
          <p className='text-xl font-bold'>{formatEth(contract.lastBid)}</p>
        </div>

        <div>
          <p className='text-gray-400'>Effective Bid</p>
          <p className='text-lg'>{formatEth(contract.effectiveBid)}</p>
        </div>

        <div>
          <p className='text-gray-400'>Size</p>
          <p className='text-lg'>{formatSize(contract.bytecode.size)}</p>
        </div>

        <div>
          <p className='text-gray-400'>Minimum Bid</p>
          <p className='text-lg'>{formatEth(contract.minBid || '0')}</p>
        </div>

        <div>
          <p className='text-gray-400'>Eviction Risk</p>
          <p className='text-lg'>
            {contract.evictionRisk
              ? formatRiskLevel(contract.evictionRisk.riskLevel)
              : 'N/A'}
          </p>
        </div>

        <div>
          <p className='text-gray-400'>Total Spent</p>
          <p className='text-lg'>{formatEth(contract.totalBidInvestment)}</p>
        </div>

        <div>
          <p className='text-gray-400'>Cache Status</p>
          <p className='text-lg'>
            {contract.bytecode.isCached ? 'Cached' : 'Not Cached'}
          </p>
        </div>

        <div>
          <p className='text-gray-400'>Last Updated</p>
          <p className='text-sm'>{formatDate(contract.bidBlockTimestamp)}</p>
        </div>

        {viewType === 'my-contracts' && (
          <div className='mt-6 pt-6 border-t border-gray-800'>
            <button className='w-full py-2 bg-black border border-white text-white rounded-md hover:bg-gray-900 transition-colors'>
              Increase Bid
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
