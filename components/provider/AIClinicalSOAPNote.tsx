// components/provider/AIClinicalSOAPNote.tsx
// Fix: Add React import for hooks.
import React, { useState, useEffect } from 'react';
// Fix: Use correct import for GoogleGenAI from "@google/genai"
import { GoogleGenAI } from "@google/genai";
// Fix: Add file extensions to imports to resolve module errors.
import { Patient } from '../../types.ts';
import { X, Zap } from '../Icons.tsx';
import AIFeedbackLoop from './AIFeedbackLoop.tsx';

interface AIClinicalSOAPNoteProps {
    isOpen: boolean;
    onClose: () => void;
    patient: Patient;
}

// Fix: Correctly initialize GoogleGenAI with a named apiKey parameter from environment variables.
const ai = new GoogleGenAI({apiKey: process.env.API_KEY});

const generatePromptTemplate = (patient: Patient): string => {
    return `Generate a clinical SOAP note for a patient named ${patient.name} diagnosed with ${patient.details.diagnosis}.
Current medications: ${patient.details.medications.filter(m => m.isCurrent).map(m => m.name).join(', ') || 'None listed'}.

Subjective: [Enter patient's subjective reports from the session. e.g., Patient reports feeling anxious about an upcoming work presentation. Reports sleeping 5-6 hours per night.]

Objective: [Enter objective observations. e.g., Mood is congruent with reported anxiety. Appears tired.]

Assessment: [Enter clinical assessment. e.g., Symptoms consistent with ${patient.details.diagnosis}.]

Plan: [Enter plan for the patient. e.g., Continue current medication. Encourage use of mindfulness exercises before presentation. Follow up in 1 week.]

---
Format the output as a standard SOAP note with S, O, A, P headings. Ensure the note is concise, professional, and suitable for a clinical chart.`;
};


const AIClinicalSOAPNote: React.FC<AIClinicalSOAPNoteProps> = ({ isOpen, onClose, patient }) => {
    const [note, setNote] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('');

    useEffect(() => {
        if (isOpen) {
            // Reset state when modal opens
            setPrompt(generatePromptTemplate(patient));
            setNote('');
            setError(null);
            setIsLoading(false);
        }
    }, [isOpen, patient]);

    const handleGenerateNote = async () => {
        if (!prompt) return;
        setIsLoading(true);
        setError(null);
        setNote('');
        try {
            // Fix: Use the correct method `ai.models.generateContent` to generate content.
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: prompt,
            });
            // Fix: Directly access the 'text' property from the response.
            const generatedText = response.text;
            setNote(generatedText.trim());
        } catch (e) {
            console.error("Error generating SOAP note:", e);
            setError("Failed to generate the note. Ensure your API key is valid and the service is available.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                        <Zap className="w-6 h-6 text-yellow-500" />
                        AI-Assisted SOAP Note
                    </h2>
                    <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"><X /></button>
                </div>
                
                <div className="bg-yellow-50 dark:bg-yellow-900/40 border-l-4 border-yellow-500 text-yellow-800 dark:text-yellow-200 p-3 text-xs rounded-r-lg mb-4 flex-shrink-0">
                    <p><span className="font-bold">Disclaimer:</span> This AI tool is for assistance only. Review and edit the generated content for accuracy. Your organization must have a BAA with Google to use this feature with PHI.</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 flex-grow overflow-hidden">
                    {/* Prompt section */}
                    <div className="flex flex-col overflow-hidden">
                        <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2 flex-shrink-0">1. Edit Your Prompt</h3>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="w-full h-full p-2 border dark:border-slate-600 rounded bg-gray-50 dark:bg-slate-700 font-mono text-sm flex-grow"
                            placeholder="Enter your SOAP note prompt here..."
                        />
                    </div>
                    {/* Output section */}
                     <div className="flex flex-col overflow-hidden">
                        <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2 flex-shrink-0">2. Review Generated Note</h3>
                         <div className="w-full h-full p-2 border dark:border-slate-600 rounded bg-gray-50 dark:bg-slate-900/50 font-mono text-sm flex-grow overflow-y-auto">
                            {isLoading ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="text-center">
                                        <Zap className="w-10 h-10 text-yellow-500 animate-pulse mx-auto" />
                                        <p className="mt-2 text-gray-600 dark:text-gray-400">Generating draft...</p>
                                    </div>
                                </div>
                            ) : error ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="text-center text-red-600 dark:text-red-400 p-4">
                                        <p>{error}</p>
                                    </div>
                                </div>
                            ) : (
                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    className="w-full h-full p-2 bg-transparent font-mono text-sm text-gray-800 dark:text-gray-200 border-none focus:ring-0 resize-none"
                                    placeholder="AI-generated note will appear here..."
                                />
                            )}
                         </div>
                     </div>
                </div>
                
                <div className="mt-6 pt-4 border-t dark:border-slate-700 flex-shrink-0">
                    <div className="flex justify-between items-center">
                        <div className="flex-grow">
                             {!isLoading && !error && note && <AIFeedbackLoop prompt={prompt} />}
                        </div>
                        <div className="flex gap-2">
                             <button onClick={handleGenerateNote} disabled={isLoading} className="bg-yellow-400 text-white px-4 py-2 text-sm font-semibold rounded-lg hover:bg-yellow-500 flex items-center gap-1 disabled:bg-gray-400">
                                <Zap className="w-4 h-4"/> {isLoading ? 'Generating...' : 'Generate'}
                            </button>
                            <button onClick={onClose} className="w-full px-4 py-2 bg-gray-200 dark:bg-slate-600 rounded font-semibold hover:bg-gray-300 dark:hover:bg-slate-500">
                                Discard
                            </button>
                            <button onClick={onClose} disabled={!note} className="w-full px-4 py-2 bg-indigo-500 text-white font-bold rounded hover:bg-indigo-600 disabled:bg-indigo-300">
                                Save to Chart
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIClinicalSOAPNote;