import { ApiClient } from './api';
import { AlertType, NotificationChannel } from '@/types/alerts';

/**
 * Alert data interface for contract monitoring
 */
export interface Alert {
  id: string;
  type: AlertType;
  value: string;
  isActive: boolean;
  lastTriggered: string | null;
  lastNotified: string | null;
  triggeredCount: number;
  slackChannelEnabled: boolean;
  telegramChannelEnabled: boolean;
  webhookChannelEnabled: boolean;
  userContractId: string;
}

/**
 * Alert settings interface matching the backend CreateAlertDto
 */
export interface AlertSettings {
  type: AlertType;
  isActive: boolean;
  value?: number | string;
  userContractId: string;
  slackChannelEnabled?: boolean;
  telegramChannelEnabled?: boolean;
  webhookChannelEnabled?: boolean;
}

/**
 * Telegram settings for user alert preferences
 */
export interface TelegramSettings {
  enabled: boolean;
  destination: string;
}

/**
 * Slack settings for user alert preferences
 */
export interface SlackSettings {
  enabled: boolean;
  destination: string;
}

/**
 * Webhook settings for user alert preferences
 */
export interface WebhookSettings {
  enabled: boolean;
  destination: string;
}

/**
 * User alert preferences interface
 */
export interface UserAlertPreferences {
  telegramSettings?: TelegramSettings;
  slackSettings?: SlackSettings;
  webhookSettings?: WebhookSettings;
}

/**
 * Alert service for handling alert-related API requests
 */
export class AlertService {
  private apiClient: ApiClient;

  /**
   * Create a new AlertService instance
   * @param accessToken JWT token for authentication
   */
  constructor(accessToken: string) {
    this.apiClient = new ApiClient(accessToken);
  }

  /**
   * Create or update an alert for a contract
   * @param alertSettings Alert settings to create or update
   * @returns Promise with the created/updated alert
   */
  async createOrUpdateAlert(alertSettings: AlertSettings): Promise<Alert> {
    return Promise.resolve({
      id: `mock-alert-${alertSettings.type}-${Date.now()}`,
      type: alertSettings.type,
      value: String(alertSettings.value ?? ''),
      isActive: alertSettings.isActive,
      lastTriggered: null,
      lastNotified: null,
      triggeredCount: 0,
      slackChannelEnabled: alertSettings.slackChannelEnabled ?? false,
      telegramChannelEnabled: alertSettings.telegramChannelEnabled ?? false,
      webhookChannelEnabled: alertSettings.webhookChannelEnabled ?? false,
      userContractId: alertSettings.userContractId,
    });
  }

  /**
   * Deactivate an alert by setting isActive to false
   * @param existingAlert The existing alert data
   * @returns Promise that resolves when the alert is deactivated
   */
  async deactivateAlert(existingAlert: Alert): Promise<Alert> {
    // Return the updated alert with isActive set to false
    return this.createOrUpdateAlert({
      type: existingAlert.type,
      value: existingAlert.value,
      userContractId: existingAlert.userContractId,
      isActive: false,
      slackChannelEnabled: existingAlert.slackChannelEnabled,
      telegramChannelEnabled: existingAlert.telegramChannelEnabled,
      webhookChannelEnabled: existingAlert.webhookChannelEnabled,
    });
  }

  /**
   * Get user's global alert preferences
   * @returns Promise with the user alert preferences
   */
  async getUserAlertPreferences(): Promise<UserAlertPreferences> {
    return Promise.resolve({
      telegramSettings: { enabled: true, destination: '@stylus-prototype' },
      slackSettings: {
        enabled: true,
        destination: 'https://hooks.slack.com/services/mock',
      },
      webhookSettings: { enabled: false, destination: '' },
    });
  }

  /**
   * Update user's global alert preferences
   * @param preferences User alert preferences to update
   * @returns Promise with the updated preferences
   */
  async updateUserAlertPreferences(
    preferences: UserAlertPreferences
  ): Promise<UserAlertPreferences> {
    return Promise.resolve(preferences);
  }

  /**
   * Send a test notification to verify notification channel setup
   * @param notificationChannel The channel to test ( telegram, slack, webhook)
   * @returns Promise with the test notification result
   */
  async testNotification(
    notificationChannel: NotificationChannel
  ): Promise<{ success: boolean; message?: string }> {
    return Promise.resolve({
      success: true,
      message: `Test sent to ${notificationChannel} (prototype mode)`,
    });
  }
}
