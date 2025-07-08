'use client';

import React, { useCallback, useMemo, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { useBlockchainEvents } from '../hooks/useBlockchainEvents';
import {
  BlockchainEventSortField,
  SortOrder,
  BlockchainEventType,
  BlockchainEvent,
  BlockchainEventsPagination,
} from '../types/blockchainEvents';
import {
  formatTransactionHash,
  formatContractAddress,
  formatEventTimestamp,
  formatRelativeTime,
  getEventTypeBadgeVariant,
  formatEventType,
  formatBlockNumber,
  getBidAmountFromEventData,
  getSizeFromEventData,
  copyToClipboard,
} from '../utils/blockchainEventFormatting';
import { formatSize } from '../utils/formatting';
import NoticeBanner from './NoticeBanner';
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Copy,
  ExternalLink,
} from 'lucide-react';
import noContractsFoundImage from '../../public/no-contracts-found.svg';
import sthWentWrongImage from '../../public/sth-went-wrong.svg';

interface BlockchainEventsTableProps {
  events?: BlockchainEvent[];
  onEventSelect?: (event: BlockchainEvent) => void;
}

// Table header component with sorting functionality
const SortableTableHead = React.memo(
  ({
    children,
    sortField,
    currentSortBy,
    currentSortOrder,
    onSort,
    ...props
  }: {
    children: React.ReactNode;
    sortField?: BlockchainEventSortField;
    currentSortBy: BlockchainEventSortField;
    currentSortOrder: SortOrder;
    onSort: (field: BlockchainEventSortField) => void;
    className?: string;
  }) => {
    // Only add sorting functionality if a sortField is provided
    const handleSort = useCallback(() => {
      if (sortField) {
        onSort(sortField);
      }
    }, [sortField, onSort]);

    // Determine if this column is currently sorted
    const isSorted = sortField && currentSortBy === sortField;

    // Function to render the appropriate sort icon
    const renderSortIcon = () => {
      if (!sortField) return null;

      if (!isSorted) {
        return (
          <span className='ml-1 text-gray-500'>
            <ArrowUpDown className='w-4 h-4' />
          </span>
        );
      }

      if (currentSortOrder === SortOrder.ASC) {
        return (
          <span className='ml-1 text-green-400'>
            <ArrowUp className='w-4 h-4' />
          </span>
        );
      }

      if (currentSortOrder === SortOrder.DESC) {
        return (
          <span className='ml-1 text-red-400'>
            <ArrowDown className='w-4 h-4' />
          </span>
        );
      }

      return <span className='ml-1 text-gray-500 opacity-50'>↕</span>;
    };

    return (
      <TableHead
        onClick={sortField ? handleSort : undefined}
        className={`font-medium text-base py-6 ${
          sortField ? 'cursor-pointer hover:bg-gray-900' : ''
        } ${props.className || ''}`}
      >
        <div className='flex items-center'>
          {children}
          {renderSortIcon()}
        </div>
      </TableHead>
    );
  }
);

SortableTableHead.displayName = 'SortableTableHead';

// Table row component - separate to improve performance
const EventRow = React.memo(
  ({
    event,
    onEventSelect,
  }: {
    event: BlockchainEvent;
    onEventSelect?: (event: BlockchainEvent) => void;
  }) => {
    const [copySuccess, setCopySuccess] = useState<{ [key: string]: boolean }>(
      {}
    );

    const handleRowClick = () => {
      if (onEventSelect) {
        onEventSelect(event);
      }
    };

    const handleCopy = async (
      text: string,
      field: string,
      e: React.MouseEvent
    ) => {
      e.stopPropagation(); // Prevent row click event
      try {
        await copyToClipboard(text);
        setCopySuccess({ ...copySuccess, [field]: true });
        setTimeout(() => {
          setCopySuccess({ ...copySuccess, [field]: false });
        }, 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    };

    const handleExternalLink = (url: string, e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent row click event
      window.open(url, '_blank');
    };

    // Extract event data
    const bidAmount = getBidAmountFromEventData(event.eventData);
    const size = getSizeFromEventData(event.eventData);

    return (
      <TableRow
        className='h-20 cursor-pointer hover:bg-gray-900 transition-colors hover:bg-gradient-to-r hover:from-[#0B436E] hover:to-[#1581D4] transition-colors duration-300'
        onClick={handleRowClick}
      >
        <TableCell className='py-6 text-lg'>
          <Badge
            variant={getEventTypeBadgeVariant(event.eventName)}
            className='px-3 py-1 text-sm font-semibold w-fit'
          >
            {formatEventType(event.eventName)}
          </Badge>
        </TableCell>
        <TableCell className='py-6 text-lg'>
          <div className='flex items-center space-x-2'>
            <span className='font-mono text-sm'>
              {formatContractAddress(event.contractAddress)}
            </span>
            <Button
              variant='ghost'
              size='sm'
              onClick={(e) => handleCopy(event.contractAddress, 'address', e)}
              className='p-1 h-auto hover:bg-gray-800'
            >
              {copySuccess.address ? (
                <span className='text-green-400 text-xs'>✓</span>
              ) : (
                <Copy className='w-3 h-3' />
              )}
            </Button>
          </div>
        </TableCell>
        <TableCell className='py-6 text-lg'>
          <div className='flex items-center space-x-2'>
            <span className='font-mono text-sm'>
              {formatTransactionHash(event.transactionHash)}
            </span>
            <Button
              variant='ghost'
              size='sm'
              onClick={(e) => handleCopy(event.transactionHash, 'tx', e)}
              className='p-1 h-auto hover:bg-gray-800'
            >
              {copySuccess.tx ? (
                <span className='text-green-400 text-xs'>✓</span>
              ) : (
                <Copy className='w-3 h-3' />
              )}
            </Button>
            <Button
              variant='ghost'
              size='sm'
              onClick={(e) =>
                handleExternalLink(
                  `https://etherscan.io/tx/${event.transactionHash}`,
                  e
                )
              }
              className='p-1 h-auto hover:bg-gray-800'
            >
              <ExternalLink className='w-3 h-3' />
            </Button>
          </div>
        </TableCell>
        <TableCell className='py-6 text-lg'>
          {formatBlockNumber(event.blockNumber)}
        </TableCell>
        <TableCell className='py-6 text-lg'>
          <div className='flex flex-col'>
            <span className='text-sm'>
              {formatEventTimestamp(event.blockTimestamp)}
            </span>
            <span className='text-xs text-gray-400'>
              {formatRelativeTime(event.blockTimestamp)}
            </span>
          </div>
        </TableCell>
        <TableCell className='py-6 text-lg'>
          {bidAmount ? (
            <span className='font-mono text-sm'>{bidAmount}</span>
          ) : (
            <Badge
              variant='outline'
              className='px-3 py-1 text-sm font-semibold w-fit'
            >
              N/A
            </Badge>
          )}
        </TableCell>
        <TableCell className='py-6 text-lg'>
          {size ? (
            <span>{formatSize(size)}</span>
          ) : (
            <Badge
              variant='outline'
              className='px-3 py-1 text-sm font-semibold w-fit'
            >
              N/A
            </Badge>
          )}
        </TableCell>
        <TableCell className='py-6 text-lg'>
          <div className='flex flex-col'>
            <span className='text-sm'>{event.contractName}</span>
            <Badge
              variant={event.isRealTime ? 'default' : 'secondary'}
              className='px-2 py-1 text-xs font-semibold w-fit mt-1'
            >
              {event.isRealTime ? 'Real-time' : 'Historical'}
            </Badge>
          </div>
        </TableCell>
      </TableRow>
    );
  }
);

EventRow.displayName = 'EventRow';

// Event type filter component
const EventTypeFilter = React.memo(
  ({
    currentFilter,
    onFilterChange,
  }: {
    currentFilter: BlockchainEventType | null;
    onFilterChange: (filter: BlockchainEventType | null) => void;
  }) => {
    return (
      <div className='flex items-center space-x-2'>
        <span className='text-sm text-gray-300'>Filter:</span>
        <select
          className='bg-black text-white rounded-md px-3 py-2 border border-gray-500 focus:outline-none focus:border-white'
          value={currentFilter || ''}
          onChange={(e) =>
            onFilterChange((e.target.value as BlockchainEventType) || null)
          }
        >
          <option value=''>All Events</option>
          <option value={BlockchainEventType.INSERT}>Insert Events</option>
          <option value={BlockchainEventType.DELETE}>Delete Events</option>
        </select>
      </div>
    );
  }
);

EventTypeFilter.displayName = 'EventTypeFilter';

// Pagination component - separate to improve performance
const Pagination = React.memo(
  ({
    pagination,
    handlePageChange,
    handleItemsPerPageChange,
  }: {
    pagination: BlockchainEventsPagination;
    handlePageChange: (page: number) => void;
    handleItemsPerPageChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  }) => {
    return (
      <div className='flex items-center justify-between mt-4 text-sm text-white'>
        <div className='flex items-center space-x-2'>
          <span>Show</span>
          <select
            className='bg-black text-white rounded-md px-2 py-1 focus:outline-none'
            value={pagination.limit}
            onChange={handleItemsPerPageChange}
          >
            <option value='5'>5</option>
            <option value='10'>10</option>
            <option value='25'>25</option>
            <option value='50'>50</option>
          </select>
          <span>entries</span>
        </div>

        <div className='flex items-center space-x-2'>
          <span>
            {pagination.totalItems > 0
              ? `Page ${pagination.page} of ${pagination.totalPages}`
              : 'No results'}
          </span>
          <div className='flex space-x-1'>
            <Button
              onClick={() => handlePageChange(1)}
              disabled={!pagination.hasPreviousPage}
              className='px-2 py-1 bg-black text-white rounded-md disabled:opacity-50'
            >
              First
            </Button>
            <Button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={!pagination.hasPreviousPage}
              className='px-2 py-1 bg-black text-white rounded-md disabled:opacity-50'
            >
              ◀
            </Button>
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
              .filter(
                (page) =>
                  Math.abs(page - pagination.page) < 3 ||
                  page === 1 ||
                  page === pagination.totalPages
              )
              .map((page, idx, arr) => (
                <React.Fragment key={page}>
                  {idx > 0 && arr[idx - 1] !== page - 1 && (
                    <span className='px-2 py-1'>...</span>
                  )}
                  <Button
                    onClick={() => handlePageChange(page)}
                    className={`px-2 py-1 rounded-md ${
                      pagination.page === page
                        ? 'bg-white text-black'
                        : 'bg-black text-white'
                    }`}
                  >
                    {page}
                  </Button>
                </React.Fragment>
              ))}
            <Button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={!pagination.hasNextPage}
              className='px-2 py-1 bg-black text-white rounded-md disabled:opacity-50'
            >
              ▶
            </Button>
            <Button
              onClick={() => handlePageChange(pagination.totalPages)}
              disabled={!pagination.hasNextPage}
              className='px-2 py-1 bg-black text-white rounded-md disabled:opacity-50'
            >
              Last
            </Button>
          </div>
        </div>
      </div>
    );
  }
);

Pagination.displayName = 'Pagination';

function BlockchainEventsTable({
  events: initialEvents,
  onEventSelect,
}: BlockchainEventsTableProps) {
  // Use our custom hook to fetch blockchain events if not provided explicitly
  const {
    events,
    isLoading,
    error,
    pagination,
    goToPage,
    setItemsPerPage,
    sortBy,
    sortOrder,
    setSorting,
    setSearchQuery,
    eventTypeFilter,
    setEventTypeFilter,
  } = useBlockchainEvents();

  const [searchInput, setSearchInput] = useState('');

  // Use provided events if available, otherwise use fetched events
  const displayEvents = useMemo(
    () => (initialEvents?.length ? initialEvents : events),
    [initialEvents, events]
  );

  // Handle page changes through the hook
  const handlePageChange = useCallback(
    (page: number) => {
      goToPage(page);
    },
    [goToPage]
  );

  // Handle items per page changes through the hook
  const handleItemsPerPageChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setItemsPerPage(Number(e.target.value));
    },
    [setItemsPerPage]
  );

  // Handle search input changes
  const handleSearchInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchInput(e.target.value);
    },
    []
  );

  // Handle search submission
  const handleSearch = useCallback(() => {
    setSearchQuery(searchInput);
  }, [searchInput, setSearchQuery]);

  // Handle search by Enter key
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        handleSearch();
      }
    },
    [handleSearch]
  );

  return (
    <div className='overflow-hidden'>
      <div className='flex justify-between items-center mb-8'>
        <h1 className='text-xl font-bold text-white'>Blockchain Events</h1>
        <div className='flex items-center gap-4'>
          <EventTypeFilter
            currentFilter={eventTypeFilter}
            onFilterChange={setEventTypeFilter}
          />
          <div className='relative'>
            <input
              type='text'
              placeholder='Search by contract address...'
              className='p-2 pl-10 bg-black rounded-md w-80 border border-gray-500 focus:outline-none focus:border-white'
              value={searchInput}
              onChange={handleSearchInputChange}
              onKeyDown={handleKeyDown}
            />
            <Button
              className='absolute left-1 top-1 p-3 bg-transparent border-none hover:bg-transparent'
              onClick={handleSearch}
            >
              <Search className='w-3 h-3' />
            </Button>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className='flex justify-center items-center py-20'>
          <div className='animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-white'></div>
        </div>
      )}

      {error && (
        <NoticeBanner
          image={sthWentWrongImage}
          title='Error'
          description={error}
        />
      )}

      {!isLoading && !error && (
        <div className='w-full'>
          <ScrollArea orientation='both' className='h-[600px]'>
            <div className='min-w-full'>
              <Table className='w-full'>
                <TableHeader className='bg-black text-white sticky top-0 z-10'>
                  <TableRow className='h-20 hover:bg-transparent'>
                    <TableHead className='font-medium text-base py-6'>
                      Event Type
                    </TableHead>
                    <TableHead className='font-medium text-base py-6'>
                      Contract Address
                    </TableHead>
                    <TableHead className='font-medium text-base py-6'>
                      Transaction Hash
                    </TableHead>
                    <SortableTableHead
                      sortField={BlockchainEventSortField.BLOCK_NUMBER}
                      currentSortBy={sortBy}
                      currentSortOrder={sortOrder}
                      onSort={setSorting}
                    >
                      Block Number
                    </SortableTableHead>
                    <SortableTableHead
                      sortField={BlockchainEventSortField.BLOCK_TIMESTAMP}
                      currentSortBy={sortBy}
                      currentSortOrder={sortOrder}
                      onSort={setSorting}
                    >
                      Timestamp
                    </SortableTableHead>
                    <TableHead className='font-medium text-base py-6'>
                      Bid Amount
                    </TableHead>
                    <TableHead className='font-medium text-base py-6'>
                      Size
                    </TableHead>
                    <TableHead className='font-medium text-base py-6'>
                      Contract Info
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className='text-white [&>tr]:py-2'>
                  {displayEvents.length > 0 ? (
                    displayEvents.map((event) => (
                      <EventRow
                        key={`${event.transactionHash}-${event.logIndex}`}
                        event={event}
                        onEventSelect={onEventSelect}
                      />
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className='text-center py-12 bg-black'
                      >
                        <NoticeBanner
                          image={noContractsFoundImage}
                          title='No Events Found'
                          description='No blockchain events found matching your criteria.'
                        />
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Only show pagination controls if we have pagination data and more than 0 items */}
      {!isLoading && !error && pagination.totalItems > 0 && (
        <Pagination
          pagination={pagination}
          handlePageChange={handlePageChange}
          handleItemsPerPageChange={handleItemsPerPageChange}
        />
      )}
    </div>
  );
}

export default React.memo(BlockchainEventsTable);
