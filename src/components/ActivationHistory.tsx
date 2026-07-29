'use client';

import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { ActivationEvent } from '@/lib/activation';
import { formatEventDate, formatEventTime } from '@/utils/formatting';
import { explorerTxUrl } from '@/utils/explorer';

interface ActivationHistoryProps {
  isLoading: boolean;
  events: ActivationEvent[];
  chainId?: number;
}

const PAGE_SIZE = 3;

const truncate = (hash: string) =>
  hash.length > 14 ? `${hash.slice(0, 8)}…${hash.slice(-6)}` : hash;

/**
 * Activation history list styled to match `BiddingHistory` — same borderless
 * Table primitive, same load-more pattern, same row rhythm — so the Cache and
 * Activation tabs read as one design instead of two competing ones.
 */
export default function ActivationHistory({
  isLoading,
  events,
  chainId,
}: ActivationHistoryProps) {
  const [visibleEntries, setVisibleEntries] = useState(PAGE_SIZE);

  const handleLoadMore = () => {
    setVisibleEntries((prev) => prev + PAGE_SIZE);
  };

  const hasMoreEntries = visibleEntries < events.length;
  const displayed = events.slice(0, visibleEntries);

  return (
    <>
      <div className='mb-4'>
        <h3 className='text-lg'>Activation History</h3>
      </div>

      <Table className='table-fixed w-full'>
        <TableBody>
          {isLoading ? (
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
          ) : events.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className='text-center py-4 text-gray-400'>
                No activation events recorded for this contract yet.
              </TableCell>
            </TableRow>
          ) : (
            displayed.map((evt) => {
              const url = explorerTxUrl(chainId, evt.txHash);
              const isSuccess = evt.status === 'success';
              const dotClass = isSuccess ? 'bg-green-500' : 'bg-red-500';
              const iconBg = isSuccess ? 'bg-green-600' : 'bg-red-600';
              const eventLabel = isSuccess ? 'Activated' : 'Failed';
              // `||` (not `??`) because backend `error` events can carry an
              // empty `note` — `'' ?? '—'` would render a blank cell.
              const spent =
                isSuccess && evt.valueConsumedEth
                  ? `Spent ${evt.valueConsumedEth} ETH`
                  : evt.note || '—';

              return (
                <TableRow
                  key={evt.id}
                  className='py-2 hover:bg-transparent rounded'
                >
                  {/* Icon + event label */}
                  <TableCell className='p-2 w-1/4'>
                    <div className='flex items-center min-w-0'>
                      <div
                        className={`w-8 h-8 shrink-0 ${iconBg} rounded-full mr-3 flex items-center justify-center`}
                      >
                        <span
                          className={`inline-block h-2 w-2 rounded-full ${dotClass}`}
                        />
                      </div>
                      <div className='font-medium text-sm truncate min-w-0'>
                        {eventLabel}
                      </div>
                    </div>
                  </TableCell>

                  {/* Spent / reason */}
                  <TableCell className='p-2 w-1/4 text-center'>
                    <span
                      className={`font-medium ${
                        isSuccess ? 'text-white' : 'text-red-300/80 text-xs'
                      }`}
                    >
                      {spent}
                    </span>
                  </TableCell>

                  {/* Tx hash badge */}
                  <TableCell className='p-2 w-1/4 text-center'>
                    {url ? (
                      <a
                        href={url}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='px-3 py-2 text-white text-xs rounded-md inline-flex items-center gap-1 bg-[#1A1A1A] border border-[#333] hover:bg-[#252525]'
                      >
                        {truncate(evt.txHash)}
                        <ExternalLink className='h-3 w-3' />
                      </a>
                    ) : (
                      <div className='px-3 py-2 text-white text-xs rounded-md inline-block bg-[#1A1A1A] border border-[#333] font-mono'>
                        {truncate(evt.txHash)}
                      </div>
                    )}
                  </TableCell>

                  {/* Date */}
                  <TableCell className='p-2 w-1/4 text-center'>
                    <div className='text-right text-gray-400 min-w-[70px]'>
                      <div className='text-xs font-medium'>
                        {formatEventTime(evt.date)}
                      </div>
                      <div className='text-xs'>
                        {formatEventDate(evt.date)}
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

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
