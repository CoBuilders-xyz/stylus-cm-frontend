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
  { value: 'active', label: 'Active', dot: 'bg-ok' },
  { value: 'expiring', label: 'Expiring', dot: 'bg-warn' },
  { value: 'inactive', label: 'Inactive', dot: 'bg-crit' },
];

const CACHE_OPTIONS: FilterOption<CacheFilter>[] = [
  { value: 'all', label: 'All' },
  { value: 'cached', label: 'Cached', dot: 'bg-ok' },
  { value: 'uncached', label: 'Not Cached', dot: 'bg-ink-3' },
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
      <span className='text-[11px] uppercase tracking-wider text-ink-3 me-1'>
        {label}
      </span>
      <div className='inline-flex items-center rounded-lg border border-hairline bg-surface-1 p-[3px]'>
        {options.map((opt) => {
          const selected = value === opt.value;
          return (
            <button
              key={opt.value}
              type='button'
              onClick={() => onChange(opt.value)}
              className={`h-6.5 inline-flex items-center gap-1.5 px-2.5 text-xs rounded-md transition-colors ${
                selected
                  ? 'bg-surface-3 text-ink-1 font-medium'
                  : 'text-ink-2 hover:text-ink-1'
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
