'use client';

import React, { useState } from 'react';
import { Contract } from '@/services/contractService';
import {
  formatEth,
  formatSize,
  formatDate,
  formatRiskLevel,
} from '@/utils/formatting';
import { MoreHorizontal, CircleEllipsis, Edit } from 'lucide-react';

interface ContractDetailsProps {
  contract: Contract;
  viewType?: 'explore-contracts' | 'my-contracts';
}

export default function ContractDetails({
  contract,
  viewType = 'explore-contracts',
}: ContractDetailsProps) {
  // State for bidding form (only used in my-contracts view)
  const [bidAmount, setBidAmount] = useState('');
  const [automatedBidding, setAutomatedBidding] = useState(false);

  // Minimum bid based on contract data or calculation
  const minBidAmount = formatEth(contract.minBid || contract.lastBid);

  // Bid history mock data - would be fetched from API in a real implementation
  const bidHistory = [
    {
      id: 1,
      address:
        contract.blockchain.cacheManagerAddress.substring(0, 6) +
        '...' +
        contract.blockchain.cacheManagerAddress.substring(
          contract.blockchain.cacheManagerAddress.length - 4
        ),
      bid: formatEth(contract.lastBid).split(' ')[0],
      type: 'automatic bid',
      date: new Date(contract.bidBlockTimestamp).toISOString().split('T')[0],
      time: new Date(contract.bidBlockTimestamp)
        .toISOString()
        .split('T')[1]
        .substring(0, 5),
      amount: '0.3',
    },
    {
      id: 2,
      address:
        contract.blockchain.cacheManagerAddress.substring(0, 6) +
        '...' +
        contract.blockchain.cacheManagerAddress.substring(
          contract.blockchain.cacheManagerAddress.length - 4
        ),
      bid: formatEth(contract.lastBid).split(' ')[0],
      type: 'manual bid',
      date: new Date(contract.bidBlockTimestamp).toISOString().split('T')[0],
      time: new Date(contract.bidBlockTimestamp)
        .toISOString()
        .split('T')[1]
        .substring(0, 5),
      amount: '0.5',
    },
    {
      id: 3,
      address:
        contract.blockchain.cacheManagerAutomationAddress.substring(0, 6) +
        '...' +
        contract.blockchain.cacheManagerAutomationAddress.substring(
          contract.blockchain.cacheManagerAutomationAddress.length - 4
        ),
      bid: formatEth(contract.lastBid).split(' ')[0],
      type: 'manual bid',
      date: new Date(contract.bidBlockTimestamp).toISOString().split('T')[0],
      time: new Date(contract.bidBlockTimestamp)
        .toISOString()
        .split('T')[1]
        .substring(0, 5),
      amount: '0.5',
    },
  ];

  // Handler for bid submission (placeholder)
  const handleSubmitBid = () => {
    console.log('Submitting bid:', bidAmount);
    // Here would be API call to submit bid
  };

  return (
    <div className='text-white flex flex-col h-full bg-[#1A1919]'>
      {/* Top Section: Contract Address and Name with Options */}
      <div className='flex justify-between items-center mb-6'>
        <div>
          <div className='text-sm font-mono opacity-80 mb-1'>
            {contract.address}
          </div>
          <h1 className='text-2xl font-bold'>
            {contract.name || 'ArbSwapRouter'}
          </h1>
        </div>
        <div className='flex gap-2'>
          <button className='p-2 rounded-md bg-black border-none hover:bg-gray-900'>
            <MoreHorizontal className='h-5 w-5' />
          </button>
          <button className='p-2 rounded-md bg-black border-none hover:bg-gray-900'>
            <CircleEllipsis className='h-5 w-5' />
          </button>
        </div>
      </div>

      {viewType === 'my-contracts' ? (
        <>
          {/* Main statistics in a 2-column grid layout */}
          <div className='grid grid-cols-2 gap-4 mb-6'>
            {/* Cache Status */}
            <div className='border border-[#2C2E30] rounded-md p-4'>
              <div className='text-gray-400 text-sm'>Cache Status</div>
              <div className='text-xl font-bold'>
                {contract.bytecode.isCached ? 'Cached' : 'Not Cached'}
              </div>
              <div className='text-xs text-gray-400'>
                Last Cached {formatDate(contract.bidBlockTimestamp)}
              </div>
            </div>

            {/* Effective Bid */}
            <div className='border border-[#2C2E30] rounded-md p-4'>
              <div className='text-gray-400 text-sm'>Effective Bid</div>
              <div className='text-xl font-bold'>
                {formatEth(contract.effectiveBid || '0.03')}
              </div>
              <div className='text-xs text-gray-400'>
                Bid: {formatEth(contract.lastBid)}
              </div>
            </div>
          </div>

          {/* Other stats as a simple list */}
          <div className='space-y-4 mb-6'>
            {/* Eviction Risk */}
            <div className='flex justify-between items-center'>
              <div className='text-gray-400'>Eviction Risk</div>
              <div className='font-medium'>
                {contract.evictionRisk
                  ? formatRiskLevel(contract.evictionRisk.riskLevel)
                  : 'High'}
              </div>
            </div>

            {/* Total Spent */}
            <div className='flex justify-between items-center'>
              <div className='text-gray-400'>Total Spent</div>
              <div className='font-medium'>
                {formatEth(contract.totalBidInvestment)}
              </div>
            </div>

            {/* Size */}
            <div className='flex justify-between items-center'>
              <div className='text-gray-400'>Size</div>
              <div className='font-medium'>
                {formatSize(contract.bytecode.size)}
              </div>
            </div>

            {/* Active Alerts */}
            <div className='flex justify-between items-center'>
              <div className='text-gray-400'>Active alerts</div>
              <div className='flex gap-2 items-center'>
                <span className='px-3 py-1 bg-red-900/50 text-white text-xs rounded-full'>
                  Eviction
                </span>
                <span className='px-3 py-1 bg-yellow-900/50 text-white text-xs rounded-full'>
                  No gas
                </span>
                <span className='px-3 py-1 bg-blue-900/50 text-white text-xs rounded-full'>
                  Low gas:0.02 ETH
                </span>
                <span className='px-3 py-1 bg-green-900/50 text-white text-xs rounded-full'>
                  Bid Safety:10%
                </span>
                <button className='p-1 rounded-full bg-transparent border border-gray-700 hover:bg-gray-900'>
                  <Edit className='h-4 w-4' />
                </button>
              </div>
            </div>
          </div>

          {/* Bidding Section Header */}
          <div className='mb-3'>
            <h3 className='text-lg'>Bidding</h3>
          </div>

          {/* Bidding Section */}
          <div className='space-y-4 mb-8'>
            {/* Bid now section */}
            <div
              className='relative rounded-md p-4 overflow-hidden'
              style={{
                background:
                  'linear-gradient(89.49deg, #3E71C6 0%, #5897B2 55.53%, #C35B88 103.8%)',
              }}
            >
              {/* White noise texture overlay */}
              <div
                className='absolute inset-0 opacity-50 mix-blend-overlay pointer-events-none'
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' fill='white'/%3E%3C/svg%3E")`,
                  backgroundSize: '100px 100px',
                  backgroundRepeat: 'repeat',
                }}
              />

              <div className='flex justify-between items-start relative z-10'>
                <div>
                  <p className='font-bold'>Bid now</p>
                  <p className='text-sm text-blue-200'>
                    Higher bids extend cache duration
                  </p>
                </div>
                <div className='flex items-center gap-2'>
                  <div className='relative rounded-md overflow-hidden'>
                    <input
                      type='text'
                      placeholder={`From ${minBidAmount}`}
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      className='px-3 py-2 bg-[#40507A] border-none outline-none text-white w-32'
                    />
                    <span className='absolute right-3 top-2 text-gray-300'>
                      ETH
                    </span>
                  </div>
                  <button
                    className='px-4 py-2 bg-black text-white border-none rounded-md'
                    onClick={handleSubmitBid}
                  >
                    Place bid
                  </button>
                </div>
              </div>
            </div>

            {/* Automated Bidding section */}
            <div
              className='relative rounded-md p-4 overflow-hidden'
              style={{
                background:
                  'linear-gradient(89.49deg, #3E71C6 0%, #5897B2 103.8%)',
              }}
            >
              {/* White noise texture overlay */}
              <div
                className='absolute inset-0 opacity-50 mix-blend-overlay pointer-events-none'
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' fill='white'/%3E%3C/svg%3E")`,
                  backgroundSize: '100px 100px',
                  backgroundRepeat: 'repeat',
                }}
              />

              <div className='flex justify-between items-center relative z-10'>
                <div>
                  <p className='font-bold'>Enable Automated Bidding</p>
                  <p className='text-sm text-blue-200'>
                    Set a maximum bid value to maintain your position in the
                    cache without manual intervention
                  </p>
                </div>
                <div className='relative inline-flex h-[24px] w-[44px] shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-gray-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-opacity-75 data-[state=checked]:bg-[#9747FF]'>
                  <span
                    className={`pointer-events-none inline-block h-[20px] w-[20px] transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      automatedBidding ? 'translate-x-5' : 'translate-x-0'
                    }`}
                    onClick={() => setAutomatedBidding(!automatedBidding)}
                  ></span>
                </div>
              </div>
            </div>
          </div>

          {/* Bid History Header */}
          <div className='mb-4'>
            <h3 className='text-lg'>Bid History</h3>
          </div>

          {/* Bid History List (not using table for this layout) */}
          <div className='space-y-4 mb-4'>
            {bidHistory.map((bid) => (
              <div
                key={bid.id}
                className='flex items-center justify-between py-2 border-b border-[#2C2E30]'
              >
                <div className='flex items-center'>
                  <div className='w-10 h-10 bg-gray-700 rounded-full mr-3'></div>
                  <div>
                    <div className='font-mono'>{bid.address}</div>
                    <div className='text-gray-400 text-sm'>
                      placed a <span className='text-white'>{bid.type}</span>
                    </div>
                    <div className='text-gray-400 text-sm'>
                      {bid.date} {bid.time}
                    </div>
                  </div>
                </div>
                <div className='font-medium'>Bid {bid.amount} ETH</div>
              </div>
            ))}
          </div>
        </>
      ) : (
        /* Explore Contracts View - Keep the existing simpler layout */
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
        </div>
      )}
    </div>
  );
}
