// components/MentorDashboardWrapper.tsx
import React from 'react';
import { User, ChatMessage } from '../types.ts';
import MentorDashboard from './MentorDashboard.tsx';
import { useCurrentMentor, useMentees } from '../hooks/useMentor.ts';

interface MentorDashboardWrapperProps {
  currentUser: User;
  onLogout: () => void;
  chats: Record<string, ChatMessage[]>;
  onSendMessage: (chatId: string, text: string, senderId: number) => void;
}

const MentorDashboardWrapper: React.FC<MentorDashboardWrapperProps> = ({
  currentUser,
  onLogout,
  chats,
  onSendMessage,
}) => {
  const { mentor, loading: mentorLoading, error: mentorError } = useCurrentMentor();
  const { mentees, loading: menteesLoading, error: menteesError } = useMentees();

  if (mentorLoading || menteesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your mentor dashboard...</p>
        </div>
      </div>
    );
  }

  if (mentorError || menteesError || !mentor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-slate-900">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-md max-w-md text-center">
          <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-4">Error Loading Mentor Data</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            {mentorError || menteesError || 'Unable to load your mentor profile. Please contact support or try logging in again.'}
          </p>
          <button
            onClick={onLogout}
            className="px-6 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  // Convert backend mentor data to frontend Mentor type
  const frontendMentor = {
    id: mentor.id,
    name: mentor.name,
    email: mentor.email,
    password: '', // Not needed
    role: 'mentor' as const,
    menteeIds: mentees.map(m => m.id),
    specialty: '',
  };

  // Convert backend mentees to frontend Provider type
  const frontendMentees = mentees.map(m => ({
    id: m.id,
    name: m.name,
    email: m.email,
    password: '', // Not needed
    role: 'provider' as const,
    patientIds: [], // Not included in mentee summary
    mentorId: mentor.id,
    specialty: m.specialty || '',
    bio: '',
  }));

  return (
    <MentorDashboard
      mentor={frontendMentor}
      mentees={frontendMentees}
      onLogout={onLogout}
      chats={chats}
      onSendMessage={onSendMessage}
    />
  );
};

export default MentorDashboardWrapper;
