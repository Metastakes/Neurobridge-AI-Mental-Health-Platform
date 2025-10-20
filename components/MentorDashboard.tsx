// components/mentor/MentorDashboard.tsx
// Fix: Add React import for hooks.
import React, { useState } from 'react';
// Fix: Add file extensions to imports to resolve module errors.
import { Mentor, Provider, ChatMessage } from '../types.ts';
import { LogOut, ChevronRight } from '../Icons.tsx';
import MentorMenteeDetail from './mentor/MentorMenteeDetail.tsx';
import ThemeToggle from '../ThemeToggle.tsx';
import useInactivityLogout from '../hooks/useInactivityLogout.ts';

interface MentorDashboardProps {
  mentor: Mentor;
  mentees: Provider[];
  onLogout: () => void;
  chats: Record<string, ChatMessage[]>;
  onSendMessage: (chatId: string, text: string, senderId: number) => void;
}

const MentorDashboard: React.FC<MentorDashboardProps> = ({ mentor, mentees, onLogout, chats, onSendMessage }) => {
  const [selectedMenteeId, setSelectedMenteeId] = useState<number | null>(mentor.menteeIds[0] || null);
  
  useInactivityLogout(onLogout);

  const selectedMentee = mentees.find(m => m.id === selectedMenteeId) || null;

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-100 dark:bg-slate-900">
      <header className="flex justify-between items-center p-4 bg-white dark:bg-slate-800 border-b dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold text-lg">{mentor.name.charAt(0)}</div>
            <div>
                <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200">{mentor.name}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Mentor Dashboard</p>
            </div>
        </div>
        <div className="flex items-center gap-2">
            <ThemeToggle />
            <button onClick={onLogout} className="text-gray-600 dark:text-gray-300 hover:text-red-500 p-2"><LogOut className="w-6 h-6" /></button>
        </div>
      </header>
      
      <div className="flex flex-grow overflow-hidden">
        <aside className="w-1/4 bg-white dark:bg-slate-800 border-r dark:border-slate-700">
          <h2 className="text-sm font-semibold p-4 text-gray-600 dark:text-gray-400">My Mentees ({mentees.length})</h2>
          <div className="overflow-y-auto">
              {mentees.map(mentee => (
                  <button 
                      key={mentee.id}
                      onClick={() => setSelectedMenteeId(mentee.id)}
                      className={`w-full text-left p-4 border-b dark:border-slate-700 flex justify-between items-center transition-colors ${
                          selectedMenteeId === mentee.id ? 'bg-indigo-50 dark:bg-slate-700' : 'hover:bg-gray-50 dark:hover:bg-slate-700/50'
                      }`}
                  >
                      <div>
                          <p className={`font-semibold ${selectedMenteeId === mentee.id ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-800 dark:text-gray-200'}`}>{mentee.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{mentee.patientIds.length} patients</p>
                      </div>
                      {selectedMenteeId === mentee.id && <ChevronRight className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
                  </button>
              ))}
          </div>
        </aside>

        <main className="w-3/4 p-6 overflow-y-auto">
          {selectedMentee ? (
            <MentorMenteeDetail 
              mentee={selectedMentee} 
              mentor={mentor} 
              chats={chats}
              onSendMessage={onSendMessage}
            />
          ) : (
             <div className="flex items-center justify-center h-full">
                <p className="text-gray-500 dark:text-gray-400">Select a mentee to view details.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default MentorDashboard;