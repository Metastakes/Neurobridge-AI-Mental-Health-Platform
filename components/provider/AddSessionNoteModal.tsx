// components/provider/AddSessionNoteModal.tsx
import React, { useState } from 'react';
import { Patient, CaseNote } from '../../types.ts';
import { X } from '../Icons.tsx';

interface AddSessionNoteModalProps {
    isOpen: boolean;
    onClose: () => void;
    patient: Patient;
    onSaveNote: (note: CaseNote) => void;
}

const noteTypes = [
    'Initial Assessment',
    'Follow-up',
    'Check-in',
    'Crisis Intervention',
    'Medication Review',
    'Treatment Plan Update',
    'Progress Note',
    'Discharge Planning',
    'Other'
];

const AddSessionNoteModal: React.FC<AddSessionNoteModalProps> = ({ isOpen, onClose, patient, onSaveNote }) => {
    const [noteType, setNoteType] = useState('Follow-up');
    const [summary, setSummary] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = () => {
        if (!summary.trim()) {
            alert('Please enter note content before saving.');
            return;
        }

        setIsSaving(true);

        const newNote: CaseNote = {
            id: `cn_${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            type: noteType,
            summary: summary.trim()
        };

        // Simulate async save
        setTimeout(() => {
            onSaveNote(newNote);
            setSummary('');
            setNoteType('Follow-up');
            setIsSaving(false);
            onClose();
        }, 300);
    };

    const handleCancel = () => {
        if (summary.trim() && !confirm('Discard unsaved changes?')) {
            return;
        }
        setSummary('');
        setNoteType('Follow-up');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="flex justify-between items-center p-6 border-b dark:border-slate-700">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                        Add Session Note - {patient.name}
                    </h2>
                    <button
                        onClick={handleCancel}
                        className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 space-y-4 overflow-y-auto flex-1">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Note Type
                        </label>
                        <select
                            value={noteType}
                            onChange={(e) => setNoteType(e.target.value)}
                            className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 dark:text-gray-200"
                        >
                            {noteTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Session Notes
                        </label>
                        <textarea
                            value={summary}
                            onChange={(e) => setSummary(e.target.value)}
                            placeholder="Document the session, patient's presentation, interventions, and plan..."
                            rows={12}
                            className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 dark:text-gray-200 resize-none"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {summary.trim().length} characters
                        </p>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-md p-3">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                            <strong>Note:</strong> This note will be added to {patient.name}'s clinical record.
                            Ensure all information is accurate and HIPAA-compliant.
                        </p>
                    </div>
                </div>

                <div className="flex justify-end gap-3 p-6 border-t dark:border-slate-700">
                    <button
                        onClick={handleCancel}
                        className="px-4 py-2 bg-gray-200 dark:bg-slate-600 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-slate-500"
                        disabled={isSaving}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        disabled={isSaving || !summary.trim()}
                    >
                        {isSaving ? 'Saving...' : 'Save Note'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddSessionNoteModal;
