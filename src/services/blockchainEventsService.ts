import { ApiClient } from './api';
import {
  BlockchainEventsResponse,
  BlockchainEventFilters,
  BlockchainEventType,
  BlockchainEventSortField,
  SortOrder,
} from '../types/blockchainEvents';

/**
 * Blockchain Events Service for handling blockchain event-related API requests
 * This service provides unauthenticated access to blockchain events
 */
export class BlockchainEventsService {
  private apiClient: ApiClient;
  private currentBlockchainId: string | null;

  /**
   * Initialize the service
   * @param defaultBlockchainId Optional default blockchain ID to use
   */
  constructor(defaultBlockchainId: string | null = null) {
    // No authentication required for blockchain events
    this.apiClient = new ApiClient(null);
    this.currentBlockchainId = defaultBlockchainId;
  }

  /**
   * Get the current blockchain ID
   */
  getCurrentBlockchainId(): string | null {
    return this.currentBlockchainId;
  }

  /**
   * Set the current blockchain ID
   * @param blockchainId The blockchain ID to use for requests
   */
  setCurrentBlockchainId(blockchainId: string | null): void {
    this.currentBlockchainId = blockchainId;
  }

  /**
   * Get blockchain events with pagination, filtering, search, and sorting
   * @param filters Filter options for the request
   * @returns Promise with paginated blockchain events response
   */
  async getBlockchainEvents(
    filters: BlockchainEventFilters
  ): Promise<BlockchainEventsResponse> {
    // Use provided blockchain ID or fallback to current one
    const blockchainId = filters.blockchainId || this.currentBlockchainId;

    if (!blockchainId) {
      throw new Error('Blockchain ID is required');
    }

    // Build URL with query parameters manually
    let url = `/blockchain-events?blockchainId=${blockchainId}`;

    // Add optional parameters if provided
    if (filters.eventType) {
      url += `&eventType=${filters.eventType}`;
    }

    if (filters.search && filters.search.trim()) {
      url += `&search=${encodeURIComponent(filters.search.trim())}`;
    }

    if (filters.sortBy) {
      url += `&sortBy=${filters.sortBy}`;
    }

    if (filters.sortOrder) {
      url += `&sortOrder=${filters.sortOrder}`;
    }

    if (filters.page) {
      url += `&page=${filters.page}`;
    }

    if (filters.limit) {
      url += `&limit=${filters.limit}`;
    }

    try {
      const response = await this.apiClient.get<BlockchainEventsResponse>(url);
      return response;
    } catch (error) {
      console.error('Error fetching blockchain events:', error);
      throw error;
    }
  }

  /**
   * Convenience method to get events with simplified parameters
   * @param page Page number (default: 1)
   * @param limit Items per page (default: 10)
   * @param sortBy Sort field (default: blockTimestamp)
   * @param sortOrder Sort order (default: DESC)
   * @param search Search term (optional)
   * @param eventType Event type filter (optional)
   * @param blockchainId Blockchain ID (optional, uses current if not provided)
   * @returns Promise with paginated blockchain events response
   */
  async getEvents(
    page: number = 1,
    limit: number = 10,
    sortBy: BlockchainEventSortField = BlockchainEventSortField.BLOCK_TIMESTAMP,
    sortOrder: SortOrder = SortOrder.DESC,
    search?: string,
    eventType?: BlockchainEventType,
    blockchainId?: string
  ): Promise<BlockchainEventsResponse> {
    const filters: BlockchainEventFilters = {
      blockchainId: blockchainId || this.currentBlockchainId || '',
      page,
      limit,
      sortBy,
      sortOrder,
    };

    if (search) {
      filters.search = search;
    }

    if (eventType) {
      filters.eventType = eventType;
    }

    return this.getBlockchainEvents(filters);
  }

  /**
   * Get only Insert events
   * @param page Page number
   * @param limit Items per page
   * @param sortBy Sort field
   * @param sortOrder Sort order
   * @param search Search term
   * @param blockchainId Blockchain ID
   * @returns Promise with paginated Insert events
   */
  async getInsertEvents(
    page: number = 1,
    limit: number = 10,
    sortBy: BlockchainEventSortField = BlockchainEventSortField.BLOCK_TIMESTAMP,
    sortOrder: SortOrder = SortOrder.DESC,
    search?: string,
    blockchainId?: string
  ): Promise<BlockchainEventsResponse> {
    return this.getEvents(
      page,
      limit,
      sortBy,
      sortOrder,
      search,
      BlockchainEventType.INSERT,
      blockchainId
    );
  }

  /**
   * Get only Delete events
   * @param page Page number
   * @param limit Items per page
   * @param sortBy Sort field
   * @param sortOrder Sort order
   * @param search Search term
   * @param blockchainId Blockchain ID
   * @returns Promise with paginated Delete events
   */
  async getDeleteEvents(
    page: number = 1,
    limit: number = 10,
    sortBy: BlockchainEventSortField = BlockchainEventSortField.BLOCK_TIMESTAMP,
    sortOrder: SortOrder = SortOrder.DESC,
    search?: string,
    blockchainId?: string
  ): Promise<BlockchainEventsResponse> {
    return this.getEvents(
      page,
      limit,
      sortBy,
      sortOrder,
      search,
      BlockchainEventType.DELETE,
      blockchainId
    );
  }
}
