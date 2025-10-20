// medicationData.ts
// Fix: Add file extension to import to resolve module error.
import { MedicationCategory } from './types.ts';

export const medicationCategories: MedicationCategory[] = [
    {
        name: 'Psychiatric',
        subCategories: [
            {
                name: 'Anxiolytics (Anti-Anxiety)',
                medications: [
                    { id: 'alprazolam', name: 'Alprazolam (Xanax)', dosages: ['0.25 mg', '0.5 mg', '1 mg'], frequencies: ['As needed', 'Twice daily'] },
                    { id: 'buspirone', name: 'Buspirone (Buspar)', dosages: ['5 mg', '10 mg', '15 mg'], frequencies: ['Twice daily', 'Three times daily'] },
                    { id: 'clonazepam', name: 'Clonazepam (Klonopin)', dosages: ['0.5 mg', '1 mg', '2 mg'], frequencies: ['Once daily', 'Twice daily'] },
                    { id: 'diazepam', name: 'Diazepam (Valium)', dosages: ['2 mg', '5 mg', '10 mg'], frequencies: ['Once daily', 'As needed'] },
                    { id: 'lorazepam', name: 'Lorazepam (Ativan)', dosages: ['0.5 mg', '1 mg', '2 mg'], frequencies: ['As needed', 'Three times daily'] },
                ].sort((a, b) => a.name.localeCompare(b.name))
            },
            {
                name: 'Mood Stabilizers',
                medications: [
                    { id: 'carbamazepine', name: 'Carbamazepine (Tegretol)', dosages: ['100 mg', '200 mg'], frequencies: ['Twice daily'] },
                    { id: 'lamotrigine', name: 'Lamotrigine (Lamictal)', dosages: ['25 mg', '50 mg', '100 mg'], frequencies: ['Once daily', 'Twice daily'] },
                    { id: 'lithium', name: 'Lithium (Lithobid)', dosages: ['300 mg', '600 mg'], frequencies: ['Twice daily', 'Three times daily'] },
                    { id: 'valproic-acid', name: 'Valproic Acid (Depakote)', dosages: ['250 mg', '500 mg'], frequencies: ['Once daily', 'Twice daily'] },
                ].sort((a, b) => a.name.localeCompare(b.name))
            },
            {
                name: 'Antipsychotics (1st Gen)',
                medications: [
                    { id: 'haloperidol', name: 'Haloperidol (Haldol)', dosages: ['1 mg', '2 mg', '5 mg'], frequencies: ['Once daily', 'Twice daily'] },
                    { id: 'chlorpromazine', name: 'Chlorpromazine (Thorazine)', dosages: ['25 mg', '50 mg', '100 mg'], frequencies: ['Once daily'] },
                ].sort((a, b) => a.name.localeCompare(b.name))
            },
            {
                name: 'Antipsychotics (2nd Gen)',
                medications: [
                     { id: 'aripiprazole', name: 'Aripiprazole (Abilify)', dosages: ['2 mg', '5 mg', '10 mg'], frequencies: ['Once daily'] },
                     { id: 'olanzapine', name: 'Olanzapine (Zyprexa)', dosages: ['5 mg', '10 mg', '15 mg'], frequencies: ['Once daily'] },
                     { id: 'quetiapine', name: 'Quetiapine (Seroquel)', dosages: ['25 mg', '50 mg', '100 mg'], frequencies: ['Once daily', 'Twice daily'] },
                     { id: 'risperidone', name: 'Risperidone (Risperdal)', dosages: ['1 mg', '2 mg', '3 mg'], frequencies: ['Once daily', 'Twice daily'] },
                     { id: 'ziprasidone', name: 'Ziprasidone (Geodon)', dosages: ['20 mg', '40 mg', '80 mg'], frequencies: ['Twice daily'] },
                ].sort((a, b) => a.name.localeCompare(b.name))
            },
            {
                name: 'Off-label Seizure Medications',
                 medications: [
                    { id: 'gabapentin', name: 'Gabapentin (Neurontin)', dosages: ['100 mg', '300 mg', '600 mg'], frequencies: ['Once daily', 'Three times daily'] },
                    { id: 'topiramate', name: 'Topiramate (Topamax)', dosages: ['25 mg', '50 mg', '100 mg'], frequencies: ['Once daily', 'Twice daily'] },
                ].sort((a, b) => a.name.localeCompare(b.name))
            }
        ]
    },
    {
        name: 'Medical',
        subCategories: [
            {
                name: 'Cardiovascular',
                medications: [
                    { id: 'amlodipine', name: 'Amlodipine (Norvasc)', dosages: ['5 mg', '10 mg'], frequencies: ['Once daily'] },
                    { id: 'atorvastatin', name: 'Atorvastatin (Lipitor)', dosages: ['10 mg', '20 mg', '40 mg'], frequencies: ['Once daily'] },
                    { id: 'lisinopril', name: 'Lisinopril (Zestril)', dosages: ['5 mg', '10 mg', '20 mg'], frequencies: ['Once daily'] },
                    { id: 'metoprolol', name: 'Metoprolol (Lopressor)', dosages: ['25 mg', '50 mg', '100 mg'], frequencies: ['Once daily', 'Twice daily'] },
                ].sort((a, b) => a.name.localeCompare(b.name))
            },
            {
                name: 'Renal (Kidney)',
                medications: [
                     { id: 'furosemide', name: 'Furosemide (Lasix)', dosages: ['20 mg', '40 mg', '80 mg'], frequencies: ['Once daily', 'Twice daily'] },
                ].sort((a, b) => a.name.localeCompare(b.name))
            },
            {
                name: 'Hepatic (Liver)',
                 medications: [
                    { id: 'lactulose', name: 'Lactulose', dosages: ['15 mL', '30 mL'], frequencies: ['Once daily', 'Twice daily'] },
                ].sort((a, b) => a.name.localeCompare(b.name))
            },
            {
                name: 'Antibiotics',
                 medications: [
                    { id: 'amoxicillin', name: 'Amoxicillin', dosages: ['250 mg', '500 mg'], frequencies: ['Twice daily', 'Three times daily'] },
                    { id: 'azithromycin', name: 'Azithromycin (Z-Pak)', dosages: ['250 mg', '500 mg'], frequencies: ['Once daily'] },
                    { id: 'doxycycline', name: 'Doxycycline', dosages: ['50 mg', '100 mg'], frequencies: ['Once daily', 'Twice daily'] },
                ].sort((a, b) => a.name.localeCompare(b.name))
            },
            {
                name: 'Narcotic (Pain)',
                 medications: [
                    { id: 'hydrocodone-acetaminophen', name: 'Hydrocodone/Acetaminophen (Vicodin)', dosages: ['5/325 mg', '10/325 mg'], frequencies: ['As needed'] },
                    { id: 'oxycodone', name: 'Oxycodone (OxyContin)', dosages: ['5 mg', '10 mg'], frequencies: ['As needed'] },
                ].sort((a, b) => a.name.localeCompare(b.name))
            },
            {
                name: 'NSAIDs',
                medications: [
                    { id: 'ibuprofen', name: 'Ibuprofen (Advil, Motrin)', dosages: ['200 mg', '400 mg', '600 mg'], frequencies: ['As needed'] },
                    { id: 'naproxen', name: 'Naproxen (Aleve)', dosages: ['220 mg', '500 mg'], frequencies: ['Twice daily', 'As needed'] },
                ].sort((a, b) => a.name.localeCompare(b.name))
            },
             {
                name: 'Vitamins & Minerals',
                medications: [
                    { id: 'vitamin-d3', name: 'Vitamin D3', dosages: ['1000 IU', '5000 IU'], frequencies: ['Once daily'] },
                    { id: 'calcium', name: 'Calcium', dosages: ['500 mg', '1000 mg'], frequencies: ['Once daily', 'Twice daily'] },
                    { id: 'iron', name: 'Iron (Ferrous Sulfate)', dosages: ['325 mg'], frequencies: ['Once daily'] },
                ].sort((a, b) => a.name.localeCompare(b.name))
            },
        ]
    }
];
