/**
 * Patch 04A: Provider Quick-Chart UI
 * Comprehensive encounter view with risk alerts, DSM intelligence, and AI co-pilot
 */

import React, { useState, useEffect } from 'react';
import Lottie from 'lottie-react';
import taskCompleteAnimation from '../../public/lottie/task_complete.json';

interface DiagnosisChip {
  icdCode: string;
  description: string;
}

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  prescribedAt: string;
}

interface RiskAlert {
  kind: string;
  severity: 'LOW' | 'MODERATE' | 'HIGH';
  message: string;
  createdAt: string;
}

interface DsmBanner {
  conditionCode: string;
  confidence: number;
  window: string;
}

interface EncounterOverview {
  patient: {
    firstName: string;
    lastName: string;
    age: number;
    allergies: string[];
  };
  diagnoses: DiagnosisChip[];
  psychMeds: Medication[];
  medicalMeds: Medication[];
  alerts: RiskAlert[];
  dsmBanner: DsmBanner | null;
  aiCoPilotCached: boolean;
  aiCoPilotAdvice?: any;
}

interface SideEffect {
  medOrderId: string;
  effect: string;
  severity: 'mild' | 'moderate' | 'severe';
  onset: string;
  notes: string;
}

interface Props {
  encounterId: string;
  apiBaseUrl?: string;
}

export default function ProviderEncounter({ encounterId, apiBaseUrl = 'http://localhost:3000' }: Props) {
  const [overview, setOverview] = useState<EncounterOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // SOAP notes state
  const [subjective, setSubjective] = useState('');
  const [objective, setObjective] = useState('');
  const [assessment, setAssessment] = useState('');
  const [plan, setPlan] = useState('');

  // Side effects state
  const [sideEffects, setSideEffects] = useState<SideEffect[]>([]);
  const [showTaskComplete, setShowTaskComplete] = useState(false);

  useEffect(() => {
    fetchEncounterOverview();
  }, [encounterId]);

  const fetchEncounterOverview = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${apiBaseUrl}/encounters/${encounterId}/overview`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch encounter overview: ${response.statusText}`);
      }

      const data = await response.json();
      setOverview(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const submitSideEffects = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${apiBaseUrl}/encounters/${encounterId}/side-effects`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sideEffects }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit side effects');
      }

      setShowTaskComplete(true);
      setTimeout(() => setShowTaskComplete(false), 2000);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading encounter...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h3 className="text-red-800 font-semibold mb-2">Error Loading Encounter</h3>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!overview) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Strip */}
      <HeaderStrip overview={overview} />

      {/* Main Content Grid */}
      <div className="container mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: SOAP Editor */}
        <div className="lg:col-span-2 space-y-6">
          <SoapEditor
            subjective={subjective}
            objective={objective}
            assessment={assessment}
            plan={plan}
            onSubjectiveChange={setSubjective}
            onObjectiveChange={setObjective}
            onAssessmentChange={setAssessment}
            onPlanChange={setPlan}
          />

          <SideEffectsGrid
            medications={overview.psychMeds}
            sideEffects={sideEffects}
            onSideEffectsChange={setSideEffects}
            onSubmit={submitSideEffects}
          />

          <BillingStrip />
        </div>

        {/* Right Column: AI Co-Pilot */}
        <div className="lg:col-span-1">
          <AICoPilot
            cached={overview.aiCoPilotCached}
            advice={overview.aiCoPilotAdvice}
          />
        </div>
      </div>

      {/* Task Complete Animation */}
      {showTaskComplete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-sm">
            <Lottie
              animationData={taskCompleteAnimation}
              loop={false}
              style={{ width: 200, height: 200 }}
            />
            <p className="text-center text-gray-700 font-medium mt-4">Side effects recorded!</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// SUB-COMPONENTS
// ============================================

function HeaderStrip({ overview }: { overview: EncounterOverview }) {
  const { patient, diagnoses, alerts, dsmBanner } = overview;

  return (
    <div className="bg-white border-b shadow-sm">
      <div className="container mx-auto px-4 py-4">
        {/* Patient Info */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {patient.firstName} {patient.lastName}
            </h1>
            <p className="text-sm text-gray-600">Age: {patient.age}</p>
          </div>
          {patient.allergies.length > 0 && (
            <div className="bg-red-50 border border-red-300 rounded-md px-3 py-2">
              <p className="text-xs font-semibold text-red-700 mb-1">ALLERGIES</p>
              <p className="text-sm text-red-600">{patient.allergies.join(', ')}</p>
            </div>
          )}
        </div>

        {/* Diagnoses */}
        <div className="flex flex-wrap gap-2 mb-3">
          {diagnoses.slice(0, 6).map((dx, idx) => (
            <span
              key={idx}
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
            >
              {dx.icdCode} - {dx.description}
            </span>
          ))}
        </div>

        {/* Risk Alerts */}
        {alerts.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {alerts.slice(0, 5).map((alert, idx) => {
              const colors = {
                LOW: 'bg-yellow-100 text-yellow-800 border-yellow-300',
                MODERATE: 'bg-orange-100 text-orange-800 border-orange-300',
                HIGH: 'bg-red-100 text-red-800 border-red-300',
              };
              return (
                <span
                  key={idx}
                  className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-semibold border ${colors[alert.severity]}`}
                >
                  ⚠️ {alert.message}
                </span>
              );
            })}
          </div>
        )}

        {/* DSM Banner */}
        {dsmBanner && (
          <div className="bg-purple-50 border border-purple-200 rounded-md px-4 py-2">
            <p className="text-sm text-purple-800">
              <strong>DSM Intelligence ({dsmBanner.window}):</strong> {dsmBanner.conditionCode} (
              {Math.round(dsmBanner.confidence * 100)}% confidence)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function SoapEditor({
  subjective,
  objective,
  assessment,
  plan,
  onSubjectiveChange,
  onObjectiveChange,
  onAssessmentChange,
  onPlanChange,
}: {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  onSubjectiveChange: (val: string) => void;
  onObjectiveChange: (val: string) => void;
  onAssessmentChange: (val: string) => void;
  onPlanChange: (val: string) => void;
}) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">SOAP Note</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Subjective</label>
          <textarea
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            value={subjective}
            onChange={(e) => onSubjectiveChange(e.target.value)}
            placeholder="Patient's description of symptoms..."
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Objective</label>
          <textarea
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            value={objective}
            onChange={(e) => onObjectiveChange(e.target.value)}
            placeholder="Provider's observations..."
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Assessment</label>
          <textarea
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            value={assessment}
            onChange={(e) => onAssessmentChange(e.target.value)}
            placeholder="Clinical assessment..."
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Plan</label>
          <textarea
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            value={plan}
            onChange={(e) => onPlanChange(e.target.value)}
            placeholder="Treatment plan..."
          />
        </div>
      </div>
    </div>
  );
}

function SideEffectsGrid({
  medications,
  sideEffects,
  onSideEffectsChange,
  onSubmit,
}: {
  medications: Medication[];
  sideEffects: SideEffect[];
  onSideEffectsChange: (effects: SideEffect[]) => void;
  onSubmit: () => void;
}) {
  const addSideEffect = (medId: string) => {
    onSideEffectsChange([
      ...sideEffects,
      { medOrderId: medId, effect: '', severity: 'mild', onset: '', notes: '' },
    ]);
  };

  const updateSideEffect = (index: number, field: keyof SideEffect, value: string) => {
    const updated = [...sideEffects];
    updated[index] = { ...updated[index], [field]: value };
    onSideEffectsChange(updated);
  };

  const removeSideEffect = (index: number) => {
    onSideEffectsChange(sideEffects.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Side Effects Tracking</h2>

      <div className="space-y-4">
        {medications.map((med, idx) => (
          <div key={idx} className="border border-gray-200 rounded-md p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-semibold text-gray-800">{med.name}</p>
                <p className="text-sm text-gray-600">{med.dosage} - {med.frequency}</p>
              </div>
              <button
                onClick={() => addSideEffect(med.name)}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                + Add Side Effect
              </button>
            </div>

            {sideEffects
              .map((se, seIdx) => ({ ...se, index: seIdx }))
              .filter(se => se.medOrderId === med.name)
              .map((se) => (
                <div key={se.index} className="mt-3 pl-4 border-l-2 border-blue-200 space-y-2">
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Effect (e.g., nausea)"
                      value={se.effect}
                      onChange={(e) => updateSideEffect(se.index, 'effect', e.target.value)}
                      className="border border-gray-300 rounded px-2 py-1 text-sm"
                    />
                    <select
                      value={se.severity}
                      onChange={(e) => updateSideEffect(se.index, 'severity', e.target.value)}
                      className="border border-gray-300 rounded px-2 py-1 text-sm"
                    >
                      <option value="mild">Mild</option>
                      <option value="moderate">Moderate</option>
                      <option value="severe">Severe</option>
                    </select>
                  </div>
                  <input
                    type="date"
                    value={se.onset}
                    onChange={(e) => updateSideEffect(se.index, 'onset', e.target.value)}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                  />
                  <textarea
                    placeholder="Notes..."
                    value={se.notes}
                    onChange={(e) => updateSideEffect(se.index, 'notes', e.target.value)}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    rows={2}
                  />
                  <button
                    onClick={() => removeSideEffect(se.index)}
                    className="text-red-600 hover:text-red-700 text-xs"
                  >
                    Remove
                  </button>
                </div>
              ))}
          </div>
        ))}
      </div>

      {sideEffects.length > 0 && (
        <button
          onClick={onSubmit}
          className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md"
        >
          Submit Side Effects
        </button>
      )}
    </div>
  );
}

function AICoPilot({ cached, advice }: { cached: boolean; advice?: any }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
        <span className="mr-2">🤖</span>
        AI Co-Pilot
      </h2>

      {cached && advice ? (
        <div className="space-y-3">
          <div className="bg-green-50 border border-green-200 rounded-md p-3">
            <p className="text-xs font-semibold text-green-700 mb-1">✓ Cached Advice Available</p>
            <p className="text-sm text-gray-700">{JSON.stringify(advice, null, 2)}</p>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-4 text-center">
          <p className="text-sm text-gray-600">No cached AI advice available</p>
          <button className="mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium">
            Generate AI Advice
          </button>
        </div>
      )}
    </div>
  );
}

function BillingStrip() {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Billing</h2>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Claim Confidence</label>
          <div className="bg-green-100 text-green-800 rounded-md px-3 py-2 text-center font-semibold">
            92%
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Place of Service</label>
          <select className="w-full border border-gray-300 rounded-md px-3 py-2">
            <option value="02">Telehealth (02)</option>
            <option value="11">Office (11)</option>
            <option value="12">Home (12)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Modifiers</label>
          <input
            type="text"
            placeholder="e.g., 95, GT"
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>
      </div>
    </div>
  );
}
