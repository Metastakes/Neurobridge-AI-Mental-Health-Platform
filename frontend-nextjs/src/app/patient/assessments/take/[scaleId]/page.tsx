'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import type { AssessmentScale, AssessmentAttempt } from '@/types'

export default function TakeAssessmentPage() {
  const router = useRouter()
  const params = useParams()
  const scaleId = parseInt(params.scaleId as string)

  const [scale, setScale] = useState<AssessmentScale | null>(null)
  const [responses, setResponses] = useState<number[]>([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<AssessmentAttempt | null>(null)
  const [startedAt] = useState(new Date().toISOString())

  useEffect(() => {
    loadScale()
  }, [scaleId])

  const loadScale = async () => {
    try {
      setIsLoading(true)
      const scaleData = await apiClient.getAssessmentScale(scaleId)
      setScale(scaleData)
      setResponses(new Array(scaleData.questions.length).fill(-1))
    } catch (err: any) {
      console.error('Failed to load scale:', err)
      setError(err.response?.data?.detail || 'Failed to load assessment')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAnswer = (value: number) => {
    const newResponses = [...responses]
    newResponses[currentQuestion] = value
    setResponses(newResponses)

    // Auto-advance to next question
    if (currentQuestion < (scale?.questions.length || 0) - 1) {
      setTimeout(() => {
        setCurrentQuestion(currentQuestion + 1)
      }, 300)
    }
  }

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const handleSubmit = async () => {
    if (!scale) return

    // Check all questions answered
    if (responses.some(r => r === -1)) {
      setError('Please answer all questions before submitting')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const attempt = await apiClient.submitAssessment({
        scale_id: scaleId,
        responses,
        started_at: startedAt,
      })
      setResult(attempt)
    } catch (err: any) {
      console.error('Failed to submit assessment:', err)
      setError(err.response?.data?.detail || 'Failed to submit assessment')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getSeverityColor = (severity: string | null) => {
    switch (severity) {
      case 'NONE_MINIMAL':
        return 'text-green-600 bg-green-100'
      case 'MILD':
        return 'text-yellow-600 bg-yellow-100'
      case 'MODERATE':
        return 'text-orange-600 bg-orange-100'
      case 'MODERATELY_SEVERE':
        return 'text-red-600 bg-red-100'
      case 'SEVERE':
        return 'text-red-800 bg-red-200'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getSeverityText = (severity: string | null) => {
    if (!severity) return 'Unknown'
    return severity.replace('_', ' ')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Loading assessment...</p>
      </div>
    )
  }

  if (!scale) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card>
          <div className="p-6 text-center">
            <p className="text-red-600 mb-4">Assessment not found</p>
            <Button onClick={() => router.push('/patient/assessments')}>
              Back to Assessments
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  // Show results after submission
  if (result) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <h1 className="text-2xl font-bold text-primary-600">Assessment Complete</h1>
          </div>
        </nav>

        <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardHeader>
              <CardTitle>{scale.scale_name}</CardTitle>
            </CardHeader>
            <div className="p-6 pt-0 space-y-6">
              <div className="text-center py-8">
                <div className="mb-4">
                  <div className="text-6xl font-bold text-primary-600">{result.total_score}</div>
                  <div className="text-sm text-gray-600 mt-2">
                    out of {scale.max_score}
                  </div>
                </div>

                {result.severity_level && (
                  <div className="mt-6">
                    <span className={`inline-block px-6 py-3 rounded-full text-lg font-semibold ${getSeverityColor(result.severity_level)}`}>
                      {getSeverityText(result.severity_level)}
                    </span>
                  </div>
                )}
              </div>

              <Alert variant="info">
                <p className="text-sm">
                  Your assessment has been saved. Your provider will review your results and discuss them with you during your next session.
                </p>
              </Alert>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => router.push('/patient/assessments')}
                  className="flex-1"
                >
                  View All Assessments
                </Button>
                <Button
                  onClick={() => router.push('/patient/dashboard')}
                  className="flex-1"
                >
                  Back to Dashboard
                </Button>
              </div>
            </div>
          </Card>
        </main>
      </div>
    )
  }

  const question = scale.questions[currentQuestion]
  const progress = ((currentQuestion + 1) / scale.questions.length) * 100
  const isLastQuestion = currentQuestion === scale.questions.length - 1
  const isAnswered = responses[currentQuestion] !== -1

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-primary-600">{scale.scale_name}</h1>
            <span className="text-sm text-gray-600">
              Question {currentQuestion + 1} of {scale.questions.length}
            </span>
          </div>
        </div>
      </nav>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Alert variant="error" className="mb-6">
            {error}
          </Alert>
        )}

        {/* Instructions (first question only) */}
        {currentQuestion === 0 && scale.instructions && (
          <Alert variant="info" className="mb-6">
            <p className="font-medium mb-1">Instructions</p>
            <p className="text-sm">{scale.instructions}</p>
          </Alert>
        )}

        {/* Question Card */}
        <Card className="mb-6">
          <div className="p-8">
            <h2 className="text-2xl font-semibold mb-8 text-gray-900">
              {question.question}
            </h2>

            <div className="space-y-3">
              {question.options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleAnswer(option.value)}
                  className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                    responses[currentQuestion] === option.value
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center">
                    <div
                      className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                        responses[currentQuestion] === option.value
                          ? 'border-primary-600 bg-primary-600'
                          : 'border-gray-300'
                      }`}
                    >
                      {responses[currentQuestion] === option.value && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                    <span className="text-lg">{option.text}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentQuestion === 0}
          >
            Previous
          </Button>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => router.push('/patient/assessments')}
            >
              Cancel
            </Button>

            {isLastQuestion ? (
              <Button
                onClick={handleSubmit}
                disabled={!isAnswered || isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Assessment'}
              </Button>
            ) : (
              <Button
                onClick={() => setCurrentQuestion(currentQuestion + 1)}
                disabled={!isAnswered}
              >
                Next
              </Button>
            )}
          </div>
        </div>

        {/* Answer Counter */}
        <div className="mt-8 text-center text-sm text-gray-600">
          {responses.filter(r => r !== -1).length} of {scale.questions.length} questions answered
        </div>
      </main>
    </div>
  )
}
