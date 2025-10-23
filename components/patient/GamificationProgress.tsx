/**
 * Patch 04: Gamification Progress & Achievements
 * Shows patient progress, achievements, and reward tiers
 */

import React, { useState, useEffect } from 'react';

interface Achievement {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  unlockedAt?: string;
  progress?: number;
  total?: number;
}

interface RewardTier {
  name: string;
  pointsRequired: number;
  benefits: string[];
  icon: string;
  color: string;
}

const REWARD_TIERS: RewardTier[] = [
  {
    name: 'Bronze',
    pointsRequired: 0,
    benefits: ['Basic rewards', 'Profile customization'],
    icon: '🥉',
    color: 'from-orange-400 to-orange-600',
  },
  {
    name: 'Silver',
    pointsRequired: 500,
    benefits: ['Priority support', 'Exclusive content', 'Profile badge'],
    icon: '🥈',
    color: 'from-gray-300 to-gray-500',
  },
  {
    name: 'Gold',
    pointsRequired: 1500,
    benefits: ['Free month premium', 'Early feature access', 'Gold badge'],
    icon: '🥇',
    color: 'from-yellow-400 to-yellow-600',
  },
  {
    name: 'Platinum',
    pointsRequired: 3000,
    benefits: ['VIP support', '3 free months', 'Platinum badge', 'Referral bonuses'],
    icon: '💎',
    color: 'from-purple-400 to-purple-600',
  },
];

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  {
    id: '1',
    key: 'first_checkin',
    name: 'First Steps',
    description: 'Complete your first mood check-in',
    icon: '🎯',
    points: 50,
  },
  {
    id: '2',
    key: 'streak_7',
    name: 'Week Warrior',
    description: 'Maintain a 7-day check-in streak',
    icon: '🔥',
    points: 100,
  },
  {
    id: '3',
    key: 'streak_30',
    name: 'Monthly Master',
    description: 'Maintain a 30-day check-in streak',
    icon: '⭐',
    points: 300,
  },
  {
    id: '4',
    key: 'streak_90',
    name: 'Quarterly Champion',
    description: 'Maintain a 90-day check-in streak',
    icon: '👑',
    points: 1000,
  },
  {
    id: '5',
    key: 'task_completionist',
    name: 'Task Master',
    description: 'Complete 10 pharmacology tasks',
    icon: '✅',
    points: 200,
  },
  {
    id: '6',
    key: 'side_effect_reporter',
    name: 'Safety Expert',
    description: 'Report 5 side effects to help your care',
    icon: '🛡️',
    points: 150,
  },
  {
    id: '7',
    key: 'session_review',
    name: 'Feedback Pro',
    description: 'Review 5 therapy sessions',
    icon: '⭐',
    points: 250,
  },
  {
    id: '8',
    key: 'referral_master',
    name: 'Community Builder',
    description: 'Refer 3 friends who complete onboarding',
    icon: '🤝',
    points: 500,
  },
];

interface Props {
  patientId: string;
  totalPoints: number;
  apiBaseUrl?: string;
}

export default function GamificationProgress({
  patientId,
  totalPoints,
  apiBaseUrl = 'http://localhost:3000',
}: Props) {
  const [achievements, setAchievements] = useState<Achievement[]>(DEFAULT_ACHIEVEMENTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAchievements();
  }, [patientId]);

  const fetchAchievements = async () => {
    try {
      // Note: Backend endpoint for achievements would be added
      // For now, using default achievements
      setAchievements(DEFAULT_ACHIEVEMENTS);
    } catch (error) {
      console.error('Failed to fetch achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentTier = (): RewardTier => {
    for (let i = REWARD_TIERS.length - 1; i >= 0; i--) {
      if (totalPoints >= REWARD_TIERS[i].pointsRequired) {
        return REWARD_TIERS[i];
      }
    }
    return REWARD_TIERS[0];
  };

  const getNextTier = (): RewardTier | null => {
    const currentTier = getCurrentTier();
    const currentIndex = REWARD_TIERS.findIndex(t => t.name === currentTier.name);
    return currentIndex < REWARD_TIERS.length - 1 ? REWARD_TIERS[currentIndex + 1] : null;
  };

  const currentTier = getCurrentTier();
  const nextTier = getNextTier();
  const unlockedAchievements = achievements.filter(a => a.unlockedAt);
  const lockedAchievements = achievements.filter(a => !a.unlockedAt);

  const progressToNextTier = nextTier
    ? ((totalPoints - currentTier.pointsRequired) / (nextTier.pointsRequired - currentTier.pointsRequired)) * 100
    : 100;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Tier */}
      <div className={`bg-gradient-to-r ${currentTier.color} text-white rounded-3xl shadow-2xl p-8`}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold mb-2">
              {currentTier.icon} {currentTier.name} Tier
            </h2>
            <p className="opacity-90">You have {totalPoints.toLocaleString()} points</p>
          </div>
          <div className="text-7xl">{currentTier.icon}</div>
        </div>

        <div className="space-y-2 mb-6">
          <h3 className="font-semibold text-lg opacity-90">Your Benefits:</h3>
          <ul className="space-y-1">
            {currentTier.benefits.map((benefit, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <span className="text-lg">✓</span>
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        {nextTier && (
          <div className="bg-white/20 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold">Progress to {nextTier.name}</span>
              <span className="text-sm">
                {nextTier.pointsRequired - totalPoints} points to go
              </span>
            </div>
            <div className="w-full bg-white/30 rounded-full h-3 overflow-hidden">
              <div
                className="bg-white h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(progressToNextTier, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Unlocked Achievements */}
      {unlockedAchievements.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <span>🏆</span>
            Unlocked Achievements ({unlockedAchievements.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {unlockedAchievements.map((achievement) => (
              <div
                key={achievement.id}
                className="bg-gradient-to-br from-yellow-100 to-orange-100 border-2 border-yellow-400 rounded-2xl p-5 shadow-lg"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-start gap-3">
                    <span className="text-4xl">{achievement.icon}</span>
                    <div>
                      <h4 className="font-bold text-gray-800">{achievement.name}</h4>
                      <p className="text-sm text-gray-700">{achievement.description}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-yellow-300">
                  <span className="text-xs text-gray-600">
                    Unlocked {achievement.unlockedAt ? new Date(achievement.unlockedAt).toLocaleDateString() : 'Recently'}
                  </span>
                  <span className="bg-yellow-500 text-white font-bold px-3 py-1 rounded-full text-sm">
                    +{achievement.points}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Locked Achievements */}
      {lockedAchievements.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <span>🔒</span>
            Available Achievements ({lockedAchievements.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {lockedAchievements.map((achievement) => (
              <div
                key={achievement.id}
                className="bg-white border-2 border-gray-200 rounded-2xl p-5 shadow-md opacity-75 hover:opacity-100 transition-all"
              >
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-4xl grayscale">{achievement.icon}</span>
                  <div>
                    <h4 className="font-bold text-gray-700">{achievement.name}</h4>
                    <p className="text-sm text-gray-600">{achievement.description}</p>
                  </div>
                </div>
                {achievement.progress !== undefined && achievement.total && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{achievement.progress}/{achievement.total}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-purple-500 h-full rounded-full transition-all"
                        style={{ width: `${(achievement.progress / achievement.total) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  <span className="text-xs text-gray-500">Locked</span>
                  <span className="bg-gray-300 text-gray-600 font-bold px-3 py-1 rounded-full text-sm">
                    +{achievement.points}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reward Tier Overview */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">All Reward Tiers</h3>
        <div className="space-y-3">
          {REWARD_TIERS.map((tier, index) => {
            const isUnlocked = totalPoints >= tier.pointsRequired;
            const isCurrent = tier.name === currentTier.name;

            return (
              <div
                key={tier.name}
                className={`
                  relative rounded-xl p-4 border-2 transition-all
                  ${isCurrent ? 'border-purple-500 bg-purple-50' : 'border-gray-200 bg-gray-50'}
                  ${!isUnlocked && 'opacity-50'}
                `}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{tier.icon}</span>
                    <div>
                      <h4 className="font-bold text-gray-800">{tier.name}</h4>
                      <p className="text-sm text-gray-600">
                        {tier.pointsRequired.toLocaleString()} points
                      </p>
                    </div>
                  </div>
                  {isUnlocked && (
                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                      Unlocked
                    </span>
                  )}
                </div>
                {isCurrent && (
                  <div className="absolute -top-2 -right-2 bg-purple-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                    Current
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
