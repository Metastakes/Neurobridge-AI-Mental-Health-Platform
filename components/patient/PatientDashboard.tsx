// Fix: Create the PatientDashboard component
import React from 'react';
// Fix: Add file extensions to imports to resolve module errors.
import { PatientView } from '../../types.ts';
import { Zap, Star, Award, MessageSquare, Plus, Calendar } from '../Icons.tsx';

interface PatientDashboardProps {
  setActiveView: (view: PatientView) => void;
  points: number;
  reviews: number;
}

const PatientDashboard: React.FC<PatientDashboardProps> = ({ setActiveView, points, reviews }) => {
  return (
    <div className="p-4 max-w-md mx-auto space-y-6">
      {/* Welcome & Points */}
      <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl shadow-lg p-6 text-white">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold">Hello, Alex</h2>
            <p className="opacity-80">Ready to take on the day?</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 font-bold text-2xl bg-white/20 px-3 py-1 rounded-full">
              <Zap className="w-6 h-6 text-yellow-300" />
              <span>{points}</span>
            </div>
            <span className="text-sm opacity-80">Points</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => setActiveView('schedule')}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-4 text-center border border-gray-200 dark:border-slate-700 hover:border-teal-400 dark:hover:border-teal-500 transition-all"
        >
          <Calendar className="w-10 h-10 text-teal-500 mx-auto mb-2" />
          <p className="font-semibold text-gray-800 dark:text-gray-200">Schedule</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Book next session</p>
        </button>
        <button
          onClick={() => setActiveView('messages')}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-4 text-center border border-gray-200 dark:border-slate-700 hover:border-teal-400 dark:hover:border-teal-500 transition-all"
        >
          <MessageSquare className="w-10 h-10 text-purple-500 mx-auto mb-2" />
          <p className="font-semibold text-gray-800 dark:text-gray-200">Messages</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Contact provider</p>
        </button>
      </div>

      {/* Session Review Prompt */}
      <div className="bg-yellow-50 dark:bg-yellow-900/50 border-l-4 border-yellow-400 dark:border-yellow-600 p-4 rounded-r-lg flex justify-between items-center">
        <div>
          <p className="font-bold text-yellow-800 dark:text-yellow-200">Review Your Last Session</p>
          <p className="text-sm text-yellow-700 dark:text-yellow-300">Earn 50 points for your feedback!</p>
        </div>
        <button
          onClick={() => setActiveView('review')}
          className="bg-yellow-400 text-white font-bold px-4 py-2 rounded-lg hover:bg-yellow-500 transition-all"
        >
          Review
        </button>
      </div>
      
      {/* Profile actions */}
       <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-5 border border-gray-200 dark:border-slate-700">
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">Your Health Profile</h3>
        <div className="space-y-3">
          <button
            onClick={() => setActiveView('profile')}
            className="w-full flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"
          >
            <span className="font-semibold text-gray-700 dark:text-gray-300">Medications & Allergies</span>
            <Plus className="w-5 h-5 text-teal-600" />
          </button>
          <button
            onClick={() => setActiveView('achievements')}
            className="w-full flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"
          >
            <span className="font-semibold text-gray-700 dark:text-gray-300">View Achievements</span>
            <Award className="w-5 h-5 text-yellow-500" />
          </button>
        </div>
      </div>

    </div>
  );
};

export default PatientDashboard;