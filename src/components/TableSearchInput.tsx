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
        type='text'
        placeholder={placeholder}
        className='h-8 ps-8 pe-3 text-[12.5px] bg-surface-1 text-ink-1 placeholder:text-ink-3 rounded-lg w-full sm:w-64 border border-hairline focus:outline-none focus:border-accent-blue'
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
      />
      <button
        type='button'
        className='absolute inset-inline-start-0 top-0 h-8 w-8 flex items-center justify-center text-ink-3 hover:text-ink-1'
        onClick={onSearch}
        aria-label='Search'
      >
        <Search className='w-3.5 h-3.5' />
      </button>
    </div>
  );
}
