'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import type {
  MedicationQuizQuestion,
  QuizAnswerSubmit,
  MedicationQuizResult,
  QuizResponseDetail
} from '@/types'

interface PageProps {
  params: {
    medicationId: string
  }
}

export default function MedicationQuizPage({ params }: PageProps) {
  const router = useRouter()
  const medicationId = parseInt(params.medicationId)

  const [loading, setLoading] = useState(true)
  const [questions, setQuestions] = useState<MedicationQuizQuestion[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<QuizAnswerSubmit[]>([])
  const [selectedAnswer, setSelectedAnswer] = useState<string>('')
  const [quizStartTime, setQuizStartTime] = useState<string>('')
  const [result, setResult] = useState<MedicationQuizResult | null>(null)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    loadQuiz()
  }, [medicationId])

  const loadQuiz = async () => {
    try {
      setLoading(true)
      const data = await apiClient.getMedicationQuiz(medicationId)
      setQuestions(data)
      setQuizStartTime(new Date().toISOString())
      setLoading(false)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load quiz')
      setLoading(false)
    }
  }

  const handleSelectAnswer = (optionKey: string) => {
    setSelectedAnswer(optionKey)
  }

  const handleNext = () => {
    if (!selectedAnswer) return

    // Save answer
    const newAnswer: QuizAnswerSubmit = {
      question_id: currentQuestion.id,
      selected_answer: selectedAnswer,
    }
    setAnswers([...answers, newAnswer])

    // Move to next question or submit
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setSelectedAnswer('')
    } else {
      submitQuiz([...answers, newAnswer])
    }
  }

  const submitQuiz = async (finalAnswers: QuizAnswerSubmit[]) => {
    try {
      const result = await apiClient.submitMedicationQuiz({
        prescribed_medication_id: medicationId,
        responses: finalAnswers,
        started_at: quizStartTime,
      })
      setResult(result)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to submit quiz')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading quiz...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <div className="text-center">
            <span className="text-6xl">⚠️</span>
            <h2 className="mt-4 text-2xl font-bold text-gray-900">Error</h2>
            <p className="mt-2 text-gray-600">{error}</p>
            <button
              onClick={() => router.push('/patient/medications')}
              className="mt-6 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              Back to Medications
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (result) {
    return <QuizResultsView result={result} onContinue={() => router.push('/patient/medications')} />
  }

  const currentQuestion = questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
            <span className="text-sm font-medium text-indigo-600">
              {Math.round(progress)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6">
          {/* Critical Warning Badge */}
          {currentQuestion.is_critical && (
            <div className="mb-4 inline-flex items-center px-4 py-2 bg-red-100 text-red-800 rounded-full">
              <span className="mr-2">⚠️</span>
              <span className="text-sm font-semibold">Critical Safety Information</span>
            </div>
          )}

          {/* Question Type Badge */}
          <div className="mb-4">
            <span className="inline-flex items-center px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
              {currentQuestion.question_type === 'black_box_warning' && '⚫ Black Box Warning'}
              {currentQuestion.question_type === 'adverse_reaction' && '🔴 Adverse Reaction'}
              {currentQuestion.question_type === 'general_function' && '💊 General Information'}
            </span>
          </div>

          {/* Question */}
          <h2 className="text-2xl font-bold text-gray-900 mb-8 leading-relaxed">
            {currentQuestion.question}
          </h2>

          {/* Answer Options */}
          <div className="space-y-4">
            {Object.entries(currentQuestion.options).map(([key, text]) => (
              <button
                key={key}
                onClick={() => handleSelectAnswer(key)}
                className={`w-full text-left p-6 rounded-xl border-2 transition-all duration-200 ${
                  selectedAnswer === key
                    ? 'border-indigo-600 bg-indigo-50 shadow-lg scale-105'
                    : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center">
                  <div
                    className={`flex-shrink-0 w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center ${
                      selectedAnswer === key
                        ? 'border-indigo-600 bg-indigo-600'
                        : 'border-gray-300'
                    }`}
                  >
                    {selectedAnswer === key && (
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <span className="text-lg text-gray-900">{text}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Navigation Button */}
        <div className="flex justify-end">
          <button
            onClick={handleNext}
            disabled={!selectedAnswer}
            className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 ${
              selectedAnswer
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-xl hover:scale-105'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {currentQuestionIndex < questions.length - 1 ? 'Next Question →' : 'Submit Quiz ✓'}
          </button>
        </div>

        {/* Micro-Learning Tip */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <span className="inline-flex items-center">
            <span className="mr-2">💡</span>
            Take your time - understanding this information ensures your safety
          </span>
        </div>
      </div>
    </div>
  )
}

function QuizResultsView({ result, onContinue }: { result: MedicationQuizResult; onContinue: () => void }) {
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set())

  const toggleQuestion = (questionId: number) => {
    const newExpanded = new Set(expandedQuestions)
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId)
    } else {
      newExpanded.add(questionId)
    }
    setExpandedQuestions(newExpanded)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Results Header */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6 text-center">
          {result.passed ? (
            <>
              <span className="text-8xl">🎉</span>
              <h1 className="text-4xl font-bold text-green-600 mt-4">Congratulations!</h1>
              <p className="text-xl text-gray-600 mt-2">You passed the medication quiz</p>
            </>
          ) : (
            <>
              <span className="text-8xl">📚</span>
              <h1 className="text-4xl font-bold text-orange-600 mt-4">Keep Learning</h1>
              <p className="text-xl text-gray-600 mt-2">Review the explanations below</p>
            </>
          )}

          {/* Score Display */}
          <div className="mt-8 grid grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl p-6">
              <div className="text-3xl font-bold text-blue-900">{result.score_percentage}%</div>
              <div className="text-sm text-blue-700 mt-1">Your Score</div>
            </div>
            <div className="bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl p-6">
              <div className="text-3xl font-bold text-purple-900">
                {result.correct_answers}/{result.total_questions}
              </div>
              <div className="text-sm text-purple-700 mt-1">Correct</div>
            </div>
            <div className="bg-gradient-to-br from-green-100 to-green-200 rounded-xl p-6">
              <div className="text-3xl font-bold text-green-900">{result.points_earned}</div>
              <div className="text-sm text-green-700 mt-1">Points Earned</div>
            </div>
          </div>

          {result.passed && (
            <div className="mt-6 inline-flex items-center px-6 py-3 bg-green-100 text-green-800 rounded-full">
              <span className="mr-2">✓</span>
              <span className="font-semibold">
                You can now start taking {result.medication_name}
              </span>
            </div>
          )}
        </div>

        {/* Question Review */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Review Your Answers</h2>

          <div className="space-y-4">
            {result.responses.map((response: QuizResponseDetail, idx: number) => (
              <div
                key={response.question_id}
                className={`border-2 rounded-xl overflow-hidden transition-all ${
                  response.is_correct ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                }`}
              >
                <button
                  onClick={() => toggleQuestion(response.question_id)}
                  className="w-full p-6 text-left flex items-center justify-between"
                >
                  <div className="flex items-center flex-1">
                    <span className="text-2xl mr-4">
                      {response.is_correct ? '✓' : '✗'}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        {response.is_critical && (
                          <span className="mr-2 text-xs px-2 py-1 bg-red-100 text-red-700 rounded">
                            Critical
                          </span>
                        )}
                        <span className="text-sm text-gray-500">Question {idx + 1}</span>
                      </div>
                      <p className="font-medium text-gray-900">{response.question}</p>
                    </div>
                  </div>
                  <svg
                    className={`w-6 h-6 text-gray-400 transition-transform ${
                      expandedQuestions.has(response.question_id) ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {expandedQuestions.has(response.question_id) && (
                  <div className="px-6 pb-6 border-t border-gray-200">
                    <div className="mt-4 space-y-3">
                      <div>
                        <span className="text-sm font-semibold text-gray-700">Your Answer:</span>
                        <p className={`mt-1 ${response.is_correct ? 'text-green-700' : 'text-red-700'}`}>
                          {response.selected}
                        </p>
                      </div>
                      {!response.is_correct && (
                        <div>
                          <span className="text-sm font-semibold text-gray-700">Correct Answer:</span>
                          <p className="mt-1 text-green-700">{response.correct}</p>
                        </div>
                      )}
                      <div className="pt-3 border-t border-gray-200">
                        <span className="text-sm font-semibold text-gray-700">Explanation:</span>
                        <p className="mt-1 text-gray-600">{response.explanation}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Continue Button */}
        <div className="mt-8 text-center">
          <button
            onClick={onContinue}
            className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold text-lg hover:shadow-xl hover:scale-105 transition-all"
          >
            Continue to Medications
          </button>
        </div>
      </div>
    </div>
  )
}
