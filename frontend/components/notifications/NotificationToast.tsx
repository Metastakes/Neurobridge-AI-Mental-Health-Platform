/**
 * INNOVATION: Real-time Notification Toast
 * Displays floating toast notifications for crisis/risk alerts
 */

'use client';

import React, { useEffect, useState } from 'react';
import { CrisisAlert, RiskAlert, SafetyCheckRequest, SystemNotification } from '@/hooks/useNotifications';

interface NotificationToastProps {
  notification: CrisisAlert | RiskAlert | SafetyCheckRequest | SystemNotification;
  onClose: () => void;
  onAction?: () => void;
  duration?: number; // Auto-dismiss after N ms (0 = no auto-dismiss)
}

export function NotificationToast({
  notification,
  onClose,
  onAction,
  duration = 0,
}: NotificationToastProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (duration > 0 && notification.severity !== 'critical') {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, notification.severity]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onClose, 300); // Wait for exit animation
  };

  const handleAction = () => {
    if (onAction) {
      onAction();
    }
    handleClose();
  };

  const getSeverityStyles = () => {
    switch (notification.severity) {
      case 'critical':
        return 'bg-red-600 border-red-700 text-white';
      case 'high':
        return 'bg-orange-600 border-orange-700 text-white';
      case 'medium':
        return 'bg-yellow-500 border-yellow-600 text-gray-900';
      case 'low':
        return 'bg-blue-500 border-blue-600 text-white';
      case 'info':
        return 'bg-blue-600 border-blue-700 text-white';
      case 'warning':
        return 'bg-yellow-600 border-yellow-700 text-white';
      case 'error':
        return 'bg-red-600 border-red-700 text-white';
      default:
        return 'bg-gray-700 border-gray-600 text-white';
    }
  };

  const getIcon = () => {
    if (notification.type === 'crisis_alert') return '🚨';
    if (notification.type === 'safety_check_request') return '🆘';
    if (notification.type === 'risk_alert') {
      if (notification.severity === 'high') return '⚠️';
      return 'ℹ️';
    }
    return 'ℹ️';
  };

  const getTitle = () => {
    if (notification.type === 'crisis_alert') {
      return `CRISIS ALERT: ${notification.alert.patientName}`;
    }
    if (notification.type === 'safety_check_request') {
      return `Safety Check Request: ${notification.request.patientName}`;
    }
    if (notification.type === 'risk_alert') {
      return `Risk Alert: ${notification.alert.patientName}`;
    }
    if (notification.type === 'notification') {
      return notification.notification.title;
    }
    return 'Notification';
  };

  const getBody = () => {
    if (notification.type === 'crisis_alert') {
      return notification.alert.indicators.join(', ');
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

  const showActionButton = () => {
    return notification.type === 'crisis_alert' ||
           notification.type === 'safety_check_request' ||
           (notification.type === 'notification' && notification.notification.action);
  };

  const getActionLabel = () => {
    if (notification.type === 'notification' && notification.notification.action) {
      return notification.notification.action.label;
    }
    return 'View Details';
  };

  return (
    <div
      className={`
        fixed bottom-4 right-4 z-50 max-w-md w-full
        ${getSeverityStyles()}
        border-2 rounded-lg shadow-2xl
        transform transition-all duration-300 ease-in-out
        ${isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
      `}
      role="alert"
      aria-live={notification.severity === 'critical' ? 'assertive' : 'polite'}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-start space-x-2 flex-1">
            <span className="text-2xl flex-shrink-0">{getIcon()}</span>
            <h3 className="font-bold text-sm leading-tight">
              {getTitle()}
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="ml-2 flex-shrink-0 text-white/80 hover:text-white transition-colors"
            aria-label="Close notification"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <p className="text-sm opacity-95 mb-3 ml-8">
          {getBody()}
        </p>

        {/* Emergency Contact (for crisis alerts) */}
        {notification.type === 'crisis_alert' && notification.alert.emergencyContact && (
          <div className="ml-8 mb-3 p-2 bg-black/20 rounded text-xs">
            <div className="font-semibold mb-1">Emergency Contact:</div>
            <div>{notification.alert.emergencyContact.name} ({notification.alert.emergencyContact.relationship})</div>
            <div className="font-mono">{notification.alert.emergencyContact.phone}</div>
          </div>
        )}

        {/* Timestamp */}
        <div className="ml-8 text-xs opacity-75 mb-2">
          {new Date(notification.timestamp).toLocaleString()}
        </div>

        {/* Action Buttons */}
        {showActionButton() && (
          <div className="flex space-x-2 ml-8">
            <button
              onClick={handleAction}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded font-semibold text-sm transition-colors"
            >
              {getActionLabel()}
            </button>
            {notification.severity === 'critical' && (
              <button
                onClick={() => {
                  if (notification.type === 'crisis_alert' && notification.alert.emergencyContact) {
                    window.location.href = `tel:${notification.alert.emergencyContact.phone}`;
                  }
                }}
                className="px-4 py-2 bg-white text-red-600 hover:bg-gray-100 rounded font-semibold text-sm transition-colors"
              >
                📞 Call Emergency Contact
              </button>
            )}
          </div>
        )}
      </div>

      {/* Severity indicator bar */}
      {notification.severity === 'critical' && (
        <div className="h-1 bg-red-800 animate-pulse" />
      )}
    </div>
  );
}
