// Blockchain Events Type Definitions

export enum BlockchainEventType {
  INSERT = 'InsertBid',
  DELETE = 'DeleteBid',
}

export enum BlockchainEventSortField {
  BLOCK_TIMESTAMP = 'blockTimestamp',
  BLOCK_NUMBER = 'blockNumber',
}

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export interface BlockchainEvent {
  id: string;
  blockchainId: string;
  blockchainName: string;
  contractName: string;
  contractAddress: string;
  eventName: string;
  blockTimestamp: string; // ISO string from backend
  blockNumber: number;
  transactionHash: string;
  logIndex: number;
  isRealTime: boolean;
  originAddress: string;
  eventData: Record<string, unknown>;
}

export interface BlockchainEventsPagination {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface BlockchainEventsResponse {
  data: BlockchainEvent[];
  meta: BlockchainEventsPagination;
}

export interface BlockchainEventFilters {
  blockchainId: string;
  eventType?: BlockchainEventType;
  search?: string;
  sortBy?: BlockchainEventSortField;
  sortOrder?: SortOrder;
  page?: number;
  limit?: number;
}

export interface BlockchainEventQueryParams {
  blockchainId: string;
  eventType?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
  page?: number;
  limit?: number;
}

// Helper interface for formatting
export interface FormattedBlockchainEvent extends BlockchainEvent {
  formattedTimestamp: string;
  formattedDate: string;
  truncatedTransactionHash: string;
  truncatedContractAddress: string;
}
