/**
 * Patch 04: Mood History Visualization
 * Shows 30-day trend with DSM insights
 */

import React, { useState, useEffect } from 'react';

interface MoodCheckin {
  day: string;
  mood: number;
  sleep: number;
  energy: number;
  focus: number;
  appetite: number;
  motivation: number;
}

interface DsmSummary {
  conditionCode: string;
  confidence: number;
  window: string;
  matchedCriteria: Record<string, number>;
}

interface Props {
  patientId: string;
  apiBaseUrl?: string;
}

export default function MoodHistory({ patientId, apiBaseUrl = 'http://localhost:3000' }: Props) {
  const [checkins, setCheckins] = useState<MoodCheckin[]>([]);
  const [dsmSummary, setDsmSummary] = useState<DsmSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDimension, setSelectedDimension] = useState<keyof MoodCheckin>('mood');

  useEffect(() => {
    fetchData();
  }, [patientId]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('authToken');

      // Fetch mood check-ins
      const checkinsResponse = await fetch(`${apiBaseUrl}/mood/checkins/${patientId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (checkinsResponse.ok) {
        const checkinsData = await checkinsResponse.json();
        setCheckins(checkinsData.checkins || []);
      }

      // Fetch DSM summary
      const dsmResponse = await fetch(`${apiBaseUrl}/mood/summary/${patientId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (dsmResponse.ok) {
        const dsmData = await dsmResponse.json();
        const summary30d = dsmData.summaries?.find((s: any) => s.window === '30d');
        setDsmSummary(summary30d || null);
      }
    } catch (error) {
      console.error('Failed to fetch mood history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const dimensions = [
    { key: 'mood' as const, label: 'Mood', emoji: '😊', color: 'bg-blue-500' },
    { key: 'sleep' as const, label: 'Sleep', emoji: '😴', color: 'bg-purple-500' },
    { key: 'energy' as const, label: 'Energy', emoji: '⚡', color: 'bg-yellow-500' },
    { key: 'focus' as const, label: 'Focus', emoji: '🎯', color: 'bg-indigo-500' },
    { key: 'appetite' as const, label: 'Appetite', emoji: '🍽️', color: 'bg-orange-500' },
    { key: 'motivation' as const, label: 'Motivation', emoji: '🔥', color: 'bg-red-500' },
  ];

  const getColorForValue = (value: number): string => {
    if (value <= -1.5) return 'bg-red-500';
    if (value <= -0.5) return 'bg-orange-500';
    if (value <= 0.5) return 'bg-gray-400';
    if (value <= 1.5) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getHeightPercentage = (value: number): number => {
    // Convert -2 to +2 scale to 0-100%
    return ((value + 2) / 4) * 100;
  };

  return (
    <div className="space-y-6">
      {/* DSM Intelligence Banner */}
      {dsmSummary && (
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl shadow-lg p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">AI Insights (30 Days)</h3>
              <p className="text-lg opacity-90">
                Pattern: <strong>{dsmSummary.conditionCode || 'Analyzing...'}</strong>
              </p>
              {dsmSummary.confidence && (
                <p className="text-sm opacity-80">
                  Confidence: {Math.round(dsmSummary.confidence * 100)}%
                </p>
              )}
            </div>
            <div className="text-5xl">🧠</div>
          </div>

          {dsmSummary.matchedCriteria && (
            <div className="mt-4 pt-4 border-t border-white/20">
              <p className="text-sm font-semibold mb-2">Matched Criteria:</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(dsmSummary.matchedCriteria).map(([criterion, count]) => (
                  <span
                    key={criterion}
                    className="bg-white/20 px-3 py-1 rounded-full text-xs font-medium"
                  >
                    {criterion}: {count}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dimension Selector */}
      <div className="bg-white rounded-2xl shadow-lg p-4">
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {dimensions.map((dim) => (
            <button
              key={dim.key}
              onClick={() => setSelectedDimension(dim.key)}
              className={`
                ${selectedDimension === dim.key ? 'ring-4 ring-purple-500 scale-105' : 'hover:scale-105'}
                bg-gray-50 rounded-xl p-3 transition-all duration-200 transform
                flex flex-col items-center gap-1
              `}
            >
              <span className="text-2xl">{dim.emoji}</span>
              <span className="text-xs font-semibold text-gray-700">{dim.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Mood Chart */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">
          {dimensions.find((d) => d.key === selectedDimension)?.label} Trend (30 Days)
        </h3>

        {checkins.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg mb-2">No check-ins yet</p>
            <p className="text-sm">Start tracking your mood to see trends</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Chart */}
            <div className="flex items-end justify-between gap-1 h-48 border-b-2 border-gray-300 pb-1">
              {checkins.slice(-30).map((checkin, index) => {
                const value = checkin[selectedDimension];
                const height = getHeightPercentage(value);
                const color = getColorForValue(value);

                return (
                  <div
                    key={index}
                    className="flex-1 flex flex-col items-center justify-end group cursor-pointer"
                    title={`${new Date(checkin.day).toLocaleDateString()}: ${value > 0 ? '+' : ''}${value}`}
                  >
                    <div
                      className={`${color} w-full rounded-t transition-all duration-300 group-hover:opacity-80`}
                      style={{ height: `${height}%`, minHeight: '4px' }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span className="text-gray-600">Very Low</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-orange-500 rounded"></div>
                <span className="text-gray-600">Low</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-gray-400 rounded"></div>
                <span className="text-gray-600">Neutral</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span className="text-gray-600">Good</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span className="text-gray-600">Great</span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-800">
                  {checkins.length}
                </p>
                <p className="text-xs text-gray-600">Total Check-ins</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-800">
                  {checkins.length > 0
                    ? (
                        checkins.reduce((sum, c) => sum + c[selectedDimension], 0) /
                        checkins.length
                      ).toFixed(1)
                    : '0'}
                </p>
                <p className="text-xs text-gray-600">Average</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-800">
                  {checkins.length > 0
                    ? checkins.slice(-7).reduce((sum, c) => sum + c[selectedDimension], 0) /
                      Math.min(7, checkins.length)
                    : '0'}
                </p>
                <p className="text-xs text-gray-600">7-Day Avg</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
