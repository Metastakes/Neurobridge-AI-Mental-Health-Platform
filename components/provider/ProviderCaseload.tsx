// components/provider/ProviderCaseload.tsx
import React from 'react';
// Fix: Add file extensions to imports to resolve module errors.
import { Patient } from '../../types.ts';
import { ChevronRight } from '../Icons.tsx';

interface ProviderCaseloadProps {
    patients: any[]; // Can be legacy Patient[] or API Patient[]
    selectedPatientId: string | null;
    onSelectPatient: (id: string) => void;
}

const ProviderCaseload: React.FC<ProviderCaseloadProps> = ({ patients, selectedPatientId, onSelectPatient }) => {
    // Helper to get patient display name (handles both legacy and API data)
    const getPatientName = (patient: any) => {
        if (patient.name) return patient.name; // Legacy format
        if (patient.user) return `${patient.user.firstName} ${patient.user.lastName}`; // API format
        return 'Unknown Patient';
    };

    // Helper to get primary diagnosis
    const getPrimaryDiagnosis = (patient: any) => {
        if (patient.details?.diagnosis) return patient.details.diagnosis; // Legacy format
        if (patient.diagnoses?.length > 0) {
            const primary = patient.diagnoses.find((d: any) => d.isPrimary);
            return primary?.description || patient.diagnoses[0]?.description || 'No diagnosis';
        }
        return 'No diagnosis';
    };

    // Helper to get alert status
    const getAlertStatus = (patient: any) => {
        return patient.alertStatus || 'STABLE';
    };

    return (
        <div>
            <h2 className="text-sm font-semibold p-4 text-gray-600 dark:text-gray-400">My Patients ({patients.length})</h2>
            <div className="overflow-y-auto">
                {patients.map(patient => {
                    const patientName = getPatientName(patient);
                    const diagnosis = getPrimaryDiagnosis(patient);
                    const alertStatus = getAlertStatus(patient);
                    const patientId = patient.id.toString();

                    return (
                        <button
                            key={patientId}
                            onClick={() => onSelectPatient(patientId)}
                            className={`w-full text-left p-4 border-b dark:border-slate-700 flex justify-between items-center transition-colors ${
                                selectedPatientId === patientId ? 'bg-indigo-50 dark:bg-slate-700' : 'hover:bg-gray-50 dark:hover:bg-slate-700/50'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                {alertStatus === 'NEW_MESSAGE' && <div className="w-2.5 h-2.5 bg-green-500 rounded-full flex-shrink-0" title="New Message"></div>}
                                {alertStatus === 'EMERGENCY' && <div className="w-2.5 h-2.5 bg-red-500 rounded-full flex-shrink-0 animate-pulse" title="Emergency"></div>}
                                {alertStatus === 'CRITICAL' && <div className="w-2.5 h-2.5 bg-orange-500 rounded-full flex-shrink-0 animate-pulse" title="Critical"></div>}

                                <div>
                                    <p className={`font-semibold ${selectedPatientId === patientId ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-800 dark:text-gray-200'}`}>{patientName}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{diagnosis}</p>
                                </div>
                            </div>

                            {selectedPatientId === patientId && <ChevronRight className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default ProviderCaseload;