import { ApiClient } from './api';
import { Blockchain } from './contractService';

/**
 * Blockchain service for handling blockchain-related API requests
 */
export class BlockchainService {
  private apiClient: ApiClient;
  private static cachedBlockchains: Blockchain[] | null = null;

  /**
   * Create a new BlockchainService instance
   * @param accessToken JWT token for authentication
   */
  constructor(accessToken: string) {
    this.apiClient = new ApiClient(accessToken);
  }

  /**
   * Get all blockchains from the API
   * Uses caching to avoid unnecessary API calls since blockchain data rarely changes
   * @returns Promise with array of blockchains
   */
  async getBlockchains(): Promise<Blockchain[]> {
    // Use cached value if available
    if (BlockchainService.cachedBlockchains) {
      return BlockchainService.cachedBlockchains;
    }

    // Fetch blockchains from API
    const blockchains = await this.apiClient.get<Blockchain[]>('/blockchains');

    // Cache the result
    BlockchainService.cachedBlockchains = blockchains;

    return blockchains;
  }

  /**
   * Reset the cached blockchains (useful if you need to force a refresh)
   */
  static resetCache(): void {
    BlockchainService.cachedBlockchains = null;
  }
}
