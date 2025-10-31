'use client'

import React, { useState } from 'react'
import { apiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import type { MedicationEducation, QuizQuestion } from '@/types'

interface MedicationLessonProps {
  education: MedicationEducation
  onComplete: () => void
}

export function MedicationLesson({ education, onComplete }: MedicationLessonProps) {
  const [showQuiz, setShowQuiz] = useState(false)
  const [answers, setAnswers] = useState<string[]>(Array(education.quiz_questions.length).fill(''))
  const [acknowledged, setAcknowledged] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null)

  const handleSubmitQuiz = async () => {
    setError(null)

    // Validation
    if (answers.some((a) => !a)) {
      setError('Please answer all quiz questions')
      return
    }

    if (!acknowledged) {
      setError('You must acknowledge understanding before proceeding')
      return
    }

    setIsLoading(true)

    try {
      const attempt = await apiClient.submitMedicationQuiz({
        education_id: education.id,
        answers,
        acknowledged: true,
      })

      setResult({
        score: attempt.score,
        passed: attempt.status === 'PASSED',
      })

      if (attempt.status === 'PASSED') {
        setTimeout(() => {
          onComplete()
        }, 3000)
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to submit quiz')
    } finally {
      setIsLoading(false)
    }
  }

  if (result) {
    return (
      <Alert type={result.passed ? 'success' : 'error'} title={result.passed ? 'Quiz Passed!' : 'Quiz Failed'}>
        {result.passed ? (
          <>You scored {result.score}%. Your medication education is complete.</>
        ) : (
          <>
            You scored {result.score}%. A passing score is {education.passing_score}%. Please review the material and try
            again.
          </>
        )}
      </Alert>
    )
  }

  if (!showQuiz) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            {education.medication_name} ({education.medication_class})
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">GUARANTEE: Medication education + quiz required before prescribing</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
            <p className="text-gray-700">{education.description}</p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Usage Instructions</h4>
            <p className="text-gray-700">{education.usage_instructions}</p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Side Effects</h4>
            <p className="text-gray-700">{education.side_effects}</p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Warnings</h4>
            <p className="text-gray-700 font-medium text-red-600">{education.warnings}</p>
          </div>

          <Button onClick={() => setShowQuiz(true)} className="w-full">
            Continue to Quiz
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quiz: {education.medication_name}</CardTitle>
        <p className="text-sm text-gray-600 mt-1">
          Passing score: {education.passing_score}% - Answer all questions to proceed
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && <Alert type="error">{error}</Alert>}

        {education.quiz_questions.map((question: QuizQuestion, index: number) => (
          <div key={index} className="space-y-2">
            <p className="font-medium text-gray-900">
              {index + 1}. {question.question}
            </p>
            <div className="space-y-2 ml-4">
              {question.options.map((option, optIndex) => (
                <label key={optIndex} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name={`question-${index}`}
                    value={option}
                    checked={answers[index] === option}
                    onChange={(e) => {
                      const newAnswers = [...answers]
                      newAnswers[index] = e.target.value
                      setAnswers(newAnswers)
                    }}
                    className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          </div>
        ))}

        <div className="border-t pt-4">
          <label className="flex items-start space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="w-4 h-4 mt-1 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700">
              I acknowledge that I have read and understood the medication information, including side effects and
              warnings. I understand this medication may be prescribed based on my quiz results.
            </span>
          </label>
        </div>

        <div className="flex space-x-3">
          <Button variant="outline" onClick={() => setShowQuiz(false)} className="flex-1">
            Review Material
          </Button>
          <Button onClick={handleSubmitQuiz} isLoading={isLoading} className="flex-1">
            {isLoading ? 'Submitting...' : 'Submit Quiz'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
