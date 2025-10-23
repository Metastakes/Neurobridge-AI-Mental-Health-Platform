/**
 * Notification Dashboard Component
 * Displays notification history, statistics, and delivery status
 */

'use client';

import React, { useState, useEffect } from 'react';

interface NotificationStats {
  totalSent: number;
  byChannel: {
    websocket: number;
    sms: number;
    email: number;
  };
  byType: {
    crisis: number;
    safety_check: number;
    high_risk: number;
    medium_risk: number;
    low_risk: number;
  };
  byStatus: {
    sent: number;
    delivered: number;
    failed: number;
  };
  avgResponseTimeMinutes: number | null;
  last24Hours: number;
  last7Days: number;
  last30Days: number;
}

interface NotificationLog {
  id: string;
  notificationType: string;
  channel: string;
  recipient: string;
  patientName: string;
  status: string;
  createdAt: string;
  sentAt: string | null;
  deliveredAt: string | null;
  failedAt: string | null;
  statusMessage: string | null;
}

interface TimelineDataPoint {
  date: string;
  count: number;
}

export function NotificationDashboard() {
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [recentLogs, setRecentLogs] = useState<NotificationLog[]>([]);
  const [failedLogs, setFailedLogs] = useState<NotificationLog[]>([]);
  const [timeline, setTimeline] = useState<TimelineDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<7 | 30 | 90>(30);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'failed'>('overview');

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  useEffect(() => {
    loadDashboardData();
  }, [selectedPeriod]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };

      const [statsRes, recentRes, failedRes, timelineRes] = await Promise.all([
        fetch(`${apiBaseUrl}/notifications/history/stats?days=${selectedPeriod}`, { headers }),
        fetch(`${apiBaseUrl}/notifications/history/recent?limit=10`, { headers }),
        fetch(`${apiBaseUrl}/notifications/history/failed?limit=20`, { headers }),
        fetch(`${apiBaseUrl}/notifications/history/timeline?days=${selectedPeriod}`, { headers }),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (recentRes.ok) setRecentLogs(await recentRes.json());
      if (failedRes.ok) setFailedLogs(await failedRes.json());
      if (timelineRes.ok) setTimeline(await timelineRes.json());
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'websocket': return '💻';
      case 'sms': return '📱';
      case 'email': return '📧';
      default: return '📬';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'crisis': return '🚨';
      case 'safety_check': return '🆘';
      case 'high_risk': return '⚠️';
      case 'medium_risk': return '⚡';
      case 'low_risk': return 'ℹ️';
      default: return '📌';
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      sent: 'bg-blue-100 text-blue-800',
      delivered: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  const formatTimestamp = (timestamp: string | null) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const formatRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Notification Dashboard</h1>
        <p className="text-gray-600">
          Track delivery status and performance of your notification alerts
        </p>
      </div>

      {/* Period Selector */}
      <div className="mb-6 flex space-x-2">
        {[7, 30, 90].map((days) => (
          <button
            key={days}
            onClick={() => setSelectedPeriod(days as 7 | 30 | 90)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedPeriod === days
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Last {days} Days
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', count: stats?.totalSent },
            { id: 'history', label: 'Recent History', count: recentLogs.length },
            { id: 'failed', label: 'Failed Deliveries', count: failedLogs.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-gray-100">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && stats && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">Total Sent</h3>
                <span className="text-2xl">📬</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.totalSent}</p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.last24Hours} in last 24h
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">Delivered</h3>
                <span className="text-2xl">✅</span>
              </div>
              <p className="text-3xl font-bold text-green-600">{stats.byStatus.delivered}</p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.byStatus.delivered > 0
                  ? `${Math.round((stats.byStatus.delivered / stats.totalSent) * 100)}% rate`
                  : 'No deliveries confirmed'}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">Failed</h3>
                <span className="text-2xl">❌</span>
              </div>
              <p className="text-3xl font-bold text-red-600">{stats.byStatus.failed}</p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.totalSent > 0
                  ? `${Math.round((stats.byStatus.failed / stats.totalSent) * 100)}% failure rate`
                  : 'No failures'}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">Avg Response</h3>
                <span className="text-2xl">⏱️</span>
              </div>
              <p className="text-3xl font-bold text-blue-600">
                {stats.avgResponseTimeMinutes !== null ? `${stats.avgResponseTimeMinutes}m` : 'N/A'}
              </p>
              <p className="text-xs text-gray-500 mt-1">Delivery time (SMS)</p>
            </div>
          </div>

          {/* Channel Breakdown */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">By Channel</h3>
            <div className="space-y-3">
              {Object.entries(stats.byChannel).map(([channel, count]) => (
                <div key={channel} className="flex items-center">
                  <div className="flex items-center space-x-2 w-32">
                    <span>{getChannelIcon(channel)}</span>
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {channel}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="relative h-8 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="absolute h-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-end pr-2"
                        style={{ width: `${(count / stats.totalSent) * 100}%` }}
                      >
                        <span className="text-xs font-bold text-white">{count}</span>
                      </div>
                    </div>
                  </div>
                  <div className="w-16 text-right">
                    <span className="text-sm text-gray-600">
                      {Math.round((count / stats.totalSent) * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Type Breakdown */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">By Alert Type</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {Object.entries(stats.byType).map(([type, count]) => (
                <div key={type} className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-3xl mb-2">{getTypeIcon(type)}</div>
                  <div className="text-2xl font-bold text-gray-900">{count}</div>
                  <div className="text-xs text-gray-600 mt-1 capitalize">
                    {type.replace('_', ' ')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Simple Timeline */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Activity Timeline</h3>
            <div className="flex items-end space-x-1 h-32">
              {timeline.map((point, index) => {
                const maxCount = Math.max(...timeline.map(p => p.count));
                const height = maxCount > 0 ? (point.count / maxCount) * 100 : 0;
                return (
                  <div
                    key={index}
                    className="flex-1 bg-blue-500 rounded-t hover:bg-blue-600 transition-colors cursor-pointer relative group"
                    style={{ height: `${height}%`, minHeight: point.count > 0 ? '4px' : '0' }}
                    title={`${point.date}: ${point.count} notifications`}
                  >
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                      {point.count} on {new Date(point.date).toLocaleDateString()}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>{timeline[0]?.date ? new Date(timeline[0].date).toLocaleDateString() : ''}</span>
              <span>Today</span>
            </div>
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Channel
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recipient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span>{getTypeIcon(log.notificationType)}</span>
                      <span className="text-sm font-medium text-gray-900 capitalize">
                        {log.notificationType.replace('_', ' ')}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span>{getChannelIcon(log.channel)}</span>
                      <span className="text-sm text-gray-700 capitalize">{log.channel}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.patientName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                    {log.recipient.length > 20 ? `${log.recipient.substring(0, 20)}...` : log.recipient}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(log.status)}`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {formatRelativeTime(log.createdAt)}
                  </td>
                </tr>
              ))}
              {recentLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No notifications sent in this period
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Failed Tab */}
      {activeTab === 'failed' && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {failedLogs.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-red-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">
                    Channel
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">
                    Error
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">
                    Failed At
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {failedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-red-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span>{getTypeIcon(log.notificationType)}</span>
                        <span className="text-sm font-medium text-gray-900 capitalize">
                          {log.notificationType.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span>{getChannelIcon(log.channel)}</span>
                        <span className="text-sm text-gray-700 capitalize">{log.channel}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.patientName}
                    </td>
                    <td className="px-6 py-4 text-sm text-red-600">
                      {log.statusMessage || 'Unknown error'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatTimestamp(log.failedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Failed Deliveries</h3>
              <p className="text-gray-600">
                All notifications have been delivered successfully in the selected period.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
