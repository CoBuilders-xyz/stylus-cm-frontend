/**
 * Alert type enum matching the backend
 */
export enum AlertType {
  EVICTION = 'eviction',
  NO_GAS = 'noGas',
  LOW_GAS = 'lowGas',
  BID_SAFETY = 'bidSafety',
}

/**
 * Notification channel type
 */
export type NotificationChannel = 'telegram' | 'slack' | 'webhook';

/**
 * Individual notification channel constants
 */
export const CHANNELS = {
  TELEGRAM: 'telegram' as const,
  SLACK: 'slack' as const,
  WEBHOOK: 'webhook' as const,
} as const;

/**
 * Array of all available notification channels
 */
export const NOTIFICATION_CHANNELS: NotificationChannel[] = [
  CHANNELS.TELEGRAM,
  CHANNELS.SLACK,
  CHANNELS.WEBHOOK,
];
