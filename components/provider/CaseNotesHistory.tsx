// components/provider/CaseNotesHistory.tsx
import React from 'react';
// Fix: Add file extensions to imports to resolve module errors.
import { caseNotes } from '../../userData.ts';
import { Plus } from '../Icons.tsx';

interface CaseNotesHistoryProps {
    patientId: number;
    onAddNote: () => void;
}

const CaseNotesHistory: React.FC<CaseNotesHistoryProps> = ({ patientId, onAddNote }) => {
    const notes = caseNotes[patientId] || [];

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Case Notes History</h3>
                <button onClick={onAddNote} className="flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                    <Plus className="w-4 h-4" /> Add Note
                </button>
            </div>
            <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                {notes.length > 0 ? (
                    notes.map(note => (
                        <div key={note.id} className="p-3 bg-gray-50 rounded-lg border">
                            <div className="flex justify-between items-center text-sm mb-1">
                                <span className="font-bold text-gray-800">{note.type}</span>
                                <span className="text-gray-500">{note.date}</span>
                            </div>
                            <p className="text-sm text-gray-700">{note.summary}</p>
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-gray-500 text-center py-4">No case notes for this patient yet.</p>
                )}
            </div>
        </div>
    );
};

export default CaseNotesHistory;
