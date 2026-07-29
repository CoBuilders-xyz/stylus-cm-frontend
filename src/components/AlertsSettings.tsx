'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useSidePanel } from './SidePanel';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Alert, AlertSettings } from '@/services/alertService';
import { AlertType, NOTIFICATION_CHANNELS } from '@/types/alerts';
import { useAlertService } from '@/hooks/useAlertService';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckedState } from '@radix-ui/react-checkbox';
import { useNotificationChannelValidation } from '@/hooks/useNotificationChannelValidation';
import NotificationChannelWarning from '@/components/NotificationChannelWarning';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAlertSettings } from '@/context/AlertSettingsProvider';

interface AlertsSettingsProps {
  onSuccess?: () => void;
  contractId: string;
  contractAddress: string;
  initialAlerts?: Alert[];
}

// Type alias for alert type values used in component logic
type AlertTypeValue = `${AlertType}`;

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
  const { openAlertSettings } = useAlertSettings();

  // Notification channel validation
  const {
    hasValidChannels,
    isValidating,
    validationResult,
    error: validationError,
    revalidate,
  } = useNotificationChannelValidation();

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
  const [evictionTelegramEnabled, setEvictionTelegramEnabled] = useState(false);
  const [evictionSlackEnabled, setEvictionSlackEnabled] = useState(false);
  const [evictionWebhookEnabled, setEvictionWebhookEnabled] = useState(false);

  const [noGasTelegramEnabled, setNoGasTelegramEnabled] = useState(false);
  const [noGasSlackEnabled, setNoGasSlackEnabled] = useState(false);
  const [noGasWebhookEnabled, setNoGasWebhookEnabled] = useState(false);

  const [lowGasTelegramEnabled, setLowGasTelegramEnabled] = useState(false);
  const [lowGasSlackEnabled, setLowGasSlackEnabled] = useState(false);
  const [lowGasWebhookEnabled, setLowGasWebhookEnabled] = useState(false);

  const [bidSafetyTelegramEnabled, setBidSafetyTelegramEnabled] =
    useState(false);
  const [bidSafetySlackEnabled, setBidSafetySlackEnabled] = useState(false);
  const [bidSafetyWebhookEnabled, setBidSafetyWebhookEnabled] = useState(false);

  // Approaching Expiration alert (days threshold)
  const [
    approachingExpirationAlertEnabled,
    setApproachingExpirationAlertEnabled,
  ] = useState(false);
  const [approachingExpirationThreshold, setApproachingExpirationThreshold] =
    useState<number | string>('');
  const [
    approachingExpirationTelegramEnabled,
    setApproachingExpirationTelegramEnabled,
  ] = useState(false);
  const [
    approachingExpirationSlackEnabled,
    setApproachingExpirationSlackEnabled,
  ] = useState(false);
  const [
    approachingExpirationWebhookEnabled,
    setApproachingExpirationWebhookEnabled,
  ] = useState(false);

  // Expired alert
  const [expiredAlertEnabled, setExpiredAlertEnabled] = useState(false);
  const [expiredTelegramEnabled, setExpiredTelegramEnabled] = useState(false);
  const [expiredSlackEnabled, setExpiredSlackEnabled] = useState(false);
  const [expiredWebhookEnabled, setExpiredWebhookEnabled] = useState(false);

  // Reactivation Succeeded alert
  const [reactivationSucceededAlertEnabled, setReactivationSucceededAlertEnabled] =
    useState(false);
  const [
    reactivationSucceededTelegramEnabled,
    setReactivationSucceededTelegramEnabled,
  ] = useState(false);
  const [
    reactivationSucceededSlackEnabled,
    setReactivationSucceededSlackEnabled,
  ] = useState(false);
  const [
    reactivationSucceededWebhookEnabled,
    setReactivationSucceededWebhookEnabled,
  ] = useState(false);

  // Reactivation Failed alert
  const [reactivationFailedAlertEnabled, setReactivationFailedAlertEnabled] =
    useState(false);
  const [reactivationFailedTelegramEnabled, setReactivationFailedTelegramEnabled] =
    useState(false);
  const [reactivationFailedSlackEnabled, setReactivationFailedSlackEnabled] =
    useState(false);
  const [reactivationFailedWebhookEnabled, setReactivationFailedWebhookEnabled] =
    useState(false);

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
      const approachingExpirationAlert = initialAlerts.find(
        (alert) => alert.type === AlertType.APPROACHING_EXPIRATION
      );
      const expiredAlert = initialAlerts.find(
        (alert) => alert.type === AlertType.EXPIRED
      );
      const reactivationSucceededAlert = initialAlerts.find(
        (alert) => alert.type === AlertType.REACTIVATION_SUCCEEDED
      );
      const reactivationFailedAlert = initialAlerts.find(
        (alert) => alert.type === AlertType.REACTIVATION_FAILED
      );

      if (evictionAlert) {
        setEvictionAlertEnabled(evictionAlert.isActive);
        setEvictionTelegramEnabled(evictionAlert.telegramChannelEnabled);
        setEvictionSlackEnabled(evictionAlert.slackChannelEnabled);
        setEvictionWebhookEnabled(evictionAlert.webhookChannelEnabled);
      }

      if (noGasAlert) {
        setNoGasAlertEnabled(noGasAlert.isActive);
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
        setBidSafetyTelegramEnabled(bidSafetyAlert.telegramChannelEnabled);
        setBidSafetySlackEnabled(bidSafetyAlert.slackChannelEnabled);
        setBidSafetyWebhookEnabled(bidSafetyAlert.webhookChannelEnabled);
      }

      if (approachingExpirationAlert) {
        setApproachingExpirationAlertEnabled(
          approachingExpirationAlert.isActive
        );
        // Parse value as an integer number of days (1-365)
        if (approachingExpirationAlert.value) {
          const numericValue = parseInt(approachingExpirationAlert.value, 10);
          if (
            !isNaN(numericValue) &&
            numericValue >= 1 &&
            numericValue <= 365
          ) {
            setApproachingExpirationThreshold(numericValue);
          } else {
            setApproachingExpirationThreshold(''); // Invalid value, reset
          }
        } else {
          setApproachingExpirationThreshold(''); // No value, reset
        }
        setApproachingExpirationTelegramEnabled(
          approachingExpirationAlert.telegramChannelEnabled
        );
        setApproachingExpirationSlackEnabled(
          approachingExpirationAlert.slackChannelEnabled
        );
        setApproachingExpirationWebhookEnabled(
          approachingExpirationAlert.webhookChannelEnabled
        );
      }

      if (expiredAlert) {
        setExpiredAlertEnabled(expiredAlert.isActive);
        setExpiredTelegramEnabled(expiredAlert.telegramChannelEnabled);
        setExpiredSlackEnabled(expiredAlert.slackChannelEnabled);
        setExpiredWebhookEnabled(expiredAlert.webhookChannelEnabled);
      }

      if (reactivationSucceededAlert) {
        setReactivationSucceededAlertEnabled(reactivationSucceededAlert.isActive);
        setReactivationSucceededTelegramEnabled(
          reactivationSucceededAlert.telegramChannelEnabled
        );
        setReactivationSucceededSlackEnabled(
          reactivationSucceededAlert.slackChannelEnabled
        );
        setReactivationSucceededWebhookEnabled(
          reactivationSucceededAlert.webhookChannelEnabled
        );
      }

      if (reactivationFailedAlert) {
        setReactivationFailedAlertEnabled(reactivationFailedAlert.isActive);
        setReactivationFailedTelegramEnabled(
          reactivationFailedAlert.telegramChannelEnabled
        );
        setReactivationFailedSlackEnabled(
          reactivationFailedAlert.slackChannelEnabled
        );
        setReactivationFailedWebhookEnabled(
          reactivationFailedAlert.webhookChannelEnabled
        );
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

  // Handler for approachingExpirationThreshold input (integer 1-365)
  const handleApproachingExpirationThresholdChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.value === '') {
      setApproachingExpirationThreshold('');
      return;
    }

    // Only accept integer digits — reject decimals / scientific notation
    if (!/^\d+$/.test(e.target.value)) {
      setApproachingExpirationThreshold(e.target.value);
      return;
    }

    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 1 && value <= 365) {
      setApproachingExpirationThreshold(value);
    } else {
      setApproachingExpirationThreshold(e.target.value);
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

    // Validate approachingExpirationThreshold: integer 1-365
    let approachingExpirationValueNumeric: number | undefined;
    if (approachingExpirationAlertEnabled) {
      if (approachingExpirationThreshold === '') {
        setError('Approaching Expiration threshold is required');
        return;
      }

      // Reject decimals / non-digits at the raw-string level. parseInt('12.2')
      // would silently truncate to 12 and pass Number.isInteger, letting the
      // backend do the rejection with a generic toast.
      const rawThreshold =
        typeof approachingExpirationThreshold === 'string'
          ? approachingExpirationThreshold
          : String(approachingExpirationThreshold);

      if (!/^\d+$/.test(rawThreshold)) {
        setError(
          'Approaching Expiration threshold must be a whole number between 1 and 365 (no decimals)'
        );
        return;
      }

      approachingExpirationValueNumeric = parseInt(rawThreshold, 10);
      if (
        isNaN(approachingExpirationValueNumeric) ||
        approachingExpirationValueNumeric < 1 ||
        approachingExpirationValueNumeric > 365
      ) {
        setError(
          'Approaching Expiration threshold must be a whole number between 1 and 365'
        );
        return;
      }
    }

    // Enabled alerts must have at least one notification channel selected.
    // Backend rejects with a generic error otherwise — catch it here so the
    // user gets an actionable message instead of "please try again".
    const enabledAlertsWithoutChannels: string[] = [];
    const hasAnyChannel = (t: boolean, s: boolean, w: boolean) => t || s || w;
    if (
      evictionAlertEnabled &&
      !hasAnyChannel(
        evictionTelegramEnabled,
        evictionSlackEnabled,
        evictionWebhookEnabled
      )
    ) {
      enabledAlertsWithoutChannels.push('Eviction');
    }
    if (
      noGasAlertEnabled &&
      !hasAnyChannel(
        noGasTelegramEnabled,
        noGasSlackEnabled,
        noGasWebhookEnabled
      )
    ) {
      enabledAlertsWithoutChannels.push('No Gas');
    }
    if (
      lowGasAlertEnabled &&
      !hasAnyChannel(
        lowGasTelegramEnabled,
        lowGasSlackEnabled,
        lowGasWebhookEnabled
      )
    ) {
      enabledAlertsWithoutChannels.push('Low Gas');
    }
    if (
      bidSafetyAlertEnabled &&
      !hasAnyChannel(
        bidSafetyTelegramEnabled,
        bidSafetySlackEnabled,
        bidSafetyWebhookEnabled
      )
    ) {
      enabledAlertsWithoutChannels.push('Bid Safety');
    }
    if (
      approachingExpirationAlertEnabled &&
      !hasAnyChannel(
        approachingExpirationTelegramEnabled,
        approachingExpirationSlackEnabled,
        approachingExpirationWebhookEnabled
      )
    ) {
      enabledAlertsWithoutChannels.push('Approaching Expiration');
    }
    if (
      expiredAlertEnabled &&
      !hasAnyChannel(
        expiredTelegramEnabled,
        expiredSlackEnabled,
        expiredWebhookEnabled
      )
    ) {
      enabledAlertsWithoutChannels.push('Expired');
    }
    if (
      reactivationSucceededAlertEnabled &&
      !hasAnyChannel(
        reactivationSucceededTelegramEnabled,
        reactivationSucceededSlackEnabled,
        reactivationSucceededWebhookEnabled
      )
    ) {
      enabledAlertsWithoutChannels.push('Reactivation Succeeded');
    }
    if (
      reactivationFailedAlertEnabled &&
      !hasAnyChannel(
        reactivationFailedTelegramEnabled,
        reactivationFailedSlackEnabled,
        reactivationFailedWebhookEnabled
      )
    ) {
      enabledAlertsWithoutChannels.push('Reactivation Failed');
    }
    if (enabledAlertsWithoutChannels.length > 0) {
      setError(
        `Select at least one notification channel for: ${enabledAlertsWithoutChannels.join(
          ', '
        )}`
      );
      return;
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
          slackChannelEnabled: evictionSlackEnabled,
          telegramChannelEnabled: evictionTelegramEnabled,
          webhookChannelEnabled: evictionWebhookEnabled,
        },
        // No Gas alert
        {
          type: AlertType.NO_GAS,
          isActive: noGasAlertEnabled,
          userContractId: contractId,
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
          slackChannelEnabled: bidSafetySlackEnabled,
          telegramChannelEnabled: bidSafetyTelegramEnabled,
          webhookChannelEnabled: bidSafetyWebhookEnabled,
        },
        // Approaching Expiration alert - value = integer days (1-365)
        {
          type: AlertType.APPROACHING_EXPIRATION,
          value: approachingExpirationValueNumeric,
          isActive: approachingExpirationAlertEnabled,
          userContractId: contractId,
          slackChannelEnabled: approachingExpirationSlackEnabled,
          telegramChannelEnabled: approachingExpirationTelegramEnabled,
          webhookChannelEnabled: approachingExpirationWebhookEnabled,
        },
        // Expired alert - no value
        {
          type: AlertType.EXPIRED,
          isActive: expiredAlertEnabled,
          userContractId: contractId,
          slackChannelEnabled: expiredSlackEnabled,
          telegramChannelEnabled: expiredTelegramEnabled,
          webhookChannelEnabled: expiredWebhookEnabled,
        },
        // Reactivation Succeeded alert - no value
        {
          type: AlertType.REACTIVATION_SUCCEEDED,
          isActive: reactivationSucceededAlertEnabled,
          userContractId: contractId,
          slackChannelEnabled: reactivationSucceededSlackEnabled,
          telegramChannelEnabled: reactivationSucceededTelegramEnabled,
          webhookChannelEnabled: reactivationSucceededWebhookEnabled,
        },
        // Reactivation Failed alert - no value
        {
          type: AlertType.REACTIVATION_FAILED,
          isActive: reactivationFailedAlertEnabled,
          userContractId: contractId,
          slackChannelEnabled: reactivationFailedSlackEnabled,
          telegramChannelEnabled: reactivationFailedTelegramEnabled,
          webhookChannelEnabled: reactivationFailedWebhookEnabled,
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
      setEvictionTelegramEnabled(true);
      setEvictionSlackEnabled(true);
      setEvictionWebhookEnabled(true);
    }
  };

  const handleNoGasAlertToggle = (checked: boolean) => {
    setNoGasAlertEnabled(checked);
    if (checked) {
      // Enable all channels by default when alert is enabled
      setNoGasTelegramEnabled(true);
      setNoGasSlackEnabled(true);
      setNoGasWebhookEnabled(true);
    }
  };

  const handleLowGasAlertToggle = (checked: boolean) => {
    setLowGasAlertEnabled(checked);
    if (checked) {
      // Enable all channels by default when alert is enabled
      setLowGasTelegramEnabled(true);
      setLowGasSlackEnabled(true);
      setLowGasWebhookEnabled(true);
    }
  };

  const handleBidSafetyAlertToggle = (checked: boolean) => {
    setBidSafetyAlertEnabled(checked);
    if (checked) {
      // Enable all channels by default when alert is enabled
      setBidSafetyTelegramEnabled(true);
      setBidSafetySlackEnabled(true);
      setBidSafetyWebhookEnabled(true);
    }
  };

  const handleApproachingExpirationAlertToggle = (checked: boolean) => {
    setApproachingExpirationAlertEnabled(checked);
    if (checked) {
      setApproachingExpirationTelegramEnabled(true);
      setApproachingExpirationSlackEnabled(true);
      setApproachingExpirationWebhookEnabled(true);
    }
  };

  const handleExpiredAlertToggle = (checked: boolean) => {
    setExpiredAlertEnabled(checked);
    if (checked) {
      setExpiredTelegramEnabled(true);
      setExpiredSlackEnabled(true);
      setExpiredWebhookEnabled(true);
    }
  };

  const handleReactivationSucceededAlertToggle = (checked: boolean) => {
    setReactivationSucceededAlertEnabled(checked);
    if (checked) {
      setReactivationSucceededTelegramEnabled(true);
      setReactivationSucceededSlackEnabled(true);
      setReactivationSucceededWebhookEnabled(true);
    }
  };

  const handleReactivationFailedAlertToggle = (checked: boolean) => {
    setReactivationFailedAlertEnabled(checked);
    if (checked) {
      setReactivationFailedTelegramEnabled(true);
      setReactivationFailedSlackEnabled(true);
      setReactivationFailedWebhookEnabled(true);
    }
  };

  // Helper function to determine which notification channels are available
  const getAvailableChannels = () => {
    if (!validationResult) return [];
    return validationResult.configuredChannels;
  };

  // Helper function to render channel checkboxes based on available channels
  const renderChannelCheckboxes = (alertType: AlertTypeValue) => {
    const availableChannels = getAvailableChannels();
    const allChannels = NOTIFICATION_CHANNELS;

    const channelConfig = {
      telegram: {
        id: `${alertType}Telegram`,
        label: 'Telegram',
        checked:
          alertType === AlertType.EVICTION
            ? evictionTelegramEnabled
            : alertType === AlertType.NO_GAS
            ? noGasTelegramEnabled
            : alertType === AlertType.LOW_GAS
            ? lowGasTelegramEnabled
            : alertType === AlertType.BID_SAFETY
            ? bidSafetyTelegramEnabled
            : alertType === AlertType.APPROACHING_EXPIRATION
            ? approachingExpirationTelegramEnabled
            : alertType === AlertType.EXPIRED
            ? expiredTelegramEnabled
            : alertType === AlertType.REACTIVATION_SUCCEEDED
            ? reactivationSucceededTelegramEnabled
            : reactivationFailedTelegramEnabled,
        onChange:
          alertType === AlertType.EVICTION
            ? setEvictionTelegramEnabled
            : alertType === AlertType.NO_GAS
            ? setNoGasTelegramEnabled
            : alertType === AlertType.LOW_GAS
            ? setLowGasTelegramEnabled
            : alertType === AlertType.BID_SAFETY
            ? setBidSafetyTelegramEnabled
            : alertType === AlertType.APPROACHING_EXPIRATION
            ? setApproachingExpirationTelegramEnabled
            : alertType === AlertType.EXPIRED
            ? setExpiredTelegramEnabled
            : alertType === AlertType.REACTIVATION_SUCCEEDED
            ? setReactivationSucceededTelegramEnabled
            : setReactivationFailedTelegramEnabled,
      },
      slack: {
        id: `${alertType}Slack`,
        label: 'Slack',
        checked:
          alertType === AlertType.EVICTION
            ? evictionSlackEnabled
            : alertType === AlertType.NO_GAS
            ? noGasSlackEnabled
            : alertType === AlertType.LOW_GAS
            ? lowGasSlackEnabled
            : alertType === AlertType.BID_SAFETY
            ? bidSafetySlackEnabled
            : alertType === AlertType.APPROACHING_EXPIRATION
            ? approachingExpirationSlackEnabled
            : alertType === AlertType.EXPIRED
            ? expiredSlackEnabled
            : alertType === AlertType.REACTIVATION_SUCCEEDED
            ? reactivationSucceededSlackEnabled
            : reactivationFailedSlackEnabled,
        onChange:
          alertType === AlertType.EVICTION
            ? setEvictionSlackEnabled
            : alertType === AlertType.NO_GAS
            ? setNoGasSlackEnabled
            : alertType === AlertType.LOW_GAS
            ? setLowGasSlackEnabled
            : alertType === AlertType.BID_SAFETY
            ? setBidSafetySlackEnabled
            : alertType === AlertType.APPROACHING_EXPIRATION
            ? setApproachingExpirationSlackEnabled
            : alertType === AlertType.EXPIRED
            ? setExpiredSlackEnabled
            : alertType === AlertType.REACTIVATION_SUCCEEDED
            ? setReactivationSucceededSlackEnabled
            : setReactivationFailedSlackEnabled,
      },
      webhook: {
        id: `${alertType}Webhook`,
        label: 'Webhook',
        checked:
          alertType === AlertType.EVICTION
            ? evictionWebhookEnabled
            : alertType === AlertType.NO_GAS
            ? noGasWebhookEnabled
            : alertType === AlertType.LOW_GAS
            ? lowGasWebhookEnabled
            : alertType === AlertType.BID_SAFETY
            ? bidSafetyWebhookEnabled
            : alertType === AlertType.APPROACHING_EXPIRATION
            ? approachingExpirationWebhookEnabled
            : alertType === AlertType.EXPIRED
            ? expiredWebhookEnabled
            : alertType === AlertType.REACTIVATION_SUCCEEDED
            ? reactivationSucceededWebhookEnabled
            : reactivationFailedWebhookEnabled,
        onChange:
          alertType === AlertType.EVICTION
            ? setEvictionWebhookEnabled
            : alertType === AlertType.NO_GAS
            ? setNoGasWebhookEnabled
            : alertType === AlertType.LOW_GAS
            ? setLowGasWebhookEnabled
            : alertType === AlertType.BID_SAFETY
            ? setBidSafetyWebhookEnabled
            : alertType === AlertType.APPROACHING_EXPIRATION
            ? setApproachingExpirationWebhookEnabled
            : alertType === AlertType.EXPIRED
            ? setExpiredWebhookEnabled
            : alertType === AlertType.REACTIVATION_SUCCEEDED
            ? setReactivationSucceededWebhookEnabled
            : setReactivationFailedWebhookEnabled,
      },
    };

    return (
      <div className='grid grid-cols-2 gap-4'>
        {allChannels.map((channel) => {
          const config = channelConfig[channel];
          if (!config) return null;

          const isConfigured = availableChannels.includes(channel);

          // If channel is not configured, show disabled checkbox with tooltip
          if (!isConfigured) {
            return (
              <div
                key={channel}
                className='flex items-center space-x-2 opacity-40'
              >
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Checkbox
                        id={config.id}
                        checked={false}
                        disabled={true}
                        className='data-[state=checked]:bg-gray-500 border-gray-500 cursor-not-allowed'
                      />
                    </TooltipTrigger>
                    <TooltipContent side='top' className='max-w-xs p-2'>
                      <div className='space-y-1'>
                        <p className='text-xs font-medium'>
                          {config.label} not configured
                        </p>
                        <Button
                          size='sm'
                          onClick={(e) => {
                            e.stopPropagation();
                            openAlertSettings();
                          }}
                          className='w-full text-xs h-6 bg-blue-600 hover:bg-blue-700'
                        >
                          Configure
                        </Button>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <label
                  htmlFor={config.id}
                  className='text-sm text-gray-500 cursor-not-allowed'
                >
                  {config.label}
                </label>
              </div>
            );
          }

          // Channel is configured, show normal functional checkbox
          return (
            <div key={channel} className='flex items-center space-x-2'>
              <Checkbox
                id={config.id}
                checked={config.checked}
                onCheckedChange={handleCheckedChange(config.onChange)}
                className='data-[state=checked]:bg-[#335CD7]'
              />
              <label htmlFor={config.id} className='text-sm cursor-pointer'>
                {config.label}
              </label>
            </div>
          );
        })}
      </div>
    );
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
        {/* Notification Channel Validation Warning */}
        {isValidating && !validationResult && (
          <div className='mb-6 p-4 bg-gray-800/50 border border-gray-700 rounded-lg'>
            <div className='flex items-center gap-2 text-gray-400'>
              <div className='animate-spin w-4 h-4 border-2 border-gray-600 border-t-white rounded-full' />
              <span className='text-sm'>Checking notification channels...</span>
            </div>
          </div>
        )}

        {validationError && (
          <div className='mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg'>
            <p className='text-red-400 text-sm'>
              Failed to check notification channels: {validationError}
            </p>
            <Button
              onClick={revalidate}
              size='sm'
              className='mt-2 bg-red-500/20 text-red-400 hover:bg-red-500/30'
            >
              Retry
            </Button>
          </div>
        )}

        {validationResult && !hasValidChannels && (
          <div className='mb-6'>
            <NotificationChannelWarning
              validationResult={validationResult}
              title='Configure Notification Channels First'
              message='You need to set up at least one notification channel before configuring alerts for this contract.'
            />
          </div>
        )}

        {validationResult &&
          hasValidChannels &&
          validationResult.enabledButInvalidChannels.length > 0 && (
            <div className='mb-6'>
              <NotificationChannelWarning
                validationResult={validationResult}
                title='Some channels need attention'
                message='Some of your notification channels are enabled but missing destinations.'
              />
            </div>
          )}

        {/* Alert Configuration Sections - Show immediately but with proper channel filtering */}
        <div
          className={cn(
            'space-y-8',
            !hasValidChannels &&
              !isValidating &&
              validationResult &&
              'opacity-50 pointer-events-none'
          )}
        >
          {/* Eviction Alerts */}
          <div className='rounded-lg bg-black p-6'>
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
              <div className='mt-4'>
                {renderChannelCheckboxes(AlertType.EVICTION)}
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
              <div className='mt-4'>
                {renderChannelCheckboxes(AlertType.NO_GAS)}
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

                {renderChannelCheckboxes(AlertType.LOW_GAS)}
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
                      onValueChange={(values) =>
                        setBidSafetyThreshold(values[0])
                      }
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

                {renderChannelCheckboxes(AlertType.BID_SAFETY)}
              </>
            )}
          </div>

          {/* Divider between cache/bid alerts and activation alerts */}
          <div
            className='border-t border-gray-800 pt-4'
            role='separator'
            aria-label='Activation alerts'
          >
            <h4 className='text-xs uppercase tracking-wider text-gray-500 mb-2'>
              Activation alerts
            </h4>
          </div>

          {/* Approaching Expiration Alerts */}
          <div className='mb-8 rounded-lg bg-black p-6'>
            <div className='flex items-center justify-between mb-2'>
              <div>
                <h3 className='text-lg font-medium'>Approaching Expiration</h3>
                <p className='text-gray-400 text-sm'>
                  Alert me N days before my contract&apos;s activation expires.
                </p>
              </div>
              <SwitchPrimitive.Root
                checked={approachingExpirationAlertEnabled}
                onCheckedChange={handleApproachingExpirationAlertToggle}
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

            {approachingExpirationAlertEnabled && (
              <>
                <div className='mt-4 mb-4'>
                  <label className='block text-sm mb-1'>
                    Days before expiration (1–365)
                  </label>
                  <Input
                    type='number'
                    inputMode='numeric'
                    min={1}
                    max={365}
                    step={1}
                    placeholder='e.g. 30'
                    value={approachingExpirationThreshold}
                    onChange={handleApproachingExpirationThresholdChange}
                    className='bg-[#1A1919] text-white border border-gray-700 rounded-md p-2 w-full'
                  />
                </div>

                {renderChannelCheckboxes(AlertType.APPROACHING_EXPIRATION)}
              </>
            )}
          </div>

          {/* Expired Alerts */}
          <div className='mb-8 rounded-lg bg-black p-6'>
            <div className='flex items-center justify-between mb-2'>
              <div>
                <h3 className='text-lg font-medium'>Expired</h3>
                <p className='text-gray-400 text-sm'>
                  Alert me when my contract&apos;s activation has expired.
                </p>
              </div>
              <SwitchPrimitive.Root
                checked={expiredAlertEnabled}
                onCheckedChange={handleExpiredAlertToggle}
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

            {expiredAlertEnabled && (
              <div className='mt-4'>
                {renderChannelCheckboxes(AlertType.EXPIRED)}
              </div>
            )}
          </div>

          {/* Reactivation Succeeded Alerts */}
          <div className='mb-8 rounded-lg bg-black p-6'>
            <div className='flex items-center justify-between mb-2'>
              <div>
                <h3 className='text-lg font-medium'>Reactivation Succeeded</h3>
                <p className='text-gray-400 text-sm'>
                  Alert me when an automatic reactivation succeeds.
                </p>
              </div>
              <SwitchPrimitive.Root
                checked={reactivationSucceededAlertEnabled}
                onCheckedChange={handleReactivationSucceededAlertToggle}
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

            {reactivationSucceededAlertEnabled && (
              <div className='mt-4'>
                {renderChannelCheckboxes(AlertType.REACTIVATION_SUCCEEDED)}
              </div>
            )}
          </div>

          {/* Reactivation Failed Alerts */}
          <div className='mb-8 rounded-lg bg-black p-6'>
            <div className='flex items-center justify-between mb-2'>
              <div>
                <h3 className='text-lg font-medium'>Reactivation Failed</h3>
                <p className='text-gray-400 text-sm'>
                  Alert me when an automatic reactivation fails.
                </p>
              </div>
              <SwitchPrimitive.Root
                checked={reactivationFailedAlertEnabled}
                onCheckedChange={handleReactivationFailedAlertToggle}
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

            {reactivationFailedAlertEnabled && (
              <div className='mt-4'>
                {renderChannelCheckboxes(AlertType.REACTIVATION_FAILED)}
              </div>
            )}
          </div>

          {/* End of Alert Configuration Sections */}
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
