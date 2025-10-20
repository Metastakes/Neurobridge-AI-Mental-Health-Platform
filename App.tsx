// App.tsx
import React, { useState, useMemo } from 'react';
// Fix: Add file extensions to imports to resolve module errors.
import LoginScreen from './components/LoginScreen.tsx';
import PatientApp from './components/PatientApp.tsx';
import ProviderDashboard from './components/ProviderDashboard.tsx';
import MentorDashboard from './components/MentorDashboard.tsx';
import HIPAADisclaimerModal from './components/HIPAADisclaimerModal.tsx';
import { users as initialUsers, initialChatHistories } from './userData.ts';
import { User, Patient, Provider, Mentor, ChatMessage } from './types.ts';
import { GoogleApiProvider } from './GoogleApiContext.tsx';
import { ThemeProvider } from './ThemeContext.tsx';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>(initialUsers);
  const [chats, setChats] = useState<Record<string, ChatMessage[]>>(initialChatHistories);
  const [showHIPAADisclaimer, setShowHIPAADisclaimer] = useState(false);

  const allPatients = useMemo(() => allUsers.filter(u => u.role === 'patient') as Patient[], [allUsers]);
  const allProviders = useMemo(() => allUsers.filter(u => u.role === 'provider') as Provider[], [allUsers]);


  const handleLogin = (email: string, pass: string) => {
    // This is a mock login. In a real app, you'd verify the password.
    const user = allUsers.find(u => u.email === email && u.password === pass);
    if (user) {
      setCurrentUser(user);
      if (user.role === 'provider' || user.role === 'mentor') {
        const hasAcknowledged = sessionStorage.getItem('hipaa_acknowledged');
        if (!hasAcknowledged) {
            setShowHIPAADisclaimer(true);
        }
      }
    } else {
      alert("Invalid credentials");
    }
  };

  const handleAcknowledgeHIPAA = () => {
    sessionStorage.setItem('hipaa_acknowledged', 'true');
    setShowHIPAADisclaimer(false);
  };

  const handleLogout = () => {
    setCurrentUser(null);
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
      if (!currentUser) {
        return <LoginScreen onLogin={handleLogin} />;
      }
      
      const currentPatient = currentUser.role === 'patient' 
        ? allPatients.find(p => p.id === currentUser.id)
        // Fix: Corrected a typo in the ternary operator from '-' to ':'.
        : undefined;
    
    
      switch (currentUser.role) {
        case 'patient':
          return currentPatient ? (
              <PatientApp 
                patient={currentPatient} 
                onLogout={handleLogout} 
                onUpdatePatientDetails={handleUpdatePatientDetails}
                chats={chats}
                onSendMessage={handleSendMessage}
                allUsers={allUsers}
              />
          ) : <div>Loading patient data...</div>;
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
      <ThemeProvider>
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
      </ThemeProvider>
  )
}

export default App;