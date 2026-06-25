import {
  ActivationInfo,
  activationDotClass,
  activationStatusLabel,
  activationSubLabel,
  activationTextClass,
} from '@/lib/activation';

interface ActivationBadgeProps {
  info: ActivationInfo;
  compact?: boolean;
}

export default function ActivationBadge({
  info,
  compact = false,
}: ActivationBadgeProps) {
  const statusText = activationStatusLabel(info);
  const subText = activationSubLabel(info);
  const showPulse = info.status === 'active' || info.status === 'expiring';

  return (
    <div className='flex items-start gap-2.5 whitespace-nowrap'>
      <span className='relative mt-1 flex shrink-0 items-center justify-center'>
        {showPulse && (
          <span
            aria-hidden
            className={`absolute inline-flex h-3 w-3 rounded-full opacity-50 animate-ping ${activationDotClass(
              info.status
            )}`}
          />
        )}
        <span
          className={`relative inline-block rounded-full ${
            compact ? 'h-2 w-2' : 'h-2.5 w-2.5'
          } ${activationDotClass(info.status)}`}
        />
      </span>
      <div className='flex flex-col leading-tight'>
        <span
          className={`${activationTextClass(info.status)} ${
            compact ? 'text-xs' : 'text-sm'
          } font-semibold tracking-tight`}
        >
          {statusText}
        </span>
        <span
          className={`${
            compact ? 'text-[10px]' : 'text-xs'
          } text-gray-400 font-normal`}
        >
          {subText}
        </span>
      </div>
    </div>
  );
}
