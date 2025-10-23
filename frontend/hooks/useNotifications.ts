/**
 * INNOVATION: Real-time WebSocket Notifications Hook
 * Connects to notification server and handles real-time crisis/risk alerts
 *
 * DEPENDENCIES REQUIRED (add to package.json):
 * - socket.io-client
 *
 * Usage:
 * const { notifications, unreadCount, markAsRead } = useNotifications({
 *   onCrisisAlert: (alert) => console.log('Crisis!', alert),
 *   onRiskAlert: (alert) => console.log('Risk:', alert),
 * });
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export interface CrisisAlert {
  type: 'crisis_alert';
  severity: 'critical' | 'high';
  alert: {
    patientId: string;
    patientName: string;
    indicators: string[];
    emergencyContact?: {
      name: string;
      phone: string;
      relationship: string;
    };
    detectedAt: string;
  };
  timestamp: string;
}

export interface RiskAlert {
  type: 'risk_alert';
  severity: 'low' | 'medium' | 'high';
  alert: {
    patientId: string;
    patientName: string;
    kind: string;
    score: number;
    message: string;
    detectedAt: string;
  };
  timestamp: string;
}

export interface SafetyCheckRequest {
  type: 'safety_check_request';
  severity: 'high';
  request: {
    patientId: string;
    patientName: string;
    reason: string;
    requestedAt: string;
  };
  timestamp: string;
}

export interface SystemNotification {
  type: 'notification';
  severity: 'info' | 'warning' | 'error';
  notification: {
    title: string;
    message: string;
    action?: {
      label: string;
      url: string;
    };
  };
  timestamp: string;
}

export type Notification = CrisisAlert | RiskAlert | SafetyCheckRequest | SystemNotification;

interface UseNotificationsOptions {
  onCrisisAlert?: (alert: CrisisAlert) => void;
  onRiskAlert?: (alert: RiskAlert) => void;
  onSafetyCheckRequest?: (request: SafetyCheckRequest) => void;
  onNotification?: (notification: SystemNotification) => void;
  autoConnect?: boolean;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
  markAsRead: (index: number) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  requestPermission: () => Promise<NotificationPermission>;
}

export function useNotifications(options: UseNotificationsOptions = {}): UseNotificationsReturn {
  const {
    onCrisisAlert,
    onRiskAlert,
    onSafetyCheckRequest,
    onNotification,
    autoConnect = true,
  } = options;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [readIndices, setReadIndices] = useState<Set<number>>(new Set());
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  /**
   * Request browser notification permission
   */
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) {
      console.warn('Browser does not support notifications');
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission;
    }

    return Notification.permission;
  }, []);

  /**
   * Show browser notification
   */
  const showBrowserNotification = useCallback((title: string, options: NotificationOptions) => {
    if (Notification.permission === 'granted') {
      new Notification(title, options);
    }
  }, []);

  /**
   * Play notification sound (optional)
   */
  const playNotificationSound = useCallback((severity: string) => {
    if (severity === 'critical' || severity === 'high') {
      // Could play an audio file here
      // const audio = new Audio('/sounds/alert.mp3');
      // audio.play();
    }
  }, []);

  /**
   * Handle incoming crisis alert
   */
  const handleCrisisAlert = useCallback((data: CrisisAlert) => {
    console.warn('🚨 Crisis Alert Received:', data);

    setNotifications(prev => [data, ...prev]);

    // Show browser notification
    showBrowserNotification(
      `🚨 CRISIS ALERT: ${data.alert.patientName}`,
      {
        body: data.alert.indicators.join('\n'),
        icon: '/icons/crisis.png',
        tag: `crisis-${data.alert.patientId}`,
        requireInteraction: true,
        urgency: 'high' as any,
      }
    );

    playNotificationSound('critical');

    if (onCrisisAlert) {
      onCrisisAlert(data);
    }
  }, [onCrisisAlert, showBrowserNotification, playNotificationSound]);

  /**
   * Handle incoming risk alert
   */
  const handleRiskAlert = useCallback((data: RiskAlert) => {
    console.log('⚠️ Risk Alert Received:', data);

    setNotifications(prev => [data, ...prev]);

    // Show browser notification for high severity only
    if (data.severity === 'high') {
      showBrowserNotification(
        `⚠️ Risk Alert: ${data.alert.patientName}`,
        {
          body: data.alert.message,
          icon: '/icons/warning.png',
          tag: `risk-${data.alert.patientId}`,
        }
      );
    }

    if (onRiskAlert) {
      onRiskAlert(data);
    }
  }, [onRiskAlert, showBrowserNotification]);

  /**
   * Handle safety check request
   */
  const handleSafetyCheckRequest = useCallback((data: SafetyCheckRequest) => {
    console.warn('🆘 Safety Check Request:', data);

    setNotifications(prev => [data, ...prev]);

    showBrowserNotification(
      `🆘 Safety Check Request: ${data.request.patientName}`,
      {
        body: data.request.reason,
        icon: '/icons/safety.png',
        tag: `safety-${data.request.patientId}`,
        requireInteraction: true,
      }
    );

    if (onSafetyCheckRequest) {
      onSafetyCheckRequest(data);
    }
  }, [onSafetyCheckRequest, showBrowserNotification]);

  /**
   * Handle system notification
   */
  const handleNotification = useCallback((data: SystemNotification) => {
    console.log('ℹ️ Notification:', data);

    setNotifications(prev => [data, ...prev]);

    if (onNotification) {
      onNotification(data);
    }
  }, [onNotification]);

  /**
   * Mark notification as read
   */
  const markAsRead = useCallback((index: number) => {
    setReadIndices(prev => new Set(prev).add(index));
  }, []);

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(() => {
    setReadIndices(new Set(notifications.map((_, i) => i)));
  }, [notifications]);

  /**
   * Clear all notifications
   */
  const clearAll = useCallback(() => {
    setNotifications([]);
    setReadIndices(new Set());
  }, []);

  /**
   * Calculate unread count
   */
  const unreadCount = notifications.length - readIndices.size;

  /**
   * Initialize WebSocket connection
   */
  useEffect(() => {
    if (!autoConnect) return;

    // Get auth token from localStorage
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('No auth token found, cannot connect to notifications');
      return;
    }

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const wsUrl = apiBaseUrl.replace('http', 'ws').replace('/api', '');

    console.log('Connecting to notification server:', `${wsUrl}/notifications`);

    // Create socket connection
    const socket = io(`${wsUrl}/notifications`, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      console.log('✅ Connected to notification server');
      setIsConnected(true);
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from notification server:', reason);
      setIsConnected(false);
    });

    socket.on('connected', (data) => {
      console.log('Server confirmed connection:', data);
    });

    // Notification events
    socket.on('crisis_alert', handleCrisisAlert);
    socket.on('risk_alert', handleRiskAlert);
    socket.on('safety_check_request', handleSafetyCheckRequest);
    socket.on('notification', handleNotification);

    // Ping/pong for keep-alive
    const pingInterval = setInterval(() => {
      if (socket.connected) {
        socket.emit('ping');
      }
    }, 30000); // Every 30 seconds

    socket.on('pong', (data) => {
      // Keep-alive confirmed
    });

    // Cleanup on unmount
    return () => {
      clearInterval(pingInterval);
      socket.disconnect();
    };
  }, [
    autoConnect,
    handleCrisisAlert,
    handleRiskAlert,
    handleSafetyCheckRequest,
    handleNotification,
  ]);

  return {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    clearAll,
    requestPermission,
  };
}
