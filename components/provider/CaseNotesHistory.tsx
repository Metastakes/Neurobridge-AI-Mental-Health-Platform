// components/provider/CaseNotesHistory.tsx
import React, { useEffect } from 'react';
import { Plus } from '../Icons.tsx';
import { usePatientNotes } from '../../hooks/usePatient.ts';

interface CaseNotesHistoryProps {
    patientId: number;
    onAddNote: () => void;
    refreshTrigger?: number; // Used to trigger refresh when new notes added
}

interface SessionNote {
    id: number;
    provider_name: string;
    note_type: string;
    session_date: string;
    assessment: string | null;
    plan: string | null;
    notes: string | null;
}

const CaseNotesHistory: React.FC<CaseNotesHistoryProps> = ({ patientId, onAddNote, refreshTrigger }) => {
    const { notes, loading, refetch } = usePatientNotes(patientId);

    useEffect(() => {
        if (refreshTrigger !== undefined) {
            refetch();
        }
    }, [refreshTrigger, refetch]);

    if (loading) {
        return (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">Session Notes History</h3>
                </div>
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                    <p className="ml-3 text-gray-600 dark:text-gray-400">Loading notes...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">Session Notes History</h3>
                <button onClick={onAddNote} className="flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300">
                    <Plus className="w-4 h-4" /> Add Note
                </button>
            </div>
            <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                {notes.length > 0 ? (
                    (notes as SessionNote[]).map(note => {
                        const sessionDate = new Date(note.session_date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                        });

                        return (
                            <div key={note.id} className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg border dark:border-slate-600">
                                <div className="flex justify-between items-center text-sm mb-2">
                                    <span className="font-bold text-gray-800 dark:text-gray-200">{note.note_type}</span>
                                    <span className="text-gray-500 dark:text-gray-400">{sessionDate}</span>
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Provider: {note.provider_name}</p>
                                {note.assessment && (
                                    <div className="mb-2">
                                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Assessment:</p>
                                        <p className="text-sm text-gray-700 dark:text-gray-300">{note.assessment}</p>
                                    </div>
                                )}
                                {note.plan && (
                                    <div className="mb-2">
                                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Plan:</p>
                                        <p className="text-sm text-gray-700 dark:text-gray-300">{note.plan}</p>
                                    </div>
                                )}
                                {note.notes && (
                                    <div>
                                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Notes:</p>
                                        <p className="text-sm text-gray-700 dark:text-gray-300">{note.notes}</p>
                                    </div>
                                )}
                            </div>
                        );
                    })
                ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No session notes for this patient yet.</p>
                )}
            </div>
        </div>
    );
};

export default CaseNotesHistory;
