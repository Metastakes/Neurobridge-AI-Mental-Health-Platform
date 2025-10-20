// Fix: Create the PatientAchievements component
import React from 'react';
// Fix: Add file extension to import to resolve module error.
import { Award } from '../Icons.tsx';

const PatientAchievements: React.FC = () => {
  const achievements = [
    { name: 'First Steps', description: 'Completed your first check-in.', unlocked: true },
    { name: 'Week of Wellness', description: 'Completed 7 consecutive daily check-ins.', unlocked: true },
    { name: 'Feedback Champion', description: 'Submitted 5 session reviews.', unlocked: false },
    { name: 'Consistency is Key', description: 'Attended 3 appointments on time.', unlocked: true },
    { name: 'Profile Pro', description: 'Completed your patient profile.', unlocked: false },
    { name: 'Goal Getter', description: 'Achieved your first personal goal.', unlocked: false },
  ];

  return (
    <div className="p-4 max-w-md mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800">Your Achievements</h2>
        <p className="text-gray-600">Celebrate your progress on your wellness journey!</p>
      </div>

      <div className="space-y-4">
        {achievements.map((ach) => (
          <div
            key={ach.name}
            className={`bg-white rounded-2xl shadow-lg p-4 border flex items-center gap-4 transition-opacity ${!ach.unlocked ? 'opacity-50' : 'border-yellow-400'}`}
          >
            <div className={`p-3 rounded-full ${ach.unlocked ? 'bg-yellow-100' : 'bg-gray-100'}`}>
              <Award className={`w-8 h-8 ${ach.unlocked ? 'text-yellow-500' : 'text-gray-400'}`} />
            </div>
            <div>
              <p className={`font-bold ${ach.unlocked ? 'text-gray-800' : 'text-gray-500'}`}>{ach.name}</p>
              <p className="text-sm text-gray-600">{ach.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PatientAchievements;
