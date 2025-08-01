import {
  UserAlertPreferences,
  NotificationChannel,
} from '@/services/alertService';

/**
 * Validation result interface providing detailed information about notification channel status
 */
export interface ValidationResult {
  isValid: boolean;
  configuredChannels: NotificationChannel[];
  missingChannels: NotificationChannel[];
  enabledButInvalidChannels: NotificationChannel[];
}

/**
 * Check if a specific notification channel is properly configured
 * @param preferences User alert preferences
 * @param channel The channel to validate
 * @returns True if the channel is enabled and has a valid destination
 */
export function isChannelValid(
  preferences: UserAlertPreferences,
  channel: NotificationChannel
): boolean {
  switch (channel) {
    case 'telegram':
      return Boolean(
        preferences.telegramSettings?.enabled &&
          preferences.telegramSettings?.destination?.trim()
      );
    case 'slack':
      return Boolean(
        preferences.slackSettings?.enabled &&
          preferences.slackSettings?.destination?.trim()
      );
    case 'webhook':
      return Boolean(
        preferences.webhookSettings?.enabled &&
          preferences.webhookSettings?.destination?.trim()
      );
    default:
      return false;
  }
}

/**
 * Check if a notification channel is enabled but has invalid/missing destination
 * @param preferences User alert preferences
 * @param channel The channel to check
 * @returns True if channel is enabled but destination is invalid
 */
export function isChannelEnabledButInvalid(
  preferences: UserAlertPreferences,
  channel: NotificationChannel
): boolean {
  switch (channel) {
    case 'telegram':
      return Boolean(
        preferences.telegramSettings?.enabled &&
          !preferences.telegramSettings?.destination?.trim()
      );
    case 'slack':
      return Boolean(
        preferences.slackSettings?.enabled &&
          !preferences.slackSettings?.destination?.trim()
      );
    case 'webhook':
      return Boolean(
        preferences.webhookSettings?.enabled &&
          !preferences.webhookSettings?.destination?.trim()
      );
    default:
      return false;
  }
}

/**
 * Check if user has at least one valid notification channel configured
 * @param preferences User alert preferences
 * @returns True if at least one channel is properly configured
 */
export function hasValidNotificationChannels(
  preferences: UserAlertPreferences
): boolean {
  const channels: NotificationChannel[] = ['telegram', 'slack', 'webhook'];
  return channels.some((channel) => isChannelValid(preferences, channel));
}

/**
 * Get list of properly configured notification channels
 * @param preferences User alert preferences
 * @returns Array of configured channel names
 */
export function getConfiguredChannels(
  preferences: UserAlertPreferences
): NotificationChannel[] {
  const channels: NotificationChannel[] = ['telegram', 'slack', 'webhook'];
  return channels.filter((channel) => isChannelValid(preferences, channel));
}

/**
 * Get list of channels that are not configured (neither enabled nor have destinations)
 * @param preferences User alert preferences
 * @returns Array of missing channel names
 */
export function getMissingChannels(
  preferences: UserAlertPreferences
): NotificationChannel[] {
  const channels: NotificationChannel[] = ['telegram', 'slack', 'webhook'];
  return channels.filter(
    (channel) =>
      !isChannelValid(preferences, channel) &&
      !isChannelEnabledButInvalid(preferences, channel)
  );
}

/**
 * Get list of channels that are enabled but have invalid/missing destinations
 * @param preferences User alert preferences
 * @returns Array of enabled but invalid channel names
 */
export function getEnabledButInvalidChannels(
  preferences: UserAlertPreferences
): NotificationChannel[] {
  const channels: NotificationChannel[] = ['telegram', 'slack', 'webhook'];
  return channels.filter((channel) =>
    isChannelEnabledButInvalid(preferences, channel)
  );
}

/**
 * Get comprehensive validation result with detailed channel status
 * @param preferences User alert preferences
 * @returns Detailed validation result
 */
export function validateNotificationChannels(
  preferences: UserAlertPreferences
): ValidationResult {
  const configuredChannels = getConfiguredChannels(preferences);
  const missingChannels = getMissingChannels(preferences);
  const enabledButInvalidChannels = getEnabledButInvalidChannels(preferences);

  return {
    isValid: configuredChannels.length > 0,
    configuredChannels,
    missingChannels,
    enabledButInvalidChannels,
  };
}

/**
 * Get user-friendly channel name for display
 * @param channel The notification channel
 * @returns Formatted channel name
 */
export function getChannelDisplayName(channel: NotificationChannel): string {
  switch (channel) {
    case 'telegram':
      return 'Telegram';
    case 'slack':
      return 'Slack';
    case 'webhook':
      return 'Webhook';
    default:
      return channel;
  }
}

/**
 * Get description for a notification channel
 * @param channel The notification channel
 * @returns Channel description
 */
export function getChannelDescription(channel: NotificationChannel): string {
  switch (channel) {
    case 'telegram':
      return 'Get instant alerts through Telegram bot';
    case 'slack':
      return 'Send alerts to your Slack channel or DM';
    case 'webhook':
      return 'Forward alerts to your custom webhook endpoint';
    default:
      return 'Notification channel';
  }
}
