'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import type { VideoSession, SessionJoinResponse, Appointment } from '@/types'

export default function PatientVideoSessionPage() {
  const router = useRouter()
  const params = useParams()
  const appointmentId = parseInt(params.appointmentId as string)

  const [videoSession, setVideoSession] = useState<VideoSession | null>(null)
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [joinResponse, setJoinResponse] = useState<SessionJoinResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inSession, setInSession] = useState(false)

  useEffect(() => {
    loadSessionData()
    // Poll for updates every 30 seconds when in waiting room
    const interval = setInterval(() => {
      if (joinResponse?.waiting_room_required && !inSession) {
        checkWaitingRoomStatus()
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [appointmentId, inSession])

  const loadSessionData = async () => {
    try {
      setIsLoading(true)
      const [sessionData, appointmentData] = await Promise.all([
        apiClient.getVideoSessionForAppointment(appointmentId),
        apiClient.getAppointment(appointmentId),
      ])
      setVideoSession(sessionData)
      setAppointment(appointmentData)
    } catch (err: any) {
      console.error('Failed to load session:', err)
      setError(err.response?.data?.detail || 'Failed to load video session')
    } finally {
      setIsLoading(false)
    }
  }

  const handleJoinSession = async () => {
    if (!videoSession) return

    setIsJoining(true)
    setError(null)

    try {
      const response = await apiClient.joinVideoSession(videoSession.id)
      setJoinResponse(response)

      if (response.can_join && !response.waiting_room_required) {
        // Provider already joined, enter session immediately
        setInSession(true)
      }
    } catch (err: any) {
      console.error('Failed to join session:', err)
      setError(err.response?.data?.detail || 'Failed to join session')
    } finally {
      setIsJoining(false)
    }
  }

  const checkWaitingRoomStatus = async () => {
    if (!videoSession) return

    try {
      const response = await apiClient.joinVideoSession(videoSession.id)
      setJoinResponse(response)

      if (response.can_join && !response.waiting_room_required) {
        // Provider has joined, we can enter
        setInSession(true)
      }
    } catch (err) {
      console.error('Failed to check waiting room:', err)
    }
  }

  const formatTime = (datetime: string) => {
    const date = new Date(datetime)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  const formatDate = (datetime: string) => {
    const date = new Date(datetime)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Loading video session...</p>
      </div>
    )
  }

  if (!videoSession || !appointment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card>
          <div className="p-6 text-center">
            <p className="text-red-600 mb-4">Video session not found</p>
            <Button onClick={() => router.push('/patient/appointments')}>
              Back to Appointments
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  // If in session, show full-screen Google Meet iframe
  if (inSession && joinResponse?.meeting_url) {
    return (
      <div className="fixed inset-0 z-50 bg-black">
        <div className="absolute top-4 right-4 z-10">
          <Button
            variant="outline"
            onClick={() => {
              setInSession(false)
              router.push('/patient/appointments')
            }}
            className="bg-white"
          >
            Leave Session
          </Button>
        </div>
        <iframe
          src={joinResponse.meeting_url}
          allow="camera; microphone; fullscreen; speaker; display-capture"
          className="w-full h-full border-0"
          title="Video Session"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-primary-600">Video Session</h1>
            <Button variant="outline" onClick={() => router.push('/patient/appointments')}>
              Back to Appointments
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Alert variant="error" className="mb-4">
            {error}
          </Alert>
        )}

        {/* Session Info Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Session Details</CardTitle>
          </CardHeader>
          <div className="p-6 pt-0 space-y-4">
            <div>
              <p className="text-sm text-gray-600">Date</p>
              <p className="font-medium">{formatDate(videoSession.scheduled_start_time)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Time</p>
              <p className="font-medium">{formatTime(videoSession.scheduled_start_time)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Duration</p>
              <p className="font-medium">{videoSession.scheduled_duration_minutes} minutes</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm ${
                  videoSession.status === 'IN_PROGRESS'
                    ? 'bg-green-100 text-green-800'
                    : videoSession.status === 'COMPLETED'
                    ? 'bg-gray-100 text-gray-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {videoSession.status.replace('_', ' ')}
              </span>
            </div>
          </div>
        </Card>

        {/* Join/Waiting Room Card */}
        {!joinResponse && (
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Ready to Join?</h3>
              <p className="text-gray-600 mb-6">
                You can join the session 5 minutes before the scheduled start time.
              </p>
              <Button onClick={handleJoinSession} disabled={isJoining} className="w-full">
                {isJoining ? 'Joining...' : 'Join Video Session'}
              </Button>
            </div>
          </Card>
        )}

        {/* Waiting Room */}
        {joinResponse && joinResponse.waiting_room_required && !inSession && (
          <Card>
            <div className="p-6 text-center">
              <div className="mb-4">
                <div className="inline-block p-4 bg-blue-100 rounded-full">
                  <svg
                    className="w-12 h-12 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">You're in the Waiting Room</h3>
              <p className="text-gray-600 mb-6">
                Your provider will admit you to the session shortly. Please wait...
              </p>
              <div className="animate-pulse">
                <div className="h-2 bg-blue-200 rounded w-full"></div>
              </div>
            </div>
          </Card>
        )}

        {/* Can't Join Yet */}
        {joinResponse && !joinResponse.can_join && (
          <Card>
            <div className="p-6 text-center">
              <Alert variant="info" className="mb-4">
                {joinResponse.message}
              </Alert>
              <Button variant="outline" onClick={() => router.push('/patient/appointments')}>
                Back to Appointments
              </Button>
            </div>
          </Card>
        )}

        {/* Ready to Join */}
        {joinResponse && joinResponse.can_join && !joinResponse.waiting_room_required && !inSession && (
          <Card>
            <div className="p-6 text-center">
              <h3 className="text-lg font-semibold mb-4 text-green-600">Ready to Start!</h3>
              <p className="text-gray-600 mb-6">Your provider is ready. Click below to enter the session.</p>
              <Button onClick={() => setInSession(true)} className="w-full">
                Enter Video Session
              </Button>
            </div>
          </Card>
        )}

        {/* Technical Support Info */}
        <Card className="mt-6">
          <div className="p-6">
            <h3 className="text-sm font-semibold mb-3">Technical Support</h3>
            <p className="text-sm text-gray-600 mb-2">
              Having trouble connecting? Make sure you have:
            </p>
            <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
              <li>A stable internet connection</li>
              <li>Camera and microphone permissions enabled</li>
              <li>Latest browser version (Chrome, Firefox, or Safari recommended)</li>
            </ul>
            <p className="text-sm text-gray-600 mt-4">
              If you continue to experience issues, please contact support.
            </p>
          </div>
        </Card>
      </main>
    </div>
  )
}
