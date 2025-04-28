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
  name?: string; // Optional field possibly used on frontend
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
  [key: string]: unknown; // Allow for additional properties
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
   * Get a specific contract by ID
   * @param id Contract ID
   * @returns Promise with the contract details
   */
  async getContractById(id: string): Promise<Contract> {
    return this.apiClient.get<Contract>(`/contracts/${id}`);
  }

  /**
   * Create a new contract
   * @param contractData Contract data to create
   * @returns Promise with the created contract
   */
  async createContract(contractData: CreateContractData): Promise<Contract> {
    if (!contractData.blockchainId) {
      if (!this.currentBlockchainId) {
        throw new Error('No blockchain ID available for createContract');
      }

      // Use the current blockchain ID
      contractData = {
        ...contractData,
        blockchainId: this.currentBlockchainId,
      };
    }

    return this.apiClient.post<Contract, CreateContractData>(
      '/contracts',
      contractData
    );
  }

  /**
   * Update an existing contract
   * @param id Contract ID
   * @param updateData Data to update
   * @returns Promise with the updated contract
   */
  async updateContract(
    id: string,
    updateData: Partial<Contract>
  ): Promise<Contract> {
    return this.apiClient.put<Contract, Partial<Contract>>(
      `/contracts/${id}`,
      updateData
    );
  }

  /**
   * Delete a contract
   * @param id Contract ID
   * @returns Promise with the operation result
   */
  async deleteContract(id: string): Promise<void> {
    return this.apiClient.delete<void>(`/contracts/${id}`);
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
}
