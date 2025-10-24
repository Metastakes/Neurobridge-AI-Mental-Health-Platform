// components/patient/PatientSchedule.tsx
import React, { useState, useMemo } from 'react';
// Fix: Add file extensions to imports to resolve module errors.
import { ChevronLeft, ChevronRight, Video, User as UserIcon, X } from '../Icons.tsx';
import { getDaysInMonth, getFirstDayOfMonth } from '../../utils/date.ts';
import { Patient, User as AppUser } from '../../types.ts';
import RequestAppointmentModal from './RequestAppointmentModal.tsx';
import { AppointmentSkeleton } from '../Skeleton.tsx';
import { useUpcomingAppointments, cancelAppointment } from '../../hooks/useAppointments.ts';

interface PatientScheduleProps {
    patient: Patient;
    allUsers: AppUser[];
}

const PatientSchedule: React.FC<PatientScheduleProps> = ({ patient, allUsers }) => {
    const { appointments, loading, refetch } = useUpcomingAppointments();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [cancelLoading, setCancelLoading] = useState(false);

    const provider = useMemo(() => {
        return allUsers.find(u => u.id === patient.providerId);
    }, [patient, allUsers]);

    const appointmentDates = useMemo(() =>
        appointments.map(appt => new Date(appt.scheduled_start).toDateString()),
        [appointments]
    );

    const handlePrevMonth = () => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };
    
    const handleDateClick = (day: number) => {
        setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
    };

    const handleCancelAppointment = async (appointmentId: number, appointmentSummary: string) => {
        const reason = prompt(
            `Are you sure you want to cancel:\n"${appointmentSummary}"?\n\nPlease provide a reason for cancellation:`
        );

        if (!reason || reason.trim().length === 0) {
            return;
        }

        setCancelLoading(true);
        try {
            const result = await cancelAppointment(appointmentId, reason.trim());

            if (result.success) {
                // Refresh the appointments list
                await refetch();
            } else {
                alert(result.error || "Failed to cancel appointment. Please try again.");
            }
        } catch (error) {
            console.error("Failed to cancel appointment:", error);
            alert("Failed to cancel appointment. Please try again.");
        } finally {
            setCancelLoading(false);
        }
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

    return (
        <div className="p-4 max-w-md mx-auto space-y-6">
            <RequestAppointmentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                provider={provider}
                patient={patient}
                onAppointmentBooked={refetch}
            />
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
                        {loading ? (
                            <div className="space-y-3">
                                <AppointmentSkeleton />
                                <AppointmentSkeleton />
                                <AppointmentSkeleton />
                            </div>
                        ) : appointments.length > 0 ? appointments.map(appt => {
                             const apptDateObj = new Date(appt.scheduled_start);
                             const apptTime = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).format(apptDateObj);
                             const appointmentTitle = `${appt.appointment_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} with ${appt.provider_name}`;

                             return (
                                <div key={appt.id} className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-lg border dark:border-slate-600 flex gap-4 items-start relative">
                                    <button
                                        onClick={() => handleCancelAppointment(appt.id, appointmentTitle)}
                                        className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors"
                                        title="Cancel appointment"
                                        disabled={cancelLoading}
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                    <div className="text-center border-r dark:border-slate-600 pr-4">
                                        <p className="text-sm font-semibold text-red-600 dark:text-red-400">{apptDateObj.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}</p>
                                        <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{apptDateObj.getDate()}</p>
                                    </div>
                                    <div className="flex-grow overflow-hidden pr-8">
                                        <p className="font-bold text-gray-800 dark:text-gray-200 truncate" title={appointmentTitle}>{appointmentTitle}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{apptTime}</p>
                                        <div className="mt-2">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                appt.status === 'confirmed' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' :
                                                appt.status === 'scheduled' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' :
                                                'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                            }`}>
                                                {appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}
                                            </span>
                                        </div>
                                        {appt.notes && (
                                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{appt.notes}</p>
                                        )}
                                    </div>
                                </div>
                            )
                        }) : <p className="text-center text-gray-500 dark:text-gray-400">No upcoming appointments scheduled.</p>}
                         <button onClick={() => setIsModalOpen(true)} className="w-full bg-gradient-to-r from-teal-500 to-teal-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg">
                            Request New Appointment
                        </button>
                    </div>
        </div>
    );
};

export default PatientSchedule;