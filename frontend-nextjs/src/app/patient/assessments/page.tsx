'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import type { AssessmentScaleListItem, GamificationDashboard, PatientAchievement } from '@/types'

export default function PatientAssessmentsPage() {
  const router = useRouter()

  const [scales, setScales] = useState<AssessmentScaleListItem[]>([])
  const [gamification, setGamification] = useState<GamificationDashboard | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showAchievements, setShowAchievements] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [scalesData, gamificationData] = await Promise.all([
        apiClient.listAssessmentScales(),
        apiClient.getGamificationDashboard(),
      ])
      setScales(scalesData)
      setGamification(gamificationData)
    } catch (err) {
      console.error('Failed to load:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const getStreakStatus = () => {
    if (!gamification) return { icon: '🔥', color: 'text-gray-400', message: 'Start your streak!' }

    const { streak_status, streak } = gamification

    if (streak_status === 'active') {
      return {
        icon: '🔥',
        color: 'text-orange-600',
        message: `${streak.current_streak_days} day streak!`
      }
    } else if (streak_status === 'at_risk') {
      return {
        icon: '⚠️',
        color: 'text-yellow-600',
        message: 'Complete today to keep your streak!'
      }
    } else {
      return {
        icon: '💪',
        color: 'text-blue-600',
        message: 'Start a new streak today!'
      }
    }
  }

  const getLevelInfo = () => {
    if (!gamification) return { level: 1, progress: 0 }
    return {
      level: gamification.current_level,
      progress: (gamification.points_to_next_level / 100) * 100
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'BRONZE': return 'bg-amber-700 text-white'
      case 'SILVER': return 'bg-gray-400 text-white'
      case 'GOLD': return 'bg-yellow-500 text-white'
      case 'PLATINUM': return 'bg-cyan-500 text-white'
      case 'DIAMOND': return 'bg-purple-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your progress...</p>
        </div>
      </div>
    )
  }

  const streakInfo = getStreakStatus()
  const levelInfo = getLevelInfo()

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-blue-50 to-purple-50">
      {/* Header */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Your Mental Health Journey</h1>
              <p className="text-sm text-gray-600 mt-1">Track your progress and earn rewards</p>
            </div>
            <Button onClick={() => router.push('/patient/progress')}>
              📊 View Progress
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Gamification Dashboard */}
        {gamification && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {/* Streak Card */}
            <Card className="bg-gradient-to-br from-orange-500 to-red-500 text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
              <div className="p-6 relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-4xl">{streakInfo.icon}</span>
                  <span className="text-xs font-semibold bg-white bg-opacity-20 px-2 py-1 rounded-full">
                    STREAK
                  </span>
                </div>
                <div className="text-3xl font-bold mb-1">{gamification.streak.current_streak_days}</div>
                <div className="text-sm opacity-90">{streakInfo.message}</div>
                {gamification.streak.longest_streak_days > gamification.streak.current_streak_days && (
                  <div className="text-xs mt-2 opacity-75">
                    Record: {gamification.streak.longest_streak_days} days
                  </div>
                )}
              </div>
            </Card>

            {/* Level Card */}
            <Card className="bg-gradient-to-br from-purple-500 to-pink-500 text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
              <div className="p-6 relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-4xl">⭐</span>
                  <span className="text-xs font-semibold bg-white bg-opacity-20 px-2 py-1 rounded-full">
                    LEVEL
                  </span>
                </div>
                <div className="text-3xl font-bold mb-1">Level {levelInfo.level}</div>
                <div className="text-sm opacity-90 mb-2">{gamification.total_points} points</div>
                <div className="w-full bg-white bg-opacity-30 rounded-full h-2">
                  <div
                    className="bg-white rounded-full h-2 transition-all duration-500"
                    style={{ width: `${100 - levelInfo.progress}%` }}
                  ></div>
                </div>
                <div className="text-xs mt-1 opacity-75">
                  {gamification.points_to_next_level} to next level
                </div>
              </div>
            </Card>

            {/* Achievements Card */}
            <Card className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white overflow-hidden relative cursor-pointer hover:scale-105 transition-transform" onClick={() => setShowAchievements(!showAchievements)}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
              <div className="p-6 relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-4xl">🏆</span>
                  <span className="text-xs font-semibold bg-white bg-opacity-20 px-2 py-1 rounded-full">
                    ACHIEVEMENTS
                  </span>
                </div>
                <div className="text-3xl font-bold mb-1">
                  {gamification.unlocked_achievements}/{gamification.total_achievements}
                </div>
                <div className="text-sm opacity-90">Unlocked</div>
                <div className="mt-2 text-xs opacity-75">Click to view all</div>
              </div>
            </Card>

            {/* Engagement Card */}
            <Card className="bg-gradient-to-br from-green-500 to-emerald-500 text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
              <div className="p-6 relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-4xl">💚</span>
                  <span className="text-xs font-semibold bg-white bg-opacity-20 px-2 py-1 rounded-full">
                    ENGAGEMENT
                  </span>
                </div>
                <div className="text-3xl font-bold mb-1">{gamification.streak.engagement_score}%</div>
                <div className="text-sm opacity-90">Overall Score</div>
                <div className="text-xs mt-2 opacity-75">
                  {gamification.streak.total_assessment_count} assessments completed
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Motivational Message */}
        {gamification?.motivational_message && (
          <Card className="mb-8 bg-gradient-to-r from-purple-100 to-pink-100 border-l-4 border-purple-500">
            <div className="p-6 flex items-start gap-4">
              <span className="text-4xl">{gamification.motivational_icon || '💭'}</span>
              <div>
                <p className="text-lg font-medium text-gray-900 mb-1">Keep going!</p>
                <p className="text-gray-700">{gamification.motivational_message}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Achievements Showcase (if toggled) */}
        {showAchievements && gamification && gamification.recent_achievements.length > 0 && (
          <Card className="mb-8">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Recent Achievements</h3>
                <button onClick={() => setShowAchievements(false)} className="text-gray-500 hover:text-gray-700">
                  ✕
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {gamification.recent_achievements.slice(0, 6).map((pa) => (
                  <div
                    key={pa.id}
                    className="p-4 rounded-lg border-2 border-gray-200 hover:border-primary-300 transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-3xl">{pa.achievement.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold px-2 py-1 rounded ${getTierColor(pa.achievement.tier)}`}>
                            {pa.achievement.tier}
                          </span>
                        </div>
                        <p className="font-semibold text-sm mt-1">{pa.achievement.name}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600">{pa.achievement.description}</p>
                    <p className="text-xs text-primary-600 font-semibold mt-2">+{pa.achievement.points} points</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Assessment Cards */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Available Assessments</h2>
          <p className="text-gray-600">Complete assessments to track your mental health and earn rewards</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {scales.map((scale) => (
            <Card key={scale.id} className="hover:shadow-xl transition-shadow duration-300 overflow-hidden group">
              <div className="h-2 bg-gradient-to-r from-primary-500 to-blue-500"></div>
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                      {scale.scale_name}
                    </h3>
                    {scale.description && (
                      <p className="text-sm text-gray-600 mb-3">{scale.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                          <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                        </svg>
                        Score: {scale.min_score}-{scale.max_score}
                      </span>
                      {scale.is_standard && (
                        <span className="flex items-center gap-1 text-green-600 font-medium">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Clinically Validated
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => router.push(`/patient/assessments/take/${scale.id}`)}
                  className="w-full group-hover:shadow-lg transition-shadow"
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  Start Assessment
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {scales.length === 0 && (
          <Card>
            <div className="p-12 text-center">
              <span className="text-6xl mb-4 block">📋</span>
              <h3 className="text-lg font-semibold mb-2">No Assessments Available</h3>
              <p className="text-gray-600">Check back soon for new assessments.</p>
            </div>
          </Card>
        )}
      </main>
    </div>
  )
}
