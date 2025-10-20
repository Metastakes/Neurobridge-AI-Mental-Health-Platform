// components/SecureSessionModal.tsx
import React from 'react';
// Fix: Add file extension to import to resolve module error.
import { X } from './Icons.tsx';

interface SecureSessionModalProps {
    isOpen: boolean;
    onClose: () => void;
    patientName: string;
}

const SecureSessionModal: React.FC<SecureSessionModalProps> = ({ isOpen, onClose, patientName }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Secure Video Session</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X /></button>
                </div>
                <div className="text-center">
                    <p className="text-gray-600 mb-4">You are about to start a secure session with <span className="font-semibold">{patientName}</span>.</p>
                    <div className="bg-gray-800 aspect-video rounded-lg flex items-center justify-center text-white mb-4">
                        <p>Video feed would appear here.</p>
                    </div>
                    <button onClick={onClose} className="w-full bg-red-500 text-white font-bold py-2 px-4 rounded hover:bg-red-600">
                        End Session
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SecureSessionModal;
