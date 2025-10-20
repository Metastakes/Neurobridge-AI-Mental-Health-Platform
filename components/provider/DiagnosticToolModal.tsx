// components/provider/DiagnosticToolModal.tsx
import React, { useState, useEffect } from 'react';
// Fix: Add file extensions to imports to resolve module errors.
import { DiagnosticTool } from '../../types.ts';
import { X } from '../Icons.tsx';

interface DiagnosticToolModalProps {
    isOpen: boolean;
    onClose: () => void;
    tool: DiagnosticTool | null;
    patientName: string;
}

const DiagnosticToolModal: React.FC<DiagnosticToolModalProps> = ({ isOpen, onClose, tool, patientName }) => {
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setAnswers({});
            setSubmitted(false);
        }
    }, [isOpen]);

    const handleAnswerChange = (questionId: string, value: number) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));
    };

    const calculateScore = () => {
        // Fix: Explicitly type accumulator and value in reduce to ensure correct type inference for the addition operation.
        return Object.values(answers).reduce((sum: number, value: number) => sum + value, 0);
    };

    const handleSubmit = () => {
        // In a real app, you would save this score to the patient's record.
        console.log(`Submitted ${tool?.id} for ${patientName}. Score: ${calculateScore()}`);
        setSubmitted(true);
    };

    const resetAndClose = () => {
        setAnswers({});
        setSubmitted(false);
        onClose();
    };
    
    if (!isOpen || !tool) return null;

    const allQuestionsAnswered = tool.questions.length === Object.keys(answers).length;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">{tool.name}</h2>
                    <button onClick={resetAndClose} className="text-gray-500 hover:text-gray-800"><X /></button>
                </div>
                
                {!submitted ? (
                     <>
                        <p className="text-sm text-gray-600 mb-4">For patient: <span className="font-semibold">{patientName}</span>. Over the last 2 weeks, how often have you been bothered by any of the following problems?</p>
                        <div className="overflow-y-auto space-y-5 pr-2">
                            {tool.questions.map((q, index) => (
                                <div key={q.id}>
                                    <p className="font-semibold text-gray-700">{index + 1}. {q.text}</p>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {q.options.map(opt => (
                                            <button 
                                                key={opt.value}
                                                onClick={() => handleAnswerChange(q.id, opt.value)}
                                                className={`px-3 py-1.5 text-sm rounded-md border ${answers[q.id] === opt.value ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-white hover:border-indigo-400'}`}
                                            >
                                                {opt.text}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 pt-4 border-t">
                             <button 
                                onClick={handleSubmit}
                                disabled={!allQuestionsAnswered}
                                className="w-full bg-indigo-500 text-white font-bold py-2 px-4 rounded hover:bg-indigo-600 disabled:bg-indigo-300"
                            >
                                {allQuestionsAnswered ? 'Submit & Calculate Score' : 'Please answer all questions'}
                            </button>
                        </div>
                     </>
                ) : (
                    <div className="text-center py-8">
                        <h3 className="text-2xl font-bold text-gray-800">Assessment Complete</h3>
                        <p className="text-gray-600 mt-2">The results have been saved to {patientName}'s record.</p>
                        <div className="my-4">
                            <p className="text-lg">Total Score:</p>
                            <p className="text-5xl font-bold text-indigo-600">{calculateScore()}</p>
                        </div>
                        <button onClick={resetAndClose} className="mt-4 bg-gray-200 py-2 px-6 rounded-lg font-semibold hover:bg-gray-300">
                            Close
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DiagnosticToolModal;