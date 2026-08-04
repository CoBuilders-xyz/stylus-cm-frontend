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
      className={`flex items-start gap-2 whitespace-nowrap ${
        align === 'end' ? 'justify-end' : ''
      }`}
    >
      <span
        aria-hidden
        className={`mt-[0.45em] inline-block shrink-0 rounded-full ${
          compact ? 'size-1.5' : 'size-2'
        } ${dotClassName}`}
      />
      <div
        className={`flex flex-col leading-tight ${
          align === 'end' ? 'items-end text-end' : ''
        }`}
      >
        <span
          className={`${compact ? 'text-xs' : 'text-sm'} font-medium ${labelClassName}`}
        >
          {label}
        </span>
        {description ? (
          <span className={`${compact ? 'text-[10px]' : 'text-xs'} text-ink-3`}>
            {description}
          </span>
        ) : null}
      </div>
    </div>
  );
}
