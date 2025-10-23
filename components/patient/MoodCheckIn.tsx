/**
 * Patch 04: DSM-Aligned Daily Mood Check-In
 * Interactive emoji-based interface with 6 DSM dimensions
 */

import React, { useState, useEffect } from 'react';
import Lottie from 'lottie-react';
import taskCompleteAnimation from '../../public/lottie/task_complete.json';

interface MoodDimension {
  key: 'mood' | 'sleep' | 'energy' | 'focus' | 'appetite' | 'motivation';
  label: string;
  description: string;
  emojis: string[];
  colors: string[];
}

const DIMENSIONS: MoodDimension[] = [
  {
    key: 'mood',
    label: 'Overall Mood',
    description: 'How do you feel today?',
    emojis: ['😢', '😕', '😐', '🙂', '😄'],
    colors: ['bg-red-100', 'bg-orange-100', 'bg-gray-100', 'bg-blue-100', 'bg-green-100'],
  },
  {
    key: 'sleep',
    label: 'Sleep Quality',
    description: 'How well did you sleep?',
    emojis: ['😴', '😪', '😑', '😌', '✨'],
    colors: ['bg-purple-100', 'bg-indigo-100', 'bg-gray-100', 'bg-teal-100', 'bg-cyan-100'],
  },
  {
    key: 'energy',
    label: 'Energy Level',
    description: 'How energized do you feel?',
    emojis: ['🔋', '🪫', '⚡', '💪', '🚀'],
    colors: ['bg-red-100', 'bg-orange-100', 'bg-yellow-100', 'bg-lime-100', 'bg-green-100'],
  },
  {
    key: 'focus',
    label: 'Focus & Concentration',
    description: 'How is your mental clarity?',
    emojis: ['😵‍💫', '🌫️', '🤔', '🎯', '🧠'],
    colors: ['bg-red-100', 'bg-orange-100', 'bg-gray-100', 'bg-blue-100', 'bg-purple-100'],
  },
  {
    key: 'appetite',
    label: 'Appetite',
    description: 'How is your appetite today?',
    emojis: ['🚫', '🥄', '🍽️', '😋', '🍕'],
    colors: ['bg-gray-100', 'bg-orange-100', 'bg-yellow-100', 'bg-lime-100', 'bg-green-100'],
  },
  {
    key: 'motivation',
    label: 'Motivation',
    description: 'How motivated do you feel?',
    emojis: ['😞', '😔', '😐', '💪', '🔥'],
    colors: ['bg-red-100', 'bg-orange-100', 'bg-gray-100', 'bg-blue-100', 'bg-green-100'],
  },
];

interface Props {
  patientId: string;
  apiBaseUrl?: string;
  onComplete?: () => void;
}

export default function MoodCheckIn({ patientId, apiBaseUrl = 'http://localhost:3000', onComplete }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [streak, setStreak] = useState(0);
  const [alreadyCheckedIn, setAlreadyCheckedIn] = useState(false);

  useEffect(() => {
    checkTodayStatus();
  }, []);

  const checkTodayStatus = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${apiBaseUrl}/mood/stats/${patientId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStreak(data.currentStreak || 0);
        setAlreadyCheckedIn(data.checkedInToday || false);
      }
    } catch (error) {
      console.error('Failed to check today status:', error);
    }
  };

  const handleSelect = (value: number) => {
    const dimension = DIMENSIONS[currentStep];
    const newResponses = { ...responses, [dimension.key]: value - 2 }; // Convert 0-4 to -2 to +2
    setResponses(newResponses);

    if (currentStep < DIMENSIONS.length - 1) {
      setTimeout(() => setCurrentStep(currentStep + 1), 300);
    } else {
      submitCheckIn(newResponses);
    }
  };

  const submitCheckIn = async (finalResponses: Record<string, number>) => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem('authToken');
      const today = new Date().toISOString().split('T')[0];

      const response = await fetch(`${apiBaseUrl}/mood/checkins/${patientId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          day: today,
          ...finalResponses,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit check-in');
      }

      const result = await response.json();
      setStreak(result.newStreak || streak + 1);
      setShowSuccess(true);

      setTimeout(() => {
        setShowSuccess(false);
        if (onComplete) onComplete();
      }, 3000);
    } catch (error) {
      console.error('Failed to submit check-in:', error);
      alert('Failed to submit check-in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const goBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (alreadyCheckedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">All Done for Today!</h2>
          <p className="text-gray-600 mb-4">You've already checked in today. Come back tomorrow!</p>
          <div className="bg-gradient-to-r from-orange-400 to-red-500 text-white rounded-full px-6 py-3 inline-flex items-center gap-2">
            <span className="text-2xl">🔥</span>
            <span className="font-bold text-xl">{streak} Day Streak</span>
          </div>
        </div>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
          <Lottie
            animationData={taskCompleteAnimation}
            loop={false}
            style={{ width: 200, height: 200, margin: '0 auto' }}
          />
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Check-In Complete!</h2>
          <p className="text-gray-600 mb-6">You earned 10 points</p>
          <div className="bg-gradient-to-r from-orange-400 to-red-500 text-white rounded-full px-8 py-4 inline-flex items-center gap-3">
            <span className="text-3xl">🔥</span>
            <span className="font-bold text-2xl">{streak} Day Streak</span>
          </div>
        </div>
      </div>
    );
  }

  const dimension = DIMENSIONS[currentStep];
  const progress = ((currentStep + 1) / DIMENSIONS.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl w-full">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-gray-600">
              Question {currentStep + 1} of {DIMENSIONS.length}
            </span>
            <span className="text-sm font-semibold text-purple-600">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">{dimension.label}</h2>
          <p className="text-lg text-gray-600">{dimension.description}</p>
        </div>

        {/* Emoji Options */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          {dimension.emojis.map((emoji, index) => {
            const isSelected = responses[dimension.key] === index - 2;
            return (
              <button
                key={index}
                onClick={() => handleSelect(index)}
                disabled={submitting}
                className={`
                  ${dimension.colors[index]}
                  ${isSelected ? 'ring-4 ring-purple-500 scale-110' : 'hover:scale-105'}
                  rounded-2xl p-6 transition-all duration-200 transform
                  disabled:opacity-50 disabled:cursor-not-allowed
                  flex flex-col items-center justify-center
                  shadow-md hover:shadow-xl
                `}
              >
                <span className="text-5xl mb-2">{emoji}</span>
                <span className="text-xs font-semibold text-gray-600">
                  {index === 0 && 'Very Low'}
                  {index === 1 && 'Low'}
                  {index === 2 && 'Neutral'}
                  {index === 3 && 'Good'}
                  {index === 4 && 'Great'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={goBack}
            disabled={currentStep === 0 || submitting}
            className="px-6 py-3 text-gray-600 font-semibold rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            ← Back
          </button>

          <div className="flex items-center gap-2">
            {DIMENSIONS.map((_, index) => (
              <div
                key={index}
                className={`
                  w-3 h-3 rounded-full transition-all
                  ${index < currentStep ? 'bg-purple-500' : ''}
                  ${index === currentStep ? 'bg-purple-500 w-8' : ''}
                  ${index > currentStep ? 'bg-gray-300' : ''}
                `}
              />
            ))}
          </div>

          <div className="w-24"></div> {/* Spacer for symmetry */}
        </div>

        {/* Submitting Indicator */}
        {submitting && (
          <div className="mt-6 text-center">
            <div className="inline-flex items-center gap-3 bg-purple-50 px-6 py-3 rounded-full">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
              <span className="text-purple-600 font-semibold">Submitting...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
