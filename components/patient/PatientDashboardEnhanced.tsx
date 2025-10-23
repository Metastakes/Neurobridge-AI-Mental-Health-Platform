/**
 * Patch 04: Enhanced Patient Dashboard
 * Integrates mood check-ins, DSM insights, risk alerts, and tasks
 */

import React, { useState, useEffect } from 'react';
import MoodCheckIn from './MoodCheckIn';
import MoodHistory from './MoodHistory';
import PharmacologyTasks from './PharmacologyTasks';

interface RiskAlert {
  id: string;
  kind: string;
  severity: 'LOW' | 'MODERATE' | 'HIGH';
  message: string;
  createdAt: string;
}

interface Stats {
  currentStreak: number;
  longestStreak: number;
  totalCheckins: number;
  checkedInToday: boolean;
  averageMood: number;
}

interface Props {
  patientId: string;
  patientName: string;
  totalPoints: number;
  apiBaseUrl?: string;
}

export default function PatientDashboardEnhanced({
  patientId,
  patientName,
  totalPoints,
  apiBaseUrl = 'http://localhost:3000',
}: Props) {
  const [view, setView] = useState<'home' | 'checkin' | 'history' | 'tasks'>('home');
  const [stats, setStats] = useState<Stats | null>(null);
  const [alerts, setAlerts] = useState<RiskAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [patientId]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('authToken');

      // Fetch mood stats
      const statsResponse = await fetch(`${apiBaseUrl}/mood/stats/${patientId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Fetch risk alerts (would need to add this endpoint)
      // For now, using placeholder
      setAlerts([]);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (view === 'checkin') {
    return (
      <MoodCheckIn
        patientId={patientId}
        apiBaseUrl={apiBaseUrl}
        onComplete={() => {
          setView('home');
          fetchDashboardData();
        }}
      />
    );
  }

  if (view === 'history') {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => setView('home')}
            className="mb-4 text-purple-600 hover:text-purple-700 font-semibold flex items-center gap-2"
          >
            ← Back to Dashboard
          </button>
          <MoodHistory patientId={patientId} apiBaseUrl={apiBaseUrl} />
        </div>
      </div>
    );
  }

  if (view === 'tasks') {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => setView('home')}
            className="mb-4 text-purple-600 hover:text-purple-700 font-semibold flex items-center gap-2"
          >
            ← Back to Dashboard
          </button>
          <PharmacologyTasks patientId={patientId} apiBaseUrl={apiBaseUrl} />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const firstName = patientName.split(' ')[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6 pb-20">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-3xl shadow-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-1">Hello, {firstName}! 👋</h1>
              <p className="opacity-90">How are you feeling today?</p>
            </div>
            <div className="text-center bg-white/20 rounded-2xl px-6 py-3">
              <div className="text-3xl font-bold">{totalPoints}</div>
              <p className="text-sm opacity-80">Points</p>
            </div>
          </div>

          {/* Streak Display */}
          {stats && stats.currentStreak > 0 && (
            <div className="bg-white/10 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-4xl">🔥</span>
                <div>
                  <p className="text-2xl font-bold">{stats.currentStreak} Day Streak</p>
                  <p className="text-sm opacity-80">Keep it going!</p>
                </div>
              </div>
              {stats.longestStreak > stats.currentStreak && (
                <div className="text-right">
                  <p className="text-sm opacity-80">Best</p>
                  <p className="text-xl font-bold">{stats.longestStreak}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Risk Alerts */}
        {alerts.length > 0 && (
          <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-5">
            <h3 className="text-lg font-bold text-red-800 mb-3 flex items-center gap-2">
              <span>⚠️</span>
              Important Alerts
            </h3>
            <div className="space-y-2">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="bg-white rounded-lg p-3 border border-red-200"
                >
                  <p className="font-semibold text-red-700">{alert.message}</p>
                  <p className="text-xs text-red-600 mt-1">
                    {new Date(alert.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Daily Check-In Card */}
        <div className="bg-white rounded-3xl shadow-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-1">Daily Check-In</h2>
              <p className="text-gray-600">
                {stats?.checkedInToday
                  ? '✅ Completed today'
                  : 'Track your mood and earn points'}
              </p>
            </div>
            <div className="text-5xl">
              {stats?.checkedInToday ? '✨' : '📝'}
            </div>
          </div>

          {!stats?.checkedInToday ? (
            <button
              onClick={() => setView('checkin')}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-4 px-6 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-xl"
            >
              Start Check-In (+10 points)
            </button>
          ) : (
            <div className="bg-green-50 border-2 border-green-300 rounded-xl p-4 text-center">
              <p className="text-green-700 font-semibold">
                Great job! You've checked in today. Come back tomorrow!
              </p>
            </div>
          )}
        </div>

        {/* Quick Stats Grid */}
        {stats && (
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl shadow-lg p-4 text-center">
              <div className="text-3xl font-bold text-purple-600">
                {stats.totalCheckins}
              </div>
              <p className="text-sm text-gray-600 mt-1">Total Check-ins</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-4 text-center">
              <div className="text-3xl font-bold text-blue-600">
                {stats.averageMood > 0 ? '+' : ''}{stats.averageMood.toFixed(1)}
              </div>
              <p className="text-sm text-gray-600 mt-1">Avg Mood</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-4 text-center">
              <div className="text-3xl font-bold text-orange-600">
                {stats.longestStreak}
              </div>
              <p className="text-sm text-gray-600 mt-1">Best Streak</p>
            </div>
          </div>
        )}

        {/* Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => setView('history')}
            className="bg-white rounded-2xl shadow-lg p-6 text-left hover:shadow-xl transition-all border-2 border-transparent hover:border-purple-300"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">📊</span>
              <h3 className="text-xl font-bold text-gray-800">Mood History</h3>
            </div>
            <p className="text-gray-600 text-sm">
              View your trends and AI insights
            </p>
          </button>

          <button
            onClick={() => setView('tasks')}
            className="bg-white rounded-2xl shadow-lg p-6 text-left hover:shadow-xl transition-all border-2 border-transparent hover:border-purple-300"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">💊</span>
              <h3 className="text-xl font-bold text-gray-800">Med Tasks</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Complete tasks and earn points
            </p>
          </button>
        </div>

        {/* Motivational Quote */}
        <div className="bg-gradient-to-r from-blue-400 to-purple-500 text-white rounded-2xl shadow-lg p-6 text-center">
          <p className="text-lg italic mb-2">
            "Every small step counts on your journey to wellness."
          </p>
          <p className="text-sm opacity-80">Keep up the great work! 💪</p>
        </div>
      </div>
    </div>
  );
}
