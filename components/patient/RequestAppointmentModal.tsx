// components/patient/RequestAppointmentModal.tsx
import React, { useState } from 'react';
import { useGoogleApi } from '../../GoogleApiContext.tsx';
import { addCalendarEvent, listUpcomingEvents } from '../../googleApi.ts';
import { Patient, User } from '../../types.ts';
import { X, Google } from '../Icons.tsx';

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

const RequestAppointmentModal: React.FC<RequestAppointmentModalProps> = ({ isOpen, onClose, provider, patient, onAppointmentBooked }) => {
    const { isSignedIn, signIn, isGapiLoaded, isGisLoaded, initError } = useGoogleApi();
    const [step, setStep] = useState(1);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [time, setTime] = useState('');
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

            // Check for duplicate sessions at the same time
            const existingEvents = await listUpcomingEvents();
            const duplicateSession = existingEvents.find(event => {
                if (!event.start.dateTime) return false;
                const eventStart = new Date(event.start.dateTime);
                // Check if event starts within 5 minutes of the selected time
                const timeDiff = Math.abs(eventStart.getTime() - startDateTime.getTime());
                return timeDiff < 5 * 60000 && event.summary?.includes(provider.name);
            });

            if (duplicateSession) {
                setError("A session with this provider already exists at this time. Please choose a different time slot.");
                setIsLoading(false);
                return;
            }

            await addCalendarEvent(
                `Therapy Session: ${provider.name} & ${patient.name}`,
                startDateTime.toISOString(),
                endDateTime.toISOString(),
                provider.email
            );

            setStep(3); // Success step
            onAppointmentBooked();
        } catch (err) {
            setError("Failed to create appointment. Please try again.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleClose = () => {
        setStep(1);
        setTime('');
        setError('');
        setIsLoading(false);
        onClose();
    }
    
    if (!isOpen) return null;
    
    const renderContent = () => {
        if (initError) {
             return (
                <div className="text-center p-8">
                    <h3 className="font-bold text-lg mb-2 text-red-700 dark:text-red-300">Booking Error</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">The appointment booking service is currently unavailable due to a configuration issue. Please contact support.</p>
                </div>
            );
        }

        if (!isGapiLoaded || !isGisLoaded) {
            return <div className="text-center p-8 dark:text-gray-300">Loading Google Services...</div>
        }
        
        if (!isSignedIn) {
             return (
                 <div className="text-center p-8">
                     <h3 className="font-bold text-lg mb-2 dark:text-gray-200">Sign in to book</h3>
                     <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Please sign in with your Google account to create a calendar event for your appointment.</p>
                     <button onClick={signIn} className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600">
                        <Google className="w-5 h-5 bg-white rounded-full p-0.5" /> Sign in with Google
                    </button>
                 </div>
             )
        }
        
        switch (step) {
            case 1: // Form
                return (
                     <div className="p-6">
                        <h3 className="font-bold text-lg mb-4 dark:text-gray-200">Request Appointment with {provider?.name}</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
                                <input type="date" value={date} onChange={e => setDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className="mt-1 block w-full p-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 dark:text-gray-200" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Time</label>
                                 <div className="grid grid-cols-4 gap-2 mt-1">
                                    {availableTimes.map(t => (
                                        <button key={t} onClick={() => setTime(t)} className={`p-2 rounded-md text-sm ${time === t ? 'bg-teal-500 text-white' : 'bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-slate-600'}`}>
                                            {new Date(`1970-01-01T${t}:00`).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </button>
                                    ))}
                                 </div>
                            </div>
                        </div>
                        {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
                        <div className="mt-6 flex justify-end gap-2">
                             <button onClick={handleClose} className="px-4 py-2 bg-gray-200 dark:bg-slate-600 dark:text-gray-200 rounded-md">Cancel</button>
                             <button onClick={handleBooking} disabled={!time || isLoading} className="px-4 py-2 bg-teal-500 text-white rounded-md disabled:bg-gray-400">
                                {isLoading ? 'Booking...' : 'Book and Invite'}
                            </button>
                        </div>
                    </div>
                );
            case 3: // Success
                 return (
                     <div className="text-center p-8">
                         <div className="text-5xl mb-3">✅</div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Appointment Requested!</h3>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">An invitation has been sent to {provider?.name} and added to your Google Calendar.</p>
                        <button onClick={handleClose} className="mt-6 w-full bg-gray-200 dark:bg-slate-600 dark:text-gray-200 py-2 rounded font-semibold hover:bg-gray-300 dark:hover:bg-slate-500">Close</button>
                    </div>
                 );
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