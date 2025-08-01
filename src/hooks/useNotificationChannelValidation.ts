import { useState, useEffect, useCallback } from 'react';
import { useAlertService } from './useAlertService';
import { useAlertSettings } from '@/context/AlertSettingsProvider';
import {
  ValidationResult,
  validateNotificationChannels,
  hasValidNotificationChannels,
} from '@/utils/notificationValidation';
import { UserAlertPreferences } from '@/services/alertService';

/**
 * Hook state interface
 */
interface NotificationChannelValidationState {
  isValidating: boolean;
  validationResult: ValidationResult | null;
  preferences: UserAlertPreferences | null;
  error: string | null;
  hasValidChannels: boolean;
}

/**
 * Hook return interface
 */
interface UseNotificationChannelValidationReturn
  extends NotificationChannelValidationState {
  revalidate: () => Promise<void>;
  refreshPreferences: () => Promise<void>;
}

/**
 * Custom hook for validating notification channel configuration
 *
 * This hook automatically loads user alert preferences and validates
 * whether the user has at least one properly configured notification channel.
 * It also listens for updates from the AlertSettingsProvider context.
 *
 * @param autoValidate Whether to automatically validate on mount (default: true)
 * @returns Validation state and control functions
 */
export function useNotificationChannelValidation(
  autoValidate: boolean = true
): UseNotificationChannelValidationReturn {
  const alertService = useAlertService();
  const { notificationChannelsUpdatedAt } = useAlertSettings();

  const [state, setState] = useState<NotificationChannelValidationState>({
    isValidating: false,
    validationResult: null,
    preferences: null,
    error: null,
    hasValidChannels: false,
  });

  /**
   * Load user preferences and validate notification channels
   */
  const validateChannels = useCallback(async () => {
    if (!alertService) {
      setState((prev) => ({
        ...prev,
        error: 'Alert service not initialized',
        isValidating: false,
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      isValidating: true,
      error: null,
    }));

    try {
      // Fetch user alert preferences
      const preferences = await alertService.getUserAlertPreferences();

      // Validate the preferences
      const validationResult = validateNotificationChannels(preferences);
      const hasValidChannels = hasValidNotificationChannels(preferences);

      setState((prev) => ({
        ...prev,
        preferences,
        validationResult,
        hasValidChannels,
        isValidating: false,
        error: null,
      }));
    } catch (error) {
      console.error('Failed to validate notification channels:', error);

      setState((prev) => ({
        ...prev,
        isValidating: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to load notification preferences',
      }));
    }
  }, [alertService]);

  /**
   * Re-run validation (alias for validateChannels for external use)
   */
  const revalidate = useCallback(async () => {
    await validateChannels();
  }, [validateChannels]);

  /**
   * Refresh preferences and re-validate (alias for external clarity)
   */
  const refreshPreferences = useCallback(async () => {
    await validateChannels();
  }, [validateChannels]);

  // Auto-validate on mount if enabled
  useEffect(() => {
    if (autoValidate) {
      validateChannels();
    }
  }, [autoValidate, validateChannels]);

  // Re-validate when alert service changes
  useEffect(() => {
    if (alertService && autoValidate) {
      validateChannels();
    }
  }, [alertService, autoValidate, validateChannels]);

  // Re-validate when notification channels are updated
  useEffect(() => {
    if (notificationChannelsUpdatedAt > 0 && autoValidate) {
      // Add a small delay to ensure the backend has processed the update
      const timer = setTimeout(() => {
        validateChannels();
      }, 100); // Reduced from 500ms to 100ms

      return () => clearTimeout(timer);
    }
  }, [notificationChannelsUpdatedAt, autoValidate, validateChannels]);

  return {
    ...state,
    revalidate,
    refreshPreferences,
  };
}

/**
 * Simple hook that only checks if user has valid notification channels
 * without loading detailed validation results
 *
 * @returns Object with hasValidChannels boolean and loading state
 */
export function useHasValidNotificationChannels(): {
  hasValidChannels: boolean;
  isLoading: boolean;
  error: string | null;
} {
  const { hasValidChannels, isValidating, error } =
    useNotificationChannelValidation(true);

  return {
    hasValidChannels,
    isLoading: isValidating,
    error,
  };
}
