import { ApiClient } from './api';

/**
 * Contract data interface
 */
export interface Contract {
  id: string;
  name?: string;
  address: string;
  bid: string;
  effectiveBid: string;
  size: string;
  minBid: string;
  evictionRisk: 'High' | 'Medium' | 'Low' | '-';
  totalSpent: string;
  cacheStatus: {
    status: 'Cached' | 'Not Cached';
    timestamp: string;
  };
}

/**
 * Data required for creating a new contract
 */
export interface CreateContractData {
  address: string;
  name?: string;
  bid: string;
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
 * Contract service for handling contract-related API requests
 */
export class ContractService {
  private apiClient: ApiClient;

  /**
   * Create a new ContractService instance
   * @param accessToken JWT token for authentication
   */
  constructor(accessToken: string) {
    this.apiClient = new ApiClient(accessToken);
  }

  /**
   * Get all contracts from the explore section
   * @param blockchainId ID of the blockchain to filter by
   * @param page Page number (optional)
   * @param limit Items per page (optional)
   * @returns Promise with paginated contracts response
   */
  async getExploreContracts(
    blockchainId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResponse<Contract>> {
    return this.apiClient.get<PaginatedResponse<Contract>>(
      `/contracts?blockchainId=${blockchainId}&page=${page}&limit=${limit}`
    );
  }

  /**
   * Get all contracts owned by the authenticated user
   * @param blockchainId ID of the blockchain to filter by
   * @param page Page number (optional)
   * @param limit Items per page (optional)
   * @returns Promise with paginated contracts response
   */
  async getMyContracts(
    blockchainId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResponse<Contract>> {
    return this.apiClient.get<PaginatedResponse<Contract>>(
      `/user-contracts?blockchainId=${blockchainId}&page=${page}&limit=${limit}`
    );
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
}
