// components/ProviderDashboard.tsx
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { patientsApi } from '../services/api.ts';
// Fix: Add file extensions to imports to resolve module errors.
import { Provider, Patient, ChatMessage, Mentor } from '../types.ts';
import { users } from '../userData.ts';
import ProviderCaseload from './provider/ProviderCaseload.tsx';
import ProviderPatientDetail from './provider/ProviderPatientDetail.tsx';
import ProviderMentorChat from './provider/ProviderMentorChat.tsx';
import ProviderSchedule from './provider/ProviderSchedule.tsx';
import { LogOut, Users, MessageSquare, Calendar } from './Icons.tsx';
import ThemeToggle from './ThemeToggle.tsx';
import useInactivityLogout from '../hooks/useInactivityLogout.ts';
import { LoadingSpinner } from './common/LoadingSpinner.tsx';
import { ErrorDisplay } from './common/ErrorDisplay.tsx';

interface ProviderDashboardProps {
  provider: Provider;
  patients: Patient[]; // Legacy - will be replaced by API data
  onLogout: () => void;
  chats: Record<string, ChatMessage[]>;
  onSendMessage: (chatId: string, text: string, senderId: string) => void;
}

const ProviderDashboard: React.FC<ProviderDashboardProps> = ({ provider, patients: legacyPatients, onLogout, chats, onSendMessage }) => {
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'caseload' | 'mentorChat' | 'schedule'>('caseload');

  useInactivityLogout(onLogout);

  // Fetch provider's patients from API
  const { data: apiPatients, isLoading, error, refetch } = useQuery({
    queryKey: ['provider-patients', provider.id],
    queryFn: async () => {
      // TODO: Update API to support filtering by providerId
      // For now, fetch all patients and filter client-side
      const allPatients = await patientsApi.getAll();
      return allPatients.filter((p: any) => p.providerId === provider.id);
    },
    enabled: !!provider.id,
  });

  // Use API patients if available, fallback to legacy
  const patients = apiPatients || legacyPatients || [];

  // Set initial selected patient
  React.useEffect(() => {
    if (patients.length > 0 && !selectedPatientId) {
      setSelectedPatientId(patients[0].id);
    }
  }, [patients, selectedPatientId]);

  const selectedPatient = patients.find((p: any) => p.id === selectedPatientId) || null;
  const mentor = useMemo(() => {
      if (!provider.mentorId) return null;
      return users.find(u => u.id === provider.mentorId) as Mentor;
  }, [provider.mentorId]);

  const providerMentorChatId = provider.mentorId ? `chat_${provider.id}_${provider.mentorId}` : '';
  const mentorChatHistory = chats[providerMentorChatId] || [];
  
  const renderMainContent = () => {
    // Show loading state while fetching patients
    if (isLoading && activeTab === 'caseload') {
      return (
        <div className="flex items-center justify-center h-full">
          <LoadingSpinner size="large" text="Loading patients..." />
        </div>
      );
    }

    // Show error state if fetch failed
    if (error && activeTab === 'caseload') {
      return (
        <div className="flex items-center justify-center h-full">
          <ErrorDisplay error={error} onRetry={() => refetch()} />
        </div>
      );
    }

    switch (activeTab) {
        case 'caseload':
            return selectedPatientId ? (
                <ProviderPatientDetail
                  patientId={selectedPatientId}
                  providerId={provider.id.toString()}
                  chats={chats}
                  onSendMessage={onSendMessage}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500 dark:text-gray-400">
                      {patients.length === 0 ? 'No patients assigned' : 'Select a patient to view details.'}
                    </p>
                </div>
              );
        case 'mentorChat':
             return mentor && (
                 <ProviderMentorChat
                    mentorName={mentor.name}
                    chatHistory={mentorChatHistory}
                    currentUser={provider}
                    onSendMessage={(text) => onSendMessage(providerMentorChatId, text, provider.id.toString())}
                 />
              );
        case 'schedule':
            return <ProviderSchedule provider={provider}/>;
        default:
            return null;
    }
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-100 dark:bg-slate-900">
      <header className="flex justify-between items-center p-4 bg-white dark:bg-slate-800 border-b dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-lg">{provider.name.charAt(0)}</div>
            <div>
                <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200">{provider.name}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Provider Dashboard</p>
            </div>
        </div>
        <div className="flex items-center gap-2">
            <ThemeToggle />
            <button onClick={onLogout} className="text-gray-600 dark:text-gray-300 hover:text-red-500 p-2"><LogOut className="w-6 h-6" /></button>
        </div>
      </header>
      
      <div className="flex flex-grow overflow-hidden">
        <aside className="w-1/4 bg-white dark:bg-slate-800 border-r dark:border-slate-700">
          <nav className="p-2 space-y-1">
            <button onClick={() => setActiveTab('caseload')} className={`w-full flex items-center gap-2 p-3 rounded-lg text-sm font-semibold ${activeTab === 'caseload' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'}`}>
                <Users className="w-5 h-5" /> My Caseload
            </button>
             <button onClick={() => setActiveTab('schedule')} className={`w-full flex items-center gap-2 p-3 rounded-lg text-sm font-semibold ${activeTab === 'schedule' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'}`}>
                <Calendar className="w-5 h-5" /> Schedule
            </button>
            {mentor && (
              <button onClick={() => setActiveTab('mentorChat')} className={`w-full flex items-center gap-2 p-3 rounded-lg text-sm font-semibold ${activeTab === 'mentorChat' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'}`}>
                  <MessageSquare className="w-5 h-5" /> Mentor Chat
              </button>
            )}
          </nav>
          <div className="border-t dark:border-slate-700">
            {activeTab === 'caseload' && (
              <ProviderCaseload 
                patients={patients} 
                selectedPatientId={selectedPatientId}
                onSelectPatient={setSelectedPatientId}
              />
            )}
          </div>
        </aside>

        <main className="w-3/4 p-6 overflow-y-auto">
          {renderMainContent()}
        </main>
      </div>
    </div>
  );
};

export default ProviderDashboard;