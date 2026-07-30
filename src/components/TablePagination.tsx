'use client';

import React from 'react';
import { Button } from '@/components/ui/button';

interface PaginationData {
  limit: number;
  totalItems: number;
  page: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

interface TablePaginationProps {
  pagination: PaginationData;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

function TablePagination({
  pagination,
  onPageChange,
  onItemsPerPageChange,
}: TablePaginationProps) {
  const visiblePages = Array.from(
    { length: pagination.totalPages },
    (_, index) => index + 1
  ).filter(
    (page) =>
      Math.abs(page - pagination.page) < 3 ||
      page === 1 ||
      page === pagination.totalPages
  );
  const mobileVisiblePages = visiblePages.filter(
    (page) =>
      page === 1 ||
      page === pagination.page ||
      page === pagination.totalPages
  );

  const renderPageNumbers = (pages: number[], compact = false) =>
    pages.map((page, index) => (
      <React.Fragment key={page}>
        {index > 0 && pages[index - 1] !== page - 1 && (
          <span className={compact ? 'px-1 py-1' : 'px-2 py-1'}>...</span>
        )}
        <Button
          aria-label={`Page ${page}`}
          aria-current={pagination.page === page ? 'page' : undefined}
          onClick={() => onPageChange(page)}
          variant='ghost'
          size='sm'
          className={`h-7 min-w-7 px-2 num ${
            pagination.page === page
              ? 'bg-surface-3 font-medium text-ink-1'
              : 'text-ink-2'
          }`}
        >
          {page}
        </Button>
      </React.Fragment>
    ));

  return (
    <div className='mt-3 flex w-full flex-col gap-3 text-xs text-ink-3 sm:flex-row sm:items-center sm:justify-between'>
      <div className='flex items-center gap-2'>
        <span>Show</span>
        <select
          aria-label='Entries per page'
          className='rounded-md border border-hairline bg-surface-2 px-2 py-1 text-ink-1 focus:border-accent-blue focus:outline-none'
          value={pagination.limit}
          onChange={onItemsPerPageChange}
        >
          <option value='5'>5</option>
          <option value='10'>10</option>
        </select>
        <span>entries</span>
      </div>

      <div className='flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-start'>
        <span className='shrink-0 whitespace-nowrap'>
          {pagination.totalItems > 0
            ? `Page ${pagination.page} of ${pagination.totalPages}`
            : 'No results'}
        </span>
        <div className='flex min-w-0 items-center justify-end gap-1'>
          <Button
            onClick={() => onPageChange(1)}
            disabled={!pagination.hasPreviousPage}
            variant='ghost'
            size='sm'
            className='hidden h-7 px-2 text-ink-2 disabled:opacity-40 sm:inline-flex'
          >
            First
          </Button>
          <Button
            aria-label='Previous page'
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={!pagination.hasPreviousPage}
            variant='ghost'
            size='sm'
            className='h-7 px-2 text-ink-2 disabled:opacity-40'
          >
            ‹
          </Button>
          <span className='contents sm:hidden'>
            {renderPageNumbers(mobileVisiblePages, true)}
          </span>
          <span className='hidden sm:contents'>
            {renderPageNumbers(visiblePages)}
          </span>
          <Button
            aria-label='Next page'
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={!pagination.hasNextPage}
            variant='ghost'
            size='sm'
            className='h-7 px-2 text-ink-2 disabled:opacity-40'
          >
            ›
          </Button>
          <Button
            onClick={() => onPageChange(pagination.totalPages)}
            disabled={!pagination.hasNextPage}
            variant='ghost'
            size='sm'
            className='hidden h-7 px-2 text-ink-2 disabled:opacity-40 sm:inline-flex'
          >
            Last
          </Button>
        </div>
      </div>
    </div>
  );
}

export default React.memo(TablePagination);
