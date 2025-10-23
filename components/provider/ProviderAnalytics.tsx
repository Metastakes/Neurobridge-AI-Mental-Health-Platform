/**
 * INNOVATION: Provider Analytics Dashboard
 * ROI tracking, efficiency metrics, and patient outcomes visualization
 */

import React, { useState, useEffect } from 'react';

interface Metrics {
  aiSoapNotesGenerated: number;
  aiSoapNotesAccepted: number;
  aiSoapNotesModified: number;
  estimatedTimeSavedMinutes: number;
  totalPatients: number;
  activePatients: number;
  averageMoodCheckinsPerPatient: number;
  patientEngagementRate: number;
  crisesDetected: number;
  crisesResolved: number;
  averageResolutionTimeHours: number;
  crisisPreventionRate: number;
  riskAlertsGenerated: number;
  riskAlertsResolved: number;
  averageAlertResolutionDays: number;
  averagePatientMoodImprovement: number;
  medicationAdherenceRate: number;
  totalEncounters: number;
  averageEncounterDurationMinutes: number;
  encountersWithAiSoap: number;
}

interface ROI {
  timeSavings: {
    totalMinutes: number;
    totalHours: string;
    aiSoapNotes: number;
    averagePerNote: number;
  };
  financialImpact: {
    dollarValue: string;
    hourlyRate: number;
    equivalentSessions: number;
  };
  efficiencyGains: {
    aiAdoptionRate: string;
    crisisPreventionRate: string;
    patientEngagementRate: string;
  };
  patientOutcomes: {
    averageMoodImprovement: string;
    medicationAdherence: string;
    activePatients: number;
  };
}

interface PatientOutcome {
  patientId: string;
  patientName: string;
  moodTrend: 'improving' | 'stable' | 'declining';
  currentStreak: number;
  moodChange30d: number;
  lastCheckIn: Date;
  activeAlerts: number;
}

interface Props {
  apiBaseUrl?: string;
}

export default function ProviderAnalytics({ apiBaseUrl = 'http://localhost:3000' }: Props) {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [roi, setRoi] = useState<ROI | null>(null);
  const [insights, setInsights] = useState<string[]>([]);
  const [patients, setPatients] = useState<PatientOutcome[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(30);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');

      // Fetch metrics
      const metricsRes = await fetch(`${apiBaseUrl}/analytics/provider/metrics?days=${period}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (metricsRes.ok) {
        const data = await metricsRes.json();
        setMetrics(data.metrics);
        setInsights(data.insights || []);
      }

      // Fetch ROI
      const roiRes = await fetch(`${apiBaseUrl}/analytics/provider/roi?days=${period}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (roiRes.ok) {
        const data = await roiRes.json();
        setRoi(data.roi);
      }

      // Fetch patient outcomes
      const patientsRes = await fetch(`${apiBaseUrl}/analytics/provider/patients?limit=10`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (patientsRes.ok) {
        const data = await patientsRes.json();
        setPatients(data.patients);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl shadow-2xl p-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">📊 Analytics Dashboard</h1>
              <p className="text-xl opacity-90">Track your efficiency and patient outcomes</p>
            </div>
            <div className="flex gap-2">
              {[7, 30, 90].map(days => (
                <button
                  key={days}
                  onClick={() => setPeriod(days)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    period === days
                      ? 'bg-white text-blue-600'
                      : 'bg-white/20 hover:bg-white/30'
                  }`}
                >
                  {days}d
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* AI Insights */}
        {insights.length > 0 && (
          <div className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-purple-800 mb-3 flex items-center gap-2">
              <span>💡</span>
              AI Insights
            </h3>
            <ul className="space-y-2">
              {insights.map((insight, idx) => (
                <li key={idx} className="flex items-start gap-2 text-purple-700">
                  <span className="text-purple-500 mt-1">•</span>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ROI Cards */}
        {roi && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <ROICard
              title="Time Saved"
              value={`${roi.timeSavings.totalHours}h`}
              subtitle={`${roi.timeSavings.aiSoapNotes} AI SOAP notes`}
              icon="⏱️"
              color="bg-green-500"
            />
            <ROICard
              title="Financial Value"
              value={`$${roi.financialImpact.dollarValue}`}
              subtitle={`≈ ${roi.financialImpact.equivalentSessions} more sessions`}
              icon="💰"
              color="bg-blue-500"
            />
            <ROICard
              title="AI Adoption"
              value={`${roi.efficiencyGains.aiAdoptionRate}%`}
              subtitle="of encounters use AI"
              icon="🤖"
              color="bg-purple-500"
            />
            <ROICard
              title="Crisis Prevention"
              value={`${roi.efficiencyGains.crisisPreventionRate}%`}
              subtitle="successfully resolved"
              icon="🛡️"
              color="bg-red-500"
            />
          </div>
        )}

        {/* Metrics Grid */}
        {metrics && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Patient Engagement */}
            <MetricCard title="Patient Engagement">
              <MetricRow
                label="Total Patients"
                value={metrics.totalPatients}
                icon="👥"
              />
              <MetricRow
                label="Active Patients"
                value={metrics.activePatients}
                subValue={`${(metrics.patientEngagementRate * 100).toFixed(0)}%`}
                icon="✅"
              />
              <MetricRow
                label="Avg Check-ins/Patient"
                value={metrics.averageMoodCheckinsPerPatient.toFixed(1)}
                icon="📝"
              />
              <MetricRow
                label="Medication Adherence"
                value={`${(metrics.medicationAdherenceRate * 100).toFixed(0)}%`}
                icon="💊"
              />
              <MetricRow
                label="Avg Mood Improvement"
                value={metrics.averagePatientMoodImprovement >= 0 ? '+' : ''}
                suffix={metrics.averagePatientMoodImprovement.toFixed(2)}
                icon={metrics.averagePatientMoodImprovement >= 0 ? '📈' : '📉'}
              />
            </MetricCard>

            {/* Crisis & Risk Management */}
            <MetricCard title="Crisis & Risk Management">
              <MetricRow
                label="Crises Detected"
                value={metrics.crisesDetected}
                icon="🚨"
              />
              <MetricRow
                label="Crises Resolved"
                value={metrics.crisesResolved}
                subValue={`${(metrics.crisisPreventionRate * 100).toFixed(0)}%`}
                icon="✓"
              />
              <MetricRow
                label="Avg Resolution Time"
                value={metrics.averageResolutionTimeHours.toFixed(1)}
                suffix="hrs"
                icon="⏰"
              />
              <MetricRow
                label="Risk Alerts Generated"
                value={metrics.riskAlertsGenerated}
                icon="⚠️"
              />
              <MetricRow
                label="Alerts Resolved"
                value={metrics.riskAlertsResolved}
                subValue={`${metrics.averageAlertResolutionDays.toFixed(1)}d avg`}
                icon="✓"
              />
            </MetricCard>

            {/* AI Documentation */}
            <MetricCard title="AI Documentation">
              <MetricRow
                label="AI SOAP Notes"
                value={metrics.aiSoapNotesGenerated}
                icon="🤖"
              />
              <MetricRow
                label="Accepted as-is"
                value={metrics.aiSoapNotesAccepted}
                subValue={`${((metrics.aiSoapNotesAccepted / Math.max(metrics.aiSoapNotesGenerated, 1)) * 100).toFixed(0)}%`}
                icon="✅"
              />
              <MetricRow
                label="Modified by provider"
                value={metrics.aiSoapNotesModified}
                icon="✏️"
              />
              <MetricRow
                label="Total Encounters"
                value={metrics.totalEncounters}
                icon="📋"
              />
              <MetricRow
                label="Avg Duration"
                value={metrics.averageEncounterDurationMinutes.toFixed(0)}
                suffix="min"
                icon="⏱️"
              />
            </MetricCard>

            {/* Time Breakdown */}
            <MetricCard title="Time Investment">
              <div className="space-y-4">
                <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                  <p className="text-sm font-semibold text-green-700 mb-1">Time Saved</p>
                  <p className="text-3xl font-bold text-green-600">
                    {(metrics.estimatedTimeSavedMinutes / 60).toFixed(1)}h
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    ≈ {Math.floor(metrics.estimatedTimeSavedMinutes / 45)} additional sessions
                  </p>
                </div>
                <div className="text-sm text-gray-700 space-y-2">
                  <p>• {metrics.aiSoapNotesGenerated} AI SOAP notes × 15 min each</p>
                  <p>• Could see {Math.floor(metrics.estimatedTimeSavedMinutes / 45)} more patients/period</p>
                  <p>• Avg encounter: {metrics.averageEncounterDurationMinutes.toFixed(0)} min</p>
                </div>
              </div>
            </MetricCard>
          </div>
        )}

        {/* Patient Outcomes Table */}
        {patients.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Patient Outcomes</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Patient</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Trend</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Streak</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">30d Change</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Alerts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {patients.map((patient) => (
                    <tr key={patient.patientId} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-800">
                        {patient.patientName}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                          patient.moodTrend === 'improving' ? 'bg-green-100 text-green-800' :
                          patient.moodTrend === 'declining' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {patient.moodTrend === 'improving' && '↗️ Improving'}
                          {patient.moodTrend === 'stable' && '→ Stable'}
                          {patient.moodTrend === 'declining' && '↘️ Declining'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {patient.currentStreak > 0 ? `🔥 ${patient.currentStreak}d` : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={patient.moodChange30d >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                          {patient.moodChange30d >= 0 ? '+' : ''}{patient.moodChange30d.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {patient.activeAlerts > 0 ? (
                          <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-semibold">
                            ⚠️ {patient.activeAlerts}
                          </span>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ROICard({ title, value, subtitle, icon, color }: {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold text-gray-600">{title}</p>
        <span className={`${color} text-white rounded-full w-10 h-10 flex items-center justify-center text-xl`}>
          {icon}
        </span>
      </div>
      <p className="text-3xl font-bold text-gray-800 mb-1">{value}</p>
      <p className="text-sm text-gray-600">{subtitle}</p>
    </div>
  );
}

function MetricCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4">{title}</h3>
      {children}
    </div>
  );
}

function MetricRow({ label, value, subValue, suffix, icon }: {
  label: string;
  value: string | number;
  subValue?: string;
  suffix?: string;
  icon?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-2">
        {icon && <span className="text-lg">{icon}</span>}
        <span className="text-sm text-gray-700">{label}</span>
      </div>
      <div className="text-right">
        <span className="text-lg font-bold text-gray-800">
          {value}{suffix && ` ${suffix}`}
        </span>
        {subValue && (
          <p className="text-xs text-gray-500">{subValue}</p>
        )}
      </div>
    </div>
  );
}
