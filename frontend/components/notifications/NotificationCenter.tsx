/**
 * INNOVATION: Notification Center
 * Dropdown panel showing all notifications with filtering and management
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { NotificationToast } from './NotificationToast';

interface NotificationCenterProps {
  onCrisisClick?: (patientId: string) => void;
  onRiskClick?: (patientId: string) => void;
  onSafetyCheckClick?: (patientId: string) => void;
}

export function NotificationCenter({
  onCrisisClick,
  onRiskClick,
  onSafetyCheckClick,
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeToast, setActiveToast] = useState<Notification | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    clearAll,
    requestPermission,
  } = useNotifications({
    onCrisisAlert: (alert) => {
      setActiveToast(alert);
    },
    onRiskAlert: (alert) => {
      if (alert.severity === 'high') {
        setActiveToast(alert);
      }
    },
    onSafetyCheckRequest: (request) => {
      setActiveToast(request);
    },
    onNotification: (notification) => {
      if (notification.severity === 'error' || notification.severity === 'warning') {
        setActiveToast(notification);
      }
    },
  });

  // Request notification permission on mount
  useEffect(() => {
    const checkPermission = async () => {
      const permission = await requestPermission();
      setPermissionGranted(permission === 'granted');
    };
    checkPermission();
  }, [requestPermission]);

  const handleNotificationClick = (notification: Notification, index: number) => {
    markAsRead(index);

    if (notification.type === 'crisis_alert' && onCrisisClick) {
      onCrisisClick(notification.alert.patientId);
    } else if (notification.type === 'risk_alert' && onRiskClick) {
      onRiskClick(notification.alert.patientId);
    } else if (notification.type === 'safety_check_request' && onSafetyCheckClick) {
      onSafetyCheckClick(notification.request.patientId);
    }

    setIsOpen(false);
  };

  const getNotificationIcon = (notification: Notification) => {
    if (notification.type === 'crisis_alert') return '🚨';
    if (notification.type === 'safety_check_request') return '🆘';
    if (notification.type === 'risk_alert') {
      if (notification.severity === 'high') return '⚠️';
      return 'ℹ️';
    }
    return 'ℹ️';
  };

  const getNotificationTitle = (notification: Notification) => {
    if (notification.type === 'crisis_alert') {
      return `Crisis: ${notification.alert.patientName}`;
    }
    if (notification.type === 'safety_check_request') {
      return `Safety Check: ${notification.request.patientName}`;
    }
    if (notification.type === 'risk_alert') {
      return `Risk Alert: ${notification.alert.patientName}`;
    }
    if (notification.type === 'notification') {
      return notification.notification.title;
    }
    return 'Notification';
  };

  const getNotificationBody = (notification: Notification) => {
    if (notification.type === 'crisis_alert') {
      return notification.alert.indicators[0] || 'Crisis detected';
    }
    if (notification.type === 'safety_check_request') {
      return notification.request.reason;
    }
    if (notification.type === 'risk_alert') {
      return notification.alert.message;
    }
    if (notification.type === 'notification') {
      return notification.notification.message;
    }
    return '';
  };

  const getSeverityColor = (notification: Notification) => {
    switch (notification.severity) {
      case 'critical':
        return 'bg-red-100 border-red-300 hover:bg-red-50';
      case 'high':
        return 'bg-orange-100 border-orange-300 hover:bg-orange-50';
      case 'medium':
        return 'bg-yellow-100 border-yellow-300 hover:bg-yellow-50';
      case 'low':
        return 'bg-blue-100 border-blue-300 hover:bg-blue-50';
      default:
        return 'bg-gray-100 border-gray-300 hover:bg-gray-50';
    }
  };

  return (
    <>
      {/* Notification Bell Button */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
          aria-label="Notifications"
        >
          {/* Bell Icon */}
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>

          {/* Unread Badge */}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}

          {/* Connection Status Indicator */}
          <span
            className={`absolute bottom-0 right-0 w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-gray-400'
            }`}
            title={isConnected ? 'Connected' : 'Disconnected'}
          />
        </button>

        {/* Dropdown Panel */}
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Panel */}
            <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 max-h-[600px] flex flex-col">
              {/* Header */}
              <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-lg">Notifications</h3>
                  <div className="flex space-x-2">
                    {notifications.length > 0 && (
                      <>
                        <button
                          onClick={markAllAsRead}
                          className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded transition-colors"
                          title="Mark all as read"
                        >
                          ✓ Read All
                        </button>
                        <button
                          onClick={clearAll}
                          className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded transition-colors"
                          title="Clear all"
                        >
                          🗑️ Clear
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span>
                    {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                  </span>
                  <span className={`text-xs ${isConnected ? 'text-green-200' : 'text-red-200'}`}>
                    {isConnected ? '● Live' : '● Offline'}
                  </span>
                </div>

                {!permissionGranted && (
                  <div className="mt-2 text-xs bg-yellow-500/20 border border-yellow-500/30 rounded p-2">
                    <button
                      onClick={async () => {
                        const permission = await requestPermission();
                        setPermissionGranted(permission === 'granted');
                      }}
                      className="underline"
                    >
                      Enable browser notifications
                    </button> for crisis alerts
                  </div>
                )}
              </div>

              {/* Notification List */}
              <div className="overflow-y-auto flex-1">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <svg className="w-16 h-16 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <p className="font-medium">No notifications</p>
                    <p className="text-sm">You're all caught up!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {notifications.map((notification, index) => (
                      <button
                        key={index}
                        onClick={() => handleNotificationClick(notification, index)}
                        className={`w-full text-left p-4 transition-colors border-l-4 ${getSeverityColor(notification)}`}
                      >
                        <div className="flex items-start space-x-3">
                          <span className="text-2xl flex-shrink-0">{getNotificationIcon(notification)}</span>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm text-gray-900 truncate">
                              {getNotificationTitle(notification)}
                            </h4>
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                              {getNotificationBody(notification)}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(notification.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Active Toast Notification */}
      {activeToast && (
        <NotificationToast
          notification={activeToast}
          onClose={() => setActiveToast(null)}
          onAction={() => {
            if (activeToast.type === 'crisis_alert' && onCrisisClick) {
              onCrisisClick(activeToast.alert.patientId);
            } else if (activeToast.type === 'risk_alert' && onRiskClick) {
              onRiskClick(activeToast.alert.patientId);
            } else if (activeToast.type === 'safety_check_request' && onSafetyCheckClick) {
              onSafetyCheckClick(activeToast.request.patientId);
            }
            setActiveToast(null);
          }}
          duration={activeToast.severity === 'critical' ? 0 : 10000}
        />
      )}
    </>
  );
}
