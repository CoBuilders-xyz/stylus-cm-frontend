'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useSidePanel } from './SidePanel';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Alert, AlertSettings, AlertType } from '@/services/alertService';
import { useAlertService } from '@/hooks/useAlertService';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckedState } from '@radix-ui/react-checkbox';

interface AlertsSettingsProps {
  onSuccess?: () => void;
  contractId: string;
  contractAddress: string;
  initialAlerts?: Alert[];
}

export default function AlertsSettings({
  onSuccess,
  contractId,
  contractAddress,
  initialAlerts = [],
}: AlertsSettingsProps) {
  const { onClose } = useSidePanel();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const alertService = useAlertService();

  // No need to track alerts separately, just use initialAlerts

  // Helper function to convert CheckedState to boolean
  const handleCheckedChange = (setter: (val: boolean) => void) => {
    return (checked: CheckedState) => {
      setter(checked === true);
    };
  };

  // Alert state
  const [evictionAlertEnabled, setEvictionAlertEnabled] = useState(false);
  const [noGasAlertEnabled, setNoGasAlertEnabled] = useState(false);
  const [lowGasAlertEnabled, setLowGasAlertEnabled] = useState(false);
  const [lowGasThreshold, setLowGasThreshold] = useState<number | string>('');
  const [bidSafetyAlertEnabled, setBidSafetyAlertEnabled] = useState(false);
  const [bidSafetyThreshold, setBidSafetyThreshold] = useState(50); // Default to 50%

  // Communication channels - will be configured elsewhere but maintain for backend API
  const [evictionEmailEnabled, setEvictionEmailEnabled] = useState(false);
  const [evictionTelegramEnabled, setEvictionTelegramEnabled] = useState(false);
  const [evictionSlackEnabled, setEvictionSlackEnabled] = useState(false);
  const [evictionWebhookEnabled, setEvictionWebhookEnabled] = useState(false);

  const [noGasEmailEnabled, setNoGasEmailEnabled] = useState(false);
  const [noGasTelegramEnabled, setNoGasTelegramEnabled] = useState(false);
  const [noGasSlackEnabled, setNoGasSlackEnabled] = useState(false);
  const [noGasWebhookEnabled, setNoGasWebhookEnabled] = useState(false);

  const [lowGasEmailEnabled, setLowGasEmailEnabled] = useState(false);
  const [lowGasTelegramEnabled, setLowGasTelegramEnabled] = useState(false);
  const [lowGasSlackEnabled, setLowGasSlackEnabled] = useState(false);
  const [lowGasWebhookEnabled, setLowGasWebhookEnabled] = useState(false);

  const [bidSafetyEmailEnabled, setBidSafetyEmailEnabled] = useState(false);
  const [bidSafetyTelegramEnabled, setBidSafetyTelegramEnabled] =
    useState(false);
  const [bidSafetySlackEnabled, setBidSafetySlackEnabled] = useState(false);
  const [bidSafetyWebhookEnabled, setBidSafetyWebhookEnabled] = useState(false);

  // Set initial alert states based on provided alerts
  useEffect(() => {
    if (initialAlerts && initialAlerts.length > 0) {
      // Set alert toggles
      const evictionAlert = initialAlerts.find(
        (alert) => alert.type === AlertType.EVICTION
      );
      const noGasAlert = initialAlerts.find(
        (alert) => alert.type === AlertType.NO_GAS
      );
      const lowGasAlert = initialAlerts.find(
        (alert) => alert.type === AlertType.LOW_GAS
      );
      const bidSafetyAlert = initialAlerts.find(
        (alert) => alert.type === AlertType.BID_SAFETY
      );

      if (evictionAlert) {
        setEvictionAlertEnabled(evictionAlert.isActive);
        setEvictionEmailEnabled(evictionAlert.emailChannelEnabled);
        setEvictionTelegramEnabled(evictionAlert.telegramChannelEnabled);
        setEvictionSlackEnabled(evictionAlert.slackChannelEnabled);
        setEvictionWebhookEnabled(evictionAlert.webhookChannelEnabled);
      }

      if (noGasAlert) {
        setNoGasAlertEnabled(noGasAlert.isActive);
        setNoGasEmailEnabled(noGasAlert.emailChannelEnabled);
        setNoGasTelegramEnabled(noGasAlert.telegramChannelEnabled);
        setNoGasSlackEnabled(noGasAlert.slackChannelEnabled);
        setNoGasWebhookEnabled(noGasAlert.webhookChannelEnabled);
      }

      if (lowGasAlert) {
        setLowGasAlertEnabled(lowGasAlert.isActive);
        // Parse value as a number for lowGas alert
        if (lowGasAlert.value) {
          const numericValue = parseFloat(lowGasAlert.value);
          if (!isNaN(numericValue) && numericValue > 0) {
            setLowGasThreshold(numericValue); // Store as number
          } else {
            setLowGasThreshold(''); // Invalid value, reset
          }
        } else {
          setLowGasThreshold(''); // No value, reset
        }
        setLowGasEmailEnabled(lowGasAlert.emailChannelEnabled);
        setLowGasTelegramEnabled(lowGasAlert.telegramChannelEnabled);
        setLowGasSlackEnabled(lowGasAlert.slackChannelEnabled);
        setLowGasWebhookEnabled(lowGasAlert.webhookChannelEnabled);
      }

      if (bidSafetyAlert) {
        setBidSafetyAlertEnabled(bidSafetyAlert.isActive);
        // Parse value as a number for bidSafety alert
        if (bidSafetyAlert.value) {
          const numericValue = parseFloat(bidSafetyAlert.value);
          if (!isNaN(numericValue) && numericValue > 0) {
            setBidSafetyThreshold(numericValue); // Store as number
          } else {
            setBidSafetyThreshold(50); // Invalid value, use default
          }
        }
        setBidSafetyEmailEnabled(bidSafetyAlert.emailChannelEnabled);
        setBidSafetyTelegramEnabled(bidSafetyAlert.telegramChannelEnabled);
        setBidSafetySlackEnabled(bidSafetyAlert.slackChannelEnabled);
        setBidSafetyWebhookEnabled(bidSafetyAlert.webhookChannelEnabled);
      }
    }
  }, [initialAlerts]);

  // Handler for lowGasThreshold input changes
  const handleLowGasThresholdChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    // Allow empty value
    if (e.target.value === '') {
      setLowGasThreshold('');
      return;
    }

    // Try to parse as a number
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= 0) {
      // Store as a numeric value
      setLowGasThreshold(value);
    } else {
      // If it's not a valid positive number, keep the input as is
      // This allows the user to type partial valid numbers
      setLowGasThreshold(e.target.value);
    }
  };

  const handleSaveAlertSettings = async () => {
    if (!alertService) {
      setError('Alert service not initialized');
      return;
    }

    // Validate that the bidSafetyThreshold is positive
    if (
      bidSafetyAlertEnabled &&
      (typeof bidSafetyThreshold !== 'number' || bidSafetyThreshold <= 0)
    ) {
      setError('Bid Safety threshold must be a positive number');
      return;
    }

    // Validate and convert lowGasThreshold to a number if provided
    let lowGasValueNumeric: number | undefined;
    if (lowGasAlertEnabled) {
      if (lowGasThreshold === '') {
        setError('Low Gas threshold is required');
        return;
      }

      // Convert to number if it's a string
      lowGasValueNumeric =
        typeof lowGasThreshold === 'string'
          ? parseFloat(lowGasThreshold)
          : lowGasThreshold;

      if (isNaN(lowGasValueNumeric) || lowGasValueNumeric <= 0) {
        setError('Low Gas threshold must be a positive number');
        return;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create an array of alert settings to save
      const alertSettings: AlertSettings[] = [
        // Eviction alert
        {
          type: AlertType.EVICTION,
          isActive: evictionAlertEnabled,
          userContractId: contractId,
          emailChannelEnabled: evictionEmailEnabled,
          slackChannelEnabled: evictionSlackEnabled,
          telegramChannelEnabled: evictionTelegramEnabled,
          webhookChannelEnabled: evictionWebhookEnabled,
        },
        // No Gas alert
        {
          type: AlertType.NO_GAS,
          isActive: noGasAlertEnabled,
          userContractId: contractId,
          emailChannelEnabled: noGasEmailEnabled,
          slackChannelEnabled: noGasSlackEnabled,
          telegramChannelEnabled: noGasTelegramEnabled,
          webhookChannelEnabled: noGasWebhookEnabled,
        },
        // Low Gas alert - value as a number
        {
          type: AlertType.LOW_GAS,
          value: lowGasValueNumeric, // Use the validated number
          isActive: lowGasAlertEnabled,
          userContractId: contractId,
          emailChannelEnabled: lowGasEmailEnabled,
          slackChannelEnabled: lowGasSlackEnabled,
          telegramChannelEnabled: lowGasTelegramEnabled,
          webhookChannelEnabled: lowGasWebhookEnabled,
        },
        // Bid Safety alert - value as a number
        {
          type: AlertType.BID_SAFETY,
          value: bidSafetyThreshold, // Already a number
          isActive: bidSafetyAlertEnabled,
          userContractId: contractId,
          emailChannelEnabled: bidSafetyEmailEnabled,
          slackChannelEnabled: bidSafetySlackEnabled,
          telegramChannelEnabled: bidSafetyTelegramEnabled,
          webhookChannelEnabled: bidSafetyWebhookEnabled,
        },
      ];

      // Save each alert individually
      const promises = alertSettings.map((settings) =>
        alertService.createOrUpdateAlert(settings)
      );

      // Wait for all alerts to be saved
      await Promise.all(promises);

      // Call the onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }

      // No need to call onClose() here as onSuccess will handle panel closing
    } catch (err) {
      console.error('Failed to save alert settings:', err);
      setError('Failed to save alert settings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle toggling all channels when alert is enabled/disabled
  const handleEvictionAlertToggle = (checked: boolean) => {
    setEvictionAlertEnabled(checked);
    if (checked) {
      // Enable all channels by default when alert is enabled
      setEvictionEmailEnabled(true);
      setEvictionTelegramEnabled(true);
      setEvictionSlackEnabled(true);
      setEvictionWebhookEnabled(true);
    }
  };

  const handleNoGasAlertToggle = (checked: boolean) => {
    setNoGasAlertEnabled(checked);
    if (checked) {
      // Enable all channels by default when alert is enabled
      setNoGasEmailEnabled(true);
      setNoGasTelegramEnabled(true);
      setNoGasSlackEnabled(true);
      setNoGasWebhookEnabled(true);
    }
  };

  const handleLowGasAlertToggle = (checked: boolean) => {
    setLowGasAlertEnabled(checked);
    if (checked) {
      // Enable all channels by default when alert is enabled
      setLowGasEmailEnabled(true);
      setLowGasTelegramEnabled(true);
      setLowGasSlackEnabled(true);
      setLowGasWebhookEnabled(true);
    }
  };

  const handleBidSafetyAlertToggle = (checked: boolean) => {
    setBidSafetyAlertEnabled(checked);
    if (checked) {
      // Enable all channels by default when alert is enabled
      setBidSafetyEmailEnabled(true);
      setBidSafetyTelegramEnabled(true);
      setBidSafetySlackEnabled(true);
      setBidSafetyWebhookEnabled(true);
    }
  };

  return (
    <div className='text-white flex flex-col h-full bg-[#1A1919] shadow-xl  overflow-hidden border-l border-gray-800'>
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
            <h2 className='text-2xl font-bold text-white'>
              Set Contract Alerts
            </h2>
            <div className='text-white/80 mt-1'>{contractAddress}</div>
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
        {/* Eviction Alerts */}
        <div className='mb-8 rounded-lg bg-black p-6'>
          <div className='flex items-center justify-between mb-2'>
            <div>
              <h3 className='text-lg font-medium'>Eviction</h3>
              <p className='text-gray-400 text-sm'>
                Alert me when my contract gets evicted from the cache.
              </p>
            </div>
            <SwitchPrimitive.Root
              checked={evictionAlertEnabled}
              onCheckedChange={handleEvictionAlertToggle}
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

          {evictionAlertEnabled && (
            <div className='mt-4 grid grid-cols-2 gap-4'>
              <div className='flex items-center space-x-2'>
                <Checkbox
                  id='evictionEmail'
                  checked={evictionEmailEnabled}
                  onCheckedChange={handleCheckedChange(setEvictionEmailEnabled)}
                  className='data-[state=checked]:bg-[#335CD7]'
                />
                <label
                  htmlFor='evictionEmail'
                  className='text-sm cursor-pointer'
                >
                  Email
                </label>
              </div>
              <div className='flex items-center space-x-2'>
                <Checkbox
                  id='evictionTelegram'
                  checked={evictionTelegramEnabled}
                  onCheckedChange={handleCheckedChange(
                    setEvictionTelegramEnabled
                  )}
                  className='data-[state=checked]:bg-[#335CD7]'
                />
                <label
                  htmlFor='evictionTelegram'
                  className='text-sm cursor-pointer'
                >
                  Telegram
                </label>
              </div>
              <div className='flex items-center space-x-2'>
                <Checkbox
                  id='evictionSlack'
                  checked={evictionSlackEnabled}
                  onCheckedChange={handleCheckedChange(setEvictionSlackEnabled)}
                  className='data-[state=checked]:bg-[#335CD7]'
                />
                <label
                  htmlFor='evictionSlack'
                  className='text-sm cursor-pointer'
                >
                  Slack
                </label>
              </div>
              <div className='flex items-center space-x-2'>
                <Checkbox
                  id='evictionWebhook'
                  checked={evictionWebhookEnabled}
                  onCheckedChange={handleCheckedChange(
                    setEvictionWebhookEnabled
                  )}
                  className='data-[state=checked]:bg-[#335CD7]'
                />
                <label
                  htmlFor='evictionWebhook'
                  className='text-sm cursor-pointer'
                >
                  Webhook
                </label>
              </div>
            </div>
          )}
        </div>

        {/* No Gas Alerts */}
        <div className='mb-8 rounded-lg bg-black p-6'>
          <div className='flex items-center justify-between mb-2'>
            <div>
              <h3 className='text-lg font-medium'>No Gas</h3>
              <p className='text-gray-400 text-sm'>
                Alert me when my balance can&apos;t cover gas for auto-bids.
              </p>
            </div>
            <SwitchPrimitive.Root
              checked={noGasAlertEnabled}
              onCheckedChange={handleNoGasAlertToggle}
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

          {noGasAlertEnabled && (
            <div className='mt-4 grid grid-cols-2 gap-4'>
              <div className='flex items-center space-x-2'>
                <Checkbox
                  id='noGasEmail'
                  checked={noGasEmailEnabled}
                  onCheckedChange={handleCheckedChange(setNoGasEmailEnabled)}
                  className='data-[state=checked]:bg-[#335CD7]'
                />
                <label htmlFor='noGasEmail' className='text-sm cursor-pointer'>
                  Email
                </label>
              </div>
              <div className='flex items-center space-x-2'>
                <Checkbox
                  id='noGasTelegram'
                  checked={noGasTelegramEnabled}
                  onCheckedChange={handleCheckedChange(setNoGasTelegramEnabled)}
                  className='data-[state=checked]:bg-[#335CD7]'
                />
                <label
                  htmlFor='noGasTelegram'
                  className='text-sm cursor-pointer'
                >
                  Telegram
                </label>
              </div>
              <div className='flex items-center space-x-2'>
                <Checkbox
                  id='noGasSlack'
                  checked={noGasSlackEnabled}
                  onCheckedChange={handleCheckedChange(setNoGasSlackEnabled)}
                  className='data-[state=checked]:bg-[#335CD7]'
                />
                <label htmlFor='noGasSlack' className='text-sm cursor-pointer'>
                  Slack
                </label>
              </div>
              <div className='flex items-center space-x-2'>
                <Checkbox
                  id='noGasWebhook'
                  checked={noGasWebhookEnabled}
                  onCheckedChange={handleCheckedChange(setNoGasWebhookEnabled)}
                  className='data-[state=checked]:bg-[#335CD7]'
                />
                <label
                  htmlFor='noGasWebhook'
                  className='text-sm cursor-pointer'
                >
                  Webhook
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Low Gas Alerts */}
        <div className='mb-8 rounded-lg bg-black p-6'>
          <div className='flex items-center justify-between mb-2'>
            <div>
              <h3 className='text-lg font-medium'>Low Gas</h3>
              <p className='text-gray-400 text-sm'>
                Alert me when my balance goes below the threshold.
              </p>
            </div>
            <SwitchPrimitive.Root
              checked={lowGasAlertEnabled}
              onCheckedChange={handleLowGasAlertToggle}
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

          {lowGasAlertEnabled && (
            <>
              <div className='mt-4 mb-4'>
                <label className='block text-sm mb-1'>
                  Low gas threshold (ETH)
                </label>
                <Input
                  type='number'
                  placeholder='e.g. 0.1'
                  value={lowGasThreshold}
                  onChange={handleLowGasThresholdChange}
                  className='bg-[#1A1919] text-white border border-gray-700 rounded-md p-2 w-full'
                />
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div className='flex items-center space-x-2'>
                  <Checkbox
                    id='lowGasEmail'
                    checked={lowGasEmailEnabled}
                    onCheckedChange={handleCheckedChange(setLowGasEmailEnabled)}
                    className='data-[state=checked]:bg-[#335CD7]'
                  />
                  <label
                    htmlFor='lowGasEmail'
                    className='text-sm cursor-pointer'
                  >
                    Email
                  </label>
                </div>
                <div className='flex items-center space-x-2'>
                  <Checkbox
                    id='lowGasTelegram'
                    checked={lowGasTelegramEnabled}
                    onCheckedChange={handleCheckedChange(
                      setLowGasTelegramEnabled
                    )}
                    className='data-[state=checked]:bg-[#335CD7]'
                  />
                  <label
                    htmlFor='lowGasTelegram'
                    className='text-sm cursor-pointer'
                  >
                    Telegram
                  </label>
                </div>
                <div className='flex items-center space-x-2'>
                  <Checkbox
                    id='lowGasSlack'
                    checked={lowGasSlackEnabled}
                    onCheckedChange={handleCheckedChange(setLowGasSlackEnabled)}
                    className='data-[state=checked]:bg-[#335CD7]'
                  />
                  <label
                    htmlFor='lowGasSlack'
                    className='text-sm cursor-pointer'
                  >
                    Slack
                  </label>
                </div>
                <div className='flex items-center space-x-2'>
                  <Checkbox
                    id='lowGasWebhook'
                    checked={lowGasWebhookEnabled}
                    onCheckedChange={handleCheckedChange(
                      setLowGasWebhookEnabled
                    )}
                    className='data-[state=checked]:bg-[#335CD7]'
                  />
                  <label
                    htmlFor='lowGasWebhook'
                    className='text-sm cursor-pointer'
                  >
                    Webhook
                  </label>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Bid Safety Alerts */}
        <div className='mb-8 rounded-lg bg-black p-6'>
          <div className='flex items-center justify-between mb-2'>
            <div>
              <h3 className='text-lg font-medium'>Bid Safety</h3>
              <p className='text-gray-400 text-sm'>
                Alert me when the minimum bid nears contract bid.
              </p>
            </div>
            <SwitchPrimitive.Root
              checked={bidSafetyAlertEnabled}
              onCheckedChange={handleBidSafetyAlertToggle}
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

          {bidSafetyAlertEnabled && (
            <>
              <div className='mt-4 mb-8'>
                <div className='flex flex-col gap-3'>
                  <Slider
                    value={[bidSafetyThreshold]}
                    max={100}
                    step={1}
                    onValueChange={(values) => setBidSafetyThreshold(values[0])}
                    className={cn(
                      'w-full',
                      '[&>span]:bg-black', // Black track
                      '[&>span>span]:bg-white', // White fill
                      '[&_[data-slot=slider-thumb]]:bg-white' // White thumb
                    )}
                  />
                  <div className='flex justify-between text-xs text-gray-400 mt-1 px-1'>
                    <span>0%</span>
                    <span className='text-center text-white font-medium'>
                      {bidSafetyThreshold}%
                    </span>
                    <span>100%</span>
                  </div>
                  <div className='text-xs text-center mt-3 text-gray-400 border-t border-gray-800 pt-3'>
                    MinBid-to-EffectiveBid distance:{' '}
                    {bidSafetyThreshold < 30
                      ? 'Close'
                      : bidSafetyThreshold < 70
                      ? 'Medium'
                      : 'Far'}
                  </div>
                </div>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div className='flex items-center space-x-2'>
                  <Checkbox
                    id='bidSafetyEmail'
                    checked={bidSafetyEmailEnabled}
                    onCheckedChange={handleCheckedChange(
                      setBidSafetyEmailEnabled
                    )}
                    className='data-[state=checked]:bg-[#335CD7]'
                  />
                  <label
                    htmlFor='bidSafetyEmail'
                    className='text-sm cursor-pointer'
                  >
                    Email
                  </label>
                </div>
                <div className='flex items-center space-x-2'>
                  <Checkbox
                    id='bidSafetyTelegram'
                    checked={bidSafetyTelegramEnabled}
                    onCheckedChange={handleCheckedChange(
                      setBidSafetyTelegramEnabled
                    )}
                    className='data-[state=checked]:bg-[#335CD7]'
                  />
                  <label
                    htmlFor='bidSafetyTelegram'
                    className='text-sm cursor-pointer'
                  >
                    Telegram
                  </label>
                </div>
                <div className='flex items-center space-x-2'>
                  <Checkbox
                    id='bidSafetySlack'
                    checked={bidSafetySlackEnabled}
                    onCheckedChange={handleCheckedChange(
                      setBidSafetySlackEnabled
                    )}
                    className='data-[state=checked]:bg-[#335CD7]'
                  />
                  <label
                    htmlFor='bidSafetySlack'
                    className='text-sm cursor-pointer'
                  >
                    Slack
                  </label>
                </div>
                <div className='flex items-center space-x-2'>
                  <Checkbox
                    id='bidSafetyWebhook'
                    checked={bidSafetyWebhookEnabled}
                    onCheckedChange={handleCheckedChange(
                      setBidSafetyWebhookEnabled
                    )}
                    className='data-[state=checked]:bg-[#335CD7]'
                  />
                  <label
                    htmlFor='bidSafetyWebhook'
                    className='text-sm cursor-pointer'
                  >
                    Webhook
                  </label>
                </div>
              </div>
            </>
          )}
        </div>

        {error && <p className='text-red-500 text-sm mb-4'>{error}</p>}

        <div className='mt-6 mb-4'>
          <Button
            className='w-full px-4 py-2 bg-black text-white font-medium hover:bg-gray-900 rounded-md'
            onClick={handleSaveAlertSettings}
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save Alert Settings'}
          </Button>
        </div>
      </div>
    </div>
  );
}
