'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useSidePanel } from './SidePanel';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Alert } from '@/services/contractService';
import { ApiClient } from '@/services/api';

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
  const [apiClient, setApiClient] = useState<ApiClient | null>(null);

  // Alert state
  const [evictionAlertEnabled, setEvictionAlertEnabled] = useState(false);
  const [noGasAlertEnabled, setNoGasAlertEnabled] = useState(false);
  const [lowGasAlertEnabled, setLowGasAlertEnabled] = useState(false);
  const [lowGasThreshold, setLowGasThreshold] = useState('');

  // Communication channels - will be configured elsewhere but maintain for backend API
  const [evictionEmailEnabled, setEvictionEmailEnabled] = useState(false);
  const [evictionTelegramEnabled, setEvictionTelegramEnabled] = useState(false);
  const [evictionSlackEnabled, setEvictionSlackEnabled] = useState(false);

  const [noGasEmailEnabled, setNoGasEmailEnabled] = useState(false);
  const [noGasTelegramEnabled, setNoGasTelegramEnabled] = useState(false);
  const [noGasSlackEnabled, setNoGasSlackEnabled] = useState(false);

  const [lowGasEmailEnabled, setLowGasEmailEnabled] = useState(false);
  const [lowGasTelegramEnabled, setLowGasTelegramEnabled] = useState(false);
  const [lowGasSlackEnabled, setLowGasSlackEnabled] = useState(false);

  // Initialize the API client
  useEffect(() => {
    // Get the token from localStorage
    const token = localStorage.getItem('accessToken');
    if (token) {
      setApiClient(new ApiClient(token));
    }
  }, []);

  // Set initial alert states based on props
  useEffect(() => {
    if (initialAlerts && initialAlerts.length > 0) {
      // Set alert toggles
      const evictionAlert = initialAlerts.find(
        (alert) => alert.type === 'eviction'
      );
      const noGasAlert = initialAlerts.find((alert) => alert.type === 'noGas');
      const lowGasAlert = initialAlerts.find(
        (alert) => alert.type === 'lowGas'
      );

      if (evictionAlert) {
        setEvictionAlertEnabled(evictionAlert.isActive);
        setEvictionEmailEnabled(evictionAlert.emailChannelEnabled);
        setEvictionTelegramEnabled(evictionAlert.telegramChannelEnabled);
        setEvictionSlackEnabled(evictionAlert.slackChannelEnabled);
      }

      if (noGasAlert) {
        setNoGasAlertEnabled(noGasAlert.isActive);
        setNoGasEmailEnabled(noGasAlert.emailChannelEnabled);
        setNoGasTelegramEnabled(noGasAlert.telegramChannelEnabled);
        setNoGasSlackEnabled(noGasAlert.slackChannelEnabled);
      }

      if (lowGasAlert) {
        setLowGasAlertEnabled(lowGasAlert.isActive);
        setLowGasThreshold(lowGasAlert.value || '');
        setLowGasEmailEnabled(lowGasAlert.emailChannelEnabled);
        setLowGasTelegramEnabled(lowGasAlert.telegramChannelEnabled);
        setLowGasSlackEnabled(lowGasAlert.slackChannelEnabled);
      }
    }
  }, [initialAlerts]);

  const handleSaveAlertSettings = async () => {
    if (!apiClient) {
      setError('API client not initialized');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Save eviction alert settings
      await apiClient.post('/alerts', {
        type: 'eviction',
        isActive: evictionAlertEnabled,
        userContractId: contractId,
        emailChannelEnabled: evictionEmailEnabled,
        slackChannelEnabled: evictionSlackEnabled,
        telegramChannelEnabled: evictionTelegramEnabled,
        webhookChannelEnabled: false,
      });

      // Save noGas alert settings
      await apiClient.post('/alerts', {
        type: 'noGas',
        isActive: noGasAlertEnabled,
        userContractId: contractId,
        emailChannelEnabled: noGasEmailEnabled,
        slackChannelEnabled: noGasSlackEnabled,
        telegramChannelEnabled: noGasTelegramEnabled,
        webhookChannelEnabled: false,
      });

      // Save lowGas alert settings
      await apiClient.post('/alerts', {
        type: 'lowGas',
        value: lowGasThreshold,
        isActive: lowGasAlertEnabled,
        userContractId: contractId,
        emailChannelEnabled: lowGasEmailEnabled,
        slackChannelEnabled: lowGasSlackEnabled,
        telegramChannelEnabled: lowGasTelegramEnabled,
        webhookChannelEnabled: false,
      });

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
    }
  };

  const handleNoGasAlertToggle = (checked: boolean) => {
    setNoGasAlertEnabled(checked);
    if (checked) {
      // Enable all channels by default when alert is enabled
      setNoGasEmailEnabled(true);
      setNoGasTelegramEnabled(true);
      setNoGasSlackEnabled(true);
    }
  };

  const handleLowGasAlertToggle = (checked: boolean) => {
    setLowGasAlertEnabled(checked);
    if (checked) {
      // Enable all channels by default when alert is enabled
      setLowGasEmailEnabled(true);
      setLowGasTelegramEnabled(true);
      setLowGasSlackEnabled(true);
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
            <div className='text-white/80 mt-1'>
              Liquidity Pool {contractAddress}
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
        {/* Eviction Alerts */}
        <div className='mb-8 rounded-lg bg-black p-6'>
          <div className='flex items-center justify-between mb-2'>
            <div>
              <h3 className='text-lg font-medium'>Eviction Alerts</h3>
              <p className='text-gray-400 text-sm'>
                Get notified when your contract is evicted from the cache.
              </p>
            </div>
            <div className='relative inline-flex items-center cursor-pointer'>
              <input
                type='checkbox'
                id='evictionToggle'
                className='sr-only'
                checked={evictionAlertEnabled}
                onChange={(e) => handleEvictionAlertToggle(e.target.checked)}
              />
              <div
                className={`w-11 h-6 rounded-full transition-colors ease-in-out duration-200 ${
                  evictionAlertEnabled ? 'bg-blue-600' : 'bg-gray-600'
                }`}
              >
                <div
                  className={`transform transition ease-in-out duration-200 h-5 w-5 rounded-full bg-white shadow-md translate-x-0.5 translate-y-0.5 ${
                    evictionAlertEnabled ? 'translate-x-5' : ''
                  }`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* No Gas Alerts */}
        <div className='mb-8 rounded-lg bg-black p-6'>
          <div className='flex items-center justify-between mb-2'>
            <div>
              <h3 className='text-lg font-medium'>No Gas Alerts</h3>
              <p className='text-gray-400 text-sm'>
                Get notified when your balance can&apos;t cover gas for
                automatic bids.
              </p>
            </div>
            <div className='relative inline-flex items-center cursor-pointer'>
              <input
                type='checkbox'
                id='noGasToggle'
                className='sr-only'
                checked={noGasAlertEnabled}
                onChange={(e) => handleNoGasAlertToggle(e.target.checked)}
              />
              <div
                className={`w-11 h-6 rounded-full transition-colors ease-in-out duration-200 ${
                  noGasAlertEnabled ? 'bg-blue-600' : 'bg-gray-600'
                }`}
              >
                <div
                  className={`transform transition ease-in-out duration-200 h-5 w-5 rounded-full bg-white shadow-md translate-x-0.5 translate-y-0.5 ${
                    noGasAlertEnabled ? 'translate-x-5' : ''
                  }`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Low Gas Alerts */}
        <div className='mb-8 rounded-lg bg-black p-6'>
          <div className='flex items-center justify-between mb-2'>
            <div>
              <h3 className='text-lg font-medium'>Low Gas Alerts</h3>
              <p className='text-gray-400 text-sm'>
                Get notified when your balance drops below the set threshold.
              </p>
            </div>
            <div className='relative inline-flex items-center cursor-pointer'>
              <input
                type='checkbox'
                id='lowGasToggle'
                className='sr-only'
                checked={lowGasAlertEnabled}
                onChange={(e) => handleLowGasAlertToggle(e.target.checked)}
              />
              <div
                className={`w-11 h-6 rounded-full transition-colors ease-in-out duration-200 ${
                  lowGasAlertEnabled ? 'bg-blue-600' : 'bg-gray-600'
                }`}
              >
                <div
                  className={`transform transition ease-in-out duration-200 h-5 w-5 rounded-full bg-white shadow-md translate-x-0.5 translate-y-0.5 ${
                    lowGasAlertEnabled ? 'translate-x-5' : ''
                  }`}
                />
              </div>
            </div>
          </div>

          {lowGasAlertEnabled && (
            <div className='mt-4 mb-4'>
              <label className='block text-sm mb-1'>
                Alert Threshold (ETH)
              </label>
              <Input
                type='number'
                placeholder='e.g. 0.1'
                value={lowGasThreshold}
                onChange={(e) => setLowGasThreshold(e.target.value)}
                className='bg-[#1A1919] text-white border border-gray-700 rounded-md p-2 w-full'
              />
            </div>
          )}
        </div>

        {error && <p className='text-red-500 text-sm mb-4'>{error}</p>}

        <div className='mt-6 mb-4'>
          <Button
            className='w-full px-4 py-2 bg-white text-black font-medium hover:bg-gray-200 rounded-md'
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
