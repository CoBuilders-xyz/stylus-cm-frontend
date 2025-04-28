'use client';

import React, { useCallback, useMemo, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  useContracts,
  ContractSortField,
  SortOrder,
} from '@/hooks/useContracts';
import { useAuthentication } from '@/context/AuthenticationProvider';
import { Contract, PaginationMeta } from '@/services/contractService';
import {
  formatEth,
  formatSize,
  formatDate,
  formatRiskLevel,
} from '@/utils/formatting';
import authRequiredImage from 'public/auth-required.svg';
import noContractsFoundImage from 'public/no-contracts-found.svg';
import sthWentWrongImage from 'public/sth-went-wrong.svg';
import NoticeBanner from '@/components/NoticeBanner';
import { Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from './ui/button';

interface ContractsTableProps {
  contracts?: Contract[];
  viewType?: 'explore-contracts' | 'my-contracts';
  onRowClick?: (contract: Contract) => void;
}

// Table header component with sorting functionality
const SortableTableHead = React.memo(
  ({
    children,
    sortField,
    currentSortBy,
    currentSortOrder,
    onSort,
    ...props
  }: {
    children: React.ReactNode;
    sortField?: ContractSortField;
    currentSortBy: ContractSortField[];
    currentSortOrder: SortOrder;
    onSort: (field: ContractSortField) => void;
    className?: string;
  }) => {
    // Only add sorting functionality if a sortField is provided
    const handleSort = useCallback(() => {
      if (sortField) {
        onSort(sortField);
      }
    }, [sortField, onSort]);

    // Determine if this column is currently sorted
    const isSorted =
      sortField && currentSortBy.length > 0 && currentSortBy[0] === sortField;

    // Function to render the appropriate sort icon
    const renderSortIcon = () => {
      if (!sortField) return null;

      if (!isSorted) {
        return (
          <span className='ml-1 text-gray-500'>
            <ArrowUpDown className='w-4 h-4' />
          </span>
        );
      }

      if (currentSortOrder === 'ASC') {
        return (
          <span className='ml-1 text-green-400'>
            <ArrowUp className='w-4 h-4' />
          </span>
        );
      }

      if (currentSortOrder === 'DESC') {
        return (
          <span className='ml-1 text-red-400'>
            <ArrowDown className='w-4 h-4' />
          </span>
        );
      }

      return <span className='ml-1 text-gray-500 opacity-50'>↕</span>;
    };

    return (
      <TableHead
        onClick={sortField ? handleSort : undefined}
        className={`font-medium text-base py-6 ${
          sortField ? 'cursor-pointer hover:bg-gray-900' : ''
        } ${props.className || ''}`}
      >
        <div className='flex items-center'>
          {children}
          {renderSortIcon()}
        </div>
      </TableHead>
    );
  }
);

SortableTableHead.displayName = 'SortableTableHead';

// A helper function to get badge variant based on risk level
const getRiskBadgeVariant = (risk?: string | null) => {
  if (!risk) return 'secondary';

  switch (risk.toLowerCase()) {
    case 'high':
      return 'destructive';
    case 'medium':
      return 'default';
    case 'low':
      return 'secondary';
    default:
      return 'default';
  }
};

// Table row component - separate to improve performance
const ContractRow = React.memo(
  ({
    contract,
    viewType,
    onRowClick,
  }: {
    contract: Contract;
    viewType: string;
    onRowClick?: (contract: Contract) => void;
  }) => {
    return (
      <TableRow
        className='h-20 cursor-pointer hover:bg-gray-900 transition-colors'
        onClick={() => onRowClick && onRowClick(contract)}
      >
        <TableCell className='py-6 text-lg w-[250px]'>
          {viewType === 'my-contracts' && contract.name ? (
            <div className='flex flex-col'>
              <span className='text-lg font-medium'>{contract.name}</span>
              <span className='text-sm text-gray-400'>{contract.address}</span>
            </div>
          ) : (
            contract.address
          )}
        </TableCell>
        <TableCell className='py-6 text-lg'>
          {formatEth(contract.lastBid)}
        </TableCell>
        <TableCell className='py-6 text-lg'>
          {formatEth(contract.effectiveBid)}
        </TableCell>
        <TableCell className='py-6 text-lg'>
          {formatSize(contract.bytecode.size)}
        </TableCell>
        <TableCell className='py-6 text-lg'>
          {formatEth(contract.minBid || '0')}
        </TableCell>
        <TableCell className='py-6 text-lg'>
          {contract.evictionRisk ? (
            <Badge
              variant={getRiskBadgeVariant(contract.evictionRisk.riskLevel)}
              className='px-3 py-1 text-sm font-semibold w-fit'
            >
              {formatRiskLevel(contract.evictionRisk.riskLevel)}
            </Badge>
          ) : (
            <Badge
              variant='outline'
              className='px-3 py-1 text-sm font-semibold w-fit'
            >
              N/A
            </Badge>
          )}
        </TableCell>
        <TableCell className='py-6 text-lg'>
          {formatEth(contract.totalBidInvestment)}
        </TableCell>
        <TableCell className='py-6'>
          <div className='flex flex-col'>
            <Badge
              variant={contract.bytecode.isCached ? 'secondary' : 'outline'}
              className='px-3 py-1 text-sm font-semibold w-fit'
            >
              {contract.bytecode.isCached ? 'Cached' : 'Not Cached'}
            </Badge>
            <span className='text-sm text-gray-400 mt-1'>
              {formatDate(contract.bidBlockTimestamp)}
            </span>
          </div>
        </TableCell>
        {viewType === 'explore-contracts' && (
          <TableCell className='py-6'>
            <Button className='w-10 h-10 flex items-center justify-center bg-black border border-white text-white rounded-md'>
              +
            </Button>
          </TableCell>
        )}
      </TableRow>
    );
  }
);

ContractRow.displayName = 'ContractRow';

// Pagination component - separate to improve performance
const Pagination = React.memo(
  ({
    pagination,
    handlePageChange,
    handleItemsPerPageChange,
  }: {
    pagination: PaginationMeta;
    handlePageChange: (page: number) => void;
    handleItemsPerPageChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  }) => {
    return (
      <div className='flex items-center justify-between mt-4 text-sm text-white'>
        <div className='flex items-center space-x-2'>
          <span>Show</span>
          <select
            className='bg-black text-white rounded-md px-2 py-1 focus:outline-none'
            value={pagination.limit}
            onChange={handleItemsPerPageChange}
          >
            <option value='5'>5</option>
            <option value='10'>10</option>
            <option value='25'>25</option>
            <option value='50'>50</option>
          </select>
          <span>entries</span>
        </div>

        <div className='flex items-center space-x-2'>
          <span>
            {pagination.totalItems > 0
              ? `Page ${pagination.page} of ${pagination.totalPages}`
              : 'No results'}
          </span>
          <div className='flex space-x-1'>
            <Button
              onClick={() => handlePageChange(1)}
              disabled={!pagination.hasPreviousPage}
              className='px-2 py-1 bg-black text-white rounded-md disabled:opacity-50'
            >
              First
            </Button>
            <Button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={!pagination.hasPreviousPage}
              className='px-2 py-1 bg-black text-white rounded-md disabled:opacity-50'
            >
              ◀
            </Button>
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
              .filter(
                (page) =>
                  Math.abs(page - pagination.page) < 3 ||
                  page === 1 ||
                  page === pagination.totalPages
              )
              .map((page, idx, arr) => (
                <React.Fragment key={page}>
                  {idx > 0 && arr[idx - 1] !== page - 1 && (
                    <span className='px-2 py-1'>...</span>
                  )}
                  <Button
                    onClick={() => handlePageChange(page)}
                    className={`px-2 py-1 rounded-md ${
                      pagination.page === page
                        ? 'bg-black text-white'
                        : 'bg-black text-white'
                    }`}
                  >
                    {page}
                  </Button>
                </React.Fragment>
              ))}
            <Button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={!pagination.hasNextPage}
              className='px-2 py-1 bg-black text-white rounded-md disabled:opacity-50'
            >
              ▶
            </Button>
            <Button
              onClick={() => handlePageChange(pagination.totalPages)}
              disabled={!pagination.hasNextPage}
              className='px-2 py-1 bg-black text-white rounded-md disabled:opacity-50'
            >
              Last
            </Button>
          </div>
        </div>
      </div>
    );
  }
);

Pagination.displayName = 'Pagination';

function ContractsTable({
  contracts: initialContracts,
  viewType = 'explore-contracts',
  onRowClick,
}: ContractsTableProps & {
  onRowClick?: (contract: Contract) => void;
}) {
  // Use our custom hook to fetch contracts if not provided explicitly
  const {
    contracts,
    isLoading,
    error,
    pagination,
    goToPage,
    setItemsPerPage,
    sortBy,
    sortOrder,
    setSorting,
    setSearchQuery,
  } = useContracts(
    viewType === 'explore-contracts' ? 'explore' : 'my-contracts'
  );

  const { isAuthenticated } = useAuthentication();
  const [searchInput, setSearchInput] = useState('');

  // Use provided contracts if available, otherwise use fetched contracts
  const displayContracts = useMemo(
    () => (initialContracts?.length ? initialContracts : contracts),
    [initialContracts, contracts]
  );

  // Handle page changes through the hook
  const handlePageChange = useCallback(
    (page: number) => {
      goToPage(page);
    },
    [goToPage]
  );

  // Handle items per page changes through the hook
  const handleItemsPerPageChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setItemsPerPage(Number(e.target.value));
    },
    [setItemsPerPage]
  );

  // Handle search input changes
  const handleSearchInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchInput(e.target.value);
    },
    []
  );

  // Handle search submission
  const handleSearch = useCallback(() => {
    setSearchQuery(searchInput);
  }, [searchInput, setSearchQuery]);

  // Handle search by Enter key
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        handleSearch();
      }
    },
    [handleSearch]
  );

  // Render placeholder when not authenticated
  if (!isAuthenticated) {
    return (
      <NoticeBanner
        image={authRequiredImage}
        title='Authentication Required'
        description='Please connect to your wallet and sign the transaction to see the contracts list.'
      />
    );
  }

  return (
    <div className='overflow-hidden'>
      <div className='flex justify-between mb-8'>
        <h1 className='text-xl font-bold text-white'>
          {viewType === 'my-contracts' ? 'My Contracts' : 'Explore Contracts'}
        </h1>
        {viewType === 'my-contracts' ? (
          <Button className='px-4 py-2 bg-black text-white border border-white rounded-md flex items-center gap-2'>
            <span>+</span>
            <span>Add Contract</span>
          </Button>
        ) : (
          <div className='relative'>
            <input
              type='text'
              placeholder='Search contracts...'
              className='p-2 pl-10 bg-black rounded-md w-60 border border-gray-500 focus:outline-none focus:border-white'
              value={searchInput}
              onChange={handleSearchInputChange}
              onKeyDown={handleKeyDown}
            />
            <Button
              className='absolute left-1 top-1 p-3 bg-transparent border-none hover:bg-transparent'
              onClick={handleSearch}
            >
              <Search className='w-3 h-3' />
            </Button>
          </div>
        )}
      </div>

      {isLoading && (
        <div className='flex justify-center items-center py-20'>
          <div className='animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-white'></div>
        </div>
      )}

      {error && (
        <NoticeBanner
          image={sthWentWrongImage}
          title='Error'
          description='An error occurred while fetching contracts. Please try again.'
        />
      )}

      {!isLoading && !error && (
        <div className='w-full'>
          <ScrollArea orientation='both' className='h-[600px]'>
            <div className='min-w-full'>
              <Table className='w-full'>
                <TableHeader className='bg-black text-white sticky top-0 z-10'>
                  <TableRow className='h-20 hover:bg-transparent'>
                    <SortableTableHead
                      className='w-[250px]'
                      currentSortBy={sortBy}
                      currentSortOrder={sortOrder}
                      onSort={setSorting}
                    >
                      Contract
                    </SortableTableHead>
                    <SortableTableHead
                      sortField={ContractSortField.LAST_BID}
                      currentSortBy={sortBy}
                      currentSortOrder={sortOrder}
                      onSort={setSorting}
                    >
                      Bid
                    </SortableTableHead>
                    <SortableTableHead
                      currentSortBy={sortBy}
                      currentSortOrder={sortOrder}
                      onSort={setSorting}
                    >
                      Effective Bid
                    </SortableTableHead>
                    <SortableTableHead
                      sortField={ContractSortField.BYTECODE_SIZE}
                      currentSortBy={sortBy}
                      currentSortOrder={sortOrder}
                      onSort={setSorting}
                    >
                      Size
                    </SortableTableHead>
                    <SortableTableHead
                      currentSortBy={sortBy}
                      currentSortOrder={sortOrder}
                      onSort={setSorting}
                    >
                      Min. Bid
                    </SortableTableHead>
                    <SortableTableHead
                      currentSortBy={sortBy}
                      currentSortOrder={sortOrder}
                      onSort={setSorting}
                    >
                      Eviction Risk
                    </SortableTableHead>
                    <SortableTableHead
                      sortField={ContractSortField.TOTAL_BID_INVESTMENT}
                      currentSortBy={sortBy}
                      currentSortOrder={sortOrder}
                      onSort={setSorting}
                    >
                      Total Spent
                    </SortableTableHead>
                    <SortableTableHead
                      sortField={ContractSortField.IS_CACHED}
                      currentSortBy={sortBy}
                      currentSortOrder={sortOrder}
                      onSort={setSorting}
                    >
                      Cache Status
                    </SortableTableHead>
                    {viewType === 'explore-contracts' && (
                      <TableHead className='font-medium text-base py-6'></TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody className='text-white [&>tr]:py-2'>
                  {displayContracts.length > 0 ? (
                    displayContracts.map((contract) => (
                      <ContractRow
                        key={contract.address}
                        contract={contract}
                        viewType={viewType}
                        onRowClick={onRowClick}
                      />
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={viewType === 'explore-contracts' ? 9 : 8}
                        className='text-center py-12 bg-black'
                      >
                        <NoticeBanner
                          image={noContractsFoundImage}
                          title='No Contracts Found'
                          description='No contracts found.'
                        />
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Only show pagination controls if we have pagination data and more than 0 items */}
      {!isLoading && !error && pagination.totalItems > 0 && (
        <Pagination
          pagination={pagination}
          handlePageChange={handlePageChange}
          handleItemsPerPageChange={handleItemsPerPageChange}
        />
      )}
    </div>
  );
}

export default React.memo(ContractsTable);
