// components/provider/ProviderSchedule.tsx
import React, { useState, useEffect } from 'react';
import { Provider } from '../../types.ts';
import { getDaysInMonth, getFirstDayOfMonth } from '../../utils/date.ts';
import { ChevronLeft, ChevronRight, ClipboardCheck, X, Calendar as CalendarIcon } from '../Icons.tsx';
import { useAppointments, cancelAppointment } from '../../hooks/useAppointments.ts';

interface ProviderScheduleProps {
    provider: Provider;
}

interface Appointment {
    id: number;
    patient_name: string;
    provider_name: string;
    appointment_type: string;
    scheduled_start: string;
    scheduled_end: string;
    status: string;
    notes?: string;
}

const ProviderSchedule: React.FC<ProviderScheduleProps> = ({ provider }) => {
    const { appointments, loading, refetch } = useAppointments({ providerId: provider.id });
    const [currentDate, setCurrentDate] = useState(new Date());
    const [cancelling, setCancelling] = useState(false);

    const handlePrevMonth = () => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };

    const handleCancelAppointment = async (appointmentId: number, appointmentSummary: string) => {
        const reason = prompt(`Cancel appointment:\n"${appointmentSummary}"?\n\nPlease provide a reason for cancellation:`);

        if (!reason) {
            return;
        }

        setCancelling(true);
        try {
            const result = await cancelAppointment(appointmentId, reason.trim());
            if (result.success) {
                await refetch();
            } else {
                alert(result.error || "Failed to cancel appointment. Please try again.");
            }
        } catch (error) {
            console.error("Failed to cancel appointment:", error);
            alert("Failed to cancel appointment. Please try again.");
        } finally {
            setCancelling(false);
        }
    };

    const renderCalendar = () => {
        const daysInMonth = getDaysInMonth(currentDate);
        const firstDay = getFirstDayOfMonth(currentDate);
        const today = new Date();

        const appointmentsInMonth = (appointments as Appointment[]).filter(appt => {
            const apptDate = new Date(appt.scheduled_start);
            return apptDate.getMonth() === currentDate.getMonth() && apptDate.getFullYear() === currentDate.getFullYear();
        });

        const calendarDays = [];
        for (let i = 0; i < firstDay; i++) {
            calendarDays.push(<div key={`pad-${i}`} className="border-r border-b dark:border-slate-700"></div>);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const loopDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const isToday = loopDate.toDateString() === today.toDateString();
            const appointmentsForDay = appointmentsInMonth.filter(appt => new Date(appt.scheduled_start).getDate() === day);

            calendarDays.push(
                <div key={day} className="border-r border-b dark:border-slate-700 p-2 min-h-[120px]">
                    <div className={`font-semibold ${isToday ? 'bg-indigo-500 text-white rounded-full w-7 h-7 flex items-center justify-center' : 'dark:text-gray-200'}`}>
                        {day}
                    </div>
                    <div className="text-xs mt-1 space-y-1">
                        {appointmentsForDay.map(appt => {
                            const startTime = new Date(appt.scheduled_start).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit'
                            });
                            const appointmentTitle = `${startTime} - ${appt.patient_name}`;

                            return (
                                <div
                                    key={appt.id}
                                    className={`p-1 rounded-md flex items-center justify-between group ${
                                        appt.status === 'cancelled'
                                            ? 'bg-gray-100 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 line-through'
                                            : 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-300'
                                    }`}
                                    title={`${appt.appointment_type} - ${appt.status}`}
                                >
                                    <span className="truncate flex-1">{appointmentTitle}</span>
                                    {appt.status !== 'cancelled' && (
                                        <button
                                            onClick={(evt) => {
                                                evt.stopPropagation();
                                                handleCancelAppointment(appt.id, appointmentTitle);
                                            }}
                                            className="opacity-0 group-hover:opacity-100 ml-1 p-0.5 hover:bg-red-200 dark:hover:bg-red-800 rounded transition-opacity"
                                            title="Cancel appointment"
                                            disabled={cancelling || loading}
                                        >
                                            <X className="w-3 h-3 text-red-600 dark:text-red-400" />
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        }
        return calendarDays;
    };

    const monthYearFormat = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long' });

    if (loading) {
        return (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow space-y-4">
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                    <p className="ml-4 text-gray-600 dark:text-gray-400">Loading your schedule...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                    <CalendarIcon className="w-7 h-7 text-indigo-500" />
                    My Schedule
                </h2>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                    {appointments.length} {appointments.length === 1 ? 'appointment' : 'appointments'}
                </div>
            </div>

            <div className="flex justify-between items-center">
                <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700">
                    <ChevronLeft className="dark:text-gray-200" />
                </button>
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">{monthYearFormat.format(currentDate)}</h3>
                <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700">
                    <ChevronRight className="dark:text-gray-200" />
                </button>
            </div>

            <div className="border-t border-l dark:border-slate-700">
                <div className="grid grid-cols-7 text-center font-bold text-gray-600 dark:text-gray-400">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="py-2 border-r border-b dark:border-slate-700">{day}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7">
                    {renderCalendar()}
                </div>
            </div>

            {appointments.length === 0 && (
                <div className="text-center py-6 border-dashed border-2 dark:border-slate-600 rounded-lg mt-4">
                    <ClipboardCheck className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                    <h3 className="font-semibold text-gray-700 dark:text-gray-300">No appointments scheduled</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Your patients can book appointments with you.</p>
                </div>
            )}
        </div>
    );
};

export default ProviderSchedule;