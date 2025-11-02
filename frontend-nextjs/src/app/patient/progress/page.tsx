'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import type { ProgressSummary, AssessmentScoreHistory } from '@/types'

export default function PatientProgressPage() {
  const router = useRouter()

  const [summary, setSummary] = useState<ProgressSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedScale, setSelectedScale] = useState<string | null>(null)

  useEffect(() => {
    loadProgress()
  }, [])

  const loadProgress = async () => {
    try {
      setIsLoading(true)
      // Get current user's patient ID (in real app, from auth context)
      const user = await apiClient.getCurrentUser()
      const patientId = user.id // Simplified

      const progressData = await apiClient.getPatientProgressSummary(patientId)
      setSummary(progressData)

      // Select first scale by default
      if (progressData.assessment_history.length > 0) {
        setSelectedScale(progressData.assessment_history[0].scale_code)
      }
    } catch (err: any) {
      console.error('Failed to load progress:', err)
      setError(err.response?.data?.detail || 'Failed to load progress data')
    } finally {
      setIsLoading(false)
    }
  }

  const getTrendIcon = (trend: string | null) => {
    if (!trend) return null
    if (trend === 'improving') {
      return (
        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
        </svg>
      )
    }
    if (trend === 'worsening') {
      return (
        <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M12 13a1 1 0 100 2h5a1 1 0 001-1V9a1 1 0 10-2 0v2.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586 3.707 5.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 9.414 14.586 13H12z" clipRule="evenodd" />
        </svg>
      )
    }
    return (
      <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
      </svg>
    )
  }

  const getTrendText = (trend: string | null) => {
    if (!trend) return 'No data'
    return trend.charAt(0).toUpperCase() + trend.slice(1)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const selectedHistory = summary?.assessment_history.find(h => h.scale_code === selectedScale)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Loading your progress...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card>
          <div className="p-6 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => router.push('/patient/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  if (!summary || summary.assessment_history.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <h1 className="text-2xl font-bold text-primary-600">My Progress</h1>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <div className="p-12 text-center">
              <svg
                className="w-16 h-16 text-gray-400 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              <h3 className="text-lg font-semibold mb-2">No Assessment Data Yet</h3>
              <p className="text-gray-600 mb-6">
                Complete your first assessment to start tracking your progress.
              </p>
              <Button onClick={() => router.push('/patient/assessments')}>
                Take an Assessment
              </Button>
            </div>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-primary-600">My Progress</h1>
            <Button onClick={() => router.push('/patient/assessments')}>
              Take New Assessment
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-1">Total Assessments</p>
              <p className="text-3xl font-bold text-gray-900">{summary.total_assessments}</p>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-1">Active Goals</p>
              <p className="text-3xl font-bold text-primary-600">{summary.active_goals_count}</p>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-1">Achieved Goals</p>
              <p className="text-3xl font-bold text-green-600">{summary.achieved_goals_count}</p>
            </div>
          </Card>
        </div>

        {/* Assessment Scales Tabs */}
        <div className="mb-6">
          <div className="flex gap-2 border-b">
            {summary.assessment_history.map((history) => (
              <button
                key={history.scale_code}
                onClick={() => setSelectedScale(history.scale_code)}
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                  selectedScale === history.scale_code
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                {history.scale_name}
              </button>
            ))}
          </div>
        </div>

        {selectedHistory && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Current Score */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Current Score</CardTitle>
                </CardHeader>
                <div className="p-6 pt-0">
                  <div className="text-center mb-6">
                    <div className="text-6xl font-bold text-primary-600 mb-2">
                      {selectedHistory.current_score || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-600">
                      out of {selectedHistory.max_score}
                    </div>
                  </div>

                  {selectedHistory.trend && (
                    <div className="flex items-center justify-center gap-2 p-3 bg-gray-50 rounded-lg">
                      {getTrendIcon(selectedHistory.trend)}
                      <span className="font-medium">{getTrendText(selectedHistory.trend)}</span>
                    </div>
                  )}

                  {selectedHistory.score_change !== null && selectedHistory.score_change !== undefined && (
                    <div className="mt-4 text-center">
                      <p className="text-sm text-gray-600">
                        Change from previous:{' '}
                        <span
                          className={`font-semibold ${
                            selectedHistory.score_change < 0 ? 'text-green-600' : selectedHistory.score_change > 0 ? 'text-red-600' : 'text-gray-600'
                          }`}
                        >
                          {selectedHistory.score_change > 0 ? '+' : ''}
                          {selectedHistory.score_change}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Assessment History */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Assessment History</CardTitle>
                </CardHeader>
                <div className="p-6 pt-0">
                  <div className="space-y-3">
                    {selectedHistory.attempts.slice(0, 10).map((attempt, index) => (
                      <div
                        key={attempt.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl font-bold text-gray-900">
                              {attempt.total_score}
                            </span>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {formatDate(attempt.completed_at)}
                              </p>
                              {attempt.severity_level && (
                                <p className="text-xs text-gray-600">
                                  {attempt.severity_level.replace('_', ' ')}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {index === 0 && (
                          <span className="px-3 py-1 bg-primary-100 text-primary-700 text-xs font-semibold rounded-full">
                            Latest
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {selectedHistory.attempts.length === 0 && (
                    <p className="text-center text-gray-600 py-8">No attempts yet</p>
                  )}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Treatment Goals Section */}
        {(summary.active_goals_count > 0 || summary.achieved_goals_count > 0) && (
          <Card className="mt-6">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Treatment Goals</CardTitle>
                <Button variant="outline" size="sm">
                  View All Goals
                </Button>
              </div>
            </CardHeader>
            <div className="p-6 pt-0">
              <p className="text-gray-600">
                You have {summary.active_goals_count} active treatment goal{summary.active_goals_count !== 1 ? 's' : ''}
                and have achieved {summary.achieved_goals_count} goal{summary.achieved_goals_count !== 1 ? 's' : ''}.
              </p>
            </div>
          </Card>
        )}
      </main>
    </div>
  )
}
