// components/PatientApp.tsx
import React, { useState, useEffect } from 'react';
// Real API integration
import { useAuth } from '../contexts/AuthContext.tsx';
import { usePatient } from '../hooks/usePatient.ts';
import { useGamificationSummary } from '../hooks/useGamification.ts';
import { LoadingSpinner } from './common/LoadingSpinner.tsx';
import { ErrorDisplay } from './common/ErrorDisplay.tsx';
// Fix: Add file extensions to imports to resolve module errors.
import { Patient, PatientView, ChatMessage, User } from '../types.ts';
import PatientDashboard from './patient/PatientDashboard.tsx';
import PatientProfile from './patient/PatientProfile.tsx';
import PatientMessages from './patient/PatientMessages.tsx';
import PatientSchedule from './patient/PatientSchedule.tsx';
import PatientReview from './patient/PatientReview.tsx';
import PatientAchievements from './patient/PatientAchievements.tsx';
import PatientRewards from './patient/PatientRewards.tsx';
import PatientProgress from './patient/PatientProgress.tsx';
import PatientOnboarding from './patient/PatientOnboarding.tsx';
import useInactivityLogout from '../hooks/useInactivityLogout.ts';
// Fix: Aliased User icon import to UserIcon to resolve name conflict with User type.
// Fix: Add ArrowLeft icon for improved navigation.
import { Home, User as UserIcon, LogOut, Award, Gift, BarChart2, MessageSquare, Calendar, ArrowLeft } from './Icons.tsx';

interface PatientAppProps {
  patient: any; // Legacy prop - will be replaced by API data
  onLogout: () => void;
  onUpdatePatientDetails?: (patient: Patient) => void; // Legacy - optional now
  chats: Record<string, ChatMessage[]>;
  onSendMessage: (chatId: string, text: string, senderId: string) => void;
  allUsers: User[];
}

const PatientApp: React.FC<PatientAppProps> = ({ patient: legacyPatient, onLogout, onUpdatePatientDetails, chats, onSendMessage, allUsers }) => {
  const { user } = useAuth();

  // Get patient ID from auth context or legacy prop
  const patientId = user?.patient?.id || legacyPatient?.id;

  // Fetch real patient data from API
  const { data: apiPatient, isLoading: patientLoading, error: patientError, refetch: refetchPatient } = usePatient(patientId);

  // Fetch gamification data (points, achievements)
  const { data: gamificationData, isLoading: gamificationLoading } = useGamificationSummary(patientId);

  // Use API data if available, fallback to legacy prop
  const patient = apiPatient || legacyPatient;
  const points = gamificationData?.totalPoints || 0;
  const reviews = gamificationData?.pendingReviews || 0;

  // Check if onboarding is complete
  const onboardingComplete = patient?.onboardingComplete !== false;

  const [activeView, setActiveView] = useState<PatientView>(onboardingComplete ? 'dashboard' : 'onboarding');

  useInactivityLogout(onLogout);

  // Update active view when patient data loads
  useEffect(() => {
    if (patient && !onboardingComplete && activeView !== 'onboarding') {
      setActiveView('onboarding');
    }
  }, [patient, onboardingComplete]);

  const patientChatId = patient ? `chat_${patient.id}_${patient.providerId || 'provider'}` : '';
  const chatHistory = chats[patientChatId] || [];

  const handleSendMessageToProvider = (text: string) => {
    if (patient) {
      onSendMessage(patientChatId, text, patient.id.toString());
    }
  };

  // Fix: Update handleCompleteOnboarding to not expect any arguments to match the onComplete prop of PatientOnboarding.
  const handleCompleteOnboarding = async () => {
    // TODO: Call API to mark onboarding complete
    // For now, use legacy method if available
    if (onUpdatePatientDetails && legacyPatient) {
      const updatedPatient: Patient = {
        ...legacyPatient,
        details: {
          ...legacyPatient.details,
          onboardingComplete: true,
        }
      };
      onUpdatePatientDetails(updatedPatient);
    }
    setActiveView('dashboard');
    await refetchPatient();
  }

  // Show loading state while fetching initial data
  if (patientLoading && !patient) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-slate-900">
        <LoadingSpinner size="large" text="Loading your dashboard..." />
      </div>
    );
  }

  // Show error state if fetch failed
  if (patientError && !patient) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-slate-900 p-6">
        <ErrorDisplay error={patientError} onRetry={() => refetchPatient()} />
      </div>
    );
  }

  // No patient data available
  if (!patient) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-slate-900">
        <div className="text-center text-gray-500">
          <p>No patient data found</p>
          <button onClick={onLogout} className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg">
            Logout
          </button>
        </div>
      </div>
    );
  }

  const renderView = () => {
    if (!onboardingComplete) {
        // Fix: Removed `currentDetails` prop as it is not defined in PatientOnboardingProps.
        return <PatientOnboarding onComplete={handleCompleteOnboarding} />;
    }

    switch (activeView) {
      case 'dashboard':
        return <PatientDashboard patient={patient} setActiveView={setActiveView} points={points} reviews={reviews} />;
      case 'profile':
        return <PatientProfile patient={patient} onUpdatePatient={onUpdatePatientDetails} onLogout={onLogout} />;
      case 'messages':
        return <PatientMessages chatHistory={chatHistory} currentUser={patient} onSendMessage={handleSendMessageToProvider} />;
      case 'schedule':
        return <PatientSchedule patient={patient} allUsers={allUsers} />;
      case 'review':
        return <PatientReview patientId={patientId} setActiveView={setActiveView} />;
      case 'achievements':
        return <PatientAchievements patientId={patientId} />;
      case 'rewards':
        return <PatientRewards patientId={patientId} points={points} />;
      case 'progress':
        return <PatientProgress patientId={patientId} />;
      default:
        return <PatientDashboard patient={patient} setActiveView={setActiveView} points={points} reviews={reviews} />;
    }
  };

  const NavItem: React.FC<{ view: PatientView; label: string; icon: React.ReactNode }> = ({ view, label, icon }) => (
    <button
      onClick={() => setActiveView(view)}
      className={`flex flex-col items-center justify-center w-full p-2 rounded-lg transition-colors ${activeView === view ? 'bg-teal-100 text-teal-600 dark:bg-teal-900 dark:text-teal-300' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'}`}
      aria-current={activeView === view}
    >
      {icon}
      <span className="text-xs font-semibold">{label}</span>
    </button>
  );
  
  // Fix: Align mainViews with the views present in the bottom navigation bar for consistent UI.
  const mainViews: PatientView[] = ['dashboard', 'schedule', 'messages', 'progress', 'profile'];
  const showBottomNav = onboardingComplete && mainViews.includes(activeView);

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-slate-900 font-sans">
        {onboardingComplete && (
            // Fix: Improved header layout to center title and correctly position navigation buttons.
            <header className="relative flex justify-between items-center p-4 bg-white dark:bg-slate-800 border-b dark:border-slate-700 shadow-sm sticky top-0 z-10">
                 {/* Back arrow for non-main views */}
                 <div className="w-10">
                   {!mainViews.includes(activeView) && (
                       <button
                          onClick={() => setActiveView('dashboard')}
                          className="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 p-2 rounded-full"
                          aria-label="Go back to dashboard"
                       >
                           <ArrowLeft className="w-5 h-5" />
                       </button>
                   )}
                 </div>
                 <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200 capitalize">{activeView}</h1>
                 {/* Logout button - accessible from all screens */}
                 <button
                    onClick={onLogout}
                    className="text-gray-600 dark:text-gray-300 hover:text-red-500 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700"
                    aria-label="Logout"
                 >
                     <LogOut className="w-5 h-5" />
                 </button>
            </header>
        )}
      <main className={`flex-grow overflow-y-auto ${showBottomNav ? 'pb-20' : ''}`}>
        {renderView()}
      </main>
      {showBottomNav && (
        <footer className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t dark:border-slate-700 shadow-md">
            <nav className="flex justify-around items-center max-w-md mx-auto p-1">
            <NavItem view="dashboard" label="Home" icon={<Home className="w-6 h-6" />} />
            <NavItem view="schedule" label="Schedule" icon={<Calendar className="w-6 h-6" />} />
            <NavItem view="messages" label="Messages" icon={<MessageSquare className="w-6 h-6" />} />
            <NavItem view="progress" label="Progress" icon={<BarChart2 className="w-6 h-6" />} />
            {/* Fix: Use aliased UserIcon component. */}
            <NavItem view="profile" label="Profile" icon={<UserIcon className="w-6 h-6" />} />
            </nav>
        </footer>
      )}
    </div>
  );
};

export default PatientApp;