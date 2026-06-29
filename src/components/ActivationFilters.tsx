'use client';

export type ActivationFilter = 'all' | 'active' | 'expiring' | 'inactive';
export type CacheFilter = 'all' | 'cached' | 'uncached';

interface FilterOption<T extends string> {
  value: T;
  label: string;
  dot?: string;
}

const ACTIVATION_OPTIONS: FilterOption<ActivationFilter>[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active', dot: 'bg-green-500' },
  { value: 'expiring', label: 'Expiring', dot: 'bg-amber-400' },
  { value: 'inactive', label: 'Inactive', dot: 'bg-red-500' },
];

const CACHE_OPTIONS: FilterOption<CacheFilter>[] = [
  { value: 'all', label: 'All' },
  { value: 'cached', label: 'Cached', dot: 'bg-emerald-500' },
  { value: 'uncached', label: 'Not Cached', dot: 'bg-gray-500' },
];

function PillFilterGroup<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: FilterOption<T>[];
  onChange: (v: T) => void;
}) {
  return (
    <div className='flex items-center gap-1.5 flex-wrap'>
      <span className='text-[11px] uppercase tracking-wider text-gray-500 mr-1'>
        {label}
      </span>
      <div className='inline-flex items-center rounded-full border border-gray-700 bg-black/30 p-0.5 backdrop-blur'>
        {options.map((opt) => {
          const selected = value === opt.value;
          return (
            <button
              key={opt.value}
              type='button'
              onClick={() => onChange(opt.value)}
              className={`h-7 inline-flex items-center gap-1.5 px-3 text-xs rounded-full transition-colors ${
                selected
                  ? 'bg-white text-black font-medium shadow-sm'
                  : 'text-gray-300 hover:text-white hover:bg-gray-800/60'
              }`}
            >
              {opt.dot && (
                <span
                  className={`inline-block h-1.5 w-1.5 rounded-full ${opt.dot}`}
                />
              )}
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface ActivationProps {
  value: ActivationFilter;
  onChange: (v: ActivationFilter) => void;
}

export default function ActivationFilters({ value, onChange }: ActivationProps) {
  return (
    <PillFilterGroup
      label='Activation'
      value={value}
      options={ACTIVATION_OPTIONS}
      onChange={onChange}
    />
  );
}

interface CacheProps {
  value: CacheFilter;
  onChange: (v: CacheFilter) => void;
}

export function CacheFilters({ value, onChange }: CacheProps) {
  return (
    <PillFilterGroup
      label='Cache'
      value={value}
      options={CACHE_OPTIONS}
      onChange={onChange}
    />
  );
}
