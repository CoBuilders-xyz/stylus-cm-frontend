'use client';

export type ActivationFilter = 'all' | 'active' | 'expiring' | 'inactive';

const OPTIONS: {
  value: ActivationFilter;
  label: string;
  dot?: string;
}[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active', dot: 'bg-green-500' },
  { value: 'expiring', label: 'Expiring', dot: 'bg-amber-400' },
  { value: 'inactive', label: 'Inactive', dot: 'bg-red-500' },
];

interface Props {
  value: ActivationFilter;
  onChange: (v: ActivationFilter) => void;
}

export default function ActivationFilters({ value, onChange }: Props) {
  return (
    <div className='flex items-center gap-1.5 flex-wrap'>
      <span className='text-[11px] uppercase tracking-wider text-gray-500 mr-1'>
        Activation
      </span>
      <div className='inline-flex items-center rounded-full border border-gray-700 bg-black/30 p-0.5 backdrop-blur'>
        {OPTIONS.map((opt) => {
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
