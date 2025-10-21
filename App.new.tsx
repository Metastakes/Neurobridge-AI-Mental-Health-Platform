/**
 * NeuroBridge AI Mental Health Platform
 * Main Application with Real API Integration
 */

import { useState } from 'react';
import { QueryProvider } from './QueryProvider';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './ThemeContext';
import { GoogleApiProvider } from './GoogleApiContext';
import LoginScreen from './components/LoginScreen';
import PatientApp from './PatientApp';
import ProviderDashboard from './components/provider/ProviderDashboard';
import MentorDashboard from './components/mentor/MentorDashboard';
import HIPAADisclaimerModal from './components/HIPAADisclaimerModal';
import { ToastContainer } from './components/common/Toast';
import { LoadingOverlay } from './components/common/LoadingSpinner';

function AppContent() {
  const { user, login, logout, isLoading, isAuthenticated } = useAuth();
  const [showHIPAADisclaimer, setShowHIPAADisclaimer] = useState(false);

  const handleLogin = async (email: string, password: string) => {
    try {
      await login(email, password);

      // Show HIPAA disclaimer for providers/mentors
      const user = JSON.parse(localStorage.getItem('authUser') || '{}');
      if (user.role === 'PROVIDER' || user.role === 'MENTOR') {
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

  if (isLoading) {
    return <LoadingOverlay text="Loading..." />;
  }

  if (!isAuthenticated || !user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  // Render based on user role
  const renderApp = () => {
    switch (user.role) {
      case 'PATIENT':
        return user.patient ? (
          <PatientApp
            patient={user.patient as any}
            onLogout={logout}
            onUpdatePatientDetails={() => {}}
            chats={{}}
            onSendMessage={() => {}}
            allUsers={[]}
          />
        ) : (
          <div>Loading patient data...</div>
        );

      case 'PROVIDER':
        return user.provider ? (
          <ProviderDashboard
            provider={user.provider as any}
            patients={[]}
            onLogout={logout}
            chats={{}}
            onSendMessage={() => {}}
          />
        ) : (
          <div>Loading provider data...</div>
        );

      case 'MENTOR':
        return user.mentor ? (
          <MentorDashboard
            mentor={user.mentor as any}
            mentees={[]}
            onLogout={logout}
            chats={{}}
            onSendMessage={() => {}}
          />
        ) : (
          <div>Loading mentor data...</div>
        );

      default:
        return <div>Unknown user role.</div>;
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
