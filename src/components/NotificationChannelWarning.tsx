'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ValidationResult } from '@/utils/notificationValidation';
import { useAlertSettings } from '@/context/AlertSettingsProvider';

interface NotificationChannelWarningProps {
  /** Validation result with channel details */
  validationResult: ValidationResult;
  /** Custom title (optional) */
  title?: string;
  /** Custom message (optional) */
  message?: string;
  /** Show detailed channel information */
  showDetails?: boolean;
  /** Custom className */
  className?: string;
  /** Callback when configure button is clicked (optional, uses global context by default) */
  onConfigureChannels?: () => void;
}

/**
 * Warning component displayed when users don't have valid notification channels configured
 */
export default function NotificationChannelWarning({
  validationResult,
  title = 'Notification Channels Required',
  message,
  className,
  onConfigureChannels,
}: NotificationChannelWarningProps) {
  const { openAlertSettings } = useAlertSettings();

  const handleConfigureClick = () => {
    if (onConfigureChannels) {
      onConfigureChannels();
    } else {
      openAlertSettings();
    }
  };

  const defaultMessage = validationResult.isValid
    ? 'Some of your notification channels need attention.'
    : 'You need to configure at least one notification channel before setting up alerts for your contracts.';

  const displayMessage = message || defaultMessage;

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg',
        className
      )}
    >
      <AlertTriangle className='h-5 w-5 text-yellow-500 flex-shrink-0' />
      <div className='flex-1 min-w-0'>
        <p className='text-sm text-yellow-200 font-medium'>{title}</p>
        <p className='text-xs text-yellow-200/80 mt-1'>{displayMessage}</p>
      </div>
      <Button
        onClick={handleConfigureClick}
        size='sm'
        className='bg-yellow-500 text-black hover:bg-yellow-400 whitespace-nowrap'
      >
        Configure
      </Button>
    </div>
  );
}

/**
 * Simple blocking overlay component for when channels are completely missing
 */
export function NotificationChannelBlockingOverlay({
  validationResult,
  className,
  onConfigureChannels,
}: Pick<
  NotificationChannelWarningProps,
  'validationResult' | 'className' | 'onConfigureChannels'
>) {
  return (
    <div
      className={cn(
        'absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-10',
        className
      )}
    >
      <div className='max-w-md mx-4'>
        <NotificationChannelWarning
          validationResult={validationResult}
          title='Setup Required'
          message='Configure at least one notification channel to receive alerts for your contracts.'
          showDetails={false}
          onConfigureChannels={onConfigureChannels}
          className='bg-black/80 border-yellow-500/30'
        />
      </div>
    </div>
  );
}
