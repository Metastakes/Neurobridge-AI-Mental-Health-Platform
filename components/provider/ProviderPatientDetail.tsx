// components/provider/ProviderPatientDetail.tsx
import React, { useState } from 'react';
// Real API integration
import { usePatient, useAddMedication, useRemoveMedication } from '../../hooks/usePatient';
import { useMedicationSuggestions } from '../../hooks/useAI';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorDisplay } from '../common/ErrorDisplay';
import { toast } from '../common/Toast';
// Legacy imports for existing UI components
import { ChatMessage } from '../../types.ts';
import { diagnosticTools } from '../../diagnosticToolsData.ts';
import ProviderMessages from './ProviderMessages.tsx';
import CaseNotesHistory from './CaseNotesHistory.tsx';
import DiagnosticToolModal from './DiagnosticToolModal.tsx';
import AIClinicalSOAPNote from './AIClinicalSOAPNote.tsx';
import { Zap } from '../Icons.tsx';
import SecureSessionModal from '../SecureSessionModal.tsx';

interface ProviderPatientDetailProps {
    patientId: string;
    providerId: string;
    onSendMessage: (chatId: string, text: string, senderId: string) => void;
    chats: Record<string, ChatMessage[]>;
}

const ProviderPatientDetail: React.FC<ProviderPatientDetailProps> = ({ patientId, providerId, onSendMessage, chats }) => {
    // Fetch real patient data from API
    const { data: patient, isLoading, error, refetch } = usePatient(patientId);
    const addMedication = useAddMedication();
    const removeMedication = useRemoveMedication();
    const getMedSuggestions = useMedicationSuggestions();

    const [isToolModalOpen, setIsToolModalOpen] = useState(false);
    const [isSOAPModalOpen, setIsSOAPModalOpen] = useState(false);
    const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
    const [selectedToolId, setSelectedToolId] = useState<string | null>(null);

    const patientProviderChatId = `chat_${patientId}_${providerId}`;
    const chatHistory = chats[patientProviderChatId] || [];

    const selectedTool = diagnosticTools.find(t => t.id === selectedToolId) || null;

    const openTool = (id: string) => {
        setSelectedToolId(id);
        setIsToolModalOpen(true);
    };

    // Loading state
    if (isLoading) {
        return <LoadingSpinner size="large" text="Loading patient data..." />;
    }

    // Error state
    if (error) {
        return <ErrorDisplay error={error} onRetry={() => refetch()} />;
    }

    // No patient found
    if (!patient) {
        return <div className="p-6 text-center text-gray-500">Patient not found</div>;
    }

    // Format patient name from user data
    const patientName = `${patient.user.firstName} ${patient.user.lastName}`;

    // Get primary diagnosis
    const primaryDiagnosis = patient.diagnoses?.find(d => d.isPrimary)?.description ||
                            patient.diagnoses?.[0]?.description ||
                            'No diagnosis recorded';

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            <DiagnosticToolModal
                isOpen={isToolModalOpen}
                onClose={() => setIsToolModalOpen(false)}
                tool={selectedTool}
                patientName={patientName}
            />
             <AIClinicalSOAPNote
                isOpen={isSOAPModalOpen}
                onClose={() => setIsSOAPModalOpen(false)}
                patient={patient}
            />
            <SecureSessionModal
                isOpen={isSessionModalOpen}
                onClose={() => setIsSessionModalOpen(false)}
                patientName={patientName}
            />

            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">{patientName}</h2>
                    <p className="text-gray-600 dark:text-gray-400">{primaryDiagnosis}</p>
                    <div className="mt-4 flex items-center gap-2">
                        <span className="rounded bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                            {patient.alertStatus}
                        </span>
                        {patient.height && patient.weight && (
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                {patient.height}" / {patient.weight} lbs
                            </span>
                        )}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                         <button onClick={() => setIsSessionModalOpen(true)} className="bg-green-500 text-white px-3 py-1.5 text-sm font-semibold rounded-lg hover:bg-green-600">Start Secure Session</button>
                         <button onClick={() => setIsSOAPModalOpen(true)} className="bg-yellow-400 text-white px-3 py-1.5 text-sm font-semibold rounded-lg hover:bg-yellow-500 flex items-center gap-1"><Zap className="w-4 h-4"/> Gen SOAP Note</button>
                    </div>
                </div>
                <CaseNotesHistory patientId={patientId} onAddNote={() => setIsSOAPModalOpen(true)} />

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
                    patientName={patientName}
                    chatHistory={chatHistory}
                    currentUser={{ id: providerId, name: 'Provider' }} // TODO: fetch provider data
                    onSendMessage={(text) => onSendMessage(patientProviderChatId, text, providerId)}
                />
            </div>
        </div>
    );
};

export default ProviderPatientDetail;