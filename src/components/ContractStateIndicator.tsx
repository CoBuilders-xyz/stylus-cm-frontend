import type { ReactNode } from 'react';

interface ContractStateIndicatorProps {
  label: ReactNode;
  description?: ReactNode;
  dotClassName: string;
  labelClassName?: string;
  compact?: boolean;
  align?: 'start' | 'end';
}

export default function ContractStateIndicator({
  label,
  description,
  dotClassName,
  labelClassName = 'text-ink-2',
  compact = false,
  align = 'start',
}: ContractStateIndicatorProps) {
  return (
    <div
      className={`flex min-w-0 flex-col whitespace-nowrap ${
        align === 'end' ? 'items-end text-end' : 'items-start text-start'
      }`}
    >
      <div className='flex items-center gap-2 leading-tight'>
        <span
          aria-hidden
          className={`inline-block shrink-0 rounded-full ${
            compact ? 'size-1.5' : 'size-2'
          } ${dotClassName}`}
        />
        <span
          className={`${compact ? 'text-xs' : 'text-sm'} font-medium ${labelClassName}`}
        >
          {label}
        </span>
      </div>
      {description ? (
        <span
          className={`${compact ? 'text-[10px]' : 'text-xs'} text-ink-3 leading-tight`}
        >
          {description}
        </span>
      ) : null}
    </div>
  );
}
