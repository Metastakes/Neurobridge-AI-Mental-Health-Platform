// components/PatientAppWrapper.tsx
import React from 'react';
import { User, ChatMessage } from '../types.ts';
import PatientApp from './PatientApp.tsx';
import { useCurrentPatient } from '../hooks/usePatient.ts';
import { useAvailableProviders } from '../hooks/useProviders.ts';

interface PatientAppWrapperProps {
  currentUser: User;
  onLogout: () => void;
  onUpdatePatientDetails: (patient: any) => void;
  chats: Record<string, ChatMessage[]>;
  onSendMessage: (chatId: string, text: string, senderId: number) => void;
}

const PatientAppWrapper: React.FC<PatientAppWrapperProps> = ({
  currentUser,
  onLogout,
  onUpdatePatientDetails,
  chats,
  onSendMessage,
}) => {
  const { patient, loading, error } = useCurrentPatient();
  const { providers, loading: providersLoading } = useAvailableProviders();

  if (loading || providersLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-slate-900">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-md max-w-md text-center">
          <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-4">Error Loading Patient Data</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            {error || 'Unable to load your patient profile. Please contact support or try logging in again.'}
          </p>
          <button
            onClick={onLogout}
            className="px-6 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  // Convert backend patient data to frontend Patient type
  const frontendPatient = {
    id: patient.user_id,
    name: patient.name,
    email: patient.email,
    password: '', // Not needed
    role: 'patient' as const,
    providerId: patient.provider_id || 1, // Default to 1 if no provider assigned
    details: {
      dateOfBirth: patient.date_of_birth || '',
      phone: patient.phone || '',
      address: '', // Not in backend yet
      emergencyContact: patient.emergency_contact_name || '',
      emergencyPhone: patient.emergency_contact_phone || '',
      insuranceProvider: patient.insurance_provider || '',
      insurancePolicyNumber: patient.insurance_policy_number || '',
      primaryDiagnosis: '', // Not in backend yet
      medications: patient.current_medications ? patient.current_medications.split(',').map(m => m.trim()) : [],
      allergies: patient.allergies ? patient.allergies.split(',').map(a => a.trim()) : [],
      treatmentStartDate: '', // Not in backend yet
      onboardingComplete: true, // Assume complete if they logged in
    },
  };

  // Convert providers to User[] format
  const allUsers = providers.map(p => ({
    id: p.id,
    name: p.name,
    email: p.email,
    password: '',
    role: 'provider' as const,
  }));

  return (
    <PatientApp
      patient={frontendPatient}
      onLogout={onLogout}
      onUpdatePatientDetails={onUpdatePatientDetails}
      chats={chats}
      onSendMessage={onSendMessage}
      allUsers={allUsers}
    />
  );
};

export default PatientAppWrapper;
