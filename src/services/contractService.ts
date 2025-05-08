import { ApiClient } from './api';

/**
 * Blockchain data interface
 */
export interface Blockchain {
  id: string;
  name: string;
  rpcUrl: string;
  cacheManagerAddress: string;
  cacheManagerAutomationAddress: string;
  arbWasmCacheAddress: string;
  chainId: number;
  otherInfo: Record<string, unknown> | null;
  lastSyncedBlock: number;
  lastProcessedBlockNumber: number;
}

/**
 * Bytecode data interface
 */
export interface Bytecode {
  id: string;
  bytecodeHash: string;
  size: string;
  lastBid: string;
  bidPlusDecay: string;
  lastEvictionBid: string;
  isCached: boolean;
  totalBidInvestment: string;
  bidBlockNumber: string;
  bidBlockTimestamp: string;
}

/**
 * Eviction risk data interface
 */
export interface EvictionRisk {
  riskLevel: 'high' | 'medium' | 'low' | 'none';
  remainingEffectiveBid: string;
  suggestedBids: {
    highRisk: string;
    midRisk: string;
    lowRisk: string;
  };
  comparisonPercentages: {
    vsHighRisk: number;
    vsMidRisk: number;
    vsLowRisk: number;
  };
  cacheStats: {
    utilization: number;
    evictionRate: number;
    medianBidPerByte: string;
    competitiveness: number;
    cacheSizeBytes: string;
    usedCacheSizeBytes: string;
  };
}

/**
 * Alert data interface for contract monitoring
 */
export interface Alert {
  id: string;
  type: 'eviction' | 'noGas' | 'lowGas' | 'bidSafety';
  value: string;
  isActive: boolean;
  lastTriggered: string | null;
  lastNotified: string | null;
  triggeredCount: number;
  emailChannelEnabled: boolean;
  slackChannelEnabled: boolean;
  telegramChannelEnabled: boolean;
  webhookChannelEnabled: boolean;
}

/**
 * Contract data interface
 */
export interface Contract {
  id: string;
  address: string;
  lastBid: string;
  bidPlusDecay: string;
  totalBidInvestment: string;
  bidBlockNumber: string;
  bidBlockTimestamp: string;
  bytecode: Bytecode;
  blockchain: Blockchain;
  effectiveBid: string;
  evictionRisk: EvictionRisk | null;
  minBid: string;
  maxBid?: string; // Maximum bid for automated bidding
  isAutomated?: boolean; // Whether automated bidding is enabled
  name?: string; // Optional field possibly used on frontend
  alerts?: Alert[]; // Optional alerts for contract monitoring
  userContractId?: string; // Optional user contract ID
  biddingHistory?: Array<{
    bytecodeHash: string;
    contractAddress: string;
    bid: string;
    actualBid: string;
    size: string;
    timestamp: string;
    blockNumber: string;
    transactionHash: string;
    originAddress: string;
  }>; // Optional bidding history
}

/**
 * Data required for creating a new contract
 */
export interface CreateContractData {
  address: string;
  blockchainId?: string; // Now optional since we can use currentBlockchainId
  name?: string;
  bid?: string;
}

/**
 * Pagination metadata interface
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * API response with pagination
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * User contract data interface with nested contract structure
 * This matches the API response from the /user-contracts endpoint
 */
export interface UserContract {
  id: string;
  address: string;
  name?: string;
  blockchain: Blockchain;
  contract: Contract;
  alerts?: Alert[]; // Contract alerts configured by the user
  [key: string]: unknown; // Allow for additional properties
}

/**
 * Bid risk levels interface
 */
export interface BidRiskLevels {
  lowRisk: string;
  midRisk: string;
  highRisk: string;
}

/**
 * Cache statistics interface
 */
export interface CacheStats {
  utilization: number;
  evictionRate: number;
  medianBidPerByte: string;
  competitiveness: number;
  cacheSizeBytes: string;
  usedCacheSizeBytes: string;
}

/**
 * Suggested bids response interface
 */
export interface SuggestedBidsResponse {
  suggestedBids: BidRiskLevels;
  cacheStats: CacheStats;
}

/**
 * Contract service for handling contract-related API requests
 */
export class ContractService {
  private apiClient: ApiClient;
  private currentBlockchainId: string | null;

  /**
   * Create a new ContractService instance
   * @param accessToken JWT token for authentication
   * @param defaultBlockchainId Optional default blockchain ID to use in requests
   */
  constructor(accessToken: string, defaultBlockchainId: string | null = null) {
    this.apiClient = new ApiClient(accessToken);
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
   * @param blockchainId New blockchain ID
   */
  setCurrentBlockchainId(blockchainId: string | null): void {
    this.currentBlockchainId = blockchainId;
  }

  /**
   * Get all contracts from the explore section
   * @param page Page number (optional)
   * @param limit Items per page (optional)
   * @param sortBy Fields to sort by (optional)
   * @param sortOrder Sort order, 'ASC' or 'DESC' or null (optional)
   * @param search Search query (optional)
   * @returns Promise with paginated contracts response
   */
  async getExploreContracts(
    page: number = 1,
    limit: number = 10,
    sortBy: string[] = ['contract.lastBid'],
    sortOrder: 'ASC' | 'DESC' | null = 'DESC',
    search?: string
  ): Promise<PaginatedResponse<Contract>> {
    if (!this.currentBlockchainId) {
      throw new Error('No blockchain ID available for getExploreContracts');
    }

    let url = `/contracts?blockchainId=${this.currentBlockchainId}&page=${page}&limit=${limit}`;

    // Add sorting parameters if provided
    if (sortBy.length > 0) {
      url += `&sortBy=${sortBy.join(',')}`;
    }

    if (sortOrder) {
      url += `&sortDirection=${sortOrder}`;
    }

    // Add search parameter if provided
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }

    return this.apiClient.get<PaginatedResponse<Contract>>(url);
  }

  /**
   * Get all contracts owned by the authenticated user
   * @param page Page number (optional)
   * @param limit Items per page (optional)
   * @param sortBy Fields to sort by (optional)
   * @param sortOrder Sort order, 'ASC' or 'DESC' or null (optional)
   * @param search Search query (optional)
   * @returns Promise with paginated user contracts response
   */
  async getMyContracts(
    page: number = 1,
    limit: number = 10,
    sortBy: string[] = ['contract.lastBid'],
    sortOrder: 'ASC' | 'DESC' | null = 'DESC',
    search?: string
  ): Promise<PaginatedResponse<UserContract>> {
    if (!this.currentBlockchainId) {
      throw new Error('No blockchain ID available for getMyContracts');
    }

    let url = `/user-contracts?blockchainId=${this.currentBlockchainId}&page=${page}&limit=${limit}`;

    // Add sorting parameters if provided
    if (sortBy.length > 0) {
      url += `&sortBy=${sortBy.join(',')}`;
    }

    if (sortOrder) {
      url += `&sortDirection=${sortOrder}`;
    }

    // Add search parameter if provided
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }

    return this.apiClient.get<PaginatedResponse<UserContract>>(url);
  }

  /**
   * Get a specific user contract by ID
   * @param user The authenticated user
   * @returns Promise with the user contract
   */
  async getUserContract(id: string): Promise<UserContract> {
    return this.apiClient.get<UserContract>(`/user-contracts/${id}`);
  }

  /**
   * Update a user contract's name
   * @param id User contract ID
   * @param name New name for the contract
   * @returns Promise with the updated user contract
   */
  async updateUserContractName(
    id: string,
    name: string
  ): Promise<UserContract> {
    return this.apiClient.patch<UserContract>(`/user-contracts/${id}/name`, {
      name,
    });
  }

  /**
   * Delete a user contract
   * @param id User contract ID
   * @returns Promise that resolves when the contract is deleted
   */
  async deleteUserContract(id: string): Promise<void> {
    return this.apiClient.delete<void>(`/user-contracts/${id}`);
  }

  /**
   * Get suggested bids for a contract by address
   * @param address Contract address
   * @param blockchainId Blockchain ID (will use current blockchain ID if not provided)
   * @returns Promise with suggested bids response
   */
  async getSuggestedBidsByAddress(
    address: string,
    blockchainId?: string
  ): Promise<SuggestedBidsResponse> {
    const targetBlockchainId = blockchainId || this.currentBlockchainId;

    if (!targetBlockchainId) {
      throw new Error(
        'No blockchain ID available for getSuggestedBidsByAddress'
      );
    }

    return this.apiClient.get<SuggestedBidsResponse>(
      `/contracts/suggest-bids/by-address/${address}?blockchainId=${targetBlockchainId}`
    );
  }
}
