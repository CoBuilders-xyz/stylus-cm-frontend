import { ApiClient } from './api';
import { AlertType } from '@/types/alerts';
import type { ActivationInfo } from '@/lib/prototype-mocks';
import {
  MOCK_BLOCKCHAINS,
  mockContracts,
  mockUserContracts,
  getMockContractById,
  getMockUserContractById,
} from '@/lib/prototype-mocks';

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
  type: AlertType;
  value: string;
  isActive: boolean;
  lastTriggered: string | null;
  lastNotified: string | null;
  triggeredCount: number;
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
  isSavedByUser?: boolean; // Flag to indicate if the contract is already saved by the user
  savedContractName?: string | null; // Name of the saved contract
  activation?: ActivationInfo; // Prototype-only: activation state metadata
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
    isAutomated?: boolean;
    automationDetails?: {
      user: string;
      minBid: string;
      maxBid: string;
      userBalance: string;
    };
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
   * @param accessToken JWT token for authentication (optional for public endpoints)
   * @param defaultBlockchainId Optional default blockchain ID to use in requests
   */
  constructor(
    accessToken: string | null = null,
    defaultBlockchainId: string | null = null
  ) {
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
    _sortBy: string[] = ['contract.lastBid'],
    _sortOrder: 'ASC' | 'DESC' | null = 'DESC',
    search?: string
  ): Promise<PaginatedResponse<Contract>> {
    void _sortBy;
    void _sortOrder;
    const filtered = search
      ? mockContracts.filter(
          (c) =>
            c.address.toLowerCase().includes(search.toLowerCase()) ||
            (c.name || '').toLowerCase().includes(search.toLowerCase())
        )
      : mockContracts;
    const start = (page - 1) * limit;
    const data = filtered.slice(start, start + limit).map((c) => ({
      ...c,
      isSavedByUser: true,
      savedContractName: c.name || c.savedContractName || null,
    }));
    const totalItems = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / limit));
    return Promise.resolve({
      data,
      meta: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
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
    _sortBy: string[] = ['contract.lastBid'],
    _sortOrder: 'ASC' | 'DESC' | null = 'DESC',
    search?: string
  ): Promise<PaginatedResponse<UserContract>> {
    void _sortBy;
    void _sortOrder;
    const filtered = search
      ? mockUserContracts.filter(
          (uc) =>
            uc.address.toLowerCase().includes(search.toLowerCase()) ||
            (uc.name || '').toLowerCase().includes(search.toLowerCase())
        )
      : mockUserContracts;
    const start = (page - 1) * limit;
    const data = filtered.slice(start, start + limit);
    const totalItems = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / limit));
    return Promise.resolve({
      data,
      meta: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  }

  /**
   * Get a specific user contract by ID
   * @param user The authenticated user
   * @returns Promise with the user contract
   */
  async getUserContract(id: string): Promise<UserContract> {
    const uc = getMockUserContractById(id);
    if (!uc) {
      const first = mockUserContracts[0];
      return Promise.resolve(first);
    }
    return Promise.resolve(uc);
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
    const uc = getMockUserContractById(id);
    if (uc) {
      uc.name = name;
      if (uc.contract) {
        uc.contract.name = name;
        uc.contract.savedContractName = name;
      }
      return Promise.resolve(uc);
    }
    return Promise.resolve(mockUserContracts[0]);
  }

  /**
   * Delete a user contract
   * @param id User contract ID
   * @returns Promise that resolves when the contract is deleted
   */
  async deleteUserContract(id: string): Promise<void> {
    void id;
    return Promise.resolve();
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
    void address;
    void blockchainId;
    const fallback = mockContracts[0]?.evictionRisk;
    return Promise.resolve({
      suggestedBids: fallback?.suggestedBids ?? {
        highRisk: '3000000000000000',
        midRisk: '4500000000000000',
        lowRisk: '6000000000000000',
      },
      cacheStats: fallback?.cacheStats ?? {
        utilization: 75,
        evictionRate: 0.05,
        medianBidPerByte: '1500000',
        competitiveness: 60,
        cacheSizeBytes: '8388608',
        usedCacheSizeBytes: '6291456',
      },
    });
  }

  /**
   * Create a new user contract
   * @param address Contract address
   * @param blockchainId Blockchain ID (optional, will use current blockchain ID if not provided)
   * @param name Optional name for the contract
   * @returns Promise with the created user contract
   */
  async createContract(
    address: string,
    blockchainId?: string,
    name?: string
  ): Promise<UserContract> {
    void blockchainId;
    const existing = mockUserContracts.find(
      (uc) => uc.address.toLowerCase() === address.toLowerCase()
    );
    if (existing) {
      if (name) {
        existing.name = name;
        if (existing.contract) existing.contract.name = name;
      }
      return Promise.resolve(existing);
    }
    const template = mockUserContracts[0];
    const newContract: UserContract = {
      ...template,
      id: `mock-new-${Date.now()}`,
      address,
      name: name || 'New Contract',
      contract: {
        ...template.contract,
        id: `mock-new-${Date.now()}`,
        address,
        name: name || 'New Contract',
        savedContractName: name || 'New Contract',
      },
    };
    mockUserContracts.push(newContract);
    mockContracts.push(newContract.contract);
    return Promise.resolve(newContract);
  }
}

// Re-exported helpers from the mock layer so callers can access them without
// importing from the prototype mocks module directly.
export { getMockContractById, MOCK_BLOCKCHAINS };
