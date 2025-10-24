// App.tsx
import React, { useState, useEffect } from 'react';
// Fix: Add file extensions to imports to resolve module errors.
import ErrorBoundary from './components/ErrorBoundary.tsx';
import LoginScreen from './components/LoginScreen.tsx';
import PatientAppWrapper from './components/PatientAppWrapper.tsx';
import ProviderDashboard from './components/ProviderDashboard.tsx';
import MentorDashboard from './components/MentorDashboard.tsx';
import HIPAADisclaimerModal from './components/HIPAADisclaimerModal.tsx';
import { initialChatHistories } from './userData.ts';
import { User, ChatMessage } from './types.ts';
import { GoogleApiProvider } from './GoogleApiContext.tsx';
import { ThemeProvider } from './ThemeContext.tsx';
import { authApi, tokenManager } from './utils/api.ts';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [chats, setChats] = useState<Record<string, ChatMessage[]>>(initialChatHistories);
  const [showHIPAADisclaimer, setShowHIPAADisclaimer] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

      switch (currentUser.role) {
        case 'patient':
          return (
            <PatientAppWrapper
              currentUser={currentUser}
              onLogout={handleLogout}
              onUpdatePatientDetails={handleUpdatePatientDetails}
              chats={chats}
              onSendMessage={handleSendMessage}
            />
          );
        case 'provider':
          return <ProviderDashboard
                    provider={currentUser as any}
                    patients={[]}
                    onLogout={handleLogout}
                    chats={chats}
                    onSendMessage={handleSendMessage}
                 />;
        case 'mentor':
            return <MentorDashboard
                    mentor={currentUser as any}
                    mentees={[]}
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