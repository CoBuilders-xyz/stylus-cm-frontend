import { ApiClient } from './api';

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
  emailChannelEnabled: boolean;
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
  emailChannelEnabled?: boolean;
  slackChannelEnabled?: boolean;
  telegramChannelEnabled?: boolean;
  webhookChannelEnabled?: boolean;
}

/**
 * Email settings for user alert preferences
 */
export interface EmailSettings {
  enabled: boolean;
  destination: string;
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
  emailSettings?: EmailSettings;
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
    return this.apiClient.post<Alert>(
      '/alerts',
      alertSettings as unknown as Record<string, unknown>
    );
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
      emailChannelEnabled: existingAlert.emailChannelEnabled,
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
    return this.apiClient.get<UserAlertPreferences>('/users/alerts-settings');
  }

  /**
   * Update user's global alert preferences
   * @param preferences User alert preferences to update
   * @returns Promise with the updated preferences
   */
  async updateUserAlertPreferences(
    preferences: UserAlertPreferences
  ): Promise<UserAlertPreferences> {
    return this.apiClient.patch<UserAlertPreferences>(
      '/users/alerts-settings',
      preferences as unknown as Record<string, unknown>
    );
  }
}
