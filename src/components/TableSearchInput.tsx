'use client';

import React from 'react';
import { Search } from 'lucide-react';

interface TableSearchInputProps {
  value: string;
  placeholder: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  onKeyDown: React.KeyboardEventHandler<HTMLInputElement>;
  onSearch: () => void;
}

export default function TableSearchInput({
  value,
  placeholder,
  onChange,
  onKeyDown,
  onSearch,
}: TableSearchInputProps) {
  return (
    <div className='relative flex-1 sm:flex-none'>
      <input
        data-table-search-input
        aria-label={placeholder}
        type='text'
        placeholder={placeholder}
        className='h-8 ps-8 pe-3 text-[12.5px] bg-surface-1 text-ink-1 placeholder:text-ink-3 rounded-lg w-full sm:w-64 border border-hairline outline-none focus-visible:border-accent-blue focus-visible:ring-2 focus-visible:ring-accent-blue/30'
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
      />
      <button
        type='button'
        className='absolute inset-inline-start-0 top-0 h-8 w-8 flex items-center justify-center rounded-lg text-ink-3 outline-none hover:text-ink-1 focus-visible:ring-2 focus-visible:ring-accent-blue/50'
        onClick={onSearch}
        aria-label='Search'
      >
        <Search className='w-3.5 h-3.5' />
      </button>
    </div>
  );
}
