import {
  ActivationInfo,
  activationDotClass,
  activationLabel,
  activationTextClass,
} from '@/lib/prototype-mocks';

interface ActivationBadgeProps {
  info: ActivationInfo;
  compact?: boolean;
}

export default function ActivationBadge({
  info,
  compact = false,
}: ActivationBadgeProps) {
  return (
    <div className='flex items-center gap-2'>
      <span
        className={`inline-block rounded-full ${
          compact ? 'h-2 w-2' : 'h-2.5 w-2.5'
        } ${activationDotClass(info.status)}`}
      />
      <span
        className={`${activationTextClass(info.status)} ${
          compact ? 'text-xs' : 'text-sm'
        } font-medium`}
      >
        {activationLabel(info)}
      </span>
    </div>
  );
}
