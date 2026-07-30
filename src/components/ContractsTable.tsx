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
  formatSize,
  formatDate,
  formatRiskLevel,
  getRiskBadgeVariant,
  formatRoundedEth,
} from '@/utils/formatting';
import authRequiredImage from 'public/auth-required.svg';
import noContractsFoundImage from 'public/no-contracts-found.svg';
import sthWentWrongImage from 'public/sth-went-wrong.svg';
import NoticeBanner from '@/components/NoticeBanner';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Info } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from './ui/button';
import { formatEther } from 'viem';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import ContractMobileCard from '@/components/ContractMobileCard';
import ActivationBadge from '@/components/ActivationBadge';
import ActivationFilters, {
  ActivationFilter,
} from '@/components/ActivationFilters';
import {
  backendProgramTimeLeft,
  buildActivationInfo,
  type ActivationInfo,
} from '@/lib/activation';

interface ContractsTableProps {
  contracts?: Contract[];
  viewType?: 'explore-contracts' | 'my-contracts';
  onContractSelect?: (contractId: string, initialData?: Contract) => void;
  onAddContract?: (contract: Contract) => void;
  onAddNewContract?: () => void;
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
          <span className='ms-1 text-ink-3 opacity-60'>
            <ArrowUpDown className='w-3.5 h-3.5' />
          </span>
        );
      }

      if (currentSortOrder === 'ASC') {
        return (
          <span className='ms-1 text-accent-blue'>
            <ArrowUp className='w-3.5 h-3.5' />
          </span>
        );
      }

      if (currentSortOrder === 'DESC') {
        return (
          <span className='ms-1 text-accent-blue'>
            <ArrowDown className='w-3.5 h-3.5' />
          </span>
        );
      }

      return <span className='ms-1 text-ink-3 opacity-50'>↕</span>;
    };

    return (
      <TableHead
        onClick={sortField ? handleSort : undefined}
        className={`${
          sortField ? 'cursor-pointer hover:text-ink-1 transition-colors' : ''
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

// Table row component - separate to improve performance
const ContractRow = React.memo(
  ({
    contract,
    viewType,
    activation,
    onContractSelect,
    onAddContract,
    isAuthenticated,
  }: {
    contract: Contract;
    viewType: string;
    activation: ActivationInfo;
    onContractSelect?: (contractId: string, initialData?: Contract) => void;
    onAddContract?: (contract: Contract) => void;
    isAuthenticated: boolean;
  }) => {
    const handleClick = () => {
      if (onContractSelect) {
        onContractSelect(contract.id, contract);
      }
    };

    const handleAddContractClick = (e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent row click event
      if (onAddContract) {
        onAddContract(contract);
      }
    };

    return (
      <TableRow className='cursor-pointer' onClick={handleClick}>
        <TableCell className='w-[260px] max-w-[260px]'>
          {(viewType === 'my-contracts' && contract.name) ||
          contract.isSavedByUser ? (
            <div className='flex flex-col min-w-0'>
              <span className='text-[13px] font-medium text-ink-1 truncate'>
                {viewType === 'my-contracts' && contract.name
                  ? contract.name
                  : contract.savedContractName}
              </span>
              <span className='mono-addr truncate'>{contract.address}</span>
            </div>
          ) : (
            <span className='mono-addr !text-ink-2 text-[12px] truncate block'>
              {contract.address}
            </span>
          )}
        </TableCell>
        <TableCell>
          <ActivationBadge info={activation} compact />
        </TableCell>
        <TableCell className='text-end num'>
          {contract.lastBid ? (
            formatRoundedEth(formatEther(BigInt(contract.lastBid))) + ' ETH'
          ) : (
            <span className='text-ink-3'>—</span>
          )}
        </TableCell>
        <TableCell className='text-end num'>
          {contract.effectiveBid ? (
            formatRoundedEth(formatEther(BigInt(contract.effectiveBid))) +
            ' ETH'
          ) : (
            <span className='text-ink-3'>—</span>
          )}
        </TableCell>
        <TableCell className='text-end num'>
          {formatSize(contract.bytecode.size)}
        </TableCell>
        <TableCell className='text-end num'>
          {contract.minBid ? (
            formatRoundedEth(formatEther(BigInt(contract.minBid))) + ' ETH'
          ) : (
            <span className='text-ink-3'>—</span>
          )}
        </TableCell>
        <TableCell>
          {contract.evictionRisk ? (
            <span className='inline-flex items-center gap-1.5 text-[12.5px] text-ink-2'>
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  contract.evictionRisk.riskLevel === 'high'
                    ? 'bg-crit'
                    : contract.evictionRisk.riskLevel === 'medium'
                    ? 'bg-warn'
                    : 'bg-ok'
                }`}
              />
              {formatRiskLevel(contract.evictionRisk.riskLevel)}
            </span>
          ) : (
            <span className='text-ink-3'>—</span>
          )}
        </TableCell>
        <TableCell className='text-end num'>
          {contract.totalBidInvestment
            ? formatRoundedEth(
                formatEther(BigInt(contract.totalBidInvestment))
              ) + ' ETH'
            : '—'}
        </TableCell>
        <TableCell>
          <div className='flex flex-col gap-0.5'>
            <span className='pill pill-muted w-fit'>
              <span
                className={`pill-dot ${
                  contract.bytecode.isCached ? 'bg-ok' : 'bg-ink-3'
                }`}
              />
              {contract.bytecode.isCached ? 'Cached' : 'Not Cached'}
            </span>
            <span className='text-[11px] text-ink-3'>
              {formatDate(contract.bidBlockTimestamp)}
            </span>
          </div>
        </TableCell>
        {viewType === 'explore-contracts' &&
          !contract.isSavedByUser &&
          isAuthenticated && (
            <TableCell>
              <Button
                variant='outline'
                size='icon'
                className='size-7 text-base hover:text-accent-blue hover:border-accent-blue'
                onClick={handleAddContractClick}
              >
                +
              </Button>
            </TableCell>
          )}
        {viewType === 'explore-contracts' && contract.isSavedByUser && (
          <TableCell>
            <span className='pill pill-muted'>Added</span>
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
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-3 text-xs text-ink-3'>
        <div className='flex items-center gap-2'>
          <span>Show</span>
          <select
            className='bg-surface-2 text-ink-1 border border-hairline rounded-md px-2 py-1 focus:outline-none focus:border-accent-blue'
            value={pagination.limit}
            onChange={handleItemsPerPageChange}
          >
            <option value='5'>5</option>
            <option value='10'>10</option>
          </select>
          <span>entries</span>
        </div>

        <div className='flex flex-wrap items-center gap-2'>
          <span className='whitespace-nowrap'>
            {pagination.totalItems > 0
              ? `Page ${pagination.page} of ${pagination.totalPages}`
              : 'No results'}
          </span>
          <div className='flex flex-wrap gap-1'>
            <Button
              onClick={() => handlePageChange(1)}
              disabled={!pagination.hasPreviousPage}
              variant='ghost'
              size='sm'
              className='hidden sm:inline-flex h-7 px-2 text-ink-2 disabled:opacity-40'
            >
              First
            </Button>
            <Button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={!pagination.hasPreviousPage}
              variant='ghost'
              size='sm'
              className='h-7 px-2 text-ink-2 disabled:opacity-40'
            >
              ‹
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
                    variant='ghost'
                    size='sm'
                    className={`h-7 min-w-7 px-2 num ${
                      pagination.page === page
                        ? 'bg-surface-3 text-ink-1 font-medium'
                        : 'text-ink-2'
                    }`}
                  >
                    {page}
                  </Button>
                </React.Fragment>
              ))}
            <Button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={!pagination.hasNextPage}
              variant='ghost'
              size='sm'
              className='h-7 px-2 text-ink-2 disabled:opacity-40'
            >
              ›
            </Button>
            <Button
              onClick={() => handlePageChange(pagination.totalPages)}
              disabled={!pagination.hasNextPage}
              variant='ghost'
              size='sm'
              className='hidden sm:inline-flex h-7 px-2 text-ink-2 disabled:opacity-40'
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
  onContractSelect,
  onAddContract,
  onAddNewContract,
}: ContractsTableProps) {
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
  const [activationFilter, setActivationFilter] =
    useState<ActivationFilter>('all');

  // Source contracts before activation filtering — keep this in a separate
  // memo so downstream derivations don't re-run when only the filter changes.
  const sourceContracts = useMemo(
    () => (initialContracts?.length ? initialContracts : contracts),
    [initialContracts, contracts]
  );

  // Resolve the effective activation status for every visible row using the
  // backend-provided fields. `programTimeLeft` + `programTimeLeftReason` are
  // returned on the list endpoints since COB-490, so no FE multicall or
  // fallback is required — `buildActivationInfo` reads the reason off the
  // contract object directly.
  const rowsWithActivation = useMemo(
    () =>
      sourceContracts.map((contract) => ({
        contract,
        activation: buildActivationInfo(
          contract,
          backendProgramTimeLeft(contract.programTimeLeft)
        ),
      })),
    [sourceContracts]
  );

  const displayRows = useMemo(() => {
    if (activationFilter === 'all') return rowsWithActivation;
    return rowsWithActivation.filter(({ activation }) => {
      // `error` rows belong to the same UX bucket as `inactive`: both need
      // the user to activate. Hiding them under "Inactive" would make
      // failed activations invisible to anyone scanning by status.
      if (activationFilter === 'inactive') {
        return activation.status === 'inactive' || activation.status === 'error';
      }
      return activation.status === activationFilter;
    });
  }, [rowsWithActivation, activationFilter]);

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
  if (!isAuthenticated && viewType === 'my-contracts') {
    return (
      <NoticeBanner
        image={authRequiredImage}
        title='Authentication Required'
        description='Please connect to your wallet and sign the transaction to see the contracts list.'
      />
    );
  }

  return (
    <div className='overflow-hidden flex flex-col h-full'>
      <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-5 flex-shrink-0'>
        <h1 className='page-title'>
          {viewType === 'my-contracts' ? 'My Contracts' : 'Explore Contracts'}
        </h1>
        {viewType === 'my-contracts' ? (
          <Button
            className='w-full sm:w-auto'
            onClick={onAddNewContract}
          >
            <span>+</span>
            <span>Add Contract</span>
          </Button>
        ) : (
          <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto'>
            <div className='relative flex-1 sm:flex-none'>
              <input
                type='text'
                placeholder='Search contracts...'
                className='h-8 ps-8 pe-3 text-[12.5px] bg-surface-1 text-ink-1 placeholder:text-ink-3 rounded-lg w-full sm:w-64 border border-hairline focus:outline-none focus:border-accent-blue'
                value={searchInput}
                onChange={handleSearchInputChange}
                onKeyDown={handleKeyDown}
              />
              <button
                className='absolute inset-inline-start-0 start-0 top-0 h-8 w-8 flex items-center justify-center text-ink-3 hover:text-ink-1'
                onClick={handleSearch}
              >
                <Search className='w-3.5 h-3.5' />
              </button>
            </div>
            <Button className='w-full sm:w-auto' onClick={onAddNewContract}>
              <span>+</span>
              <span>Add Contract</span>
            </Button>
          </div>
        )}
      </div>

      {isLoading && (
        <div className='flex justify-center items-center py-20'>
          <div className='animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-ink-2'></div>
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
        <div className='w-full flex-1 flex flex-col min-h-0'>
          <div className='mb-4 flex-shrink-0'>
            <ActivationFilters
              value={activationFilter}
              onChange={setActivationFilter}
            />
          </div>
          {/* Mobile card list */}
          <div className='md:hidden flex-1 min-h-0 overflow-y-auto'>
            {displayRows.length > 0 ? (
              <div className='flex flex-col gap-2 pb-4'>
                {displayRows.map(({ contract, activation }) => (
                  <ContractMobileCard
                    key={contract.address}
                    contract={contract}
                    viewType={viewType}
                    activation={activation}
                    isAuthenticated={isAuthenticated}
                    onContractSelect={onContractSelect}
                    onAddContract={onAddContract}
                  />
                ))}
              </div>
            ) : (
              <NoticeBanner
                image={noContractsFoundImage}
                title='No Contracts Found'
                description='No contracts found.'
              />
            )}
          </div>

          {/* Desktop table */}
          <ScrollArea className='hidden md:block h-[calc(100vh-320px)] min-h-[400px] app-card'>
            <Table className='w-full'>
              <TableHeader className='bg-surface-1 sticky top-0 z-10'>
                <TableRow className='hover:bg-transparent'>
                  <SortableTableHead
                    className='w-[260px]'
                    currentSortBy={sortBy}
                    currentSortOrder={sortOrder}
                    onSort={setSorting}
                  >
                    Contract
                  </SortableTableHead>
                  <SortableTableHead
                    currentSortBy={sortBy}
                    currentSortOrder={sortOrder}
                    onSort={setSorting}
                  >
                    Activation
                  </SortableTableHead>
                  <SortableTableHead
                    sortField={ContractSortField.LAST_BID}
                    currentSortBy={sortBy}
                    currentSortOrder={sortOrder}
                    onSort={setSorting}
                    className='justify-end-safe [&>div]:justify-end'
                  >
                    Bid
                  </SortableTableHead>
                  <SortableTableHead
                    currentSortBy={sortBy}
                    currentSortOrder={sortOrder}
                    onSort={setSorting}
                  >
                    <div className='flex items-center gap-2'>
                      Effective Bid
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className='w-4 h-4 cursor-help' />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className='max-w-xs'>
                            <strong>Bids decay over time.</strong>
                            <br />
                            The effective bid is reduced by a{' '}
                            <em>decay penalty</em>, calculated as:
                            <br />
                            <code>decayPenalty = decayRate × timeCached</code>
                            <br />
                            The longer a contract stays cached, the lower its
                            effective bid becomes.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </SortableTableHead>
                  <SortableTableHead
                    sortField={ContractSortField.BYTECODE_SIZE}
                    currentSortBy={sortBy}
                    currentSortOrder={sortOrder}
                    onSort={setSorting}
                    className='[&>div]:justify-end'
                  >
                    Size
                  </SortableTableHead>
                  <SortableTableHead
                    currentSortBy={sortBy}
                    currentSortOrder={sortOrder}
                    onSort={setSorting}
                    className='[&>div]:justify-end'
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
                    className='[&>div]:justify-end'
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
                  {viewType === 'explore-contracts' && <TableHead />}
                </TableRow>
              </TableHeader>
              <TableBody className='text-ink-1'>
                {displayRows.length > 0 ? (
                  displayRows.map(({ contract, activation }) => (
                    <ContractRow
                      key={contract.address}
                      contract={contract}
                      viewType={viewType}
                      activation={activation}
                      onContractSelect={onContractSelect}
                      onAddContract={onAddContract}
                      isAuthenticated={isAuthenticated}
                    />
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={viewType === 'explore-contracts' ? 10 : 9}
                      className='text-center py-12'
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
          </ScrollArea>
        </div>
      )}

      {/* Only show pagination controls if we have pagination data and more than 0 items */}
      {!isLoading && !error && pagination.totalItems > 0 && (
        <div className='flex-shrink-0'>
          <Pagination
            pagination={pagination}
            handlePageChange={handlePageChange}
            handleItemsPerPageChange={handleItemsPerPageChange}
          />
        </div>
      )}
    </div>
  );
}

export default React.memo(ContractsTable);
