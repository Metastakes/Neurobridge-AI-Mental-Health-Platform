// components/provider/ProviderCaseload.tsx
import React from 'react';
// Fix: Add file extensions to imports to resolve module errors.
import { Patient } from '../../types.ts';
import { ChevronRight } from '../Icons.tsx';

interface ProviderCaseloadProps {
    patients: Patient[];
    selectedPatientId: number | null;
    onSelectPatient: (id: number) => void;
}

const ProviderCaseload: React.FC<ProviderCaseloadProps> = ({ patients, selectedPatientId, onSelectPatient }) => {
    return (
        <div>
            <h2 className="text-sm font-semibold p-4 text-gray-600 dark:text-gray-400">My Patients ({patients.length})</h2>
            <div className="overflow-y-auto">
                {patients.map(patient => (
                    <button 
                        key={patient.id}
                        onClick={() => onSelectPatient(patient.id)}
                        className={`w-full text-left p-4 border-b dark:border-slate-700 flex justify-between items-center transition-colors ${
                            selectedPatientId === patient.id ? 'bg-indigo-50 dark:bg-slate-700' : 'hover:bg-gray-50 dark:hover:bg-slate-700/50'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            {patient.alertStatus === 'new_message' && <div className="w-2.5 h-2.5 bg-green-500 rounded-full flex-shrink-0" title="New Message"></div>}
                            {patient.alertStatus === 'emergency' && <div className="w-2.5 h-2.5 bg-red-500 rounded-full flex-shrink-0 animate-pulse" title="Emergency"></div>}
                            
                            <div>
                                <p className={`font-semibold ${selectedPatientId === patient.id ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-800 dark:text-gray-200'}`}>{patient.name}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{patient.details.diagnosis}</p>
                            </div>
                        </div>

                        {selectedPatientId === patient.id && <ChevronRight className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default ProviderCaseload;