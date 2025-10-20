// userData.ts
// Fix: Add file extension to import to resolve module error.
import { Patient, Provider, Mentor, User, ChatMessage, CaseNote, PatientDetails } from './types.ts';

const basePatientDetails: Omit<PatientDetails, 'diagnosis' | 'medications' | 'allergies'> = {
    dateOfBirth: '1990-05-15',
    contact: { phone: '555-0101', email: 'patient@neuro.io' },
    address: {
        street: '123 Wellness Way',
        city: 'Healthestia',
        state: 'CA',
        zip: '90210'
    },
    pharmacy: {
        name: 'Community Pharmacy',
        address: '456 Health St, Healthestia, CA 90210'
    },
    biometrics: {
        height: "5' 8\"",
        weight: '150 lbs'
    },
    nextAppointment: {
        id: 'appt1',
        date: '2024-11-05',
        time: '10:00 AM',
        providerName: 'Dr. Evelyn Reed',
        type: 'Video Call'
    },
    medicationLog: [
        { id: 'log1', timestamp: '2024-10-18 09:15 AM', user: 'Provider', action: 'Added Buspirone 10 mg' }
    ],
    onboardingComplete: true,
    signedDocuments: ['tos', 'privacy'],
};


export const users: (Patient | Provider | Mentor)[] = [
    // Patients
    {
        id: 1,
        name: 'Alex Johnson',
        email: 'patient@neuro.io',
        password: 'password',
        role: 'patient',
        details: {
            ...basePatientDetails,
            diagnosis: 'Generalized Anxiety Disorder',
            medications: [
                { id: 'buspirone', name: 'Buspirone (Buspar)', dosage: '10 mg', frequency: 'Twice daily', isCurrent: true },
                { id: 'trazodone', name: 'Trazodone', dosage: '50 mg', frequency: 'As needed for sleep', isCurrent: false },
            ],
            allergies: [{ id: 'penicillin', name: 'Penicillin', reaction: 'Hives', severity: 7 }],
        },
        alertStatus: 'new_message',
        providerId: 101
    },
    {
        id: 2,
        name: 'Maria Garcia',
        email: 'maria@example.com',
        password: 'password',
        role: 'patient',
        details: {
            ...basePatientDetails,
            dateOfBirth: '1985-11-22',
            diagnosis: 'Major Depressive Disorder',
            medications: [
                { id: 'sertraline', name: 'Sertraline (Zoloft)', dosage: '100 mg', frequency: 'Once daily', isCurrent: true },
            ],
            allergies: [],
        },
        alertStatus: 'stable',
        providerId: 101,
    },
    {
        id: 3,
        name: 'Chen Wei',
        email: 'chen@example.com',
        password: 'password',
        role: 'patient',
        details: {
            ...basePatientDetails,
            dateOfBirth: '1992-02-10',
            diagnosis: 'Bipolar II Disorder',
            medications: [
                { id: 'lamotrigine', name: 'Lamotrigine (Lamictal)', dosage: '150 mg', frequency: 'Once daily', isCurrent: true },
                { id: 'quetiapine', name: 'Quetiapine (Seroquel)', dosage: '25 mg', frequency: 'As needed for sleep', isCurrent: true }
            ],
            allergies: [{ id: 'sulfa-drugs', name: 'Sulfa Drugs', reaction: 'Severe rash', severity: 9 }],
        },
        alertStatus: 'emergency',
        providerId: 101,
    },

    // Providers
    {
        id: 101,
        name: 'Dr. Evelyn Reed',
        email: 'provider@neuro.io',
        password: 'password',
        role: 'provider',
        patientIds: [1, 2, 3],
        mentorId: 201
    },

    // Mentor
    {
        id: 201,
        name: 'Dr. Ben Carter',
        email: 'mentor@neuro.io',
        password: 'password',
        role: 'mentor',
        menteeIds: [101]
    },
];

export const initialChatHistories: Record<string, ChatMessage[]> = {
    'chat_1_101': [
        { id: 'msg1', senderId: 101, text: 'Hi Alex, how are you feeling today?', timestamp: '10:30 AM' },
        { id: 'msg2', senderId: 1, text: 'A bit anxious about work, but managing.', timestamp: '10:32 AM' }
    ],
    'chat_2_101': [],
    'chat_3_101': [],
    'chat_101_201': [
        { id: 'msg3', senderId: 201, text: 'Evelyn, let\'s discuss the new patient, Chen Wei.', timestamp: '09:00 AM' },
        { id: 'msg4', senderId: 101, text: 'Of course, Ben. I have some concerns about his sleep patterns.', timestamp: '09:05 AM' }
    ]
};

export const caseNotes: Record<number, CaseNote[]> = {
    1: [
        { id: 'cn1', date: '2024-10-18', type: 'Follow-up', summary: 'Patient reports increased anxiety due to work stress. Discussed coping mechanisms.' },
        { id: 'cn2', date: '2024-10-11', type: 'Check-in', summary: 'Medication seems to be effective with minimal side effects.' },
    ],
    3: [
        { id: 'cn3', date: '2024-10-22', type: 'Intake', summary: 'New patient intake. Established initial treatment plan for Bipolar II.' },
    ]
};
