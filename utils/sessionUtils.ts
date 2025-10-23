// utils/sessionUtils.ts
import { caseNotes } from '../userData.ts';
import { CaseNote } from '../types.ts';

export interface SessionWithPatient extends CaseNote {
    patientId: number;
}

/**
 * Fetches the most recent session across all patients
 * @returns The most recent session with patient ID, or null if no sessions exist
 */
export const getMostRecentSession = (): SessionWithPatient | null => {
    let mostRecentSession: SessionWithPatient | null = null;
    let mostRecentDate: Date | null = null;

    // Iterate through all patients' case notes
    Object.entries(caseNotes).forEach(([patientId, notes]) => {
        notes.forEach(note => {
            const noteDate = new Date(note.date);

            if (!mostRecentDate || noteDate > mostRecentDate) {
                mostRecentDate = noteDate;
                mostRecentSession = {
                    ...note,
                    patientId: parseInt(patientId)
                };
            }
        });
    });

    return mostRecentSession;
};

/**
 * Fetches all sessions sorted by date (most recent first)
 * @returns Array of all sessions with patient IDs, sorted by date descending
 */
export const getAllSessionsSorted = (): SessionWithPatient[] => {
    const allSessions: SessionWithPatient[] = [];

    // Collect all sessions from all patients
    Object.entries(caseNotes).forEach(([patientId, notes]) => {
        notes.forEach(note => {
            allSessions.push({
                ...note,
                patientId: parseInt(patientId)
            });
        });
    });

    // Sort by date (most recent first)
    return allSessions.sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
};

/**
 * Fetches the most recent session for a specific patient
 * @param patientId - The patient's ID
 * @returns The most recent session for the patient, or null if none exist
 */
export const getMostRecentSessionForPatient = (patientId: number): CaseNote | null => {
    const notes = caseNotes[patientId];

    if (!notes || notes.length === 0) {
        return null;
    }

    // Sort notes by date and return the most recent
    const sortedNotes = [...notes].sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    return sortedNotes[0];
};
