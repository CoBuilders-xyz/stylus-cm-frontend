import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Contract,
  PaginationMeta,
  UserContract,
} from '@/services/contractService';
import { useContractService } from './useContractService';
import { useBlockchainService } from './useBlockchainService';
import { addContractUpdateListener } from './useContractsUpdater';

// Enum for contract sort fields - matches the backend enum
export enum ContractSortField {
  LAST_BID = 'contract.lastBid',
  BYTECODE_SIZE = 'bytecode.size',
  IS_CACHED = 'bytecode.isCached',
  TOTAL_BID_INVESTMENT = 'contract.totalBidInvestment',
}

// Type for sort order
export type SortOrder = 'ASC' | 'DESC' | null;

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
  const { currentBlockchainId, isLoading: isBlockchainLoading } =
    useBlockchainService();

  // Use useCallback to ensure the function reference is stable
  const fetchContracts = useCallback(async () => {
    if (!contractService) {
      return;
    }

    // Don't fetch if we don't have a blockchain ID yet
    if (!currentBlockchainId) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const currentType = typeRef.current;

      // Only include sort parameters if we have sort fields and a sort order
      const sortParams =
        sortBy.length > 0 && sortOrder
          ? {
              sortBy,
              sortOrder,
            }
          : {
              sortBy: [],
              sortOrder: null,
            };

      if (currentType === 'explore') {
        const response = await contractService.getExploreContracts(
          page,
          limit,
          sortParams.sortBy,
          sortParams.sortOrder,
          searchQuery || undefined
        );

        setContracts(response.data);
        setPagination(response.meta);
      } else {
        // For my-contracts, we need to transform the UserContract format to Contract format
        const response = await contractService.getMyContracts(
          page,
          limit,
          sortParams.sortBy,
          sortParams.sortOrder,
          searchQuery || undefined
        );

        // Transform UserContract to Contract for the UI
        const transformedContracts = response.data.map(
          (userContract: UserContract) => {
            // Extract the nested contract and merge with top-level data
            const { contract, ...rest } = userContract;

            // Ensure all required fields exist, but preserve null values when appropriate
            return {
              ...contract,
              ...rest,
              userContractId: userContract.id,
              // Preserve name from top level if exists
              name: rest.name || '',
              // Pass evictionRisk as is (could be null)
              evictionRisk: contract.evictionRisk,
              // Ensure bytecode exists with minimal required properties
              bytecode: {
                ...contract.bytecode,
                // We still need to provide defaults for bytecode size since it's used everywhere
                size: contract.bytecode?.size || '0',
                isCached: contract.bytecode?.isCached || false,
              },
            } as Contract;
          }
        );

        setContracts(transformedContracts);
        setPagination(response.meta);
      }
    } catch (err) {
      console.error('Failed to fetch contracts:', err);
      setError('Failed to load contracts. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, [
    contractService,
    currentBlockchainId,
    page,
    limit,
    sortBy,
    sortOrder,
    searchQuery,
  ]);

  // Go to a specific page - use useCallback for stable reference
  const goToPage = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  // Change items per page - use useCallback for stable reference
  const handleSetItemsPerPage = useCallback((newLimit: number) => {
    setLimit(newLimit);
    setPage(1); // Reset to first page when changing items per page
  }, []);

  // Set sorting - toggles between ASC, DESC and neutral if the same field is clicked
  const handleSetSorting = useCallback(
    (field: ContractSortField) => {
      if (!field) return;

      setSortBy((prevSortBy) => {
        // If already sorting by this field
        if (prevSortBy.length > 0 && prevSortBy[0] === field) {
          // Toggle sort order: DESC -> ASC -> null (neutral)
          if (sortOrder === 'DESC') {
            setSortOrder('ASC');
            return prevSortBy;
          } else if (sortOrder === 'ASC') {
            setSortOrder(null);
            return []; // Clear sort fields when going to neutral
          } else {
            // From null back to DESC
            setSortOrder('DESC');
            return [field];
          }
        } else {
          // Otherwise set as the new sort field with default DESC order
          setSortOrder('DESC');
          return [field];
        }
      });

      setPage(1); // Reset to first page when changing sort
    },
    [sortOrder]
  );

  // Handle search query changes
  const handleSetSearchQuery = useCallback((query: string) => {
    setSearchQuery(query);
    setPage(1); // Reset to first page when searching
  }, []);

  // Listen for contract update events
  useEffect(() => {
    // Set up listener for contract update events
    const removeListener = addContractUpdateListener(
      (contractId, updateType) => {
        console.log(
          `Contract update detected: ${updateType} for ${contractId}, refreshing data...`
        );
        fetchContracts();
      }
    );

    // Clean up the listener when the component unmounts
    return () => {
      removeListener();
    };
  }, [fetchContracts]);

  // Fetch contracts when dependencies change
  useEffect(() => {
    if (isBlockchainLoading) {
      setIsLoading(true);
      return;
    }

    fetchContracts();
  }, [fetchContracts, isBlockchainLoading]);

  // Create a stable reference to the result object to avoid unnecessary re-renders
  return {
    contracts,
    isLoading: isLoading || isBlockchainLoading,
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
