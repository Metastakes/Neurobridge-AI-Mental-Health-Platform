/**
 * Provider Notification Preferences Component
 * Allows providers to customize alert delivery preferences
 */

'use client';

import React, { useState, useEffect } from 'react';

interface NotificationPreferences {
  id: string;
  providerId: string;

  // Channel preferences
  enableSms: boolean;
  enableEmail: boolean;
  enableWebSocket: boolean;

  // Alert type preferences
  crisisAlerts: boolean;
  safetyCheckAlerts: boolean;
  highRiskAlerts: boolean;
  mediumRiskAlerts: boolean;
  lowRiskAlerts: boolean;

  // Quiet hours
  enableQuietHours: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  quietHoursTimezone: string | null;

  // Delivery preferences
  smsForCriticalOnly: boolean;
  emailDigestEnabled: boolean;

  // Contact overrides
  overrideSmsNumber: string | null;
  overrideEmail: string | null;

  createdAt: string;
  updatedAt: string;
}

export function NotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, set Saving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  // Load preferences on mount
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/notifications/preferences`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPreferences(data);
      } else {
        throw new Error('Failed to load preferences');
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load notification preferences' });
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!preferences) return;

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch(`${apiBaseUrl}/notifications/preferences`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      });

      if (response.ok) {
        const updated = await response.json();
        setPreferences(updated);
        setMessage({ type: 'success', text: 'Preferences saved successfully' });
      } else {
        throw new Error('Failed to save preferences');
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save preferences' });
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = async () => {
    if (!confirm('Reset all notification preferences to defaults?')) return;

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch(`${apiBaseUrl}/notifications/preferences/reset`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const reset = await response.json();
        setPreferences(reset);
        setMessage({ type: 'success', text: 'Preferences reset to defaults' });
      } else {
        throw new Error('Failed to reset preferences');
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to reset preferences' });
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = <K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ) => {
    if (preferences) {
      setPreferences({ ...preferences, [key]: value });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800">Failed to load notification preferences</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Notification Preferences</h1>
        <p className="text-gray-600">
          Customize how you receive crisis alerts, risk notifications, and safety check requests
        </p>
      </div>

      {/* Message Banner */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Channel Preferences */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Notification Channels</h2>
        <p className="text-sm text-gray-600 mb-4">
          Choose which channels you want to receive notifications through
        </p>

        <div className="space-y-4">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={preferences.enableWebSocket}
              onChange={(e) => updatePreference('enableWebSocket', e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <div>
              <div className="font-medium text-gray-900">Real-time In-App Notifications</div>
              <div className="text-sm text-gray-600">
                Instant alerts when you're logged into the platform
              </div>
            </div>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={preferences.enableSms}
              onChange={(e) => updatePreference('enableSms', e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <div>
              <div className="font-medium text-gray-900">SMS Text Messages</div>
              <div className="text-sm text-gray-600">
                Receive alerts via text message when you're offline
              </div>
            </div>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={preferences.enableEmail}
              onChange={(e) => updatePreference('enableEmail', e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <div>
              <div className="font-medium text-gray-900">Email Notifications</div>
              <div className="text-sm text-gray-600">
                Receive alerts via email when you're offline
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Alert Type Preferences */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Alert Types</h2>
        <p className="text-sm text-gray-600 mb-4">
          Choose which types of alerts trigger SMS/Email notifications (when you're offline)
        </p>

        <div className="space-y-4">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={preferences.crisisAlerts}
              onChange={(e) => updatePreference('crisisAlerts', e.target.checked)}
              className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
            />
            <div>
              <div className="font-medium text-gray-900 flex items-center">
                <span className="text-red-600 mr-2">🚨</span>
                Crisis Alerts
                <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                  CRITICAL
                </span>
              </div>
              <div className="text-sm text-gray-600">
                Severe mood decline, multiple high-risk alerts, or suicide risk
              </div>
            </div>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={preferences.safetyCheckAlerts}
              onChange={(e) => updatePreference('safetyCheckAlerts', e.target.checked)}
              className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
            />
            <div>
              <div className="font-medium text-gray-900 flex items-center">
                <span className="text-orange-600 mr-2">🆘</span>
                Safety Check Requests
                <span className="ml-2 text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                  URGENT
                </span>
              </div>
              <div className="text-sm text-gray-600">
                Patient requesting immediate safety check or feeling unsafe
              </div>
            </div>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={preferences.highRiskAlerts}
              onChange={(e) => updatePreference('highRiskAlerts', e.target.checked)}
              className="w-5 h-5 text-orange-500 rounded focus:ring-orange-400"
            />
            <div>
              <div className="font-medium text-gray-900 flex items-center">
                <span className="text-orange-500 mr-2">⚠️</span>
                High Risk Alerts
                <span className="ml-2 text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded">
                  HIGH
                </span>
              </div>
              <div className="text-sm text-gray-600">
                Medication non-adherence, worsening symptoms, activation patterns
              </div>
            </div>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={preferences.mediumRiskAlerts}
              onChange={(e) => updatePreference('mediumRiskAlerts', e.target.checked)}
              className="w-5 h-5 text-yellow-500 rounded focus:ring-yellow-400"
            />
            <div>
              <div className="font-medium text-gray-900 flex items-center">
                <span className="text-yellow-500 mr-2">⚡</span>
                Medium Risk Alerts
                <span className="ml-2 text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded">
                  MEDIUM
                </span>
              </div>
              <div className="text-sm text-gray-600">
                Moderate symptom changes, missed appointments, lab due dates
              </div>
            </div>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={preferences.lowRiskAlerts}
              onChange={(e) => updatePreference('lowRiskAlerts', e.target.checked)}
              className="w-5 h-5 text-blue-500 rounded focus:ring-blue-400"
            />
            <div>
              <div className="font-medium text-gray-900 flex items-center">
                <span className="text-blue-500 mr-2">ℹ️</span>
                Low Risk Alerts
                <span className="ml-2 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                  LOW
                </span>
              </div>
              <div className="text-sm text-gray-600">
                Informational alerts, reminders, routine follow-ups
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Quiet Hours */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quiet Hours</h2>
        <p className="text-sm text-gray-600 mb-4">
          Set times when non-critical alerts won't trigger SMS/Email
          <br />
          <span className="text-xs text-gray-500">
            Note: Crisis and safety check alerts will always be sent, even during quiet hours
          </span>
        </p>

        <div className="space-y-4">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={preferences.enableQuietHours}
              onChange={(e) => updatePreference('enableQuietHours', e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="font-medium text-gray-900">Enable Quiet Hours</span>
          </label>

          {preferences.enableQuietHours && (
            <div className="ml-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  value={preferences.quietHoursStart || '22:00'}
                  onChange={(e) => updatePreference('quietHoursStart', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Time
                </label>
                <input
                  type="time"
                  value={preferences.quietHoursEnd || '08:00'}
                  onChange={(e) => updatePreference('quietHoursEnd', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Timezone
                </label>
                <select
                  value={preferences.quietHoursTimezone || 'America/New_York'}
                  onChange={(e) => updatePreference('quietHoursTimezone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="America/New_York">Eastern (ET)</option>
                  <option value="America/Chicago">Central (CT)</option>
                  <option value="America/Denver">Mountain (MT)</option>
                  <option value="America/Los_Angeles">Pacific (PT)</option>
                  <option value="America/Anchorage">Alaska (AKT)</option>
                  <option value="Pacific/Honolulu">Hawaii (HT)</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delivery Preferences */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Delivery Preferences</h2>

        <div className="space-y-4">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={preferences.smsForCriticalOnly}
              onChange={(e) => updatePreference('smsForCriticalOnly', e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <div>
              <div className="font-medium text-gray-900">SMS for Critical Alerts Only</div>
              <div className="text-sm text-gray-600">
                Only send SMS for crisis and safety check alerts (use email for others)
              </div>
            </div>
          </label>

          <label className="flex items-center space-x-3 opacity-50 cursor-not-allowed">
            <input
              type="checkbox"
              checked={preferences.emailDigestEnabled}
              disabled
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <div>
              <div className="font-medium text-gray-900">
                Daily Email Digest
                <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                  COMING SOON
                </span>
              </div>
              <div className="text-sm text-gray-600">
                Receive non-critical alerts as a daily summary instead of instant notifications
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Contact Overrides */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Contact Information</h2>
        <p className="text-sm text-gray-600 mb-4">
          Override the contact info from your profile for notifications
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              SMS Phone Number (E.164 format)
            </label>
            <input
              type="tel"
              value={preferences.overrideSmsNumber || ''}
              onChange={(e) => updatePreference('overrideSmsNumber', e.target.value || null)}
              placeholder="+15551234567"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave blank to use phone from your profile
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={preferences.overrideEmail || ''}
              onChange={(e) => updatePreference('overrideEmail', e.target.value || null)}
              placeholder="doctor@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave blank to use email from your profile
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-4">
        <button
          onClick={savePreferences}
          disabled={saving}
          className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>

        <button
          onClick={resetToDefaults}
          disabled={saving}
          className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Reset to Defaults
        </button>
      </div>

      {/* Info Footer */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start space-x-2">
          <span className="text-blue-600 text-xl">ℹ️</span>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">About Notification Preferences</p>
            <ul className="list-disc ml-5 space-y-1">
              <li>Real-time notifications are always enabled when you're logged in</li>
              <li>SMS and Email are only sent when you're offline from the dashboard</li>
              <li>Crisis and safety check alerts override quiet hours settings</li>
              <li>You can test your settings from the "Test Notifications" page</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
