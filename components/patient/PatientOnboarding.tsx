// components/patient/PatientOnboarding.tsx
import React, { useState } from 'react';
// Fix: Add file extensions to imports to resolve module errors.
import { legalDocuments } from '../../legalDocumentsData.ts';
import DocumentModal from './DocumentModal.tsx';
import { LegalDocument } from '../../types.ts';

interface PatientOnboardingProps {
  // Fix: Changed prop from setActiveView to onComplete to match usage in PatientApp.tsx
  onComplete: () => void;
}

const PatientOnboarding: React.FC<PatientOnboardingProps> = ({ onComplete }) => {
  const [agreed, setAgreed] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentDoc, setCurrentDoc] = useState<LegalDocument | null>(null);

  const openDoc = (docId: string) => {
    const doc = legalDocuments.find(d => d.id === docId);
    if (doc) {
      setCurrentDoc(doc);
      setIsModalOpen(true);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto flex flex-col items-center justify-center min-h-[80vh]">
        <DocumentModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            document={currentDoc}
        />
        <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800">Welcome to Health Companion</h2>
            <p className="text-gray-600 mt-2">Before we get started, please review and agree to our terms.</p>
        </div>
        
        <div className="w-full bg-white p-6 rounded-lg shadow-md mt-8 space-y-4">
            <p className="text-sm text-gray-700">Please review the following documents:</p>
            <button onClick={() => openDoc('tos')} className="text-teal-600 hover:underline font-semibold">
                Terms of Service
            </button>
            <br/>
            <button onClick={() => openDoc('privacy')} className="text-teal-600 hover:underline font-semibold">
                Privacy Policy
            </button>
            
            <div className="flex items-start mt-4">
                <input
                    id="agree"
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="h-4 w-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500 mt-1"
                />
                <label htmlFor="agree" className="ml-2 block text-sm text-gray-900">
                    I have read and agree to the Terms of Service and Privacy Policy.
                </label>
            </div>
        </div>

        <button
            disabled={!agreed}
            onClick={onComplete}
            className="w-full mt-6 bg-teal-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
            Continue
        </button>
    </div>
  );
};

export default PatientOnboarding;
