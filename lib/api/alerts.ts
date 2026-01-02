/**
 * Alerts API Client
 *
 * Type-safe API methods for alert preferences.
 */

import { apiClient } from './client'

export interface AlertThresholds {
  low_balance_threshold: number
  budget_warning_percent: number
}

export interface EmailPreferences {
  enabled: boolean
  email_address: string | null
  budget_alerts: boolean
  low_balance_alerts: boolean
  bill_reminders: boolean
  weekly_summary: boolean
}

export interface DeduplicationSettings {
  budget_alert_hours: number
  low_balance_alert_hours: number
}

export interface AlertPreferences {
  user_id: string
  thresholds: AlertThresholds
  email_preferences: EmailPreferences
  deduplication: DeduplicationSettings
  updated_at: string
}

export interface AlertPreferencesUpdate {
  thresholds?: Partial<AlertThresholds>
  email_preferences?: Partial<EmailPreferences>
  deduplication?: Partial<DeduplicationSettings>
}

export const alertApi = {
  /**
   * Get alert preferences
   */
  getPreferences: async (): Promise<AlertPreferences> => {
    return apiClient.get<AlertPreferences>('/api/v1/alerts/preferences')
  },

  /**
   * Update alert preferences
   */
  updatePreferences: async (data: AlertPreferencesUpdate): Promise<AlertPreferences> => {
    return apiClient.put<AlertPreferences>('/api/v1/alerts/preferences', data)
  },
}
