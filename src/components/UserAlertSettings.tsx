'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useSidePanel } from './SidePanel';
import { Info, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { UserAlertPreferences } from '@/services/alertService';
import { NotificationChannel } from '@/types/alerts';
import { useAlertService } from '@/hooks/useAlertService';
import { useAlertSettings } from '@/context/AlertSettingsProvider';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { cn } from '@/lib/utils';
import { showSuccessToast, showErrorToast } from '@/components/Toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface UserAlertSettingsProps {
  onSuccess?: () => void;
}

export default function UserAlertSettings({
  onSuccess,
}: UserAlertSettingsProps) {
  const { onClose } = useSidePanel();
  const { notifyChannelsUpdated } = useAlertSettings();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const alertService = useAlertService();

  // Telegram settings
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [telegramDestination, setTelegramDestination] = useState('');
  const [telegramError, setTelegramError] = useState<string | null>(null);

  // Slack settings
  const [slackEnabled, setSlackEnabled] = useState(false);
  const [slackDestination, setSlackDestination] = useState('');

  // Webhook settings
  const [webhookEnabled, setWebhookEnabled] = useState(false);
  const [webhookDestination, setWebhookDestination] = useState('');
  const [webhookError, setWebhookError] = useState<string | null>(null);

  // Track if settings have changed
  const [hasChangedTelegram, setHasChangedTelegram] = useState(false);
  const [hasChangedSlack, setHasChangedSlack] = useState(false);
  const [hasChangedWebhook, setHasChangedWebhook] = useState(false);

  // Load user alert preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      if (!alertService) return;

      try {
        setIsLoading(true);
        const preferences = await alertService.getUserAlertPreferences();

        // Set telegram settings
        if (preferences.telegramSettings) {
          setTelegramEnabled(preferences.telegramSettings.enabled);
          setTelegramDestination(
            preferences.telegramSettings.destination || ''
          );
        }

        // Set slack settings
        if (preferences.slackSettings) {
          setSlackEnabled(preferences.slackSettings.enabled);
          setSlackDestination(preferences.slackSettings.destination || '');
        }

        // Set webhook settings
        if (preferences.webhookSettings) {
          setWebhookEnabled(preferences.webhookSettings.enabled);
          setWebhookDestination(preferences.webhookSettings.destination || '');
        }

        // Reset change tracking after loading
        setHasChangedTelegram(false);
        setHasChangedSlack(false);
        setHasChangedWebhook(false);
      } catch (err) {
        console.error('Failed to load alert preferences:', err);
        setError('Failed to load alert preferences');
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, [alertService]);

  // Telegram validation
  const validateTelegram = (chatId: string): boolean => {
    if (!chatId && telegramEnabled) {
      setTelegramError('Telegram Chat ID is required');
      return false;
    }

    setTelegramError(null);
    return true;
  };

  // Webhook validation
  const validateWebhook = (url: string): boolean => {
    if (!url && webhookEnabled) {
      setWebhookError('Webhook URL is required');
      return false;
    }

    try {
      if (url) {
        new URL(url); // Will throw if URL is invalid
      }
      setWebhookError(null);
      return true;
    } catch {
      setWebhookError('Enter a valid URL');
      return false;
    }
  };

  const handleTelegramEnabledChange = (enabled: boolean) => {
    setTelegramEnabled(enabled);
    setHasChangedTelegram(true);
  };

  const handleTelegramDestinationChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setTelegramDestination(e.target.value);
    setHasChangedTelegram(true);
    if (telegramError) validateTelegram(e.target.value);
  };

  const handleSlackEnabledChange = (enabled: boolean) => {
    setSlackEnabled(enabled);
    setHasChangedSlack(true);
  };

  const handleSlackDestinationChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSlackDestination(e.target.value);
    setHasChangedSlack(true);
  };

  const handleWebhookEnabledChange = (enabled: boolean) => {
    setWebhookEnabled(enabled);
    setHasChangedWebhook(true);
  };

  const handleWebhookDestinationChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setWebhookDestination(e.target.value);
    setHasChangedWebhook(true);
    if (webhookError) validateWebhook(e.target.value);
  };

  // Function to test notification channels
  const testNotification = async (channel: NotificationChannel) => {
    if (!alertService) {
      setError('Alert service not initialized');
      return;
    }

    // Check if there are unsaved changes for this channel
    let hasUnsavedChanges = false;

    if (channel === NotificationChannel.TELEGRAM && hasChangedTelegram) {
      hasUnsavedChanges = true;
    } else if (channel === NotificationChannel.SLACK && hasChangedSlack) {
      hasUnsavedChanges = true;
    } else if (channel === NotificationChannel.WEBHOOK && hasChangedWebhook) {
      hasUnsavedChanges = true;
    }

    // If there are unsaved changes, save first
    if (hasUnsavedChanges) {
      try {
        await handleSaveSettings(false);
        // If save was successful, the change flags will be reset
        // Continue to test notification
      } catch (err) {
        // If save failed, don't proceed with test
        console.error('Failed to save before testing:', err);
        return;
      }
    }

    try {
      // Validate destination before testing
      let isValid = true;

      if (
        channel === NotificationChannel.TELEGRAM &&
        !validateTelegram(telegramDestination)
      ) {
        isValid = false;
      }

      if (
        channel === NotificationChannel.WEBHOOK &&
        !validateWebhook(webhookDestination)
      ) {
        isValid = false;
      }

      if (!isValid) {
        // If validation fails, don't proceed with test
        return;
      }

      // Call the test notification service
      const result = await alertService.testNotification(channel);

      // Show success toast - if we get here, the test was successful (API returns 201)
      showSuccessToast({
        message:
          result.message || `Test ${channel} notification sent successfully`,
      });
    } catch (err) {
      console.error(`Failed to test ${channel} notification:`, err);

      // Show error toast
      showErrorToast({
        message: `Failed to test ${channel} notification`,
      });
    }
  };

  const handleSaveSettings = async (shouldTriggerOnSuccess = true) => {
    if (!alertService) {
      setError('Alert service not initialized');
      return;
    }

    // Validate all enabled services
    let isValid = true;

    if (telegramEnabled) {
      isValid = validateTelegram(telegramDestination) && isValid;
    }

    if (webhookEnabled) {
      isValid = validateWebhook(webhookDestination) && isValid;
    }

    if (!isValid) {
      return; // Stop if validation fails
    }

    setIsLoading(true);
    setError(null);

    try {
      // Check if any settings have changed
      if (!hasChangedTelegram && !hasChangedSlack && !hasChangedWebhook) {
        // Show custom toast for no changes
        showSuccessToast({
          message: 'No changes to save',
        });

        if (shouldTriggerOnSuccess && onSuccess) {
          onSuccess();
        }
        return;
      }

      // Create the complete alert settings object with all fields
      const alertsSettings: UserAlertPreferences = {
        // Always include all settings, not just the changed ones
        telegramSettings: {
          enabled: telegramEnabled,
          destination: telegramDestination,
        },
        slackSettings: {
          enabled: slackEnabled,
          destination: slackDestination,
        },
        webhookSettings: {
          enabled: webhookEnabled,
          destination: webhookDestination,
        },
      };

      // Update all settings with a single API call
      await alertService.updateUserAlertPreferences(alertsSettings);

      // Reset change tracking
      setHasChangedTelegram(false);
      setHasChangedSlack(false);
      setHasChangedWebhook(false);

      // Notify context that channels have been updated
      notifyChannelsUpdated();

      // Show custom toast for success
      showSuccessToast({
        message: 'Alert preferences saved successfully',
      });

      if (shouldTriggerOnSuccess && onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Failed to save alert preferences:', err);
      setError('Failed to save alert preferences. Please try again.');

      // Show custom toast for error
      showErrorToast({
        message: 'Failed to save alert preferences',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='text-white flex flex-col h-full bg-[#1A1919] shadow-xl overflow-hidden'>
      {/* Title header with gradient background and noise texture */}
      <div
        className='relative overflow-hidden'
        style={{
          background:
            'linear-gradient(88.8deg, #275A93 0.24%, #2D99DD 24.41%, #FA9647 59.66%, #E0445B 100.95%)',
        }}
      >
        {/* White noise texture overlay */}
        <div
          className='absolute inset-0 opacity-50 mix-blend-overlay pointer-events-none'
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' fill='white'/%3E%3C/svg%3E")`,
            backgroundSize: '100px 100px',
            backgroundRepeat: 'repeat',
          }}
        />

        {/* Header content */}
        <div className='flex justify-between items-center p-6 relative z-10'>
          <div>
            <h2 className='text-2xl font-bold text-white'>Alert Settings</h2>
            <div className='text-white/80 mt-1'>
              Set up your notification channels for all contracts.
            </div>
          </div>
          <Button
            size='icon'
            onClick={onClose}
            className='w-10 h-10 flex items-center justify-center bg-transparent border border-white text-white rounded-md'
          >
            <X className='h-6 w-6' />
          </Button>
        </div>
      </div>

      <div className='p-6 flex-1 overflow-auto'>
        {/* Telegram Alerts */}
        <div className='mb-8 rounded-lg bg-black p-6'>
          <div className='flex items-center justify-between mb-2'>
            <h3 className='text-lg font-medium'>Telegram Alerts</h3>
            <SwitchPrimitive.Root
              checked={telegramEnabled}
              onCheckedChange={handleTelegramEnabledChange}
              className={cn(
                'inline-flex h-[26px] w-[48px] shrink-0 items-center rounded-full border-transparent transition-all outline-none',
                'data-[state=unchecked]:border data-[state=unchecked]:border-[#73777A] data-[state=unchecked]:bg-[#2C2E30]',
                'data-[state=checked]:border-0 data-[state=checked]:bg-[#335CD7]'
              )}
            >
              <SwitchPrimitive.Thumb
                className={cn(
                  'pointer-events-none block h-[20px] w-[20px] rounded-full bg-white shadow-lg ring-0 transition-transform',
                  'data-[state=checked]:translate-x-[24px] data-[state=unchecked]:translate-x-0.5'
                )}
              />
            </SwitchPrimitive.Root>
          </div>

          {telegramEnabled && (
            <div className='mt-4'>
              <label className='block text-sm text-gray-300 mb-1'>
                <div className='flex items-center gap-2'>
                  Telegram Chat ID{' '}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className='w-4 h-4 cursor-help' />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className='max-w-xs'>
                          <strong>Your unique Telegram chat ID.</strong>
                          <br />
                          Used to send you automation alerts via Telegram.
                          <br />
                          You can get it by messaging{' '}
                          <a
                            href='https://t.me/userinfobot'
                            target='_blank'
                            rel='noopener noreferrer'
                          >
                            @userinfobot
                          </a>{' '}
                          — it will reply with your chat ID.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </label>
              <div className='flex gap-2'>
                <Input
                  type='text'
                  placeholder='0123456789'
                  value={telegramDestination}
                  onChange={handleTelegramDestinationChange}
                  className='bg-[#1A1919] text-white border border-gray-700 rounded-md p-2 flex-grow'
                />
                <Button
                  onClick={() => testNotification(NotificationChannel.TELEGRAM)}
                  disabled={!telegramDestination}
                  className='bg-[#335CD7] text-white hover:bg-[#4a6fe0] disabled:bg-[#335CD7]/50 min-w-[100px]'
                >
                  {hasChangedTelegram ? 'Save & Test' : 'Test'}
                </Button>
              </div>
              <p className='text-gray-400 text-xs mt-2'>
                Start a conversation with{' '}
                <a
                  href='http://t.me/stylusCmNotifications_bot'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-blue-400 hover:text-blue-300 underline'
                >
                  @stylusCmNotifications_bot
                </a>{' '}
                to receive your Telegram notifications
              </p>
              {telegramError && (
                <p className='text-red-500 text-xs mt-1'>{telegramError}</p>
              )}
            </div>
          )}
        </div>

        {/* Slack Alerts */}
        <div className='mb-8 rounded-lg bg-black p-6'>
          <div className='flex items-center justify-between mb-2'>
            <h3 className='text-lg font-medium'>Slack Alerts</h3>
            <SwitchPrimitive.Root
              checked={slackEnabled}
              onCheckedChange={handleSlackEnabledChange}
              className={cn(
                'inline-flex h-[26px] w-[48px] shrink-0 items-center rounded-full border-transparent transition-all outline-none',
                'data-[state=unchecked]:border data-[state=unchecked]:border-[#73777A] data-[state=unchecked]:bg-[#2C2E30]',
                'data-[state=checked]:border-0 data-[state=checked]:bg-[#335CD7]'
              )}
            >
              <SwitchPrimitive.Thumb
                className={cn(
                  'pointer-events-none block h-[20px] w-[20px] rounded-full bg-white shadow-lg ring-0 transition-transform',
                  'data-[state=checked]:translate-x-[24px] data-[state=unchecked]:translate-x-0.5'
                )}
              />
            </SwitchPrimitive.Root>
          </div>

          {slackEnabled && (
            <div className='mt-4'>
              <label className='block text-sm text-gray-300 mb-1'>
                <div className='flex items-center gap-2'>
                  Slack Webhook URL
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className='w-4 h-4 cursor-help' />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className='max-w-xs'>
                        <strong>
                          Used to send automation alerts to your Slack channel.
                        </strong>
                        <br />
                        You can create a webhook URL by adding an{' '}
                        <em>Incoming Webhook</em> to your Slack workspace.
                        <br />
                        Visit:{' '}
                        <a
                          href='https://api.slack.com/messaging/webhooks'
                          target='_blank'
                          rel='noopener noreferrer'
                        >
                          Slack Webhooks Setup
                        </a>
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </label>
              <div className='flex gap-2'>
                <Input
                  type='text'
                  placeholder='https://slack-webhook.co/'
                  value={slackDestination}
                  onChange={handleSlackDestinationChange}
                  className='bg-[#1A1919] text-white border border-gray-700 rounded-md p-2 flex-grow'
                />
                <Button
                  onClick={() => testNotification(NotificationChannel.SLACK)}
                  disabled={!slackDestination}
                  className='bg-[#335CD7] text-white hover:bg-[#4a6fe0] disabled:bg-[#335CD7]/50 min-w-[100px]'
                >
                  {hasChangedSlack ? 'Save & Test' : 'Test'}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Webhook Alerts */}
        <div className='mb-8 rounded-lg bg-black p-6'>
          <div className='flex items-center justify-between mb-2'>
            <h3 className='text-lg font-medium'>Webhook Alerts</h3>
            <SwitchPrimitive.Root
              checked={webhookEnabled}
              onCheckedChange={handleWebhookEnabledChange}
              className={cn(
                'inline-flex h-[26px] w-[48px] shrink-0 items-center rounded-full border-transparent transition-all outline-none',
                'data-[state=unchecked]:border data-[state=unchecked]:border-[#73777A] data-[state=unchecked]:bg-[#2C2E30]',
                'data-[state=checked]:border-0 data-[state=checked]:bg-[#335CD7]'
              )}
            >
              <SwitchPrimitive.Thumb
                className={cn(
                  'pointer-events-none block h-[20px] w-[20px] rounded-full bg-white shadow-lg ring-0 transition-transform',
                  'data-[state=checked]:translate-x-[24px] data-[state=unchecked]:translate-x-0.5'
                )}
              />
            </SwitchPrimitive.Root>
          </div>

          {webhookEnabled && (
            <div className='mt-4'>
              <label className='block text-sm text-gray-300 mb-1'>
                <div className='flex items-center gap-2'>
                  Webhook URL
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className='w-4 h-4 cursor-help' />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className='max-w-xs'>
                          <strong>
                            Send automation alerts to your own backend.
                          </strong>
                          <br />
                          Provide a URL that accepts POST requests — your server
                          will receive real-time updates about automated bidding
                          actions.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </label>
              <div className='flex gap-2'>
                <Input
                  type='url'
                  placeholder='https://webhook.co/your-endpoint'
                  value={webhookDestination}
                  onChange={handleWebhookDestinationChange}
                  className='bg-[#1A1919] text-white border border-gray-700 rounded-md p-2 flex-grow'
                />
                <Button
                  onClick={() => testNotification(NotificationChannel.WEBHOOK)}
                  disabled={!webhookDestination}
                  className='bg-[#335CD7] text-white hover:bg-[#4a6fe0] disabled:bg-[#335CD7]/50 min-w-[100px]'
                >
                  {hasChangedWebhook ? 'Save & Test' : 'Test'}
                </Button>
              </div>
              {webhookError && (
                <p className='text-red-500 text-xs mt-1'>{webhookError}</p>
              )}
            </div>
          )}
        </div>

        {error && <p className='text-red-500 text-sm mb-4'>{error}</p>}

        <div className='mt-6 mb-4'>
          <Button
            className='w-full px-4 py-2 bg-black text-white font-medium hover:bg-gray-900 rounded-md'
            onClick={() => handleSaveSettings()}
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save Alert Settings'}
          </Button>
        </div>
      </div>
    </div>
  );
}
