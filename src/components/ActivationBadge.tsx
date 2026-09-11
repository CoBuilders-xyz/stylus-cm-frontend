import {
  ActivationInfo,
  activationDotClass,
  activationStatusLabel,
  activationSubLabel,
  activationTextClass,
} from '@/lib/activation';
import ContractStateIndicator from '@/components/ContractStateIndicator';

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
  return (
    <ContractStateIndicator
      label={statusText}
      description={subText}
      dotClassName={activationDotClass(info.status)}
      labelClassName={activationTextClass(info.status)}
      compact={compact}
    />
  );
}
