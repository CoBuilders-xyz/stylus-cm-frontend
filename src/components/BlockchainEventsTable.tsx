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
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { useBlockchainEvents } from '../hooks/useBlockchainEvents';
import {
  BlockchainEventSortField,
  SortOrder,
  BlockchainEventType,
  BlockchainEvent,
} from '../types/blockchainEvents';
import {
  formatTransactionHash,
  formatEventTimestamp,
  formatRelativeTime,
  formatEventType,
  formatBlockNumber,
  getBidAmountFromEventData,
  getSizeFromEventData,
  copyToClipboard,
} from '../utils/blockchainEventFormatting';
import { formatSize } from '../utils/formatting';
import NoticeBanner from './NoticeBanner';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Copy,
  Info,
} from 'lucide-react';
import noContractsFoundImage from '../../public/no-contracts-found.svg';
import sthWentWrongImage from '../../public/sth-went-wrong.svg';
import EventMobileCard from '@/components/EventMobileCard';
import TablePagination from '@/components/TablePagination';
import TableSearchInput from '@/components/TableSearchInput';

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
          <span className='ms-1 text-ink-3 opacity-60'>
            <ArrowUpDown className='w-3.5 h-3.5' />
          </span>
        );
      }

      if (currentSortOrder === SortOrder.ASC) {
        return (
          <span className='ms-1 text-accent-blue'>
            <ArrowUp className='w-3.5 h-3.5' />
          </span>
        );
      }

      if (currentSortOrder === SortOrder.DESC) {
        return (
          <span className='ms-1 text-accent-blue'>
            <ArrowDown className='w-3.5 h-3.5' />
          </span>
        );
      }

      return <span className='ms-1 text-ink-3 opacity-50'>↕</span>;
    };

    return (
      <TableHead
        aria-sort={
          sortField
            ? !isSorted
              ? 'none'
              : currentSortOrder === SortOrder.ASC
                ? 'ascending'
                : 'descending'
            : undefined
        }
        className={props.className || ''}
      >
        {sortField ? (
          <button
            type='button'
            onClick={handleSort}
            className='flex w-full items-center rounded-sm text-start text-inherit outline-none transition-colors hover:text-ink-1 focus-visible:ring-2 focus-visible:ring-accent-blue/60'
          >
            {children}
            {renderSortIcon()}
          </button>
        ) : (
          <div className='flex items-center'>{children}</div>
        )}
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

    const handleRowKeyDown = (
      keyEvent: React.KeyboardEvent<HTMLTableRowElement>
    ) => {
      if (keyEvent.target !== keyEvent.currentTarget) return;
      if (keyEvent.key === 'Enter' || keyEvent.key === ' ') {
        keyEvent.preventDefault();
        handleRowClick();
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

    // Extract event data
    const bidAmount = getBidAmountFromEventData(
      event.eventData,
      event.eventName
    );
    const size = getSizeFromEventData(event.eventData, event.eventName);

    return (
      <TableRow
        className='cursor-pointer outline-none focus-visible:bg-surface-2 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-blue/60'
        onClick={handleRowClick}
        onKeyDown={handleRowKeyDown}
        tabIndex={onEventSelect ? 0 : undefined}
        data-focus-return-id={`event-${event.id}`}
        aria-label={
          onEventSelect
            ? `Open ${formatEventType(event.eventName)} event ${formatTransactionHash(event.transactionHash)}`
            : undefined
        }
      >
        <TableCell>
          <span
            className={`pill ${
              event.eventName === 'DeleteBid' ? 'pill-crit' : 'pill-muted'
            }`}
          >
            <span
              className={`pill-dot ${
                event.eventName === 'DeleteBid' ? 'bg-crit' : 'bg-ok'
              }`}
            />
            {formatEventType(event.eventName)}
          </span>
        </TableCell>
        <TableCell>
          <div className='flex items-center gap-1.5'>
            <span className='mono-addr !text-ink-2 text-[12px]'>
              {formatTransactionHash(event.transactionHash)}
            </span>
            <Button
              variant='ghost'
              size='sm'
              onClick={(e) => handleCopy(event.transactionHash, 'tx', e)}
              aria-label='Copy transaction hash'
              className='p-1 h-auto text-ink-3 hover:text-ink-1 hover:bg-transparent'
            >
              {copySuccess.tx ? (
                <span className='text-ok-text text-xs'>✓</span>
              ) : (
                <Copy className='w-3 h-3' />
              )}
            </Button>
          </div>
        </TableCell>
        <TableCell className='text-end num'>
          {formatBlockNumber(event.blockNumber)}
        </TableCell>
        <TableCell>
          <div className='flex flex-col'>
            <span className='text-[13px] num'>
              {formatEventTimestamp(event.blockTimestamp)}
            </span>
            <span className='text-[11px] text-ink-3'>
              {formatRelativeTime(event.blockTimestamp)}
            </span>
          </div>
        </TableCell>
        <TableCell className='text-end num'>
          {bidAmount ? (
            <span>{bidAmount}</span>
          ) : (
            <span className='text-ink-3'>—</span>
          )}
        </TableCell>
        <TableCell className='text-end num'>
          {size ? (
            <span>{formatSize(size)}</span>
          ) : (
            <span className='text-ink-3'>—</span>
          )}
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
      <div className='flex items-center gap-2 w-full sm:w-auto'>
        <span className='text-[12.5px] text-ink-2 shrink-0'>Filter:</span>
        <Select
          value={currentFilter || 'all'}
          onValueChange={(value) =>
            onFilterChange(
              value === 'all' ? null : (value as BlockchainEventType)
            )
          }
        >
          <SelectTrigger className='flex-1 sm:flex-none sm:w-[170px] h-8 bg-surface-1 text-ink-1 border-hairline focus:border-accent-blue text-[12.5px]'>
            <SelectValue placeholder='All Events' />
          </SelectTrigger>
          <SelectContent className='bg-surface-2 text-ink-1 border-hairline-strong'>
            <SelectItem value='all'>All Events</SelectItem>
            <SelectItem value={BlockchainEventType.INSERT}>
              Insert Events
            </SelectItem>
            <SelectItem value={BlockchainEventType.DELETE}>
              Delete Events
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  }
);

EventTypeFilter.displayName = 'EventTypeFilter';

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
    <div className='overflow-hidden flex flex-col h-full'>
      <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6 sm:mb-8 flex-shrink-0'>
        <h1 className='page-title'>Cache Events</h1>
        <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto'>
          <EventTypeFilter
            currentFilter={eventTypeFilter}
            onFilterChange={setEventTypeFilter}
          />
          <TableSearchInput
            value={searchInput}
            placeholder='Search by contract address...'
            onChange={handleSearchInputChange}
            onKeyDown={handleKeyDown}
            onSearch={handleSearch}
          />
        </div>
      </div>

      {isLoading && (
        <div className='flex justify-center items-center py-20'>
          <div className='animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-ink-2'></div>
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
        <div className='w-full flex-1 flex flex-col min-h-0'>
          {/* Mobile card list */}
          <div className='md:hidden flex-1 min-h-0 overflow-y-auto'>
            {displayEvents.length > 0 ? (
              <div className='app-card divide-y divide-hairline overflow-hidden mb-4'>
                {displayEvents.map((event) => (
                  <EventMobileCard
                    key={`${event.transactionHash}-${event.logIndex}`}
                    event={event}
                    onSelect={onEventSelect}
                  />
                ))}
              </div>
            ) : (
              <NoticeBanner
                image={noContractsFoundImage}
                title='No Events Found'
                description='No blockchain events found matching your criteria.'
              />
            )}
          </div>

          {/* Desktop table */}
          <ScrollArea
            orientation='both'
            className='hidden md:block h-[calc(100vh-320px)] min-h-[400px] app-card'
          >
            <div className='min-w-full'>
              <TooltipProvider>
                <Table className='w-full'>
                  <TableHeader className='bg-surface-1 sticky top-0 z-10'>
                    <TableRow className='hover:bg-transparent'>
                      <TableHead >
                        Event Type
                      </TableHead>
                      <TableHead >
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
                      <TableHead >
                        <div className='flex items-center gap-2'>
                          Bid Amount
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className='w-4 h-4 cursor-help' />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className='max-w-xs'>
                                <strong>
                                  Event Bid Amount includes time decay.
                                </strong>
                                <br />
                                It’s calculated as:
                                <br />
                                <code>
                                  bidAmount + (decayRate × biddingTimestamp)
                                </code>
                                <br />
                                This may differ from the actual amount paid.
                                <br />
                                For accurate values, refer to the contract
                                tables.
                              </p>{' '}
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </TableHead>
                      <TableHead >
                        Size
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
                          colSpan={6}
                          className='text-center py-12'
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
              </TooltipProvider>
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Only show pagination controls if we have pagination data and more than 0 items */}
      {!isLoading && !error && pagination.totalItems > 0 && (
        <div className='flex-shrink-0'>
          <TablePagination
            pagination={pagination}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        </div>
      )}
    </div>
  );
}

export default React.memo(BlockchainEventsTable);
