// components/mentor/MentorChartAudit.tsx
// Fix: Add React import for hooks.
import React, { useState, useEffect } from 'react';
// Fix: Use correct import for GoogleGenAI from "@google/genai"
import { GoogleGenAI } from "@google/genai";
// Fix: Add file extensions to imports to resolve module errors.
import { Patient } from '../../types.ts';
import { Zap } from '../Icons.tsx';
import AIFeedbackLoop from '../provider/AIFeedbackLoop.tsx';
import { caseNotes } from '../../userData.ts';

// Fix: Correctly initialize GoogleGenAI with a named apiKey parameter from environment variables.
const ai = new GoogleGenAI({apiKey: process.env.API_KEY});

interface MentorChartAuditProps {
    patient: Patient;
}

const MentorChartAudit: React.FC<MentorChartAuditProps> = ({ patient }) => {
    const [summary, setSummary] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const patientCaseNotes = caseNotes[patient.id] || [];
    const notesText = patientCaseNotes.map(n => `Date: ${n.date}, Type: ${n.type}, Summary: ${n.summary}`).join('\n');

    const prompt = `As a clinical mentor, review the following case notes for patient ${patient.name} (Diagnosis: ${patient.details.diagnosis}) and provide a concise summary. Highlight any potential areas for the provider to explore further, such as treatment adherence, risk factors, or new symptoms.
    
    Case Notes:
    ${notesText}
    `;

    useEffect(() => {
        const generateSummary = async () => {
            if (!patient) return;
            setIsLoading(true);
            setError(null);
            setSummary('');

            try {
                // Fix: Use the correct method `ai.models.generateContent` to generate content.
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-pro',
                    contents: prompt,
                });
                // Fix: Directly access the 'text' property from the response.
                const generatedText = response.text;
                setSummary(generatedText.trim());
            } catch (e) {
                console.error("Error generating audit summary:", e);
                setError("Failed to generate the summary. Please try again.");
            } finally {
                setIsLoading(false);
            }
        };

        generateSummary();
    }, [patient, prompt]);

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">Chart Audit for: <span className="text-indigo-600 dark:text-indigo-400">{patient.name}</span></h3>
            
            <div className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-lg border dark:border-slate-600">
                <h4 className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-500" />
                    AI-Powered Audit Summary
                </h4>
                
                <div className="bg-yellow-50 dark:bg-yellow-900/40 border-l-4 border-yellow-500 text-yellow-800 dark:text-yellow-200 p-3 text-xs rounded-r-lg my-2">
                    <p><span className="font-bold">Disclaimer:</span> Verify AI-generated content for accuracy. Your organization must have a BAA with Google to use this feature with PHI.</p>
                </div>

                {isLoading ? (
                    <p className="mt-2 text-gray-600 dark:text-gray-400 animate-pulse">Generating summary...</p>
                ) : error ? (
                    <p className="mt-2 text-red-600">{error}</p>
                ) : (
                    <div className="mt-2 text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{summary}</div>
                )}

                {!isLoading && !error && <AIFeedbackLoop prompt={prompt} />}
            </div>
        </div>
    );
};

export default MentorChartAudit;