// components/mentor/MentorMenteeDetail.tsx
// Fix: Add React import for hooks.
import React, { useState, useMemo } from 'react';
// Fix: Add file extensions to imports to resolve module errors.
import { Provider, Mentor, ChatMessage, Patient } from '../../types.ts';
import { users } from '../../userData.ts';
import ProviderMentorChat from '../provider/ProviderMentorChat.tsx';
import MentorChartAudit from './MentorChartAudit.tsx';

interface MentorMenteeDetailProps {
    mentee: Provider;
    mentor: Mentor;
    onSendMessage: (chatId: string, text: string, senderId: number) => void;
    chats: Record<string, ChatMessage[]>;
}

const MentorMenteeDetail: React.FC<MentorMenteeDetailProps> = ({ mentee, mentor, onSendMessage, chats }) => {
    const [selectedPatientId, setSelectedPatientId] = useState<number | null>(mentee.patientIds[0] || null);

    const patients = useMemo(() => {
        return users.filter(u => u.role === 'patient' && mentee.patientIds.includes(u.id)) as Patient[];
    }, [mentee.patientIds]);
    
    const selectedPatient = patients.find(p => p.id === selectedPatientId);

    const providerMentorChatId = `chat_${mentee.id}_${mentor.id}`;
    const chatHistory = chats[providerMentorChatId] || [];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">{mentee.name}'s Caseload</h2>
                    <p className="text-gray-600 dark:text-gray-400">Select a patient to perform a chart audit.</p>
                </div>
                {/* Patient list for audit */}
                <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow">
                    <div className="flex gap-2">
                        {patients.map(p => (
                            <button
                                key={p.id}
                                onClick={() => setSelectedPatientId(p.id)}
                                className={`px-4 py-2 rounded-lg font-semibold text-sm ${
                                    selectedPatientId === p.id ? 'bg-indigo-500 text-white' : 'bg-gray-100 dark:bg-slate-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-600'
                                }`}
                            >
                                {p.name}
                            </button>
                        ))}
                    </div>
                </div>

                {selectedPatient && <MentorChartAudit patient={selectedPatient} />}
            </div>
            <div className="lg:col-span-1 h-full">
                 <ProviderMentorChat 
                    mentorName={mentee.name}
                    chatHistory={chatHistory}
                    currentUser={mentor}
                    onSendMessage={(text) => onSendMessage(providerMentorChatId, text, mentor.id)}
                />
            </div>
        </div>
    );
};

export default MentorMenteeDetail;