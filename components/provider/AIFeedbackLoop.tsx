// components/provider/AIFeedbackLoop.tsx
import React, { useState } from 'react';
// Fix: Add file extension to import to resolve module error.
import { ThumbsUp, ThumbsDown } from '../Icons.tsx';

interface AIFeedbackLoopProps {
    prompt: string;
}

const AIFeedbackLoop: React.FC<AIFeedbackLoopProps> = ({ prompt }) => {
    const [feedback, setFeedback] = useState<'good' | 'bad' | null>(null);
    const [submitted, setSubmitted] = useState(false);

    const handleFeedback = (type: 'good' | 'bad') => {
        setFeedback(type);
        // Here you would typically send this feedback to a logging service
        console.log(`Feedback received: ${type} for prompt: "${prompt}"`);
        setSubmitted(true);
    };

    if (submitted) {
        return <p className="text-xs text-gray-500 mt-2">Thank you for your feedback!</p>
    }

    return (
        <div className="flex items-center gap-4 mt-4 pt-2 border-t">
            <p className="text-xs text-gray-600 font-semibold">Was this summary helpful?</p>
            <div className="flex gap-2">
                <button 
                    onClick={() => handleFeedback('good')} 
                    className={`p-1.5 rounded-full ${feedback === 'good' ? 'bg-green-100' : 'hover:bg-gray-100'}`}
                    aria-label="Helpful"
                >
                    <ThumbsUp className={`w-4 h-4 ${feedback === 'good' ? 'text-green-600' : 'text-gray-500'}`} />
                </button>
                <button 
                    onClick={() => handleFeedback('bad')} 
                    className={`p-1.5 rounded-full ${feedback === 'bad' ? 'bg-red-100' : 'hover:bg-gray-100'}`}
                    aria-label="Not helpful"
                >
                    <ThumbsDown className={`w-4 h-4 ${feedback === 'bad' ? 'text-red-600' : 'text-gray-500'}`} />
                </button>
            </div>
        </div>
    );
};

export default AIFeedbackLoop;
