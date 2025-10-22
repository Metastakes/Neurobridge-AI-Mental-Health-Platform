/**
 * NeuroBridge AI Mental Health Platform
 * Main Application with Real API Integration
 */

import { useState } from 'react';
import { QueryProvider } from './QueryProvider.tsx';
import { AuthProvider, useAuth } from './contexts/AuthContext.tsx';
import { ThemeProvider } from './ThemeContext.tsx';
import { GoogleApiProvider } from './GoogleApiContext.tsx';
import LoginScreen from './components/LoginScreen.tsx';
import PatientApp from './components/PatientApp.tsx';
import ProviderDashboard from './components/ProviderDashboard.tsx';
import MentorDashboard from './components/MentorDashboard.tsx';
import HIPAADisclaimerModal from './components/HIPAADisclaimerModal.tsx';
import { ToastContainer } from './components/common/Toast.tsx';
import { LoadingOverlay } from './components/common/LoadingSpinner.tsx';
import { ChatMessage } from './types.ts';

function AppContent() {
  const { user, login, logout, isLoading, isAuthenticated } = useAuth();
  const [showHIPAADisclaimer, setShowHIPAADisclaimer] = useState(false);
  const [chats, setChats] = useState<Record<string, ChatMessage[]>>({});

  const handleLogin = async (email: string, password: string) => {
    try {
      await login(email, password);

      // Show HIPAA disclaimer for providers/mentors
      const userData = JSON.parse(localStorage.getItem('authUser') || '{}');
      if (userData.role === 'PROVIDER' || userData.role === 'MENTOR') {
        const hasAcknowledged = sessionStorage.getItem('hipaa_acknowledged');
        if (!hasAcknowledged) {
          setShowHIPAADisclaimer(true);
        }
      }
    } catch (error) {
      alert('Invalid credentials. Please try again.');
    }
  };

  const handleAcknowledgeHIPAA = () => {
    sessionStorage.setItem('hipaa_acknowledged', 'true');
    setShowHIPAADisclaimer(false);
  };

  const handleSendMessage = (chatId: string, text: string, senderId: string) => {
    const newMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      text,
      senderId: parseInt(senderId), // Convert to number for legacy compatibility
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setChats(prev => ({
      ...prev,
      [chatId]: [...(prev[chatId] || []), newMessage],
    }));
  };

  if (isLoading) {
    return <LoadingOverlay text="Loading..." />;
  }

  if (!isAuthenticated || !user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  // Render based on user role
  const renderApp = () => {
    // Convert role to match legacy types (uppercase to lowercase)
    const legacyRole = user.role.toLowerCase();

    switch (user.role) {
      case 'PATIENT':
        return user.patient ? (
          <PatientApp
            patient={user.patient as any}
            onLogout={logout}
            onUpdatePatientDetails={() => {}}
            chats={chats}
            onSendMessage={handleSendMessage}
            allUsers={[]}
          />
        ) : (
          <div className="flex items-center justify-center h-screen">
            <LoadingOverlay text="Loading patient data..." />
          </div>
        );

      case 'PROVIDER':
        return user.provider ? (
          <ProviderDashboard
            provider={user.provider as any}
            patients={[]} // Patients will be fetched inside ProviderDashboard
            onLogout={logout}
            chats={chats}
            onSendMessage={handleSendMessage}
          />
        ) : (
          <div className="flex items-center justify-center h-screen">
            <LoadingOverlay text="Loading provider data..." />
          </div>
        );

      case 'MENTOR':
        return user.mentor ? (
          <MentorDashboard
            mentor={user.mentor as any}
            mentees={[]} // Mentees will be fetched inside MentorDashboard
            onLogout={logout}
            chats={chats}
            onSendMessage={handleSendMessage}
          />
        ) : (
          <div className="flex items-center justify-center h-screen">
            <LoadingOverlay text="Loading mentor data..." />
          </div>
        );

      default:
        return <div className="flex items-center justify-center h-screen text-gray-500">Unknown user role.</div>;
    }
  };

  return (
    <>
      {(user.role === 'PROVIDER' || user.role === 'MENTOR') && (
        <HIPAADisclaimerModal
          isOpen={showHIPAADisclaimer}
          onAcknowledge={handleAcknowledgeHIPAA}
          userRole={user.role.toLowerCase() as 'provider' | 'mentor'}
        />
      )}
      {renderApp()}
      <ToastContainer />
    </>
  );
}

function App() {
  return (
    <QueryProvider>
      <AuthProvider>
        <ThemeProvider>
          <GoogleApiProvider>
            <AppContent />
          </GoogleApiProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryProvider>
  );
}

export default App;