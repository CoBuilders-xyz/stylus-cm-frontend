'use client';

import { Button } from '@/components/ui/button';

export type ActivationFilter = 'all' | 'active' | 'expiring' | 'inactive';

const OPTIONS: { value: ActivationFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'expiring', label: 'Expiring' },
  { value: 'inactive', label: 'Inactive' },
];

interface Props {
  value: ActivationFilter;
  onChange: (v: ActivationFilter) => void;
}

export default function ActivationFilters({ value, onChange }: Props) {
  return (
    <div className='flex items-center gap-2 flex-wrap'>
      <span className='text-xs text-gray-400 mr-1'>Activation:</span>
      {OPTIONS.map((opt) => {
        const selected = value === opt.value;
        return (
          <Button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`h-7 px-3 text-xs rounded-full border transition-colors ${
              selected
                ? 'bg-white text-black border-white'
                : 'bg-transparent text-white border-gray-600 hover:bg-gray-800'
            }`}
          >
            {opt.label}
          </Button>
        );
      })}
    </div>
  );
}
