// components/provider/ProviderSchedule.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useGoogleApi } from '../../GoogleApiContext.tsx';
import { listUpcomingEvents } from '../../googleApi.ts';
import { CalendarEvent, Provider } from '../../types.ts';
import { getDaysInMonth, getFirstDayOfMonth } from '../../utils/date.ts';
import { ChevronLeft, ChevronRight, Google, LogOut, ClipboardCheck } from '../Icons.tsx';

interface ProviderScheduleProps {
    provider: Provider;
}

const ProviderSchedule: React.FC<ProviderScheduleProps> = ({ provider }) => {
    const { isSignedIn, signIn, signOut, isGapiLoaded, isGisLoaded, initError } = useGoogleApi();
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentDate, setCurrentDate] = useState(new Date());
    
    const fetchEvents = useCallback(async () => {
        if (isSignedIn) {
            setLoading(true);
            const eventList = await listUpcomingEvents();
            setEvents(eventList);
            setLoading(false);
        }
    }, [isSignedIn]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    const handlePrevMonth = () => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };

    const renderCalendar = () => {
        const daysInMonth = getDaysInMonth(currentDate);
        const firstDay = getFirstDayOfMonth(currentDate);
        const today = new Date();
        
        const eventsInMonth = events.filter(event => {
            const eventDate = new Date(event.start.dateTime || event.start.date!);
            return eventDate.getMonth() === currentDate.getMonth() && eventDate.getFullYear() === currentDate.getFullYear();
        });

        const calendarDays = [];
        for (let i = 0; i < firstDay; i++) {
            calendarDays.push(<div key={`pad-${i}`} className="border-r border-b dark:border-slate-700"></div>);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const loopDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const isToday = loopDate.toDateString() === today.toDateString();
            const eventsForDay = eventsInMonth.filter(e => new Date(e.start.dateTime || e.start.date!).getDate() === day);

            calendarDays.push(
                <div key={day} className="border-r border-b dark:border-slate-700 p-2 min-h-[120px]">
                    <div className={`font-semibold ${isToday ? 'bg-indigo-500 text-white rounded-full w-7 h-7 flex items-center justify-center' : 'dark:text-gray-200'}`}>
                        {day}
                    </div>
                    <div className="text-xs mt-1 space-y-1">
                        {eventsForDay.map(e => (
                            <div key={e.id} className="bg-indigo-100 dark:bg-indigo-900/50 p-1 rounded-md text-indigo-800 dark:text-indigo-300 truncate" title={e.summary}>
                                {e.summary}
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
        return calendarDays;
    };

    const monthYearFormat = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long' });

    if (initError) {
        return (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow space-y-4">
                <div className="bg-red-100 dark:bg-red-900/40 border-l-4 border-red-500 text-red-700 dark:text-red-200 p-4" role="alert">
                    <p className="font-bold">Calendar Unavailable</p>
                    <p className="text-sm">Could not connect to Google Calendar services. The administrator needs to configure the API key.</p>
                </div>
            </div>
        );
    }

    if (!isGapiLoaded || !isGisLoaded) {
        return <div className="flex items-center justify-center h-full"><p className="dark:text-gray-300">Loading Google API...</p></div>;
    }

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">My Schedule</h2>
                {isSignedIn ? (
                    <button onClick={signOut} className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 font-semibold rounded-lg hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-800/50">
                        <LogOut className="w-5 h-5" /> Disconnect Calendar
                    </button>
                ) : (
                    <button onClick={signIn} className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600">
                        <Google className="w-5 h-5 bg-white rounded-full" /> Connect Google Calendar
                    </button>
                )}
            </div>

            {isSignedIn ? (
                <>
                    <div className="flex justify-between items-center">
                        <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700"><ChevronLeft className="dark:text-gray-200" /></button>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">{monthYearFormat.format(currentDate)}</h3>
                        <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700"><ChevronRight className="dark:text-gray-200" /></button>
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
                </>
            ) : (
                <div className="text-center py-12 border-dashed border-2 dark:border-slate-600 rounded-lg">
                    <ClipboardCheck className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                    <h3 className="font-semibold text-gray-700 dark:text-gray-300">Connect your calendar to get started</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">View your appointments and manage your schedule in one place.</p>
                </div>
            )}
        </div>
    );
};

export default ProviderSchedule;