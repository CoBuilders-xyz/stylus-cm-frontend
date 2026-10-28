import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { formatEventDate, formatEventTime } from '@/utils/formatting';

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
        <h3 className='text-[15px] font-semibold text-ink-1'>Bid History</h3>
      </div>

      {/* Bid History Table — table-fixed so columns respect their widths
          rather than growing to fit the longest cell (which pushed the date
          column off the right edge of the panel on mobile). */}
      <Table className='table-fixed w-full'>
        <TableBody>
          {isLoading ? (
            // Loading state
            Array(3)
              .fill(0)
              .map((_, index) => (
                <TableRow
                  key={index}
                  className='animate-pulse border-b border-hairline bg-surface-2'
                >
                  <TableCell className='p-2 w-1/4'>
                    <div className='flex items-center'>
                      <div className='w-8 h-8 bg-none rounded-full me-3'></div>
                      <div>
                        <div className='h-4 bg-surface-3 rounded w-24 mb-2'></div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className='p-2 w-1/4 text-center'>
                    <div className='h-4 bg-surface-3 rounded w-20 mx-auto'></div>
                  </TableCell>
                  <TableCell className='p-2 w-1/4'>
                    <div className='h-4 bg-surface-3 rounded w-24 ms-auto'></div>
                  </TableCell>
                  <TableCell className='p-2 w-1/4 text-end'>
                    <div className='h-3 bg-surface-3 rounded w-16 ms-auto mb-1'></div>
                    <div className='h-3 bg-surface-3 rounded w-20 ms-auto'></div>
                  </TableCell>
                </TableRow>
              ))
          ) : biddingHistory.length === 0 ? (
            // No bid history available
            <TableRow>
              <TableCell colSpan={4} className='text-center py-4 text-ink-3'>
                No bidding history available for this contract.
              </TableCell>
            </TableRow>
          ) : (
            // Display bid history
            displayedEntries.map((bid) => (
              <TableRow
                key={bid.id}
                className='py-2 hover:bg-transparent rounded border-hairline'
              >
                {/* Left side with avatar and address */}
                <TableCell className='p-2 w-1/4'>
                  <div className='flex items-center min-w-0'>
                    <div className='w-8 h-8 shrink-0 bg-surface-3 text-ink-2 rounded-full me-3 flex items-center justify-center text-xs font-semibold'>
                      {bid.contractName.substring(0, 2).toUpperCase() || 'CN'}
                    </div>
                    <div className='mono-addr truncate min-w-0'>
                      {bid.isAutomated
                        ? 'Cache Manager Automation'
                        : bid.originAddress}
                    </div>
                  </div>
                </TableCell>

                {/* Center with bid information */}
                <TableCell className='p-2 w-1/4 text-center'>
                  <span className='text-[13px] font-medium text-ink-1 num'>
                    Bid {bid.amount} ETH
                  </span>
                </TableCell>

                {/* Action button */}
                <TableCell className='p-2 w-1/4 text-center'>
                  <div className='pill pill-muted'>
                    {bid.isAutomated ? 'Automated Bid' : 'Manual Bid'}
                  </div>
                </TableCell>

                {/* Timestamp */}
                <TableCell className='p-2 w-1/4 text-center'>
                  <div className='text-end text-ink-3 min-w-[70px]'>
                    <div className='text-xs font-medium num'>
                      {formatEventTime(bid.date)}
                    </div>
                    <div className='text-xs num'>
                      {formatEventDate(bid.date)}
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
          <Button variant='outline' size='sm' onClick={handleLoadMore}>
            Load More Entries
          </Button>
        </div>
      )}
    </>
  );
}

export default BiddingHistory;
