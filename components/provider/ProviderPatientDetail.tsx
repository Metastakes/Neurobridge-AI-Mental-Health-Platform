// components/provider/ProviderPatientDetail.tsx
import React, { useState } from 'react';
// Fix: Add file extensions to imports to resolve module errors.
import { Patient, Provider, ChatMessage, CaseNote } from '../../types.ts';
import { diagnosticTools } from '../../diagnosticToolsData.ts';
import ProviderMessages from './ProviderMessages.tsx';
import CaseNotesHistory from './CaseNotesHistory.tsx';
import DiagnosticToolModal from './DiagnosticToolModal.tsx';
import AIClinicalSOAPNote from './AIClinicalSOAPNote.tsx';
import AddSessionNoteModal from './AddSessionNoteModal.tsx';
import { Zap } from '../Icons.tsx';
import SecureSessionModal from '../SecureSessionModal.tsx';

interface ProviderPatientDetailProps {
    patient: Patient;
    provider: Provider;
    onSendMessage: (chatId: string, text: string, senderId: number) => void;
    chats: Record<string, ChatMessage[]>;
}

const ProviderPatientDetail: React.FC<ProviderPatientDetailProps> = ({ patient, provider, onSendMessage, chats }) => {
    const [isToolModalOpen, setIsToolModalOpen] = useState(false);
    const [isSOAPModalOpen, setIsSOAPModalOpen] = useState(false);
    const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
    const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState(false);
    const [selectedToolId, setSelectedToolId] = useState<string | null>(null);
    const [notesRefreshTrigger, setNotesRefreshTrigger] = useState(0);

    const patientProviderChatId = `chat_${patient.id}_${provider.id}`;
    const chatHistory = chats[patientProviderChatId] || [];
    
    const selectedTool = diagnosticTools.find(t => t.id === selectedToolId) || null;

    const openTool = (id: string) => {
        setSelectedToolId(id);
        setIsToolModalOpen(true);
    };

    const handleSaveNote = (note: CaseNote) => {
        // Save to localStorage
        const storedNotes = localStorage.getItem(`caseNotes_${patient.id}`);
        const savedNotes: CaseNote[] = storedNotes ? JSON.parse(storedNotes) : [];
        savedNotes.unshift(note); // Add to beginning
        localStorage.setItem(`caseNotes_${patient.id}`, JSON.stringify(savedNotes));

        // Trigger refresh of notes list
        setNotesRefreshTrigger(prev => prev + 1);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            <DiagnosticToolModal 
                isOpen={isToolModalOpen}
                onClose={() => setIsToolModalOpen(false)}
                tool={selectedTool}
                patientName={patient.name}
            />
             <AIClinicalSOAPNote 
                isOpen={isSOAPModalOpen}
                onClose={() => setIsSOAPModalOpen(false)}
                patient={patient}
            />
            <SecureSessionModal
                isOpen={isSessionModalOpen}
                onClose={() => setIsSessionModalOpen(false)}
                patientName={patient.name}
            />
            <AddSessionNoteModal
                isOpen={isAddNoteModalOpen}
                onClose={() => setIsAddNoteModalOpen(false)}
                patient={patient}
                onSaveNote={handleSaveNote}
            />

            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">{patient.name}</h2>
                    <p className="text-gray-600 dark:text-gray-400">{patient.details.diagnosis}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                         <button onClick={() => setIsSessionModalOpen(true)} className="bg-green-500 text-white px-3 py-1.5 text-sm font-semibold rounded-lg hover:bg-green-600">Start Secure Session</button>
                         <button onClick={() => setIsSOAPModalOpen(true)} className="bg-yellow-400 text-white px-3 py-1.5 text-sm font-semibold rounded-lg hover:bg-yellow-500 flex items-center gap-1"><Zap className="w-4 h-4"/> Gen SOAP Note</button>
                    </div>
                </div>
                <CaseNotesHistory
                    patientId={patient.id}
                    onAddNote={() => setIsAddNoteModalOpen(true)}
                    refreshTrigger={notesRefreshTrigger}
                />

                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">Diagnostic Tools</h3>
                    <div className="mt-2 flex gap-2">
                        {diagnosticTools.map(tool => (
                             <button key={tool.id} onClick={() => openTool(tool.id)} className="bg-gray-100 dark:bg-slate-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-600 px-3 py-1.5 text-sm font-semibold rounded-lg">
                                {tool.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="lg:col-span-1 h-full">
                <ProviderMessages 
                    patientName={patient.name}
                    chatHistory={chatHistory}
                    currentUser={provider}
                    onSendMessage={(text) => onSendMessage(patientProviderChatId, text, provider.id)}
                />
            </div>
        </div>
    );
};

export default ProviderPatientDetail;