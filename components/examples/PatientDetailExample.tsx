/**
 * Example Component: Patient Detail with Real API
 * This demonstrates how to use the real backend API with React Query
 */

import { useState } from 'react';
import { usePatient, useAddMedication, useRemoveMedication } from '../../hooks/usePatient';
import { useMedicationSuggestions } from '../../hooks/useAI';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorDisplay } from '../common/ErrorDisplay';
import { toast } from '../common/Toast';
import type { AISuggestionResponse } from '../../types/api.types';

interface Props {
  patientId: string;
  providerId: string;
}

export function PatientDetailExample({ patientId, providerId }: Props) {
  const [aiSuggestion, setAiSuggestion] = useState<AISuggestionResponse | null>(null);
  const [showAddMedModal, setShowAddMedModal] = useState(false);

  // Fetch patient data from real API
  const { data: patient, isLoading, error, refetch } = usePatient(patientId);

  // Mutations
  const addMedication = useAddMedication();
  const removeMedication = useRemoveMedication();
  const getMedSuggestions = useMedicationSuggestions();

  // Handle adding medication
  const handleAddMedication = async (medication: {
    name: string;
    dosage: string;
    frequency: string;
    category?: string;
  }) => {
    try {
      await addMedication.mutateAsync({
        patientId,
        ...medication,
        prescriberId: providerId,
      });

      toast.success('Medication added successfully!');
      setShowAddMedModal(false);
    } catch (error: any) {
      toast.error(`Failed to add medication: ${error.message}`);
    }
  };

  // Handle removing medication
  const handleRemoveMedication = async (medicationId: string, medicationName: string) => {
    if (!confirm(`Discontinue ${medicationName}?`)) return;

    try {
      await removeMedication.mutateAsync(medicationId);
      toast.success(`${medicationName} discontinued`);
    } catch (error: any) {
      toast.error(`Failed to discontinue medication: ${error.message}`);
    }
  };

  // Handle AI medication analysis
  const handleAnalyzeMedication = async (medication: {
    name: string;
    dosage: string;
    category?: string;
  }) => {
    try {
      const suggestions = await getMedSuggestions.mutateAsync({
        patientId,
        proposedMedication: medication,
      });

      setAiSuggestion(suggestions);

      // Show warnings for low safety scores
      if (suggestions.safetyScore < 7) {
        toast.warning('⚠️ Safety concerns detected! Review AI alerts.');
      } else {
        toast.success('AI analysis complete');
      }
    } catch (error: any) {
      toast.error(`AI analysis failed: ${error.message}`);
    }
  };

  // Loading state
  if (isLoading) {
    return <LoadingSpinner size="large" text="Loading patient data..." />;
  }

  // Error state
  if (error) {
    return <ErrorDisplay error={error} onRetry={() => refetch()} />;
  }

  // No patient found
  if (!patient) {
    return <div>Patient not found</div>;
  }

  return (
    <div className="p-6">
      {/* Patient Header */}
      <div className="mb-6 rounded-lg bg-white p-6 shadow">
        <h1 className="text-2xl font-bold">
          {patient.user.firstName} {patient.user.lastName}
        </h1>
        <p className="text-gray-600">{patient.user.email}</p>
        <div className="mt-4 flex gap-4">
          <span className="rounded bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
            {patient.alertStatus}
          </span>
          {patient.height && patient.weight && (
            <span className="text-sm text-gray-600">
              {patient.height}" / {patient.weight} lbs
            </span>
          )}
        </div>
      </div>

      {/* Diagnoses */}
      <div className="mb-6 rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold">Diagnoses</h2>
        {patient.diagnoses && patient.diagnoses.length > 0 ? (
          <div className="space-y-2">
            {patient.diagnoses.map((dx) => (
              <div
                key={dx.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <span className="font-medium">{dx.description}</span>
                  <span className="ml-2 text-sm text-gray-600">({dx.icdCode})</span>
                  {dx.isPrimary && (
                    <span className="ml-2 rounded bg-green-100 px-2 py-1 text-xs text-green-800">
                      Primary
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No diagnoses recorded</p>
        )}
      </div>

      {/* Medications */}
      <div className="mb-6 rounded-lg bg-white p-6 shadow">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Current Medications</h2>
          <button
            onClick={() => setShowAddMedModal(true)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            + Add Medication
          </button>
        </div>

        {patient.medications && patient.medications.length > 0 ? (
          <div className="space-y-2">
            {patient.medications.map((med) => (
              <div
                key={med.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex-1">
                  <div className="font-medium">{med.name}</div>
                  <div className="text-sm text-gray-600">
                    {med.dosage} • {med.frequency}
                    {med.category && ` • ${med.category}`}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      handleAnalyzeMedication({
                        name: med.name,
                        dosage: med.dosage,
                        category: med.category || undefined,
                      })
                    }
                    className="rounded px-3 py-1 text-sm text-blue-600 hover:bg-blue-50"
                    disabled={getMedSuggestions.isPending}
                  >
                    {getMedSuggestions.isPending ? 'Analyzing...' : 'AI Analyze'}
                  </button>
                  <button
                    onClick={() => handleRemoveMedication(med.id, med.name)}
                    className="rounded px-3 py-1 text-sm text-red-600 hover:bg-red-50"
                    disabled={removeMedication.isPending}
                  >
                    Discontinue
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No active medications</p>
        )}
      </div>

      {/* AI Suggestions */}
      {aiSuggestion && (
        <div className="mb-6 rounded-lg border-2 border-blue-200 bg-blue-50 p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold text-blue-900">
            AI Clinical Suggestions
          </h2>

          {/* Safety Score */}
          <div className="mb-4">
            <span className="text-sm font-medium text-gray-700">Safety Score:</span>
            <span
              className={`ml-2 text-2xl font-bold ${
                aiSuggestion.safetyScore >= 8
                  ? 'text-green-600'
                  : aiSuggestion.safetyScore >= 6
                  ? 'text-yellow-600'
                  : 'text-red-600'
              }`}
            >
              {aiSuggestion.safetyScore.toFixed(1)}/10
            </span>
            <span className="ml-2 text-sm text-gray-600">
              (Confidence: {(aiSuggestion.confidence * 100).toFixed(0)}%)
            </span>
          </div>

          {/* Safety Alerts */}
          {aiSuggestion.safety_alerts.length > 0 && (
            <div className="mb-4">
              <h3 className="mb-2 font-semibold">Safety Alerts:</h3>
              <div className="space-y-2">
                {aiSuggestion.safety_alerts.map((alert, idx) => (
                  <div
                    key={idx}
                    className={`rounded-lg p-3 ${
                      alert.severity === 'critical'
                        ? 'bg-red-100 text-red-900'
                        : alert.severity === 'high'
                        ? 'bg-orange-100 text-orange-900'
                        : 'bg-yellow-100 text-yellow-900'
                    }`}
                  >
                    <div className="font-medium">{alert.message}</div>
                    {alert.recommendation && (
                      <div className="mt-1 text-sm">{alert.recommendation}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Next Questions */}
          {aiSuggestion.next_best_questions.length > 0 && (
            <div>
              <h3 className="mb-2 font-semibold">Next Best Questions:</h3>
              <ul className="space-y-2">
                {aiSuggestion.next_best_questions.map((q, idx) => (
                  <li key={idx} className="rounded-lg bg-white p-3">
                    <div className="font-medium">{q.question}</div>
                    <div className="mt-1 text-sm text-gray-600">{q.rationale}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Simple Add Medication Modal (replace with better UI) */}
      {showAddMedModal && (
        <AddMedicationModal
          onAdd={handleAddMedication}
          onClose={() => setShowAddMedModal(false)}
          isLoading={addMedication.isPending}
        />
      )}
    </div>
  );
}

// Simple Modal for Adding Medication
function AddMedicationModal({
  onAdd,
  onClose,
  isLoading,
}: {
  onAdd: (med: any) => void;
  onClose: () => void;
  isLoading: boolean;
}) {
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [category, setCategory] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({ name, dosage, frequency, category: category || undefined });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-xl font-bold">Add Medication</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded border p-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Dosage</label>
            <input
              type="text"
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
              className="w-full rounded border p-2"
              placeholder="e.g., 100mg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Frequency</label>
            <input
              type="text"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="w-full rounded border p-2"
              placeholder="e.g., Once daily"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Category (Optional)</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded border p-2"
              placeholder="e.g., SSRI"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded px-4 py-2 text-gray-600 hover:bg-gray-100"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Adding...' : 'Add Medication'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
