#!/usr/bin/env ts-node
// scripts/displayLatestSession.ts
// A script to display the most recent session and all sessions sorted by date

import { getMostRecentSession, getAllSessionsSorted } from '../utils/sessionUtils.ts';
import { users } from '../userData.ts';
import { Patient } from '../types.ts';

const getPatientName = (patientId: number): string => {
    const patient = users.find(u => u.id === patientId && u.role === 'patient') as Patient | undefined;
    return patient?.name || 'Unknown Patient';
};

console.log('\n==============================================');
console.log('  NEUROBRIDGE SESSION REPORT');
console.log('==============================================\n');

// Display the most recent session
const mostRecentSession = getMostRecentSession();

if (mostRecentSession) {
    console.log('📋 MOST RECENT SESSION:');
    console.log('─────────────────────────────────────────────');
    console.log(`  Patient:    ${getPatientName(mostRecentSession.patientId)}`);
    console.log(`  Patient ID: ${mostRecentSession.patientId}`);
    console.log(`  Date:       ${mostRecentSession.date}`);
    console.log(`  Type:       ${mostRecentSession.type}`);
    console.log(`  Summary:    ${mostRecentSession.summary}`);
    console.log('─────────────────────────────────────────────\n');
} else {
    console.log('No sessions found.\n');
}

// Display all sessions
const allSessions = getAllSessionsSorted();

if (allSessions.length > 0) {
    console.log(`📚 ALL SESSIONS (${allSessions.length} total, sorted by date):`);
    console.log('==============================================\n');

    allSessions.forEach((session, index) => {
        console.log(`${index + 1}. ${session.date} - ${session.type}`);
        console.log(`   Patient: ${getPatientName(session.patientId)}`);
        console.log(`   Summary: ${session.summary}`);
        console.log('');
    });
} else {
    console.log('No sessions recorded yet.\n');
}

console.log('==============================================\n');

// Export the data as JSON for programmatic use
const sessionData = {
    mostRecent: mostRecentSession,
    allSessions: allSessions
};

console.log('JSON Output:');
console.log(JSON.stringify(sessionData, null, 2));
