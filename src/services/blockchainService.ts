import { ApiClient } from './api';
import { Blockchain } from './contractService';
import { MOCK_BLOCKCHAINS } from '@/lib/prototype-mocks';

/**
 * Blockchain service for handling blockchain-related API requests
 */
export class BlockchainService {
  private apiClient: ApiClient;
  private static cachedBlockchains: Blockchain[] | null = null;

  /**
   * Create a new BlockchainService instance
   * @param accessToken JWT token for authentication (optional for non-authenticated endpoints)
   */
  constructor(accessToken?: string) {
    this.apiClient = new ApiClient(accessToken || '');
  }

  /**
   * Get all blockchains from the API
   * Uses caching to avoid unnecessary API calls since blockchain data rarely changes
   * @returns Promise with array of blockchains
   */
  async getBlockchains(): Promise<Blockchain[]> {
    if (!BlockchainService.cachedBlockchains) {
      BlockchainService.cachedBlockchains = MOCK_BLOCKCHAINS;
    }
    return Promise.resolve(BlockchainService.cachedBlockchains);
  }

  /**
   * Reset the cached blockchains (useful if you need to force a refresh)
   */
  static resetCache(): void {
    BlockchainService.cachedBlockchains = null;
  }
}
