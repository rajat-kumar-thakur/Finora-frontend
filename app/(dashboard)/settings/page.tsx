"use client"

/**
 * Settings Page
 *
 * User settings for profile, security, and notification preferences.
 */

import { useState, useEffect } from 'react'
import { useRequireAuth } from '@/lib/auth'
import { userApi, alertApi, type User, type AlertPreferences } from '@/lib/api'

type TabId = 'profile' | 'security' | 'notifications'

function Toggle({
  enabled,
  onToggle,
  disabled,
  label
}: {
  enabled: boolean
  onToggle: () => void
  disabled?: boolean
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-label={label}
      aria-pressed={enabled ? "true" : "false"}
      className={`relative w-11 h-6 rounded-full transition-colors disabled:opacity-50 ${
        enabled ? 'bg-primary' : 'bg-muted-foreground/30'
      }`}
    >
      <span
        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
          enabled ? 'left-5' : 'left-0.5'
        }`}
      />
    </button>
  )
}

export default function SettingsPage() {
  useRequireAuth()

  const [activeTab, setActiveTab] = useState<TabId>('profile')
  const [user, setUser] = useState<User | null>(null)
  const [alertPrefs, setAlertPrefs] = useState<AlertPreferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Profile form
  const [fullName, setFullName] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  // Email form
  const [newEmail, setNewEmail] = useState('')
  const [emailPassword, setEmailPassword] = useState('')
  const [savingEmail, setSavingEmail] = useState(false)

  // Password form
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  // Notification preferences
  const [savingNotifications, setSavingNotifications] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [userData, prefsData] = await Promise.all([
        userApi.getProfile(),
        alertApi.getPreferences(),
      ])
      setUser(userData)
      setFullName(userData.full_name || '')
      setAlertPrefs(prefsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const showSuccess = (message: string) => {
    setSuccess(message)
    setError(null)
    setTimeout(() => setSuccess(null), 3000)
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingProfile(true)
    setError(null)
    try {
      const updated = await userApi.updateProfile({ full_name: fullName })
      setUser(updated)
      showSuccess('Profile updated successfully')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEmail || !emailPassword) {
      setError('Please fill in all fields')
      return
    }
    setSavingEmail(true)
    setError(null)
    try {
      const updated = await userApi.changeEmail({
        new_email: newEmail,
        password: emailPassword,
      })
      setUser(updated)
      setNewEmail('')
      setEmailPassword('')
      showSuccess('Email updated successfully')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change email')
    } finally {
      setSavingEmail(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Please fill in all fields')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match')
      return
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters')
      return
    }
    setSavingPassword(true)
    setError(null)
    try {
      await userApi.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      showSuccess('Password changed successfully')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password')
    } finally {
      setSavingPassword(false)
    }
  }

  const handleUpdateNotifications = async (updates: Partial<AlertPreferences['email_preferences']>) => {
    if (!alertPrefs) return
    setSavingNotifications(true)
    setError(null)
    try {
      const updated = await alertApi.updatePreferences({
        email_preferences: {
          ...alertPrefs.email_preferences,
          ...updates,
        },
      })
      setAlertPrefs(updated)
      showSuccess('Preferences saved')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update preferences')
    } finally {
      setSavingNotifications(false)
    }
  }

  const handleUpdateThresholds = async (updates: Partial<AlertPreferences['thresholds']>) => {
    if (!alertPrefs) return
    setSavingNotifications(true)
    setError(null)
    try {
      const updated = await alertApi.updatePreferences({
        thresholds: {
          ...alertPrefs.thresholds,
          ...updates,
        },
      })
      setAlertPrefs(updated)
      showSuccess('Thresholds saved')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update thresholds')
    } finally {
      setSavingNotifications(false)
    }
  }

  const handleUpdateDeduplication = async (updates: Partial<AlertPreferences['deduplication']>) => {
    if (!alertPrefs) return
    setSavingNotifications(true)
    setError(null)
    try {
      const updated = await alertApi.updatePreferences({
        deduplication: {
          ...alertPrefs.deduplication,
          ...updates,
        },
      })
      setAlertPrefs(updated)
      showSuccess('Alert frequency saved')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update alert frequency')
    } finally {
      setSavingNotifications(false)
    }
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your account and preferences</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="spinner" />
        </div>
      </div>
    )
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: 'profile', label: 'Profile' },
    { id: 'security', label: 'Security' },
    { id: 'notifications', label: 'Notifications' },
  ]

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your account and preferences</p>
      </div>

      {/* Tabs */}
      <div className="tab-container">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id)
              setError(null)
              setSuccess(null)
            }}
            type="button"
            className={`tab-item ${activeTab === tab.id ? 'tab-active' : 'tab-inactive'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      {error && (
        <div className="alert-error">{error}</div>
      )}
      {success && (
        <div className="alert-success">{success}</div>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && user && (
        <div className="space-y-6">
          <div className="card-base card-padding">
            <h2 className="section-title mb-4">Profile Information</h2>
            <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-md">
              <div>
                <label htmlFor="profile-email" className="block text-sm font-medium text-foreground mb-1">
                  Email Address
                </label>
                <input
                  id="profile-email"
                  type="email"
                  value={user.email}
                  disabled
                  className="input-sm bg-muted text-muted-foreground cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Change email in Security tab
                </p>
              </div>
              <div>
                <label htmlFor="profile-fullname" className="block text-sm font-medium text-foreground mb-1">
                  Full Name
                </label>
                <input
                  id="profile-fullname"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="input-sm"
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <label htmlFor="profile-member-since" className="block text-sm font-medium text-foreground mb-1">
                  Member Since
                </label>
                <input
                  id="profile-member-since"
                  type="text"
                  value={new Date(user.created_at).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                  disabled
                  className="input-sm bg-muted text-muted-foreground cursor-not-allowed"
                />
              </div>
              <button
                type="submit"
                disabled={savingProfile}
                className="btn-primary"
              >
                {savingProfile ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && user && (
        <div className="space-y-6">
          {/* Change Email */}
          <div className="card-base card-padding">
            <h2 className="section-title mb-4">Change Email</h2>
            <form onSubmit={handleChangeEmail} className="space-y-4 max-w-md">
              <div>
                <label htmlFor="current-email" className="block text-sm font-medium text-foreground mb-1">
                  Current Email
                </label>
                <input
                  id="current-email"
                  type="email"
                  value={user.email}
                  disabled
                  className="input-sm bg-muted text-muted-foreground cursor-not-allowed"
                />
              </div>
              <div>
                <label htmlFor="new-email" className="block text-sm font-medium text-foreground mb-1">
                  New Email Address
                </label>
                <input
                  id="new-email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="input-sm"
                  placeholder="Enter new email address"
                />
              </div>
              <div>
                <label htmlFor="email-password" className="block text-sm font-medium text-foreground mb-1">
                  Current Password
                </label>
                <input
                  id="email-password"
                  type="password"
                  value={emailPassword}
                  onChange={(e) => setEmailPassword(e.target.value)}
                  className="input-sm"
                  placeholder="Verify with your password"
                />
              </div>
              <button
                type="submit"
                disabled={savingEmail}
                className="btn-primary"
              >
                {savingEmail ? 'Changing...' : 'Change Email'}
              </button>
            </form>
          </div>

          {/* Change Password */}
          <div className="card-base card-padding">
            <h2 className="section-title mb-4">Change Password</h2>
            <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
              <div>
                <label htmlFor="current-password" className="block text-sm font-medium text-foreground mb-1">
                  Current Password
                </label>
                <input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="input-sm"
                  placeholder="Enter current password"
                />
              </div>
              <div>
                <label htmlFor="new-password" className="block text-sm font-medium text-foreground mb-1">
                  New Password
                </label>
                <input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input-sm"
                  placeholder="Min 8 characters"
                />
              </div>
              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-foreground mb-1">
                  Confirm New Password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-sm"
                  placeholder="Confirm new password"
                />
              </div>
              <button
                type="submit"
                disabled={savingPassword}
                className="btn-primary"
              >
                {savingPassword ? 'Changing...' : 'Change Password'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && alertPrefs && (
        <div className="space-y-6">
          {/* Email Notifications */}
          <div className="card-base card-padding">
            <h2 className="section-title mb-4">Email Notifications</h2>
            <div className="space-y-4">
              {/* Master Switch */}
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <p className="font-medium text-foreground text-sm">Enable Email Notifications</p>
                  <p className="text-xs text-muted-foreground">
                    Turn on to receive alerts via email
                  </p>
                </div>
                <Toggle
                  enabled={alertPrefs.email_preferences.enabled}
                  onToggle={() => handleUpdateNotifications({ enabled: !alertPrefs.email_preferences.enabled })}
                  disabled={savingNotifications}
                  label="Enable email notifications"
                />
              </div>

              {alertPrefs.email_preferences.enabled && (
                <>
                  {/* Notification Email */}
                  <div className="py-3 border-b border-border">
                    <label htmlFor="notification-email" className="block font-medium text-foreground text-sm mb-1">
                      Notification Email
                    </label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Leave empty to use account email ({user?.email})
                    </p>
                    <div className="flex gap-2 max-w-md">
                      <input
                        id="notification-email"
                        type="email"
                        value={alertPrefs.email_preferences.email_address || ''}
                        onChange={(e) => setAlertPrefs({
                          ...alertPrefs,
                          email_preferences: {
                            ...alertPrefs.email_preferences,
                            email_address: e.target.value || null,
                          },
                        })}
                        className="flex-1 input-sm"
                        placeholder="alternate@email.com"
                      />
                      <button
                        type="button"
                        onClick={() => handleUpdateNotifications({
                          email_address: alertPrefs.email_preferences.email_address,
                        })}
                        disabled={savingNotifications}
                        className="btn-primary"
                      >
                        Save
                      </button>
                    </div>
                  </div>

                  {/* Individual Toggles */}
                  <div className="flex items-center justify-between py-3 border-b border-border">
                    <div>
                      <p className="font-medium text-foreground text-sm">Budget Alerts</p>
                      <p className="text-xs text-muted-foreground">
                        When you exceed or near budget limits
                      </p>
                    </div>
                    <Toggle
                      enabled={alertPrefs.email_preferences.budget_alerts}
                      onToggle={() => handleUpdateNotifications({ budget_alerts: !alertPrefs.email_preferences.budget_alerts })}
                      disabled={savingNotifications}
                      label="Budget alerts"
                    />
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-border">
                    <div>
                      <p className="font-medium text-foreground text-sm">Low Balance Alerts</p>
                      <p className="text-xs text-muted-foreground">
                        When balance falls below threshold
                      </p>
                    </div>
                    <Toggle
                      enabled={alertPrefs.email_preferences.low_balance_alerts}
                      onToggle={() => handleUpdateNotifications({ low_balance_alerts: !alertPrefs.email_preferences.low_balance_alerts })}
                      disabled={savingNotifications}
                      label="Low balance alerts"
                    />
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-border">
                    <div>
                      <p className="font-medium text-foreground text-sm">Bill Reminders</p>
                      <p className="text-xs text-muted-foreground">
                        Upcoming recurring payment reminders
                      </p>
                    </div>
                    <Toggle
                      enabled={alertPrefs.email_preferences.bill_reminders}
                      onToggle={() => handleUpdateNotifications({ bill_reminders: !alertPrefs.email_preferences.bill_reminders })}
                      disabled={savingNotifications}
                      label="Bill reminders"
                    />
                  </div>

                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium text-foreground text-sm">Weekly Summary</p>
                      <p className="text-xs text-muted-foreground">
                        Finance score and spending summary
                      </p>
                    </div>
                    <Toggle
                      enabled={alertPrefs.email_preferences.weekly_summary}
                      onToggle={() => handleUpdateNotifications({ weekly_summary: !alertPrefs.email_preferences.weekly_summary })}
                      disabled={savingNotifications}
                      label="Weekly summary"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Alert Thresholds */}
          <div className="card-base card-padding">
            <h2 className="section-title mb-4">Alert Thresholds</h2>
            <div className="space-y-4 max-w-md">
              <div>
                <label htmlFor="low-balance-threshold" className="block font-medium text-foreground text-sm mb-1">
                  Low Balance Threshold
                </label>
                <p className="text-xs text-muted-foreground mb-2">
                  Alert when balance falls below this amount
                </p>
                <div className="flex gap-2 items-center">
                  <span className="text-muted-foreground text-sm">₹</span>
                  <input
                    id="low-balance-threshold"
                    type="number"
                    value={alertPrefs.thresholds.low_balance_threshold}
                    onChange={(e) => setAlertPrefs({
                      ...alertPrefs,
                      thresholds: {
                        ...alertPrefs.thresholds,
                        low_balance_threshold: parseFloat(e.target.value) || 0,
                      },
                    })}
                    className="w-32 input-sm"
                    min="0"
                    step="100"
                  />
                  <button
                    type="button"
                    onClick={() => handleUpdateThresholds({
                      low_balance_threshold: alertPrefs.thresholds.low_balance_threshold,
                    })}
                    disabled={savingNotifications}
                    className="btn-primary"
                  >
                    Save
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="budget-warning-threshold" className="block font-medium text-foreground text-sm mb-1">
                  Budget Warning Threshold
                </label>
                <p className="text-xs text-muted-foreground mb-2">
                  Warn when budget usage exceeds this %
                </p>
                <div className="flex gap-2 items-center">
                  <input
                    id="budget-warning-threshold"
                    type="number"
                    value={alertPrefs.thresholds.budget_warning_percent}
                    onChange={(e) => setAlertPrefs({
                      ...alertPrefs,
                      thresholds: {
                        ...alertPrefs.thresholds,
                        budget_warning_percent: parseInt(e.target.value) || 80,
                      },
                    })}
                    className="w-20 input-sm"
                    min="50"
                    max="100"
                  />
                  <span className="text-muted-foreground text-sm">%</span>
                  <button
                    type="button"
                    onClick={() => handleUpdateThresholds({
                      budget_warning_percent: alertPrefs.thresholds.budget_warning_percent,
                    })}
                    disabled={savingNotifications}
                    className="btn-primary"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Alert Frequency */}
          <div className="card-base card-padding">
            <h2 className="section-title mb-2">Alert Frequency</h2>
            <p className="section-subtitle mb-4">
              Control how often you receive repeated alerts. Set to 0 hours to receive an alert every time the threshold is crossed.
            </p>
            <div className="space-y-4 max-w-md">
              <div>
                <label htmlFor="budget-alert-hours" className="block font-medium text-foreground text-sm mb-1">
                  Budget Alert Cooldown
                </label>
                <p className="text-xs text-muted-foreground mb-2">
                  Wait this long before re-alerting for the same budget
                </p>
                <div className="flex gap-2 items-center">
                  <select
                    id="budget-alert-hours"
                    value={alertPrefs.deduplication.budget_alert_hours}
                    onChange={(e) => {
                      const value = parseInt(e.target.value)
                      setAlertPrefs({
                        ...alertPrefs,
                        deduplication: {
                          ...alertPrefs.deduplication,
                          budget_alert_hours: value,
                        },
                      })
                      handleUpdateDeduplication({ budget_alert_hours: value })
                    }}
                    disabled={savingNotifications}
                    className="input-sm"
                  >
                    <option value={0}>Every time (no cooldown)</option>
                    <option value={1}>1 hour</option>
                    <option value={6}>6 hours</option>
                    <option value={12}>12 hours</option>
                    <option value={24}>24 hours (default)</option>
                    <option value={48}>48 hours</option>
                    <option value={168}>1 week</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="low-balance-alert-hours" className="block font-medium text-foreground text-sm mb-1">
                  Low Balance Alert Cooldown
                </label>
                <p className="text-xs text-muted-foreground mb-2">
                  Wait this long before re-alerting for low balance
                </p>
                <div className="flex gap-2 items-center">
                  <select
                    id="low-balance-alert-hours"
                    value={alertPrefs.deduplication.low_balance_alert_hours}
                    onChange={(e) => {
                      const value = parseInt(e.target.value)
                      setAlertPrefs({
                        ...alertPrefs,
                        deduplication: {
                          ...alertPrefs.deduplication,
                          low_balance_alert_hours: value,
                        },
                      })
                      handleUpdateDeduplication({ low_balance_alert_hours: value })
                    }}
                    disabled={savingNotifications}
                    className="input-sm"
                  >
                    <option value={0}>Every time (no cooldown)</option>
                    <option value={1}>1 hour</option>
                    <option value={6}>6 hours</option>
                    <option value={12}>12 hours (default)</option>
                    <option value={24}>24 hours</option>
                    <option value={48}>48 hours</option>
                    <option value={168}>1 week</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
