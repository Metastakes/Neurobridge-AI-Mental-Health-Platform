// components/patient/DocumentModal.tsx
import React from 'react';
// Fix: Add file extensions to imports to resolve module errors.
import { LegalDocument } from '../../types.ts';
import { X } from '../Icons.tsx';

interface DocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: LegalDocument | null;
}

const DocumentModal: React.FC<DocumentModalProps> = ({ isOpen, onClose, document }) => {
  if (!isOpen || !document) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-5 w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4 pb-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">{document.title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X /></button>
        </div>
        <div className="overflow-y-auto space-y-4 text-gray-600">
          <p className="whitespace-pre-wrap">{document.content}</p>
        </div>
        <div className="mt-6 pt-4 border-t">
          <button onClick={onClose} className="w-full bg-teal-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-teal-600">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentModal;
