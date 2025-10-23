// components/provider/CaseNotesHistory.tsx
import React, { useState, useEffect } from 'react';
// Fix: Add file extensions to imports to resolve module errors.
import { caseNotes as initialCaseNotes } from '../../userData.ts';
import { CaseNote } from '../../types.ts';
import { Plus } from '../Icons.tsx';

interface CaseNotesHistoryProps {
    patientId: number;
    onAddNote: () => void;
    refreshTrigger?: number; // Used to trigger refresh when new notes added
}

const CaseNotesHistory: React.FC<CaseNotesHistoryProps> = ({ patientId, onAddNote, refreshTrigger }) => {
    const [notes, setNotes] = useState<CaseNote[]>([]);

    useEffect(() => {
        // Load notes from localStorage
        const storedNotes = localStorage.getItem(`caseNotes_${patientId}`);
        const savedNotes: CaseNote[] = storedNotes ? JSON.parse(storedNotes) : [];

        // Combine initial notes with saved notes, sort by date descending
        const combined = [...(initialCaseNotes[patientId] || []), ...savedNotes];
        combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        setNotes(combined);
    }, [patientId, refreshTrigger]);

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">Case Notes History</h3>
                <button onClick={onAddNote} className="flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300">
                    <Plus className="w-4 h-4" /> Add Note
                </button>
            </div>
            <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                {notes.length > 0 ? (
                    notes.map(note => (
                        <div key={note.id} className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg border dark:border-slate-600">
                            <div className="flex justify-between items-center text-sm mb-1">
                                <span className="font-bold text-gray-800 dark:text-gray-200">{note.type}</span>
                                <span className="text-gray-500 dark:text-gray-400">{note.date}</span>
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{note.summary}</p>
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No case notes for this patient yet.</p>
                )}
            </div>
        </div>
    );
};

export default CaseNotesHistory;
