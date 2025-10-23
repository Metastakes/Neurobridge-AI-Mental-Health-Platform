/**
 * INNOVATION: Provider Crisis Management Dashboard
 * Real-time view of patients in crisis with emergency contact information
 */

import React, { useState, useEffect } from 'react';

interface EmergencyPatient {
  patientId: string;
  name: string;
  email: string | null;
  phone: string | null;
  emergencyContact: string | null;
  emergencyPhone: string | null;
  latestAlert: {
    id: string;
    kind: string;
    severity: string;
    message: string;
    source: any;
    createdAt: string;
  } | null;
}

interface CrisisDashboardData {
  summary: {
    activeEmergencies: number;
    recentCrises24h: number;
    unresolvedCrises: number;
  };
  emergencyPatients: EmergencyPatient[];
}

interface Props {
  apiBaseUrl?: string;
}

export default function ProviderCrisisDashboard({ apiBaseUrl = 'http://localhost:3000' }: Props) {
  const [dashboard, setDashboard] = useState<CrisisDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [resolvingAlertId, setResolvingAlertId] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<EmergencyPatient | null>(null);

  useEffect(() => {
    fetchDashboard();
    // Refresh every 2 minutes
    const interval = setInterval(fetchDashboard, 120000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${apiBaseUrl}/crisis/dashboard/provider`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDashboard(data);
      }
    } catch (error) {
      console.error('Failed to fetch crisis dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const resolveAlert = async (alertId: string, notes: string, actionTaken: string) => {
    setResolvingAlertId(alertId);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${apiBaseUrl}/crisis/alerts/${alertId}/resolve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes, actionTaken }),
      });

      if (!response.ok) {
        throw new Error('Failed to resolve alert');
      }

      // Refresh dashboard
      await fetchDashboard();
      setSelectedPatient(null);
    } catch (error) {
      console.error('Failed to resolve alert:', error);
      alert('Failed to resolve alert. Please try again.');
    } finally {
      setResolvingAlertId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-600">Failed to load crisis dashboard</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-2xl shadow-2xl p-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                <span>🚨</span>
                Crisis Dashboard
              </h1>
              <p className="text-xl opacity-90">Active emergencies requiring immediate attention</p>
            </div>
            <button
              onClick={fetchDashboard}
              className="bg-white text-red-600 font-bold px-6 py-3 rounded-lg hover:bg-gray-100 transition-all shadow-lg"
            >
              🔄 Refresh
            </button>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-white/20 rounded-xl p-4 text-center">
              <div className="text-4xl font-bold">{dashboard.summary.activeEmergencies}</div>
              <p className="text-sm opacity-80 mt-1">Active Emergencies</p>
            </div>
            <div className="bg-white/20 rounded-xl p-4 text-center">
              <div className="text-4xl font-bold">{dashboard.summary.recentCrises24h}</div>
              <p className="text-sm opacity-80 mt-1">Crises (24h)</p>
            </div>
            <div className="bg-white/20 rounded-xl p-4 text-center">
              <div className="text-4xl font-bold">{dashboard.summary.unresolvedCrises}</div>
              <p className="text-sm opacity-80 mt-1">Unresolved</p>
            </div>
          </div>
        </div>

        {/* Emergency Patients */}
        {dashboard.emergencyPatients.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">No Active Crises</h3>
            <p className="text-gray-600">All patients are stable at this time</p>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800">Patients Requiring Attention</h2>
            {dashboard.emergencyPatients.map((patient) => (
              <PatientCrisisCard
                key={patient.patientId}
                patient={patient}
                onViewDetails={() => setSelectedPatient(patient)}
              />
            ))}
          </div>
        )}

        {/* Patient Detail Modal */}
        {selectedPatient && (
          <PatientDetailModal
            patient={selectedPatient}
            onClose={() => setSelectedPatient(null)}
            onResolve={resolveAlert}
            isResolving={resolvingAlertId === selectedPatient.latestAlert?.id}
          />
        )}
      </div>
    </div>
  );
}

function PatientCrisisCard({
  patient,
  onViewDetails,
}: {
  patient: EmergencyPatient;
  onViewDetails: () => void;
}) {
  const getSeverityColor = (severity: string) => {
    if (severity === 'CRITICAL') return 'bg-red-100 border-red-500 text-red-800';
    if (severity === 'HIGH') return 'bg-orange-100 border-orange-500 text-orange-800';
    return 'bg-yellow-100 border-yellow-500 text-yellow-800';
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border-2 border-red-300 p-6 hover:shadow-2xl transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-2xl font-bold text-gray-800 mb-1">{patient.name}</h3>
          {patient.latestAlert && (
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${getSeverityColor(patient.latestAlert.severity)}`}
              >
                {patient.latestAlert.severity}
              </span>
              <span className="text-sm text-gray-600">
                {new Date(patient.latestAlert.createdAt).toLocaleString()}
              </span>
            </div>
          )}
          {patient.latestAlert && (
            <p className="text-gray-700 font-medium">{patient.latestAlert.message}</p>
          )}
        </div>
      </div>

      {/* Contact Information */}
      <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <p className="text-xs font-semibold text-gray-600 mb-1">Patient Contact</p>
          {patient.phone && (
            <a href={`tel:${patient.phone}`} className="text-blue-600 font-semibold hover:underline block">
              📞 {patient.phone}
            </a>
          )}
          {patient.email && (
            <a href={`mailto:${patient.email}`} className="text-blue-600 hover:underline block text-sm">
              ✉️ {patient.email}
            </a>
          )}
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-600 mb-1">Emergency Contact</p>
          {patient.emergencyContact && (
            <p className="text-gray-800 font-medium">{patient.emergencyContact}</p>
          )}
          {patient.emergencyPhone && (
            <a href={`tel:${patient.emergencyPhone}`} className="text-red-600 font-bold hover:underline block">
              🚨 {patient.emergencyPhone}
            </a>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onViewDetails}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all"
        >
          View Details & Resolve
        </button>
        {patient.phone && (
          <a
            href={`tel:${patient.phone}`}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-all"
          >
            📞 Call Now
          </a>
        )}
      </div>
    </div>
  );
}

function PatientDetailModal({
  patient,
  onClose,
  onResolve,
  isResolving,
}: {
  patient: EmergencyPatient;
  onClose: () => void;
  onResolve: (alertId: string, notes: string, actionTaken: string) => void;
  isResolving: boolean;
}) {
  const [notes, setNotes] = useState('');
  const [actionTaken, setActionTaken] = useState('');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-red-600 to-pink-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">{patient.name} - Crisis Details</h2>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition-all"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Alert Evidence */}
          {patient.latestAlert && patient.latestAlert.source?.indicators && (
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-gray-800">Crisis Indicators</h3>
              {patient.latestAlert.source.indicators.map((indicator: any, idx: number) => (
                <div key={idx} className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                  <p className="font-bold text-red-800">{indicator.type.replace(/_/g, ' ').toUpperCase()}</p>
                  <p className="text-gray-700 mt-1">{indicator.message}</p>
                  <pre className="text-xs text-gray-600 mt-2 bg-white p-2 rounded overflow-x-auto">
                    {JSON.stringify(indicator.evidence, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          )}

          {/* Resolution Form */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-800">Resolution</h3>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Action Taken
              </label>
              <select
                value={actionTaken}
                onChange={(e) => setActionTaken(e.target.value)}
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select action...</option>
                <option value="contacted_patient">Contacted patient directly</option>
                <option value="contacted_emergency">Contacted emergency contact</option>
                <option value="scheduled_session">Scheduled emergency session</option>
                <option value="referred_emergency">Referred to emergency services</option>
                <option value="safety_plan_updated">Updated safety plan</option>
                <option value="medication_adjusted">Adjusted medications</option>
                <option value="false_positive">False positive / Patient stable</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Document your intervention and outcome..."
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500"
                rows={4}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (!actionTaken) {
                    alert('Please select an action taken');
                    return;
                  }
                  if (patient.latestAlert) {
                    onResolve(patient.latestAlert.id, notes, actionTaken);
                  }
                }}
                disabled={isResolving || !actionTaken}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isResolving ? 'Resolving...' : 'Mark as Resolved'}
              </button>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
