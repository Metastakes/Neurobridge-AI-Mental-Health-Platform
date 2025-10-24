// components/patient/RequestAppointmentModal.tsx
import React, { useState } from 'react';
import { Patient, User } from '../../types.ts';
import { X } from '../Icons.tsx';
import { bookAppointment } from '../../hooks/useAppointments.ts';

interface RequestAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider?: User;
  patient: Patient;
  onAppointmentBooked: () => void;
}

const availableTimes = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00"
];

const appointmentTypes = [
    { value: 'initial_consultation', label: 'Initial Consultation' },
    { value: 'follow_up', label: 'Follow-up Appointment' },
    { value: 'therapy_session', label: 'Therapy Session' },
    { value: 'medication_review', label: 'Medication Review' },
];

const RequestAppointmentModal: React.FC<RequestAppointmentModalProps> = ({ isOpen, onClose, provider, patient, onAppointmentBooked }) => {
    const [step, setStep] = useState(1);
    const [appointmentType, setAppointmentType] = useState('therapy_session');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [time, setTime] = useState('');
    const [notes, setNotes] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleBooking = async () => {
        if (!provider || !date || !time) {
            setError("Please select a date and time.");
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const startDateTime = new Date(`${date}T${time}:00`);
            const endDateTime = new Date(startDateTime.getTime() + 50 * 60000); // 50 minute session

            const result = await bookAppointment({
                providerId: provider.id,
                appointmentType,
                scheduledStart: startDateTime.toISOString(),
                scheduledEnd: endDateTime.toISOString(),
                notes: notes.trim() || undefined,
            });

            if (result.success) {
                setStep(3); // Success step
                onAppointmentBooked();
            } else {
                setError(result.error || "Failed to book appointment. Please try again.");
            }
        } catch (err) {
            setError("Failed to book appointment. Please try again.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleClose = () => {
        setStep(1);
        setAppointmentType('therapy_session');
        setTime('');
        setNotes('');
        setError('');
        setIsLoading(false);
        onClose();
    }

    if (!isOpen) return null;

    const renderContent = () => {
        switch (step) {
            case 1: // Form
                return (
                     <div className="p-6">
                        <h3 className="font-bold text-lg mb-4 dark:text-gray-200">Request Appointment with {provider?.name}</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Appointment Type</label>
                                <select
                                    value={appointmentType}
                                    onChange={e => setAppointmentType(e.target.value)}
                                    className="mt-1 block w-full p-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 dark:text-gray-200"
                                >
                                    {appointmentTypes.map(type => (
                                        <option key={type.value} value={type.value}>{type.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={e => setDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                    className="mt-1 block w-full p-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 dark:text-gray-200"
                                />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Time</label>
                                 <div className="grid grid-cols-4 gap-2 mt-1">
                                    {availableTimes.map(t => (
                                        <button
                                            key={t}
                                            onClick={() => setTime(t)}
                                            type="button"
                                            className={`p-2 rounded-md text-sm ${time === t ? 'bg-teal-500 text-white' : 'bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-slate-600'}`}
                                        >
                                            {new Date(`1970-01-01T${t}:00`).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </button>
                                    ))}
                                 </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notes (Optional)</label>
                                <textarea
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    rows={3}
                                    placeholder="Any additional information about your appointment..."
                                    className="mt-1 block w-full p-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 dark:text-gray-200"
                                />
                            </div>
                        </div>
                        {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
                        <div className="mt-6 flex justify-end gap-2">
                             <button
                                onClick={handleClose}
                                type="button"
                                className="px-4 py-2 bg-gray-200 dark:bg-slate-600 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-slate-500"
                            >
                                Cancel
                            </button>
                             <button
                                onClick={handleBooking}
                                disabled={!time || isLoading}
                                type="button"
                                className="px-4 py-2 bg-teal-500 text-white rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-teal-600"
                            >
                                {isLoading ? 'Booking...' : 'Book Appointment'}
                            </button>
                        </div>
                    </div>
                );
            case 3: // Success
                 return (
                     <div className="text-center p-8">
                         <div className="text-5xl mb-3">✅</div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Appointment Booked!</h3>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">
                            Your appointment with {provider?.name} has been successfully scheduled.
                        </p>
                        <button
                            onClick={handleClose}
                            type="button"
                            className="mt-6 w-full bg-gray-200 dark:bg-slate-600 dark:text-gray-200 py-2 rounded font-semibold hover:bg-gray-300 dark:hover:bg-slate-500"
                        >
                            Close
                        </button>
                    </div>
                 );
            default:
                return null;
        }
    }

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md">
                <div className="flex justify-end p-2">
                     <button onClick={handleClose} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"><X /></button>
                </div>
                {renderContent()}
            </div>
        </div>
    );
};

export default RequestAppointmentModal;