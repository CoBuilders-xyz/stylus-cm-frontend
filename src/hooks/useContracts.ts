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

  // Use useCallback to ensure the function reference is stable
  const fetchContracts = useCallback(async () => {
    if (!contractService) {
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
