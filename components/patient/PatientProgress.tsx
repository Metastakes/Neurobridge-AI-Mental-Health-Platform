import React from 'react';

const PatientProgress: React.FC = () => {
    const moodData = [
        { day: 'Mon', value: 3 }, // 1-5 scale: 3 is neutral
        { day: 'Tue', value: 4 }, // 4 is good
        { day: 'Wed', value: 2 }, // 2 is not good
        { day: 'Thu', value: 4 },
        { day: 'Fri', value: 5 }, // 5 is great
        { day: 'Sat', value: 3 },
        { day: 'Sun', value: 4 },
    ];

    const pointsData = [
        { day: 'Mon', value: 5 },
        { day: 'Tue', value: 8 },
        { day: 'Wed', value: 5 },
        { day: 'Thu', value: 13 },
        { day: 'Fri', value: 5 },
        { day: 'Sat', value: 8 },
        { day: 'Sun', value: 5 },
    ];

    const moodEmojis = ['','😔', '😐', '🙂', '😊', '😄'];

    return (
        <div className="p-4 max-w-md mx-auto space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-5 border border-gray-200 dark:border-slate-700">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">Mood Trend This Week</h3>
                <div className="flex justify-between items-end h-40 border-b border-gray-200 dark:border-slate-600 pb-2">
                    {moodData.map(item => (
                        <div key={item.day} className="flex flex-col items-center gap-2 w-1/7">
                             <div className="text-2xl">{moodEmojis[item.value]}</div>
                            <div 
                                className="w-8 bg-gradient-to-b from-teal-400 to-teal-500 rounded-t-md"
                                style={{ height: `${item.value * 20}%` }}
                                title={`Mood: ${item.value}`}
                            ></div>
                            <div className="text-sm font-semibold text-gray-500 dark:text-gray-400">{item.day}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-5 border border-gray-200 dark:border-slate-700">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">Points Earned This Week</h3>
                <div className="flex justify-between items-end h-40 border-b border-gray-200 dark:border-slate-600 pb-2">
                    {pointsData.map(item => (
                        <div key={item.day} className="flex flex-col items-center gap-2 w-1/7">
                             <div className="text-sm font-bold text-purple-600 dark:text-purple-400">{item.value}</div>
                            <div 
                                className="w-8 bg-gradient-to-b from-purple-400 to-purple-500 rounded-t-md"
                                style={{ height: `${item.value * 6}%` }}
                                title={`Points: ${item.value}`}
                            ></div>
                            <div className="text-sm font-semibold text-gray-500 dark:text-gray-400">{item.day}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PatientProgress;