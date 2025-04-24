import { useState, useEffect, useCallback, useRef } from 'react';
import { Contract, PaginationMeta } from '@/services/contractService';
import { useContractService } from './useContractService';

interface ContractsResult {
  contracts: Contract[];
  isLoading: boolean;
  error: string | null;
  pagination: PaginationMeta;
  refetch: () => void;
  goToPage: (page: number) => void;
  setItemsPerPage: (limit: number) => void;
}

/**
 * Default empty pagination meta
 */
const DEFAULT_PAGINATION: PaginationMeta = {
  page: 1,
  limit: 5,
  totalItems: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
};

/**
 * Hook to fetch contracts data with pagination
 * @param type The type of contracts to fetch ('explore' or 'my-contracts')
 * @returns Object with contracts data, pagination, loading state, error, and refetch function
 */
export function useContracts(
  type: 'explore' | 'my-contracts'
): ContractsResult {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [pagination, setPagination] =
    useState<PaginationMeta>(DEFAULT_PAGINATION);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);

  // Store the current type in a ref to avoid unnecessary re-renders
  const typeRef = useRef(type);
  useEffect(() => {
    typeRef.current = type;
  }, [type]);

  const contractService = useContractService();

  // Sample fallback data if service is not available or error occurs
  const sampleContracts: Contract[] = [
    {
      id: '1',
      address: '0xF5A7B8C9D0E1F2A3B4C5D6E7F8A9B0C1D2E3F456',
      lastBid: '50000000000000000',
      bidPlusDecay: '50000000000000000',
      totalBidInvestment: '900000000000000000',
      bidBlockNumber: '123456',
      bidBlockTimestamp: '2024-02-04T14:30:00.000Z',
      bytecode: {
        id: '1a',
        bytecodeHash:
          '0x2e08f0e15ca1f0bd5f6a394e4935f20c3f272edbe32d08339f1fc86c893ff16c',
        size: '12400',
        lastBid: '50000000000000000',
        bidPlusDecay: '50000000000000000',
        lastEvictionBid: '50000000000000000',
        isCached: true,
        totalBidInvestment: '900000000000000000',
        bidBlockNumber: '123456',
        bidBlockTimestamp: '2024-02-04T14:30:00.000Z',
      },
      blockchain: {
        id: '3a17dc1b-58ad-4472-96c8-76151a502282',
        name: 'Arbitrum Local',
        rpcUrl: 'http://localhost:8547',
        cacheManagerAddress: '0x0f1f89aaf1c6fdb7ff9d361e4388f5f3997f12a8',
        cacheManagerAutomationAddress:
          '0x343FAF37071Ae1Bb8676b5a116c82D9db52696C0',
        arbWasmCacheAddress: '0x0000000000000000000000000000000000000072',
        chainId: 412346,
        otherInfo: null,
        lastSyncedBlock: 30,
        lastProcessedBlockNumber: 30,
      },
      effectiveBid: '50000000000000000',
      evictionRisk: {
        riskLevel: 'high',
        remainingEffectiveBid: '50000000000000000',
        suggestedBids: {
          highRisk: '60000000000000000',
          midRisk: '70000000000000000',
          lowRisk: '80000000000000000',
        },
        comparisonPercentages: {
          vsHighRisk: 0.8,
          vsMidRisk: 0.7,
          vsLowRisk: 0.6,
        },
        cacheStats: {
          utilization: 0.5,
          evictionRate: 0.2,
          medianBidPerByte: '20000000000000',
          competitiveness: 0.7,
          cacheSizeBytes: '536870912',
          usedCacheSizeBytes: '12400',
        },
      },
      name: 'ERC-20 Token',
    },
    {
      id: '2',
      address: '0xC00ME1F2A3B4C5D6E7F8A9B0C1D2E3F4012345',
      lastBid: '50000000000000000',
      bidPlusDecay: '0',
      totalBidInvestment: '0',
      bidBlockNumber: '123457',
      bidBlockTimestamp: '2024-02-04T14:30:00.000Z',
      bytecode: {
        id: '2a',
        bytecodeHash:
          '0x3f19e0d25ca1f0bd5f6a394e4935f20c3f272edbe32d08339f1fc86c893ff17d',
        size: '13200',
        lastBid: '50000000000000000',
        bidPlusDecay: '0',
        lastEvictionBid: '0',
        isCached: false,
        totalBidInvestment: '0',
        bidBlockNumber: '123457',
        bidBlockTimestamp: '2024-02-04T14:30:00.000Z',
      },
      blockchain: {
        id: '3a17dc1b-58ad-4472-96c8-76151a502282',
        name: 'Arbitrum Local',
        rpcUrl: 'http://localhost:8547',
        cacheManagerAddress: '0x0f1f89aaf1c6fdb7ff9d361e4388f5f3997f12a8',
        cacheManagerAutomationAddress:
          '0x343FAF37071Ae1Bb8676b5a116c82D9db52696C0',
        arbWasmCacheAddress: '0x0000000000000000000000000000000000000072',
        chainId: 412346,
        otherInfo: null,
        lastSyncedBlock: 30,
        lastProcessedBlockNumber: 30,
      },
      effectiveBid: '0',
      evictionRisk: {
        riskLevel: 'none',
        remainingEffectiveBid: '0',
        suggestedBids: {
          highRisk: '60000000000000000',
          midRisk: '70000000000000000',
          lowRisk: '80000000000000000',
        },
        comparisonPercentages: {
          vsHighRisk: 0,
          vsMidRisk: 0,
          vsLowRisk: 0,
        },
        cacheStats: {
          utilization: 0.5,
          evictionRate: 0.2,
          medianBidPerByte: '20000000000000',
          competitiveness: 0.7,
          cacheSizeBytes: '536870912',
          usedCacheSizeBytes: '13200',
        },
      },
      name: 'NFT Collection',
    },
  ];

  // Use useCallback to ensure the function reference is stable
  const fetchContracts = useCallback(async () => {
    if (!contractService) {
      setContracts(sampleContracts);
      // Create sample pagination with the sample data
      setPagination({
        page: 1,
        limit: 10,
        totalItems: sampleContracts.length,
        totalPages: Math.ceil(sampleContracts.length / 10),
        hasNextPage: false,
        hasPreviousPage: false,
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const blockchainId = '3a17dc1b-58ad-4472-96c8-76151a502282'; // Could be parameterized
      const currentType = typeRef.current;
      const response =
        currentType === 'explore'
          ? await contractService.getExploreContracts(blockchainId, page, limit)
          : await contractService.getMyContracts(blockchainId, page, limit);

      setContracts(response.data);
      setPagination(response.meta);
    } catch (err) {
      console.error('Failed to fetch contracts:', err);
      setError('Failed to load contracts. Please try again later.');
      // Fall back to sample data
      setContracts(sampleContracts);
      // Create sample pagination with the sample data
      setPagination({
        page: 1,
        limit: 10,
        totalItems: sampleContracts.length,
        totalPages: Math.ceil(sampleContracts.length / 10),
        hasNextPage: false,
        hasPreviousPage: false,
      });
    } finally {
      setIsLoading(false);
    }
  }, [contractService, page, limit]);

  // Go to a specific page - use useCallback for stable reference
  const goToPage = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  // Change items per page - use useCallback for stable reference
  const handleSetItemsPerPage = useCallback((newLimit: number) => {
    setLimit(newLimit);
    setPage(1); // Reset to first page when changing items per page
  }, []);

  // Fetch contracts when dependencies change
  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  // Create a stable reference to the result object to avoid unnecessary re-renders
  return {
    contracts,
    isLoading,
    error,
    pagination,
    refetch: fetchContracts,
    goToPage,
    setItemsPerPage: handleSetItemsPerPage,
  };
}
