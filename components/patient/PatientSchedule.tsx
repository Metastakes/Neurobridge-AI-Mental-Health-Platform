// components/patient/PatientSchedule.tsx
import React, { useState, useMemo, useEffect, useCallback } from 'react';
// Fix: Add file extensions to imports to resolve module errors.
import { ChevronLeft, ChevronRight, Video, User as UserIcon, Google, ClipboardCheck } from '../Icons.tsx';
import { getDaysInMonth, getFirstDayOfMonth } from '../../utils/date.ts';
import { Patient, User as AppUser, CalendarEvent } from '../../types.ts';
import RequestAppointmentModal from './RequestAppointmentModal.tsx';
import { useGoogleApi } from '../../GoogleApiContext.tsx';
import { listUpcomingEvents } from '../../googleApi.ts';

interface PatientScheduleProps {
    patient: Patient;
    allUsers: AppUser[];
}

const PatientSchedule: React.FC<PatientScheduleProps> = ({ patient, allUsers }) => {
    const { isSignedIn, signIn, isGapiLoaded, isGisLoaded, initError } = useGoogleApi();
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);

    const provider = useMemo(() => {
        return allUsers.find(u => u.id === patient.providerId);
    }, [patient, allUsers]);

    const fetchEvents = useCallback(async () => {
        if (isSignedIn) {
            setLoading(true);
            try {
                const eventList = await listUpcomingEvents();
                setEvents(eventList);
            } catch (error) {
                console.error("Failed to fetch events:", error);
            } finally {
                setLoading(false);
            }
        }
    }, [isSignedIn]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    const appointmentDates = useMemo(() => events.map(event => new Date(event.start.dateTime || event.start.date!).toDateString()), [events]);

    const handlePrevMonth = () => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };
    
    const handleDateClick = (day: number) => {
        setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
    };

    const renderCalendar = () => {
        const daysInMonth = getDaysInMonth(currentDate);
        const firstDay = getFirstDayOfMonth(currentDate);
        const today = new Date();

        const calendarDays = [];

        // Padding for previous month
        for (let i = 0; i < firstDay; i++) {
            calendarDays.push(<div key={`pad-start-${i}`} className="p-2"></div>);
        }

        // Days of current month
        for (let day = 1; day <= daysInMonth; day++) {
            const loopDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const isToday = loopDate.toDateString() === today.toDateString();
            const isSelected = loopDate.toDateString() === selectedDate.toDateString();
            const hasAppointment = appointmentDates.includes(loopDate.toDateString());

            let dayClasses = 'p-2 rounded-full cursor-pointer relative flex items-center justify-center transition-colors duration-200 aspect-square text-gray-800 dark:text-gray-200';
            if (isSelected) {
                dayClasses += ' bg-teal-500 text-white font-bold';
            } else if (isToday) {
                dayClasses += ' bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-200 font-semibold';
            } else {
                dayClasses += ' hover:bg-gray-100 dark:hover:bg-slate-700';
            }

            calendarDays.push(
                <div key={day} className={dayClasses} onClick={() => handleDateClick(day)}>
                    <span>{day}</span>
                    {hasAppointment && <div className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-red-500'}`}></div>}
                </div>
            );
        }

        return calendarDays;
    };
    
    const monthYearFormat = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long' });
    
    if (initError) {
        return (
            <div className="p-4 max-w-md mx-auto space-y-6 text-center">
                <div className="bg-red-100 dark:bg-red-900/40 border-l-4 border-red-500 text-red-700 dark:text-red-200 p-4" role="alert">
                    <p className="font-bold">Calendar Unavailable</p>
                    <p className="text-sm">Could not connect to Google Calendar services. The administrator needs to configure the API key.</p>
                </div>
            </div>
        );
    }

    if (!isGapiLoaded || !isGisLoaded) {
        return <div className="p-4 max-w-md mx-auto space-y-6 text-center dark:text-gray-300">Loading Google Services...</div>;
    }

    return (
        <div className="p-4 max-w-md mx-auto space-y-6">
            <RequestAppointmentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                provider={provider}
                patient={patient}
                onAppointmentBooked={fetchEvents}
            />
            {!isSignedIn ? (
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 border border-gray-200 dark:border-slate-700 text-center">
                    <ClipboardCheck className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                    <h3 className="font-bold text-xl text-gray-800 dark:text-gray-200">Connect Your Calendar</h3>
                    <p className="text-gray-600 dark:text-gray-400 my-2">Sign in with Google to view your schedule and book appointments directly to your calendar.</p>
                    <button onClick={signIn} className="flex items-center justify-center gap-2 w-full max-w-xs mx-auto mt-4 px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600">
                       <Google className="w-5 h-5 bg-white rounded-full p-0.5" /> Connect Google Calendar
                   </button>
                </div>
            ) : (
                <>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-5 border border-gray-200 dark:border-slate-700">
                        <div className="flex justify-between items-center mb-4">
                            <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700"><ChevronLeft className="dark:text-gray-200" /></button>
                            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">{monthYearFormat.format(currentDate)}</h3>
                            <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700"><ChevronRight className="dark:text-gray-200" /></button>
                        </div>
                        <div className="grid grid-cols-7 gap-1 text-center text-sm">
                             {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                                <div key={day} className="text-gray-500 dark:text-gray-400 font-semibold">{day}</div>
                            ))}
                            {renderCalendar()}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-5 border border-gray-200 dark:border-slate-700 space-y-4">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">Upcoming Sessions</h3>
                        {loading ? <p className="text-center text-gray-500 dark:text-gray-400">Loading appointments...</p> : events.length > 0 ? events.map(event => {
                             const apptDateObj = new Date(event.start.dateTime || event.start.date!);
                             const apptTime = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).format(apptDateObj);

                             return (
                                <div key={event.id} className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-lg border dark:border-slate-600 flex gap-4 items-center">
                                    <div className="text-center border-r dark:border-slate-600 pr-4">
                                        <p className="text-sm font-semibold text-red-600 dark:text-red-400">{apptDateObj.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}</p>
                                        <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{apptDateObj.getDate()}</p>
                                    </div>
                                    <div className="flex-grow overflow-hidden">
                                        <p className="font-bold text-gray-800 dark:text-gray-200 truncate" title={event.summary}>{event.summary}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{apptTime}</p>
                                        {event.hangoutLink ? (
                                            <a href={event.hangoutLink} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 text-sm font-semibold rounded-full hover:bg-blue-200 dark:hover:bg-blue-800/50">
                                                <Video className="w-4 h-4" /> Join with Google Meet
                                            </a>
                                        ) : (
                                             <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1"><UserIcon className="w-4 h-4"/> In-Person Appointment</p>
                                        )}
                                    </div>
                                </div>
                            )
                        }) : <p className="text-center text-gray-500 dark:text-gray-400">No upcoming appointments found in your calendar.</p>}
                         <button onClick={() => setIsModalOpen(true)} className="w-full bg-gradient-to-r from-teal-500 to-teal-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg">
                            Request New Appointment
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default PatientSchedule;