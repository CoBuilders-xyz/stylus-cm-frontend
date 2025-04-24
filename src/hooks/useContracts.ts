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
  limit: 10,
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
  const [limit, setLimit] = useState(10);

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
      name: 'ERC-20 Token',
      address: '0xF5A7B8C9...567890',
      bid: '0.05 ETH',
      effectiveBid: '0.05 ETH',
      size: '12.4 KB',
      minBid: '0.05 ETH',
      evictionRisk: 'High',
      totalSpent: '0.9 ETH',
      cacheStatus: {
        status: 'Cached',
        timestamp: '2024-02-04 14:30',
      },
    },
    {
      id: '2',
      name: 'NFT Collection',
      address: '0xC00ME1F2...012345',
      bid: '0.05 ETH',
      effectiveBid: '0.0 ETH',
      size: '13.2 KB',
      minBid: '0.05 ETH',
      evictionRisk: '-',
      totalSpent: '0.00 ETH',
      cacheStatus: {
        status: 'Not Cached',
        timestamp: '2024-02-04 14:30',
      },
    },
    // Additional sample contracts as needed
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
