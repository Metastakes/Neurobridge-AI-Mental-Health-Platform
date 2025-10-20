// components/patient/PatientProfile.tsx
import React, { useState, useMemo } from 'react';
// Fix: Add file extensions to imports to resolve module errors.
import { Patient, Medication, Allergy, MedicationInfo } from '../../types.ts';
import { User, Mail, Edit, Save, Plus, X, ChevronDown, ChevronRight, LogOut } from '../Icons.tsx';
import { medicationCategories } from '../../medicationData.ts';
import ThemeToggle from '../ThemeToggle.tsx';

interface PatientProfileProps {
    patient: Patient;
    onUpdatePatient: (patient: Patient) => void;
    onLogout: () => void;
}

const calculateAge = (dob: string) => {
    if (!dob) return '';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};


const PatientProfile: React.FC<PatientProfileProps> = ({ patient, onUpdatePatient, onLogout }) => {
    const [isEditingMeds, setIsEditingMeds] = useState(false);
    const [isEditingAllergies, setIsEditingAllergies] = useState(false);

    const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});
    const [selectedMed, setSelectedMed] = useState<MedicationInfo | null>(null);
    const [medDetails, setMedDetails] = useState<{ dosage: string, frequency: string }>({ dosage: '', frequency: '' });
    
    // States for allergy management
    const [selectedAllergy, setSelectedAllergy] = useState<MedicationInfo | null>(null); // For adding a new allergy from med list
    const [editingAllergy, setEditingAllergy] = useState<Allergy | null>(null); // For editing an existing allergy
    const [allergyDetails, setAllergyDetails] = useState<{ reaction: string, severity: number }>({ reaction: '', severity: 5 });
    const [showAddAllergyList, setShowAddAllergyList] = useState(false);

    const age = useMemo(() => calculateAge(patient.details.dateOfBirth), [patient.details.dateOfBirth]);
    
    // Medication Handlers
    const handleMedSelection = (med: MedicationInfo) => {
        setSelectedMed(med);
        setMedDetails({ dosage: med.dosages[0] || '', frequency: med.frequencies[0] || ''});
    };
    
    const handleAddMedication = () => {
        if (!selectedMed || !medDetails.dosage || !medDetails.frequency) return;
        const newMed: Medication = {
            id: selectedMed.id,
            name: selectedMed.name,
            isCurrent: true,
            dosage: medDetails.dosage,
            frequency: medDetails.frequency,
        };
        const updatedPatient = {
            ...patient,
            details: {
                ...patient.details,
                medications: [...patient.details.medications, newMed]
            }
        };
        onUpdatePatient(updatedPatient);
        setSelectedMed(null);
    };

    const handleToggleMedStatus = (medId: string) => {
        const updatedMeds = patient.details.medications.map(m => 
            m.id === medId ? { ...m, isCurrent: !m.isCurrent } : m
        );
        onUpdatePatient({ ...patient, details: { ...patient.details, medications: updatedMeds }});
    };
    
    const handleRemoveMedication = (medId: string) => {
        const updatedMeds = patient.details.medications.filter(m => m.id !== medId);
        onUpdatePatient({ ...patient, details: { ...patient.details, medications: updatedMeds }});
    };
    
    // Allergy Handlers
    const handleAllergySelection = (med: MedicationInfo) => {
        setSelectedAllergy(med);
        setAllergyDetails({ reaction: '', severity: 5 });
        setShowAddAllergyList(false);
    };
    
    const handleEditAllergyClick = (allergy: Allergy) => {
        setEditingAllergy(allergy);
        setAllergyDetails({ reaction: allergy.reaction, severity: allergy.severity });
    };

    const handleAddAllergy = () => {
        if (!selectedAllergy || !allergyDetails.reaction) return;
        const newAllergy: Allergy = {
            id: selectedAllergy.id,
            name: selectedAllergy.name,
            reaction: allergyDetails.reaction,
            severity: allergyDetails.severity,
        };
        const updatedPatient = {
            ...patient,
            details: {
                ...patient.details,
                allergies: [...patient.details.allergies, newAllergy]
            }
        };
        onUpdatePatient(updatedPatient);
        closeAllergyModal();
    };
    
    const handleUpdateAllergy = () => {
        if (!editingAllergy) return;
        const updatedAllergies = patient.details.allergies.map(a =>
            a.id === editingAllergy.id
                ? { ...a, reaction: allergyDetails.reaction, severity: allergyDetails.severity }
                : a
        );
        onUpdatePatient({ ...patient, details: { ...patient.details, allergies: updatedAllergies } });
        closeAllergyModal();
    };

    const handleRemoveAllergy = (allergyId: string) => {
        const updatedAllergies = patient.details.allergies.filter(a => a.id !== allergyId);
        onUpdatePatient({ ...patient, details: { ...patient.details, allergies: updatedAllergies }});
    };
    
    const closeAllergyModal = () => {
        setSelectedAllergy(null);
        setEditingAllergy(null);
    };

    const handleSaveAllergy = () => {
        if (editingAllergy) {
            handleUpdateAllergy();
        } else {
            handleAddAllergy();
        }
    };
    
    const isAllergyModalOpen = !!selectedAllergy || !!editingAllergy;
    const allergyModalData = editingAllergy || selectedAllergy;

    return (
        <div className="p-4 max-w-2xl mx-auto space-y-6">
            {/* Med Detail Modal */}
            {selectedMed && (
                 <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-sm">
                        <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200">Add Details for {selectedMed.name}</h3>
                        <div className="py-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Dosage</label>
                                <select value={medDetails.dosage} onChange={e => setMedDetails(d => ({...d, dosage: e.target.value}))} className="mt-1 block w-full p-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200">
                                    {selectedMed.dosages.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Frequency</label>
                                <select value={medDetails.frequency} onChange={e => setMedDetails(d => ({...d, frequency: e.target.value}))} className="mt-1 block w-full p-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200">
                                    {selectedMed.frequencies.map(f => <option key={f} value={f}>{f}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setSelectedMed(null)} className="px-4 py-2 bg-gray-200 dark:bg-slate-600 dark:text-gray-200 rounded-md">Cancel</button>
                            <button onClick={handleAddMedication} className="px-4 py-2 bg-teal-500 text-white rounded-md">Add to My List</button>
                        </div>
                    </div>
                 </div>
            )}
            
            {/* Allergy Add/Edit Modal */}
            {isAllergyModalOpen && allergyModalData && (
                 <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-sm">
                        <h3 className="font-bold text-lg dark:text-gray-200">{editingAllergy ? 'Edit Allergy' : 'Add Allergy'}: {allergyModalData.name}</h3>
                         <div className="py-4 space-y-4">
                             <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Reaction</label>
                                 <input type="text" value={allergyDetails.reaction} onChange={e => setAllergyDetails(d => ({...d, reaction: e.target.value}))} className="mt-1 block w-full p-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 dark:text-gray-200" placeholder="e.g., Hives, Anaphylaxis" />
                             </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Severity: {allergyDetails.severity}</label>
                                 <input type="range" min="1" max="10" value={allergyDetails.severity} onChange={e => setAllergyDetails(d => ({...d, severity: parseInt(e.target.value)}))} className="w-full" />
                             </div>
                         </div>
                        <div className="flex justify-end gap-2">
                            <button onClick={closeAllergyModal} className="px-4 py-2 bg-gray-200 dark:bg-slate-600 dark:text-gray-200 rounded-md">Cancel</button>
                            <button onClick={handleSaveAllergy} className="px-4 py-2 bg-teal-500 text-white rounded-md">Save Allergy</button>
                        </div>
                    </div>
                 </div>
            )}

            {/* Profile Header */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-5 border border-gray-200 dark:border-slate-700">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-teal-500 flex items-center justify-center text-white font-bold text-3xl">
                            {patient.name.charAt(0)}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">{patient.name}</h2>
                            <p className="text-gray-500 dark:text-gray-400">{patient.details.contact.email}</p>
                        </div>
                    </div>
                     <button onClick={onLogout} className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-slate-700 hover:bg-red-100 dark:hover:bg-red-900/50 text-gray-600 dark:text-gray-300 hover:text-red-600 rounded-lg text-sm font-semibold">
                         <LogOut className="w-4 h-4" /> Logout
                     </button>
                </div>
            </div>

            {/* Clinical Summary */}
             <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-5 border border-gray-200 dark:border-slate-700">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">Clinical Summary</h3>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-800 dark:text-gray-300">
                    <div><strong className="text-gray-600 dark:text-gray-400">DOB:</strong> {patient.details.dateOfBirth} ({age} years old)</div>
                    <div><strong className="text-gray-600 dark:text-gray-400">Diagnosis:</strong> {patient.details.diagnosis}</div>
                    <div><strong className="text-gray-600 dark:text-gray-400">Phone:</strong> {patient.details.contact.phone}</div>
                    <div><strong className="text-gray-600 dark:text-gray-400">Next Appointment:</strong> {patient.details.nextAppointment?.date || 'Not scheduled'}</div>
                    <div className="col-span-2"><strong className="text-gray-600 dark:text-gray-400">Pharmacy:</strong> {patient.details.pharmacy.name} - {patient.details.pharmacy.address}</div>
                </div>
            </div>

            {/* Medications */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-5 border border-gray-200 dark:border-slate-700">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">My Medications</h3>
                    <button onClick={() => setIsEditingMeds(!isEditingMeds)} className="px-3 py-1.5 text-sm font-semibold text-white bg-teal-500 rounded-lg hover:bg-teal-600">
                       {isEditingMeds ? 'Done' : 'Edit Medications'}
                    </button>
                </div>
                {isEditingMeds && (
                    <div className="space-y-2">
                        <h4 className="font-semibold text-center my-2 text-gray-800 dark:text-gray-200">Add a Medication</h4>
                        {medicationCategories.map(cat => (
                           <div key={cat.name}>
                                <button onClick={() => setOpenCategories(p => ({...p, [cat.name]: !p[cat.name]}))} className="w-full flex justify-between items-center p-2 bg-gray-100 dark:bg-slate-700 rounded-md">
                                    <span className="font-bold text-gray-800 dark:text-gray-200">{cat.name}</span>
                                    {openCategories[cat.name] ? <ChevronDown className="text-gray-600 dark:text-gray-400" /> : <ChevronRight className="text-gray-600 dark:text-gray-400" />}
                                </button>
                                {openCategories[cat.name] && (
                                    <div className="pl-2 border-l-2 dark:border-slate-600">
                                        {cat.subCategories.map(subCat => (
                                            <div key={subCat.name}>
                                                <button onClick={() => setOpenCategories(p => ({...p, [subCat.name]: !p[subCat.name]}))} className="w-full flex justify-between items-center p-2 mt-1">
                                                     <span className="font-semibold text-gray-700 dark:text-gray-300">{subCat.name}</span>
                                                      {openCategories[subCat.name] ? <ChevronDown className="text-gray-600 dark:text-gray-400" /> : <ChevronRight className="text-gray-600 dark:text-gray-400" />}
                                                </button>
                                                {openCategories[subCat.name] && (
                                                     <div className="pl-4">
                                                         {subCat.medications.map(med => <button key={med.id} onClick={() => handleMedSelection(med)} className="block w-full text-left p-1 text-gray-700 dark:text-gray-300 hover:bg-teal-50 dark:hover:bg-teal-900/50 rounded">{med.name}</button>)}
                                                     </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                           </div>
                        ))}
                    </div>
                )}

                <ul className="mt-4 space-y-3">
                    {patient.details.medications.map(med => (
                        <li key={med.id} className="flex justify-between items-center bg-gray-50 dark:bg-slate-700/50 p-3 rounded-lg">
                            <div>
                                <span className="font-semibold text-gray-800 dark:text-gray-200">{med.name}</span>
                                <span className="text-gray-500 dark:text-gray-400 text-sm"> - {med.dosage}, {med.frequency}</span>
                            </div>
                             <div className="flex items-center gap-4">
                                <label className="flex items-center cursor-pointer">
                                  <div className="relative">
                                    <input type="checkbox" className="sr-only" checked={med.isCurrent} onChange={() => handleToggleMedStatus(med.id)} disabled={!isEditingMeds} />
                                    <div className={`block w-14 h-8 rounded-full ${med.isCurrent ? 'bg-teal-500' : 'bg-gray-300 dark:bg-slate-600'}`}></div>
                                    <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${med.isCurrent ? 'transform translate-x-6' : ''}`}></div>
                                  </div>
                                  <div className="ml-3 text-gray-700 dark:text-gray-300 font-medium text-sm">{med.isCurrent ? 'Current' : 'Past'}</div>
                                </label>
                                {isEditingMeds && <button onClick={() => handleRemoveMedication(med.id)}><X className="w-5 h-5 text-red-500" /></button>}
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
            
             {/* Allergies */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-5 border border-gray-200 dark:border-slate-700">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">My Allergies</h3>
                    <button onClick={() => { setIsEditingAllergies(!isEditingAllergies); setShowAddAllergyList(false); }} className="px-3 py-1.5 text-sm font-semibold text-white bg-teal-500 rounded-lg hover:bg-teal-600">
                       {isEditingAllergies ? 'Done' : 'Edit Allergies'}
                    </button>
                </div>
                {isEditingAllergies && (
                    <div className="mb-4">
                        <button onClick={() => setShowAddAllergyList(!showAddAllergyList)} className="w-full text-left p-2 bg-gray-100 dark:bg-slate-700 rounded-md font-semibold text-gray-700 dark:text-gray-300 flex justify-between items-center hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors">
                            <span>{showAddAllergyList ? 'Cancel Adding' : 'Add New Allergy'}</span>
                            {showAddAllergyList ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                        </button>
                        {showAddAllergyList && (
                            <div className="space-y-2 mt-2 p-2 border dark:border-slate-600 rounded-md max-h-60 overflow-y-auto">
                                <h4 className="font-semibold text-center my-2 text-sm text-gray-600 dark:text-gray-400">Select a medication to add as an allergy</h4>
                                {medicationCategories.map(cat => (
                                   <div key={cat.name}>
                                        <button onClick={() => setOpenCategories(p => ({...p, [`allergy-${cat.name}`]: !p[`allergy-${cat.name}`]}))} className="w-full flex justify-between items-center p-2 bg-gray-100 dark:bg-slate-700 rounded-md">
                                            <span className="font-bold text-gray-800 dark:text-gray-200">{cat.name}</span>
                                            {openCategories[`allergy-${cat.name}`] ? <ChevronDown className="text-gray-600 dark:text-gray-400" /> : <ChevronRight className="text-gray-600 dark:text-gray-400" />}
                                        </button>
                                        {openCategories[`allergy-${cat.name}`] && (
                                            <div className="pl-2 border-l-2 dark:border-slate-600">
                                                {cat.subCategories.map(subCat => (
                                                    <div key={subCat.name}>
                                                        <button onClick={() => setOpenCategories(p => ({...p, [`allergy-${subCat.name}`]: !p[`allergy-${subCat.name}`]}))} className="w-full flex justify-between items-center p-2 mt-1">
                                                             <span className="font-semibold text-gray-700 dark:text-gray-300">{subCat.name}</span>
                                                              {openCategories[`allergy-${subCat.name}`] ? <ChevronDown className="text-gray-600 dark:text-gray-400" /> : <ChevronRight className="text-gray-600 dark:text-gray-400" />}
                                                        </button>
                                                        {openCategories[`allergy-${subCat.name}`] && (
                                                             <div className="pl-4">
                                                                 {subCat.medications.map(med => <button key={med.id} onClick={() => handleAllergySelection(med)} className="block w-full text-left p-1 text-gray-700 dark:text-gray-300 hover:bg-teal-50 dark:hover:bg-teal-900/50 rounded">{med.name}</button>)}
                                                             </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                   </div>
                                ))}
                            </div>
                        )}
                    </div>
                 )}
                 <ul className="mt-4 space-y-3">
                    {patient.details.allergies.map(allergy => (
                         <li key={allergy.id} className="flex justify-between items-center bg-red-50 dark:bg-red-900/40 p-3 rounded-lg">
                            <div>
                               <span className="font-semibold text-red-800 dark:text-red-200">{allergy.name}</span>
                               <span className="text-red-600 dark:text-red-300 text-sm"> - Reaction: {allergy.reaction} (Severity: {allergy.severity}/10)</span>
                            </div>
                            {isEditingAllergies && (
                                <div className="flex items-center gap-2">
                                    <button onClick={() => handleEditAllergyClick(allergy)} className="p-1 hover:bg-red-100 dark:hover:bg-red-800/50 rounded-full"><Edit className="w-5 h-5 text-gray-600 dark:text-gray-300" /></button>
                                    <button onClick={() => handleRemoveAllergy(allergy.id)} className="p-1 hover:bg-red-100 dark:hover:bg-red-800/50 rounded-full"><X className="w-5 h-5 text-red-500" /></button>
                                </div>
                            )}
                         </li>
                    ))}
                     {patient.details.allergies.length === 0 && (
                        <p className="text-sm text-center text-gray-500 dark:text-gray-400">No allergies listed.</p>
                     )}
                 </ul>
            </div>
            
             {/* Settings */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-5 border border-gray-200 dark:border-slate-700">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">Settings</h3>
                <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Dark Mode</span>
                    <ThemeToggle />
                </div>
            </div>

        </div>
    );
};

export default PatientProfile;