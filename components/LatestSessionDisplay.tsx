// components/LatestSessionDisplay.tsx
import React, { useMemo } from 'react';
import { getMostRecentSession, getAllSessionsSorted } from '../utils/sessionUtils.ts';
import { users } from '../userData.ts';
import { Patient } from '../types.ts';
import { Calendar, FileText, User } from './Icons.tsx';

interface LatestSessionDisplayProps {
    showAllSessions?: boolean;
}

const LatestSessionDisplay: React.FC<LatestSessionDisplayProps> = ({ showAllSessions = false }) => {
    const mostRecentSession = useMemo(() => getMostRecentSession(), []);
    const allSessions = useMemo(() => getAllSessionsSorted(), []);

    const getPatientName = (patientId: number): string => {
        const patient = users.find(u => u.id === patientId && u.role === 'patient') as Patient | undefined;
        return patient?.name || 'Unknown Patient';
    };

    if (!mostRecentSession && !showAllSessions) {
        return (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-slate-700">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">Latest Session</h3>
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">No sessions recorded yet.</p>
            </div>
        );
    }

    if (showAllSessions) {
        return (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-slate-700">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-teal-600" />
                    All Sessions
                </h3>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                    {allSessions.length > 0 ? (
                        allSessions.map((session, index) => (
                            <div
                                key={session.id}
                                className={`p-4 rounded-lg border ${
                                    index === 0
                                        ? 'bg-teal-50 dark:bg-teal-900/20 border-teal-300 dark:border-teal-700'
                                        : 'bg-gray-50 dark:bg-slate-700/50 border-gray-200 dark:border-slate-600'
                                }`}
                            >
                                {index === 0 && (
                                    <span className="inline-block text-xs font-bold text-teal-600 dark:text-teal-400 mb-2">
                                        MOST RECENT
                                    </span>
                                )}
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                        <span className="font-semibold text-gray-800 dark:text-gray-200">
                                            {getPatientName(session.patientId)}
                                        </span>
                                    </div>
                                    <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                                        {session.type}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
                                    <Calendar className="w-4 h-4" />
                                    <span>{session.date}</span>
                                </div>
                                <p className="text-sm text-gray-700 dark:text-gray-300">{session.summary}</p>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500 dark:text-gray-400 text-center py-4">No sessions recorded yet.</p>
                    )}
                </div>
            </div>
        );
    }

    // Show only the most recent session
    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-600" />
                Latest Session
            </h3>
            {mostRecentSession && (
                <div className="p-4 bg-teal-50 dark:bg-teal-900/20 rounded-lg border border-teal-300 dark:border-teal-700">
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                            <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                            <span className="font-semibold text-gray-800 dark:text-gray-200">
                                {getPatientName(mostRecentSession.patientId)}
                            </span>
                        </div>
                        <span className="px-3 py-1 text-sm font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/40 rounded-full">
                            {mostRecentSession.type}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
                        <Calendar className="w-4 h-4" />
                        <span className="font-medium">{mostRecentSession.date}</span>
                    </div>
                    <div className="bg-white dark:bg-slate-800/50 p-3 rounded-md">
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                            {mostRecentSession.summary}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LatestSessionDisplay;
