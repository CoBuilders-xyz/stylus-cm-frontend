import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { useIsMobile } from '@/hooks/useIsMobile';

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

// Mobile card component for bid history
const BidHistoryCard = ({ bid }: { bid: BiddingHistoryItem }) => {
  return (
    <div className='bg-gray-900/50 rounded-lg p-3 mb-2'>
      <div className='flex items-center justify-between mb-2'>
        <div className='flex items-center gap-2'>
          <div className='w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0'>
            {bid.contractName.substring(0, 2).toUpperCase() || 'CN'}
          </div>
          <div className='font-mono text-xs truncate max-w-[120px]'>
            {bid.isAutomated ? 'Cache Manager' : bid.originAddress}
          </div>
        </div>
        <div
          className={`px-2 py-1 text-white text-xs rounded-md bg-[#1A1A1A] border border-[#333]`}
        >
          {bid.isAutomated ? 'Auto' : 'Manual'}
        </div>
      </div>
      <div className='flex items-center justify-between'>
        <span className='font-medium text-sm'>{bid.amount} ETH</span>
        <div className='text-right text-gray-400'>
          <div className='text-xs'>
            {bid.date.split(',')[1]?.split(' ')[1]?.trim() || ''}
          </div>
          <div className='text-xs'>
            {bid.date.split(',')[0]?.replace(/\//g, '-') || '2024-02-04'}
          </div>
        </div>
      </div>
    </div>
  );
};

export function BiddingHistory({
  isLoading,
  biddingHistory,
}: BiddingHistoryProps) {
  const isMobile = useIsMobile();
  
  // State to track how many entries to show
  const [visibleEntries, setVisibleEntries] = useState(3);

  // Handler for loading more entries
  const handleLoadMore = () => {
    setVisibleEntries((prev) => prev + 3);
  };

  // Calculate if we have more entries to show
  const hasMoreEntries = visibleEntries < biddingHistory.length;

  // Get the currently visible entries
  const displayedEntries = biddingHistory.slice(0, visibleEntries);

  return (
    <>
      {/* Bid History Header */}
      <div className='mb-4'>
        <h3 className='text-lg'>Bid History</h3>
      </div>

      {isLoading ? (
        // Loading state
        <div className='space-y-2'>
          {Array(3)
            .fill(0)
            .map((_, index) => (
              <div
                key={index}
                className='animate-pulse bg-gray-800 rounded-lg p-4'
              >
                <div className='h-4 bg-gray-700 rounded w-3/4 mb-2'></div>
                <div className='h-3 bg-gray-700 rounded w-1/2'></div>
              </div>
            ))}
        </div>
      ) : biddingHistory.length === 0 ? (
        // No bid history available
        <div className='text-center py-4 text-gray-400'>
          No bidding history available for this contract.
        </div>
      ) : isMobile ? (
        // Mobile card view
        <div className='space-y-2'>
          {displayedEntries.map((bid) => (
            <BidHistoryCard key={bid.id} bid={bid} />
          ))}
        </div>
      ) : (
        // Desktop table view
        <Table>
          <TableBody>
            {displayedEntries.map((bid) => (
              <TableRow
                key={bid.id}
                className='py-2 hover:bg-transparent rounded'
              >
                {/* Left side with avatar and address */}
                <TableCell className='p-2 w-1/4'>
                  <div className='flex items-center'>
                    <div className='w-8 h-8 bg-blue-600 rounded-full mr-3 flex items-center justify-center text-xs font-bold'>
                      {bid.contractName.substring(0, 2).toUpperCase() || 'CN'}
                    </div>
                    <div className='font-mono text-sm'>
                      {bid.isAutomated
                        ? 'Cache Manager Automation'
                        : bid.originAddress}
                    </div>
                  </div>
                </TableCell>

                {/* Center with bid information */}
                <TableCell className='p-2 w-1/4 text-center'>
                  <span className='font-medium'>Bid {bid.amount} ETH</span>
                </TableCell>

                {/* Action button */}
                <TableCell className='p-2 w-1/4 text-center'>
                  <div
                    className={`px-3 py-2 text-white text-xs rounded-md inline-block
                      ${
                        bid.isAutomated
                          ? 'bg-[#1A1A1A] border border-[#333]'
                          : 'bg-[#1A1A1A] border border-[#333]'
                      }`}
                  >
                    {bid.isAutomated ? 'Automated Bid' : 'Manual Bid'}
                  </div>
                </TableCell>

                {/* Timestamp */}
                <TableCell className='p-2 w-1/4 text-center'>
                  <div className='text-right text-gray-400 min-w-[70px]'>
                    <div className='text-xs font-medium'>
                      {bid.date.split(',')[1]?.split(' ')[1]?.trim() || ''}
                    </div>
                    <div className='text-xs'>
                      {bid.date.split(',')[0]?.replace(/\//g, '-') ||
                        '2024-02-04'}
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Load More button */}
      {!isLoading && hasMoreEntries && (
        <div className='mt-4 flex justify-center'>
          <Button
            onClick={handleLoadMore}
            className='px-4 py-2 bg-[#1A1A1A] border border-[#333] text-white hover:bg-[#252525] rounded-md text-sm'
          >
            Load More Entries
          </Button>
        </div>
      )}
    </>
  );
}

export default BiddingHistory;
