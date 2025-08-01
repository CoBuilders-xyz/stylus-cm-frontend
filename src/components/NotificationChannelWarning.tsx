'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Settings, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ValidationResult,
  getChannelDisplayName,
  getChannelDescription,
} from '@/utils/notificationValidation';
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
  /** Variant styling */
  variant?: 'default' | 'compact';
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
  showDetails = true,
  variant = 'default',
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

  // Compact variant for smaller spaces
  if (variant === 'compact') {
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

  // Default variant with full details
  return (
    <div
      className={cn(
        'p-6 bg-yellow-500/10 border border-yellow-500/20 rounded-lg',
        className
      )}
    >
      <div className='flex items-start gap-4'>
        <div className='flex-shrink-0'>
          <AlertTriangle className='h-6 w-6 text-yellow-500 mt-1' />
        </div>

        <div className='flex-1 min-w-0'>
          <h3 className='text-lg font-semibold text-yellow-200 mb-2'>
            {title}
          </h3>

          <p className='text-yellow-200/90 mb-4'>{displayMessage}</p>

          {showDetails && (
            <div className='space-y-4'>
              {/* Configured Channels */}
              {validationResult.configuredChannels.length > 0 && (
                <div>
                  <h4 className='text-sm font-medium text-green-400 mb-2'>
                    ✓ Configured Channels (
                    {validationResult.configuredChannels.length})
                  </h4>
                  <div className='grid grid-cols-1 gap-2'>
                    {validationResult.configuredChannels.map((channel) => (
                      <div
                        key={channel}
                        className='flex items-center gap-2 text-sm text-green-300'
                      >
                        <div className='w-2 h-2 bg-green-400 rounded-full' />
                        <span className='font-medium'>
                          {getChannelDisplayName(channel)}
                        </span>
                        <span className='text-green-300/70'>
                          - {getChannelDescription(channel)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Enabled but Invalid Channels */}
              {validationResult.enabledButInvalidChannels.length > 0 && (
                <div>
                  <h4 className='text-sm font-medium text-yellow-400 mb-2'>
                    ⚠ Needs Attention (
                    {validationResult.enabledButInvalidChannels.length})
                  </h4>
                  <div className='grid grid-cols-1 gap-2'>
                    {validationResult.enabledButInvalidChannels.map(
                      (channel) => (
                        <div
                          key={channel}
                          className='flex items-center gap-2 text-sm text-yellow-300'
                        >
                          <div className='w-2 h-2 bg-yellow-400 rounded-full' />
                          <span className='font-medium'>
                            {getChannelDisplayName(channel)}
                          </span>
                          <span className='text-yellow-300/70'>
                            - Missing destination
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Missing Channels */}
              {validationResult.missingChannels.length > 0 && (
                <div>
                  <h4 className='text-sm font-medium text-gray-400 mb-2'>
                    Available Channels (
                    {validationResult.missingChannels.length})
                  </h4>
                  <div className='grid grid-cols-1 gap-2'>
                    {validationResult.missingChannels.map((channel) => (
                      <div
                        key={channel}
                        className='flex items-center gap-2 text-sm text-gray-400'
                      >
                        <div className='w-2 h-2 bg-gray-500 rounded-full' />
                        <span className='font-medium'>
                          {getChannelDisplayName(channel)}
                        </span>
                        <span className='text-gray-400/70'>
                          - {getChannelDescription(channel)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className='flex items-center gap-3 mt-6'>
            <Button
              onClick={handleConfigureClick}
              className='bg-yellow-500 text-black hover:bg-yellow-400 font-medium'
            >
              <Settings className='h-4 w-4 mr-2' />
              Configure Notification Channels
              <ArrowRight className='h-4 w-4 ml-2' />
            </Button>
          </div>
        </div>
      </div>
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
