// App.tsx
import React, { useState, useMemo, useEffect } from 'react';
// Fix: Add file extensions to imports to resolve module errors.
import ErrorBoundary from './components/ErrorBoundary.tsx';
import LoginScreen from './components/LoginScreen.tsx';
import PatientApp from './components/PatientApp.tsx';
import ProviderDashboard from './components/ProviderDashboard.tsx';
import MentorDashboard from './components/MentorDashboard.tsx';
import HIPAADisclaimerModal from './components/HIPAADisclaimerModal.tsx';
import { users as initialUsers, initialChatHistories } from './userData.ts';
import { User, Patient, Provider, Mentor, ChatMessage } from './types.ts';
import { GoogleApiProvider } from './GoogleApiContext.tsx';
import { ThemeProvider } from './ThemeContext.tsx';
import { authApi, tokenManager } from './utils/api.ts';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>(initialUsers);
  const [chats, setChats] = useState<Record<string, ChatMessage[]>>(initialChatHistories);
  const [showHIPAADisclaimer, setShowHIPAADisclaimer] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const allPatients = useMemo(() => allUsers.filter(u => u.role === 'patient') as Patient[], [allUsers]);
  const allProviders = useMemo(() => allUsers.filter(u => u.role === 'provider') as Provider[], [allUsers]);

  // Check for existing session on mount
  useEffect(() => {
    const checkExistingSession = async () => {
      const token = tokenManager.getAccessToken();
      if (token) {
        const response = await authApi.getCurrentUser();
        if (response.data?.user) {
          const userData = response.data.user;
          // Convert backend user format to frontend User type
          const user: User = {
            id: userData.id,
            name: userData.name,
            email: userData.email,
            password: '', // Don't store password
            role: userData.role as 'patient' | 'provider' | 'mentor',
          };
          setCurrentUser(user);

          if (user.role === 'provider' || user.role === 'mentor') {
            const hasAcknowledged = sessionStorage.getItem('hipaa_acknowledged');
            if (!hasAcknowledged) {
              setShowHIPAADisclaimer(true);
            }
          }
        } else {
          // Token is invalid, clear it
          tokenManager.clearTokens();
        }
      }
      setIsLoading(false);
    };

    checkExistingSession();
  }, []);

  const handleLogin = async (email: string, pass: string) => {
    setLoginError(null);
    setIsLoading(true);

    try {
      const response = await authApi.login(email, pass);

      if (response.data?.user) {
        const userData = response.data.user;
        // Convert backend user format to frontend User type
        const user: User = {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          password: '', // Don't store password
          role: userData.role as 'patient' | 'provider' | 'mentor',
        };

        setCurrentUser(user);

        if (user.role === 'provider' || user.role === 'mentor') {
          const hasAcknowledged = sessionStorage.getItem('hipaa_acknowledged');
          if (!hasAcknowledged) {
            setShowHIPAADisclaimer(true);
          }
        }
      } else {
        setLoginError(response.error || "Invalid email or password. Please try again.");
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginError("An error occurred during login. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcknowledgeHIPAA = () => {
    sessionStorage.setItem('hipaa_acknowledged', 'true');
    setShowHIPAADisclaimer(false);
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setCurrentUser(null);
      // Clear HIPAA acknowledgment on logout to ensure new users must accept
      sessionStorage.removeItem('hipaa_acknowledged');
    }
  };

   const handleUpdatePatientDetails = (updatedPatient: Patient) => {
    setAllUsers(prevUsers => {
        return prevUsers.map(user => 
            user.id === updatedPatient.id ? updatedPatient : user
        );
    });
  };

  const handleSendMessage = (chatId: string, text: string, senderId: number) => {
    const newMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      text,
      senderId,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setChats(prev => ({
      ...prev,
      [chatId]: [...(prev[chatId] || []), newMessage],
    }));
  };
  
  const renderApp = () => {
      // Show loading spinner while checking for existing session
      if (isLoading) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-slate-900">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
            </div>
          </div>
        );
      }

      if (!currentUser) {
        return <LoginScreen onLogin={handleLogin} error={loginError} />;
      }

      const currentPatient = currentUser.role === 'patient'
        ? allPatients.find(p => p.id === currentUser.id)
        // Fix: Corrected a typo in the ternary operator from '-' to ':'.
        : undefined;


      switch (currentUser.role) {
        case 'patient':
          if (!currentPatient) {
            // If patient data is missing, show error and allow logout
            return (
              <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-slate-900">
                <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-md max-w-md text-center">
                  <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-4">Error Loading Patient Data</h2>
                  <p className="text-gray-700 dark:text-gray-300 mb-6">
                    Unable to load your patient profile. Please contact support or try logging in again.
                  </p>
                  <button
                    onClick={handleLogout}
                    className="px-6 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600"
                  >
                    Return to Login
                  </button>
                </div>
              </div>
            );
          }
          return (
            <PatientApp
              patient={currentPatient}
              onLogout={handleLogout}
              onUpdatePatientDetails={handleUpdatePatientDetails}
              chats={chats}
              onSendMessage={handleSendMessage}
              allUsers={allUsers}
            />
          );
        case 'provider':
          return <ProviderDashboard 
                    provider={currentUser as Provider} 
                    patients={allPatients.filter(p => (currentUser as Provider).patientIds.includes(p.id))}
                    onLogout={handleLogout}
                    chats={chats}
                    onSendMessage={handleSendMessage}
                 />;
        case 'mentor':
            return <MentorDashboard 
                    mentor={currentUser as Mentor} 
                    mentees={allProviders.filter(u => (currentUser as Mentor).menteeIds.includes(u.id))}
                    onLogout={handleLogout}
                    chats={chats}
                    onSendMessage={handleSendMessage}
                   />;
        default:
          return <div>Unknown user role.</div>;
      }
  }

  return (
      <ErrorBoundary>
        <ThemeProvider>
          <ErrorBoundary>
            <GoogleApiProvider>
              {currentUser && (currentUser.role === 'provider' || currentUser.role === 'mentor') && (
                  <HIPAADisclaimerModal
                    isOpen={showHIPAADisclaimer}
                    onAcknowledge={handleAcknowledgeHIPAA}
                    userRole={currentUser.role}
                  />
              )}
              {renderApp()}
            </GoogleApiProvider>
          </ErrorBoundary>
        </ThemeProvider>
      </ErrorBoundary>
  )
}

export default App;