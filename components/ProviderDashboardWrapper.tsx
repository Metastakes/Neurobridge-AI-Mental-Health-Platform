// components/ProviderDashboardWrapper.tsx
import React from 'react';
import { User, ChatMessage } from '../types.ts';
import ProviderDashboard from './ProviderDashboard.tsx';
import { useCurrentProvider, useProviderPatients } from '../hooks/useProviders.ts';

interface ProviderDashboardWrapperProps {
  currentUser: User;
  onLogout: () => void;
  chats: Record<string, ChatMessage[]>;
  onSendMessage: (chatId: string, text: string, senderId: number) => void;
}

const ProviderDashboardWrapper: React.FC<ProviderDashboardWrapperProps> = ({
  currentUser,
  onLogout,
  chats,
  onSendMessage,
}) => {
  const { provider, loading: providerLoading, error: providerError } = useCurrentProvider();
  const { patients, loading: patientsLoading, error: patientsError } = useProviderPatients();

  if (providerLoading || patientsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (providerError || patientsError || !provider) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-slate-900">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-md max-w-md text-center">
          <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-4">Error Loading Provider Data</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            {providerError || patientsError || 'Unable to load your provider profile. Please contact support or try logging in again.'}
          </p>
          <button
            onClick={onLogout}
            className="px-6 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  // Convert backend provider data to frontend Provider type
  const frontendProvider = {
    id: provider.id,
    name: provider.name,
    email: provider.email,
    password: '', // Not needed
    role: 'provider' as const,
    patientIds: patients.map(p => p.user_id),
    mentorId: undefined, // Will be added when mentor functionality is implemented
    specialty: provider.specialty || '',
    bio: provider.bio || '',
  };

  // Convert backend patient data to frontend Patient type
  const frontendPatients = patients.map(p => ({
    id: p.user_id,
    name: p.name,
    email: p.email,
    password: '', // Not needed
    role: 'patient' as const,
    providerId: p.provider_id || provider.id,
    details: {
      dateOfBirth: p.date_of_birth || '',
      phone: p.phone || '',
      address: '', // Not in backend yet
      emergencyContact: '',
      emergencyPhone: '',
      insuranceProvider: '',
      insurancePolicyNumber: '',
      primaryDiagnosis: '',
      medications: [],
      allergies: [],
      treatmentStartDate: '',
      onboardingComplete: true,
    },
  }));

  return (
    <ProviderDashboard
      provider={frontendProvider}
      patients={frontendPatients}
      onLogout={onLogout}
      chats={chats}
      onSendMessage={onSendMessage}
    />
  );
};

export default ProviderDashboardWrapper;
