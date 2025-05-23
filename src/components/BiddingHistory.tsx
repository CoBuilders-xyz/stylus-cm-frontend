import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';

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

      {/* Bid History Table */}
      <Table>
        <TableBody>
          {isLoading ? (
            // Loading state
            Array(3)
              .fill(0)
              .map((_, index) => (
                <TableRow
                  key={index}
                  className='animate-pulse border-b border-[#1A1A1A] bg-[#121212]'
                >
                  <TableCell className='p-2 w-1/4'>
                    <div className='flex items-center'>
                      <div className='w-8 h-8 bg-none rounded-full mr-3'></div>
                      <div>
                        <div className='h-4 bg-gray-700 rounded w-24 mb-2'></div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className='p-2 w-1/4 text-center'>
                    <div className='h-4 bg-gray-700 rounded w-20 mx-auto'></div>
                  </TableCell>
                  <TableCell className='p-2 w-1/4'>
                    <div className='h-4 bg-gray-700 rounded w-24 ml-auto'></div>
                  </TableCell>
                  <TableCell className='p-2 w-1/4 text-right'>
                    <div className='h-3 bg-gray-800 rounded w-16 ml-auto mb-1'></div>
                    <div className='h-3 bg-gray-800 rounded w-20 ml-auto'></div>
                  </TableCell>
                </TableRow>
              ))
          ) : biddingHistory.length === 0 ? (
            // No bid history available
            <TableRow>
              <TableCell colSpan={4} className='text-center py-4 text-gray-400'>
                No bidding history available for this contract.
              </TableCell>
            </TableRow>
          ) : (
            // Display bid history
            displayedEntries.map((bid) => (
              <TableRow
                key={bid.id}
                className='py-2  hover:bg-transparent rounded'
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
            ))
          )}
        </TableBody>
      </Table>

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
