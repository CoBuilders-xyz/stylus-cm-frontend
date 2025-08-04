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
 * Notification channel enum
 */
export enum NotificationChannel {
  TELEGRAM = 'telegram',
  SLACK = 'slack',
  WEBHOOK = 'webhook',
}

/**
 * Array of all available notification channels
 */
export const NOTIFICATION_CHANNELS = Object.values(NotificationChannel);
