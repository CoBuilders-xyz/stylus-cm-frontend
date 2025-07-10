import { useState, useEffect, useCallback } from 'react';
import {
  BlockchainEvent,
  BlockchainEventsPagination,
  BlockchainEventType,
  BlockchainEventSortField,
  SortOrder,
} from '@/types/blockchainEvents';
import { useBlockchainEventsService } from './useBlockchainEventsService';
import { useBlockchainService } from './useBlockchainService';

interface BlockchainEventsResult {
  events: BlockchainEvent[];
  isLoading: boolean;
  error: string | null;
  pagination: BlockchainEventsPagination;
  refetch: () => void;
  goToPage: (page: number) => void;
  setItemsPerPage: (limit: number) => void;
  sortBy: BlockchainEventSortField;
  sortOrder: SortOrder;
  setSorting: (field: BlockchainEventSortField) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  eventTypeFilter: BlockchainEventType | null;
  setEventTypeFilter: (eventType: BlockchainEventType | null) => void;
}

/**
 * Default empty pagination meta
 */
const DEFAULT_PAGINATION: BlockchainEventsPagination = {
  page: 1,
  limit: 10,
  totalItems: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
};

/**
 * Hook to fetch blockchain events data with pagination, sorting, search, and filtering
 * @returns Object with events data, pagination, loading state, error, and methods to control data fetching
 */
export function useBlockchainEvents(): BlockchainEventsResult {
  const [events, setEvents] = useState<BlockchainEvent[]>([]);
  const [pagination, setPagination] =
    useState<BlockchainEventsPagination>(DEFAULT_PAGINATION);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState<BlockchainEventSortField>(
    BlockchainEventSortField.BLOCK_TIMESTAMP
  );
  const [sortOrder, setSortOrder] = useState<SortOrder>(SortOrder.DESC);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [eventTypeFilter, setEventTypeFilter] =
    useState<BlockchainEventType | null>(null);

  const blockchainEventsService = useBlockchainEventsService();
  const { currentBlockchainId, isLoading: isBlockchainLoading } =
    useBlockchainService(false);

  // Fetch blockchain events
  const fetchEvents = useCallback(async () => {
    // Don't fetch if we don't have a blockchain ID yet
    if (!currentBlockchainId) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await blockchainEventsService.getEvents(
        page,
        limit,
        sortBy,
        sortOrder,
        searchQuery || undefined,
        eventTypeFilter || undefined,
        currentBlockchainId
      );

      setEvents(response.data);
      setPagination(response.meta);
    } catch (err) {
      console.error('Failed to fetch blockchain events:', err);
      setError('Failed to load blockchain events. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, [
    blockchainEventsService,
    currentBlockchainId,
    page,
    limit,
    sortBy,
    sortOrder,
    searchQuery,
    eventTypeFilter,
  ]);

  // Go to a specific page
  const goToPage = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  // Change items per page
  const handleSetItemsPerPage = useCallback((newLimit: number) => {
    setLimit(newLimit);
    setPage(1); // Reset to first page when changing items per page
  }, []);

  // Set sorting - toggles between ASC, DESC if the same field is clicked
  const handleSetSorting = useCallback(
    (field: BlockchainEventSortField) => {
      if (!field) return;

      // If already sorting by this field, toggle sort order
      if (sortBy === field) {
        // Toggle between DESC -> ASC -> DESC
        setSortOrder(
          sortOrder === SortOrder.DESC ? SortOrder.ASC : SortOrder.DESC
        );
      } else {
        // Otherwise set as the new sort field with default DESC order
        setSortBy(field);
        setSortOrder(SortOrder.DESC);
      }

      setPage(1); // Reset to first page when changing sort
    },
    [sortBy, sortOrder]
  );

  // Handle search query changes
  const handleSetSearchQuery = useCallback((query: string) => {
    setSearchQuery(query);
    setPage(1); // Reset to first page when searching
  }, []);

  // Handle event type filter changes
  const handleSetEventTypeFilter = useCallback(
    (eventType: BlockchainEventType | null) => {
      setEventTypeFilter(eventType);
      setPage(1); // Reset to first page when filtering
    },
    []
  );

  // Fetch events when dependencies change
  useEffect(() => {
    if (isBlockchainLoading) {
      setIsLoading(true);
      return;
    }

    fetchEvents();
  }, [fetchEvents, isBlockchainLoading]);

  return {
    events,
    isLoading: isLoading || isBlockchainLoading,
    error,
    pagination,
    refetch: fetchEvents,
    goToPage,
    setItemsPerPage: handleSetItemsPerPage,
    sortBy,
    sortOrder,
    setSorting: handleSetSorting,
    searchQuery,
    setSearchQuery: handleSetSearchQuery,
    eventTypeFilter,
    setEventTypeFilter: handleSetEventTypeFilter,
  };
}
