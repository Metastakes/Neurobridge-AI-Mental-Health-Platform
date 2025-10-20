// components/HIPAADisclaimerModal.tsx
import React from 'react';
import { X } from './Icons.tsx';

interface HIPAADisclaimerModalProps {
  isOpen: boolean;
  onAcknowledge: () => void;
  userRole: 'provider' | 'mentor';
}

const HIPAADisclaimerModal: React.FC<HIPAADisclaimerModalProps> = ({ isOpen, onAcknowledge, userRole }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-lg">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Important Compliance Notice</h2>
        <div className="my-4 space-y-3 text-sm text-gray-700 dark:text-gray-300">
          <p>
            As a <span className="font-semibold">{userRole}</span>, you are responsible for maintaining compliance with the Health Insurance Portability and Accountability Act (HIPAA) when using this platform.
          </p>
          <p>
            This platform integrates with third-party services, such as Google (for Calendar, Meet, and AI features). To use these services with Protected Health Information (PHI), your organization <span className="font-bold text-red-600 dark:text-red-400">must</span> have a signed Business Associate Agreement (BAA) with Google.
          </p>
          <p>
            Do not use any features that transmit PHI to third parties (including AI-powered notes and calendar integration) unless a BAA is in place.
          </p>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={onAcknowledge}
            className="w-full bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700"
          >
            I Understand and Acknowledge My Responsibilities
          </button>
        </div>
      </div>
    </div>
  );
};

export default HIPAADisclaimerModal;
