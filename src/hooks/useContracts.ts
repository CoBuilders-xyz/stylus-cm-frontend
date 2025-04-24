import { useState, useEffect, useCallback, useRef } from 'react';
import { Contract, PaginationMeta } from '@/services/contractService';
import { useContractService } from './useContractService';

// Enum for contract sort fields - matches the backend enum
export enum ContractSortField {
  LAST_BID = 'contract.lastBid',
  BYTECODE_SIZE = 'bytecode.size',
  IS_CACHED = 'bytecode.isCached',
  TOTAL_BID_INVESTMENT = 'contract.totalBidInvestment',
}

// Type for sort order
export type SortOrder = 'ASC' | 'DESC';

interface ContractsResult {
  contracts: Contract[];
  isLoading: boolean;
  error: string | null;
  pagination: PaginationMeta;
  refetch: () => void;
  goToPage: (page: number) => void;
  setItemsPerPage: (limit: number) => void;
  sortBy: ContractSortField[];
  sortOrder: SortOrder;
  setSorting: (field: ContractSortField) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
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
 * Hook to fetch contracts data with pagination and sorting
 * @param type The type of contracts to fetch ('explore' or 'my-contracts')
 * @returns Object with contracts data, pagination, loading state, error, and methods to control data fetching
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
  const [sortBy, setSortBy] = useState<ContractSortField[]>([
    ContractSortField.LAST_BID,
  ]);
  const [sortOrder, setSortOrder] = useState<SortOrder>('DESC');
  const [searchQuery, setSearchQuery] = useState<string>('');

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
          ? await contractService.getExploreContracts(
              blockchainId,
              page,
              limit,
              sortBy,
              sortOrder,
              searchQuery || undefined
            )
          : await contractService.getMyContracts(
              blockchainId,
              page,
              limit,
              sortBy,
              sortOrder,
              searchQuery || undefined
            );

      setContracts(response.data);
      setPagination(response.meta);
    } catch (err) {
      console.error('Failed to fetch contracts:', err);
      setError('Failed to load contracts. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, [contractService, page, limit, sortBy, sortOrder, searchQuery]);

  // Go to a specific page - use useCallback for stable reference
  const goToPage = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  // Change items per page - use useCallback for stable reference
  const handleSetItemsPerPage = useCallback((newLimit: number) => {
    setLimit(newLimit);
    setPage(1); // Reset to first page when changing items per page
  }, []);

  // Set sorting - toggles between ASC and DESC if the same field is clicked
  const handleSetSorting = useCallback((field: ContractSortField) => {
    setSortBy((prevSortBy) => {
      // If already sorting by this field, keep only this field
      if (prevSortBy[0] === field) {
        // Toggle sort order
        setSortOrder((prevOrder) => (prevOrder === 'ASC' ? 'DESC' : 'ASC'));
        return [field];
      }
      // Otherwise set as the new sort field with default DESC order
      setSortOrder('DESC');
      return [field];
    });
    setPage(1); // Reset to first page when changing sort
  }, []);

  // Handle search query changes
  const handleSetSearchQuery = useCallback((query: string) => {
    setSearchQuery(query);
    setPage(1); // Reset to first page when searching
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
    sortBy,
    sortOrder,
    setSorting: handleSetSorting,
    searchQuery,
    setSearchQuery: handleSetSearchQuery,
  };
}
