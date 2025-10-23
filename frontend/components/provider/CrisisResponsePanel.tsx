/**
 * Crisis Response Panel
 * Comprehensive UI for providers to respond to mental health crises
 * Displays patient context, risk indicators, quick actions, and intervention tools
 */

'use client';

import React, { useState, useEffect } from 'react';

// Types
export interface CrisisAlert {
  id: string;
  patientId: string;
  patientName: string;
  detectedAt: string;
  severity: 'critical' | 'high' | 'medium';
  riskScore: number;
  indicators: string[];
  triggerEvent?: {
    type: string;
    content: string;
    timestamp: string;
  };
  emergencyContacts?: Array<{
    id: string;
    name: string;
    relationship: string;
    phone: string;
    isPrimary: boolean;
  }>;
  safetyPlan?: {
    warningSigns: string[];
    copingStrategies: string[];
    professionalSupport: string[];
    emergencyNumbers: string[];
  };
  recentActivity?: {
    lastMoodCheck?: {
      mood: string;
      timestamp: string;
      notes?: string;
    };
    lastAppointment?: {
      date: string;
      type: string;
    };
    medicationCompliance?: {
      status: 'compliant' | 'partial' | 'non-compliant';
      missedDoses: number;
    };
  };
}

export interface CrisisIntervention {
  crisisId: string;
  providerId: string;
  timestamp: string;
  actionsTaken: string[];
  notes: string;
  contactedEmergencyServices: boolean;
  contactedEmergencyContact: boolean;
  scheduledFollowUp: boolean;
  followUpDate?: string;
  resolution: 'resolved' | 'ongoing' | 'escalated';
  resolutionNotes?: string;
}

interface CrisisResponsePanelProps {
  crisisId: string;
  onClose?: () => void;
  onResolved?: (intervention: CrisisIntervention) => void;
}

export function CrisisResponsePanel({
  crisisId,
  onClose,
  onResolved,
}: CrisisResponsePanelProps) {
  const [crisis, setCrisis] = useState<CrisisAlert | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Intervention state
  const [interventionNotes, setInterventionNotes] = useState('');
  const [actionsTaken, setActionsTaken] = useState<Set<string>>(new Set());
  const [contactedEmergencyServices, setContactedEmergencyServices] = useState(false);
  const [contactedEmergencyContact, setContactedEmergencyContact] = useState(false);
  const [scheduledFollowUp, setScheduledFollowUp] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');
  const [resolution, setResolution] = useState<'resolved' | 'ongoing' | 'escalated'>('ongoing');
  const [resolutionNotes, setResolutionNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'safety-plan' | 'intervention'>('overview');

  useEffect(() => {
    loadCrisisDetails();
  }, [crisisId]);

  const loadCrisisDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

      const response = await fetch(`${apiBaseUrl}/crisis/alerts/${crisisId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load crisis details');
      }

      const data = await response.json();
      setCrisis(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load crisis details');
      console.error('Error loading crisis:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleAction = (action: string) => {
    setActionsTaken(prev => {
      const next = new Set(prev);
      if (next.has(action)) {
        next.delete(action);
      } else {
        next.add(action);
      }
      return next;
    });
  };

  const handleSubmitIntervention = async () => {
    if (!crisis) return;

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

      const intervention: Omit<CrisisIntervention, 'providerId' | 'timestamp'> = {
        crisisId: crisis.id,
        actionsTaken: Array.from(actionsTaken),
        notes: interventionNotes,
        contactedEmergencyServices,
        contactedEmergencyContact,
        scheduledFollowUp,
        followUpDate: scheduledFollowUp ? followUpDate : undefined,
        resolution,
        resolutionNotes: resolution !== 'ongoing' ? resolutionNotes : undefined,
      };

      const response = await fetch(`${apiBaseUrl}/crisis/interventions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(intervention),
      });

      if (!response.ok) {
        throw new Error('Failed to submit intervention');
      }

      const savedIntervention = await response.json();

      if (onResolved) {
        onResolved(savedIntervention);
      }

      // Show success message
      alert('Crisis intervention documented successfully');

      if (onClose) {
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit intervention');
      console.error('Error submitting intervention:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-600 text-white';
      case 'high':
        return 'bg-orange-600 text-white';
      case 'medium':
        return 'bg-yellow-600 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading crisis details...</p>
        </div>
      </div>
    );
  }

  if (error || !crisis) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md">
          <div className="text-red-600 text-5xl mb-4 text-center">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2 text-center">Error Loading Crisis</h2>
          <p className="text-gray-600 text-center mb-4">{error || 'Crisis not found'}</p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-lg shadow-lg p-6 mb-6 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-6xl">🚨</div>
              <div>
                <h1 className="text-3xl font-bold mb-2">CRISIS ALERT</h1>
                <p className="text-red-100 text-lg">
                  Patient: <span className="font-semibold">{crisis.patientName}</span>
                </p>
                <p className="text-red-100 text-sm">
                  Detected: {formatDate(crisis.detectedAt)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className={`inline-block px-4 py-2 rounded-lg font-bold text-lg mb-2 ${getSeverityColor(crisis.severity)}`}>
                {crisis.severity.toUpperCase()}
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg px-4 py-2">
                <div className="text-sm text-red-100">Risk Score</div>
                <div className="text-3xl font-bold">{crisis.riskScore}/100</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-t-lg shadow-md border-b border-gray-200">
          <div className="flex space-x-1">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'safety-plan', label: 'Safety Plan', icon: '🛡️' },
              { id: 'intervention', label: 'Intervention', icon: '💊' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-b-lg shadow-md p-6 mb-6">
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Risk Indicators */}
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                  <span className="text-2xl mr-2">⚠️</span>
                  Detected Risk Indicators
                </h2>
                <div className="grid grid-cols-1 gap-3">
                  {crisis.indicators.map((indicator, index) => (
                    <div
                      key={index}
                      className="bg-red-50 border-l-4 border-red-600 p-4 rounded"
                    >
                      <div className="flex items-start">
                        <span className="text-red-600 font-bold mr-2">{index + 1}.</span>
                        <p className="text-gray-800">{indicator}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trigger Event */}
              {crisis.triggerEvent && (
                <div>
                  <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <span className="text-2xl mr-2">🔔</span>
                    Trigger Event
                  </h2>
                  <div className="bg-yellow-50 border-l-4 border-yellow-600 p-4 rounded">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-yellow-800">
                        {crisis.triggerEvent.type}
                      </span>
                      <span className="text-sm text-yellow-700">
                        {formatDate(crisis.triggerEvent.timestamp)}
                      </span>
                    </div>
                    <p className="text-gray-700 italic">"{crisis.triggerEvent.content}"</p>
                  </div>
                </div>
              )}

              {/* Emergency Contacts */}
              {crisis.emergencyContacts && crisis.emergencyContacts.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <span className="text-2xl mr-2">📞</span>
                    Emergency Contacts
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {crisis.emergencyContacts.map((contact) => (
                      <div
                        key={contact.id}
                        className={`border-2 rounded-lg p-4 ${
                          contact.isPrimary
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-300 bg-white'
                        }`}
                      >
                        {contact.isPrimary && (
                          <div className="text-xs font-bold text-blue-600 mb-2">
                            PRIMARY CONTACT
                          </div>
                        )}
                        <div className="font-bold text-gray-800 text-lg mb-1">
                          {contact.name}
                        </div>
                        <div className="text-gray-600 text-sm mb-2">
                          {contact.relationship}
                        </div>
                        <a
                          href={`tel:${contact.phone}`}
                          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                        >
                          <span className="mr-2">📞</span>
                          {formatPhoneNumber(contact.phone)}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Activity */}
              {crisis.recentActivity && (
                <div>
                  <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <span className="text-2xl mr-2">📈</span>
                    Recent Activity
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {crisis.recentActivity.lastMoodCheck && (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <div className="text-purple-600 font-semibold mb-2">Last Mood Check</div>
                        <div className="text-2xl mb-1">{crisis.recentActivity.lastMoodCheck.mood}</div>
                        <div className="text-sm text-gray-600">
                          {formatDate(crisis.recentActivity.lastMoodCheck.timestamp)}
                        </div>
                        {crisis.recentActivity.lastMoodCheck.notes && (
                          <p className="text-sm text-gray-700 mt-2 italic">
                            "{crisis.recentActivity.lastMoodCheck.notes}"
                          </p>
                        )}
                      </div>
                    )}

                    {crisis.recentActivity.lastAppointment && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="text-blue-600 font-semibold mb-2">Last Appointment</div>
                        <div className="text-lg mb-1">{crisis.recentActivity.lastAppointment.type}</div>
                        <div className="text-sm text-gray-600">
                          {formatDate(crisis.recentActivity.lastAppointment.date)}
                        </div>
                      </div>
                    )}

                    {crisis.recentActivity.medicationCompliance && (
                      <div className={`border rounded-lg p-4 ${
                        crisis.recentActivity.medicationCompliance.status === 'compliant'
                          ? 'bg-green-50 border-green-200'
                          : crisis.recentActivity.medicationCompliance.status === 'partial'
                          ? 'bg-yellow-50 border-yellow-200'
                          : 'bg-red-50 border-red-200'
                      }`}>
                        <div className={`font-semibold mb-2 ${
                          crisis.recentActivity.medicationCompliance.status === 'compliant'
                            ? 'text-green-600'
                            : crisis.recentActivity.medicationCompliance.status === 'partial'
                            ? 'text-yellow-600'
                            : 'text-red-600'
                        }`}>
                          Medication Compliance
                        </div>
                        <div className="text-lg mb-1 capitalize">
                          {crisis.recentActivity.medicationCompliance.status}
                        </div>
                        {crisis.recentActivity.medicationCompliance.missedDoses > 0 && (
                          <div className="text-sm text-gray-600">
                            {crisis.recentActivity.medicationCompliance.missedDoses} missed doses
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SAFETY PLAN TAB */}
          {activeTab === 'safety-plan' && (
            <div className="space-y-6">
              {crisis.safetyPlan ? (
                <>
                  {/* Warning Signs */}
                  {crisis.safetyPlan.warningSigns.length > 0 && (
                    <div>
                      <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                        <span className="text-2xl mr-2">⚠️</span>
                        Warning Signs
                      </h2>
                      <ul className="space-y-2">
                        {crisis.safetyPlan.warningSigns.map((sign, index) => (
                          <li key={index} className="flex items-start bg-yellow-50 p-3 rounded">
                            <span className="text-yellow-600 mr-2">•</span>
                            <span className="text-gray-800">{sign}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Coping Strategies */}
                  {crisis.safetyPlan.copingStrategies.length > 0 && (
                    <div>
                      <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                        <span className="text-2xl mr-2">🧘</span>
                        Coping Strategies
                      </h2>
                      <ul className="space-y-2">
                        {crisis.safetyPlan.copingStrategies.map((strategy, index) => (
                          <li key={index} className="flex items-start bg-green-50 p-3 rounded">
                            <span className="text-green-600 mr-2">✓</span>
                            <span className="text-gray-800">{strategy}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Professional Support */}
                  {crisis.safetyPlan.professionalSupport.length > 0 && (
                    <div>
                      <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                        <span className="text-2xl mr-2">👨‍⚕️</span>
                        Professional Support
                      </h2>
                      <ul className="space-y-2">
                        {crisis.safetyPlan.professionalSupport.map((support, index) => (
                          <li key={index} className="flex items-start bg-blue-50 p-3 rounded">
                            <span className="text-blue-600 mr-2">•</span>
                            <span className="text-gray-800">{support}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Emergency Numbers */}
                  {crisis.safetyPlan.emergencyNumbers.length > 0 && (
                    <div>
                      <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                        <span className="text-2xl mr-2">📞</span>
                        Emergency Numbers
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {crisis.safetyPlan.emergencyNumbers.map((number, index) => (
                          <a
                            key={index}
                            href={`tel:${number}`}
                            className="flex items-center justify-between bg-red-50 border-2 border-red-200 p-4 rounded-lg hover:bg-red-100 transition-colors"
                          >
                            <span className="font-medium text-gray-800">{number}</span>
                            <span className="text-red-600">📞</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📋</div>
                  <p className="text-gray-600 text-lg">No safety plan on file for this patient</p>
                  <button className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Create Safety Plan
                  </button>
                </div>
              )}
            </div>
          )}

          {/* INTERVENTION TAB */}
          {activeTab === 'intervention' && (
            <div className="space-y-6">
              {/* Quick Actions */}
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                  <span className="text-2xl mr-2">⚡</span>
                  Quick Actions
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { id: 'called_patient', label: 'Called Patient', icon: '📞' },
                    { id: 'called_emergency_contact', label: 'Called Emergency Contact', icon: '👥' },
                    { id: 'contacted_911', label: 'Contacted 911', icon: '🚑' },
                    { id: 'scheduled_urgent_appointment', label: 'Scheduled Urgent Appointment', icon: '📅' },
                    { id: 'reviewed_safety_plan', label: 'Reviewed Safety Plan', icon: '🛡️' },
                    { id: 'updated_medications', label: 'Updated Medications', icon: '💊' },
                    { id: 'sent_crisis_resources', label: 'Sent Crisis Resources', icon: '📚' },
                    { id: 'notified_supervisor', label: 'Notified Supervisor', icon: '👔' },
                  ].map((action) => (
                    <button
                      key={action.id}
                      onClick={() => toggleAction(action.id)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        actionsTaken.has(action.id)
                          ? 'bg-blue-600 text-white border-blue-600 shadow-lg'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                      }`}
                    >
                      <div className="text-3xl mb-2">{action.icon}</div>
                      <div className="text-sm font-medium">{action.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Emergency Services Contacted */}
              <div>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={contactedEmergencyServices}
                    onChange={(e) => setContactedEmergencyServices(e.target.checked)}
                    className="w-5 h-5 text-red-600"
                  />
                  <span className="text-lg font-medium text-gray-800">
                    Emergency Services Contacted (911, Crisis Line, etc.)
                  </span>
                </label>
              </div>

              {/* Emergency Contact Contacted */}
              <div>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={contactedEmergencyContact}
                    onChange={(e) => setContactedEmergencyContact(e.target.checked)}
                    className="w-5 h-5 text-blue-600"
                  />
                  <span className="text-lg font-medium text-gray-800">
                    Emergency Contact Notified
                  </span>
                </label>
              </div>

              {/* Follow-up Scheduled */}
              <div>
                <label className="flex items-center space-x-3 cursor-pointer mb-3">
                  <input
                    type="checkbox"
                    checked={scheduledFollowUp}
                    onChange={(e) => setScheduledFollowUp(e.target.checked)}
                    className="w-5 h-5 text-green-600"
                  />
                  <span className="text-lg font-medium text-gray-800">
                    Follow-up Appointment Scheduled
                  </span>
                </label>

                {scheduledFollowUp && (
                  <div className="ml-8">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Follow-up Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      value={followUpDate}
                      onChange={(e) => setFollowUpDate(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                )}
              </div>

              {/* Intervention Notes */}
              <div>
                <label className="block text-lg font-bold text-gray-800 mb-2">
                  Intervention Notes
                </label>
                <textarea
                  value={interventionNotes}
                  onChange={(e) => setInterventionNotes(e.target.value)}
                  rows={8}
                  placeholder="Document your intervention, actions taken, patient response, clinical assessment, and any immediate concerns..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>

              {/* Resolution Status */}
              <div>
                <label className="block text-lg font-bold text-gray-800 mb-3">
                  Resolution Status
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'resolved', label: 'Resolved', color: 'green', icon: '✅' },
                    { value: 'ongoing', label: 'Ongoing', color: 'yellow', icon: '⏳' },
                    { value: 'escalated', label: 'Escalated', color: 'red', icon: '🚨' },
                  ].map((status) => (
                    <button
                      key={status.value}
                      onClick={() => setResolution(status.value as any)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        resolution === status.value
                          ? `bg-${status.color}-600 text-white border-${status.color}-600 shadow-lg`
                          : `bg-white text-gray-700 border-gray-300 hover:border-${status.color}-400`
                      }`}
                    >
                      <div className="text-3xl mb-2">{status.icon}</div>
                      <div className="font-medium">{status.label}</div>
                    </button>
                  ))}
                </div>

                {resolution !== 'ongoing' && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Resolution Notes
                    </label>
                    <textarea
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      rows={4}
                      placeholder="Describe the resolution or escalation details..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    />
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitIntervention}
                  disabled={submitting || !interventionNotes.trim()}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-bold text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting...' : 'Document Intervention'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Warning */}
        <div className="bg-yellow-50 border-l-4 border-yellow-600 rounded-lg p-4">
          <div className="flex items-start">
            <span className="text-yellow-600 text-2xl mr-3">⚠️</span>
            <div>
              <p className="font-semibold text-yellow-800 mb-1">Important Reminder</p>
              <p className="text-sm text-yellow-700">
                Always follow your organization's crisis intervention protocols. If you believe the patient
                is in immediate danger, contact emergency services (911) immediately. This tool is for
                documentation purposes and does not replace professional clinical judgment.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
