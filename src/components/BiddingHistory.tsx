import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Bidding history item interface
export interface BiddingHistoryItem {
  id: number;
  address: string;
  bid: string;
  type: string;
  date: string;
  amount: string;
  transactionHash?: string;
  contractName: string;
  originAddress: string;
  isAutomated: boolean;
}

interface BiddingHistoryProps {
  isLoading: boolean;
  biddingHistory: BiddingHistoryItem[];
}

export function BiddingHistory({
  isLoading,
  biddingHistory,
}: BiddingHistoryProps) {
  const [visibleEntries, setVisibleEntries] = useState(3);

  const handleLoadMore = () => {
    setVisibleEntries((prev) => prev + 3);
  };

  const hasMoreEntries = visibleEntries < biddingHistory.length;
  const displayedEntries = biddingHistory.slice(0, visibleEntries);

  return (
    <div>
      <div className='mb-3'>
        <h3 className='text-lg'>Bid History</h3>
      </div>

      {isLoading ? (
        <ul className='flex flex-col gap-2'>
          {Array(3)
            .fill(0)
            .map((_, index) => (
              <li
                key={index}
                className='animate-pulse rounded-md border border-[#1A1A1A] bg-[#121212] p-3'
              >
                <div className='flex items-center gap-3'>
                  <div className='w-8 h-8 rounded-full bg-gray-700' />
                  <div className='flex-1 space-y-2'>
                    <div className='h-3 bg-gray-700 rounded w-24' />
                    <div className='h-3 bg-gray-800 rounded w-32' />
                  </div>
                </div>
              </li>
            ))}
        </ul>
      ) : biddingHistory.length === 0 ? (
        <p className='text-sm text-gray-400'>
          No bidding history available for this contract.
        </p>
      ) : (
        <ul className='flex flex-col gap-2'>
          {displayedEntries.map((bid) => {
            const initials =
              bid.contractName?.substring(0, 2).toUpperCase() || 'CN';
            return (
              <li
                key={bid.id}
                className='rounded-md border border-[#1A1A1A] bg-[#0F0F0F] p-3 flex flex-col gap-2'
              >
                <div className='flex items-center gap-3 min-w-0'>
                  <div className='shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold'>
                    {initials}
                  </div>
                  <div className='min-w-0 flex-1'>
                    <div className='font-mono text-sm text-white truncate'>
                      {bid.isAutomated
                        ? 'Cache Manager Automation'
                        : bid.originAddress}
                    </div>
                    <div className='text-[11px] text-gray-500 truncate'>
                      {bid.date}
                    </div>
                  </div>
                  <Badge
                    variant='outline'
                    className='shrink-0 px-2 py-0.5 text-[11px] font-medium'
                  >
                    {bid.isAutomated ? 'Automated' : 'Manual'}
                  </Badge>
                </div>
                <div className='text-sm tabular-nums'>
                  Bid <span className='font-semibold'>{bid.amount}</span> ETH
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {!isLoading && hasMoreEntries && (
        <div className='mt-3 flex justify-center'>
          <Button
            onClick={handleLoadMore}
            className='px-4 py-2 bg-[#1A1A1A] border border-[#333] text-white hover:bg-[#252525] rounded-md text-sm'
          >
            Load More Entries
          </Button>
        </div>
      )}
    </div>
  );
}

export default BiddingHistory;
