import { ApiClient } from './api';
import {
  BlockchainEventsResponse,
  BlockchainEventFilters,
  BlockchainEventType,
  BlockchainEventSortField,
  SortOrder,
} from '../types/blockchainEvents';
import { buildMockEventsResponse } from '@/lib/prototype-mocks';

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
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    return Promise.resolve(
      buildMockEventsResponse(page, limit, filters.eventType, filters.search)
    );
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
