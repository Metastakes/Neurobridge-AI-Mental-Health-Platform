'use client'

import React, { useState } from 'react'
import { apiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import type { PreSessionTask } from '@/types'

interface PreSessionTaskFormProps {
  task: PreSessionTask
  onSuccess: () => void
}

export function PreSessionTaskForm({ task, onSuccess }: PreSessionTaskFormProps) {
  const [answers, setAnswers] = useState({
    answer_1: '',
    answer_2: '',
    answer_3: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!answers.answer_1 || !answers.answer_2 || !answers.answer_3) {
      setError('Please answer all 3 questions')
      return
    }

    setIsLoading(true)

    try {
      await apiClient.submitPreSessionTask(task.id, answers)
      setSuccess(true)
      setTimeout(() => {
        onSuccess()
      }, 1500)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to submit answers')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <Alert type="success" title="Submitted!">
        Your pre-session check-in has been completed. Thank you!
      </Alert>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pre-Session Check-In</CardTitle>
        <p className="text-sm text-gray-600 mt-1">
          GUARANTEE: 3-question micro-check-in due before your appointment
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <Alert type="error">{error}</Alert>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              1. {task.question_1}
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={3}
              value={answers.answer_1}
              onChange={(e) => setAnswers({ ...answers, answer_1: e.target.value })}
              placeholder="Your answer..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              2. {task.question_2}
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={3}
              value={answers.answer_2}
              onChange={(e) => setAnswers({ ...answers, answer_2: e.target.value })}
              placeholder="Your answer..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              3. {task.question_3}
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={3}
              value={answers.answer_3}
              onChange={(e) => setAnswers({ ...answers, answer_3: e.target.value })}
              placeholder="Your answer..."
              required
            />
          </div>

          <Button type="submit" isLoading={isLoading} className="w-full">
            {isLoading ? 'Submitting...' : 'Submit Check-In'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
