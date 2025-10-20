// components/PatientApp.tsx
import React, { useState } from 'react';
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
  patient: Patient;
  onLogout: () => void;
  onUpdatePatientDetails: (patient: Patient) => void;
  chats: Record<string, ChatMessage[]>;
  onSendMessage: (chatId: string, text: string, senderId: number) => void;
  allUsers: User[];
}

const PatientApp: React.FC<PatientAppProps> = ({ patient, onLogout, onUpdatePatientDetails, chats, onSendMessage, allUsers }) => {
  const [activeView, setActiveView] = useState<PatientView>(patient.details.onboardingComplete ? 'dashboard' : 'onboarding');
  const [points, setPoints] = useState(1250);
  const [reviews, setReviews] = useState(3);
  
  useInactivityLogout(onLogout);

  const patientChatId = `chat_${patient.id}_${patient.providerId}`;
  const chatHistory = chats[patientChatId] || [];

  const handleSendMessageToProvider = (text: string) => {
    onSendMessage(patientChatId, text, patient.id);
  };

  // Fix: Update handleCompleteOnboarding to not expect any arguments to match the onComplete prop of PatientOnboarding.
  const handleCompleteOnboarding = () => {
      const updatedPatient: Patient = {
          ...patient,
          details: {
              ...patient.details,
              onboardingComplete: true,
          }
      };
      onUpdatePatientDetails(updatedPatient);
      setActiveView('dashboard');
  }

  const renderView = () => {
    if (!patient.details.onboardingComplete) {
        // Fix: Removed `currentDetails` prop as it is not defined in PatientOnboardingProps.
        return <PatientOnboarding onComplete={handleCompleteOnboarding} />;
    }

    switch (activeView) {
      case 'dashboard':
        return <PatientDashboard setActiveView={setActiveView} points={points} reviews={reviews} />;
      case 'profile':
        return <PatientProfile patient={patient} onUpdatePatient={onUpdatePatientDetails} onLogout={onLogout} />;
      case 'messages':
        return <PatientMessages chatHistory={chatHistory} currentUser={patient} onSendMessage={handleSendMessageToProvider} />;
      case 'schedule':
        return <PatientSchedule patient={patient} allUsers={allUsers} />;
      case 'review':
        return <PatientReview setActiveView={setActiveView} setPoints={setPoints} setReviews={setReviews} />;
      case 'achievements':
        return <PatientAchievements />;
      case 'rewards':
        return <PatientRewards points={points} setPoints={setPoints} />;
      case 'progress':
        return <PatientProgress />;
      default:
        return <PatientDashboard setActiveView={setActiveView} points={points} reviews={reviews} />;
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
  const showBottomNav = patient.details.onboardingComplete && mainViews.includes(activeView);

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-slate-900 font-sans">
        {patient.details.onboardingComplete && (
            // Fix: Improved header layout to center title and correctly position an icon-based back button.
            <header className="relative flex justify-center items-center p-4 bg-white dark:bg-slate-800 border-b dark:border-slate-700 shadow-sm sticky top-0 z-10">
                 {/* Back arrow for non-main views */}
                 {!mainViews.includes(activeView) && (
                     <button 
                        onClick={() => setActiveView('dashboard')} 
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 p-2 rounded-full"
                        aria-label="Go back to dashboard"
                     >
                         <ArrowLeft className="w-5 h-5" />
                     </button>
                 )}
                 <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200 capitalize">{activeView}</h1>
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