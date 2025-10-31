'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import type {
  VideoSession,
  SessionJoinResponse,
  Appointment,
  WaitingRoomEntry,
  SessionNote,
  SessionNoteCreate,
} from '@/types'

export default function ProviderVideoSessionPage() {
  const router = useRouter()
  const params = useParams()
  const appointmentId = parseInt(params.appointmentId as string)

  const [videoSession, setVideoSession] = useState<VideoSession | null>(null)
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [joinResponse, setJoinResponse] = useState<SessionJoinResponse | null>(null)
  const [waitingPatients, setWaitingPatients] = useState<WaitingRoomEntry[]>([])
  const [sessionNotes, setSessionNotes] = useState<SessionNote[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inSession, setInSession] = useState(false)
  const [showNotes, setShowNotes] = useState(false)

  // Note creation state
  const [noteContent, setNoteContent] = useState('')
  const [noteType, setNoteType] = useState('session_note')
  const [isPrivate, setIsPrivate] = useState(false)
  const [isCreatingNote, setIsCreatingNote] = useState(false)

  useEffect(() => {
    loadSessionData()
  }, [appointmentId])

  useEffect(() => {
    // Poll for waiting room updates every 10 seconds when in session
    if (inSession && videoSession) {
      const interval = setInterval(() => {
        loadWaitingRoom()
      }, 10000)

      return () => clearInterval(interval)
    }
  }, [inSession, videoSession])

  const loadSessionData = async () => {
    try {
      setIsLoading(true)
      const [sessionData, appointmentData] = await Promise.all([
        apiClient.getVideoSessionForAppointment(appointmentId),
        apiClient.getAppointment(appointmentId),
      ])
      setVideoSession(sessionData)
      setAppointment(appointmentData)

      // Load notes if session started
      if (sessionData.status !== 'SCHEDULED') {
        loadSessionNotes(sessionData.id)
      }
    } catch (err: any) {
      console.error('Failed to load session:', err)
      setError(err.response?.data?.detail || 'Failed to load video session')
    } finally {
      setIsLoading(false)
    }
  }

  const loadWaitingRoom = async () => {
    if (!videoSession) return

    try {
      const waiting = await apiClient.getWaitingRoom(videoSession.id)
      setWaitingPatients(waiting)
    } catch (err) {
      console.error('Failed to load waiting room:', err)
    }
  }

  const loadSessionNotes = async (sessionId: number) => {
    try {
      const notes = await apiClient.getSessionNotes(sessionId)
      setSessionNotes(notes)
    } catch (err) {
      console.error('Failed to load notes:', err)
    }
  }

  const handleJoinSession = async () => {
    if (!videoSession) return

    setIsJoining(true)
    setError(null)

    try {
      const response = await apiClient.joinVideoSession(videoSession.id)
      setJoinResponse(response)

      if (response.can_join) {
        setInSession(true)
        // Load waiting room after joining
        loadWaitingRoom()
        // Load session notes
        loadSessionNotes(videoSession.id)
      }
    } catch (err: any) {
      console.error('Failed to join session:', err)
      setError(err.response?.data?.detail || 'Failed to join session')
    } finally {
      setIsJoining(false)
    }
  }

  const handleAdmitPatient = async (waitingRoomId: number) => {
    try {
      await apiClient.admitFromWaitingRoom(waitingRoomId)
      // Refresh waiting room
      loadWaitingRoom()
    } catch (err: any) {
      console.error('Failed to admit patient:', err)
      setError(err.response?.data?.detail || 'Failed to admit patient')
    }
  }

  const handleCreateNote = async () => {
    if (!videoSession || !noteContent.trim()) return

    setIsCreatingNote(true)
    try {
      const noteData: SessionNoteCreate = {
        note_content: noteContent,
        note_type: noteType,
        is_private: isPrivate,
      }

      await apiClient.createSessionNote(videoSession.id, noteData)

      // Clear form
      setNoteContent('')
      setNoteType('session_note')
      setIsPrivate(false)

      // Reload notes
      loadSessionNotes(videoSession.id)
    } catch (err: any) {
      console.error('Failed to create note:', err)
      setError(err.response?.data?.detail || 'Failed to create note')
    } finally {
      setIsCreatingNote(false)
    }
  }

  const handleEndSession = async () => {
    if (!videoSession) return

    try {
      await apiClient.updateSessionStatus(videoSession.id, { status: 'COMPLETED' })
      router.push('/provider/appointments')
    } catch (err: any) {
      console.error('Failed to end session:', err)
      setError(err.response?.data?.detail || 'Failed to end session')
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
            <Button onClick={() => router.push('/provider/appointments')}>
              Back to Appointments
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  // If in session, show split-screen layout
  if (inSession && joinResponse?.meeting_url) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-900">
        <div className="flex h-full">
          {/* Video Panel (Left) */}
          <div className="flex-1 relative">
            <iframe
              src={joinResponse.meeting_url}
              allow="camera; microphone; fullscreen; speaker; display-capture"
              className="w-full h-full border-0"
              title="Video Session"
            />
          </div>

          {/* Side Panel (Right) */}
          <div className="w-96 bg-white flex flex-col">
            {/* Header */}
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="font-semibold">Session Tools</h2>
              <Button variant="outline" size="sm" onClick={handleEndSession}>
                End Session
              </Button>
            </div>

            {/* Tabs */}
            <div className="flex border-b">
              <button
                onClick={() => setShowNotes(false)}
                className={`flex-1 py-3 px-4 text-sm font-medium ${
                  !showNotes
                    ? 'border-b-2 border-primary-600 text-primary-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Waiting Room ({waitingPatients.length})
              </button>
              <button
                onClick={() => setShowNotes(true)}
                className={`flex-1 py-3 px-4 text-sm font-medium ${
                  showNotes
                    ? 'border-b-2 border-primary-600 text-primary-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Notes ({sessionNotes.length})
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {error && (
                <Alert variant="error" className="mb-4">
                  {error}
                </Alert>
              )}

              {!showNotes ? (
                // Waiting Room
                <div className="space-y-3">
                  {waitingPatients.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">
                      No patients waiting
                    </p>
                  ) : (
                    waitingPatients.map((entry) => (
                      <Card key={entry.id}>
                        <div className="p-3">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-medium text-sm">Patient</p>
                              <p className="text-xs text-gray-500">
                                Joined: {formatTime(entry.joined_at)}
                              </p>
                            </div>
                          </div>
                          {entry.message_to_provider && (
                            <p className="text-sm text-gray-600 mb-2">{entry.message_to_provider}</p>
                          )}
                          {entry.is_waiting && (
                            <Button
                              size="sm"
                              onClick={() => handleAdmitPatient(entry.id)}
                              className="w-full"
                            >
                              Admit to Session
                            </Button>
                          )}
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              ) : (
                // Session Notes
                <div className="space-y-4">
                  {/* Create Note Form */}
                  <Card>
                    <div className="p-3 space-y-3">
                      <textarea
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                        placeholder="Add session note..."
                        className="w-full px-3 py-2 border rounded text-sm"
                        rows={4}
                      />
                      <div className="space-y-2">
                        <select
                          value={noteType}
                          onChange={(e) => setNoteType(e.target.value)}
                          className="w-full px-3 py-2 border rounded text-sm"
                        >
                          <option value="session_note">Session Note</option>
                          <option value="clinical_observation">Clinical Observation</option>
                          <option value="treatment_plan">Treatment Plan</option>
                          <option value="follow_up">Follow-up</option>
                        </select>
                        <label className="flex items-center text-sm">
                          <input
                            type="checkbox"
                            checked={isPrivate}
                            onChange={(e) => setIsPrivate(e.target.checked)}
                            className="mr-2"
                          />
                          Private note (not visible to patient)
                        </label>
                      </div>
                      <Button
                        size="sm"
                        onClick={handleCreateNote}
                        disabled={isCreatingNote || !noteContent.trim()}
                        className="w-full"
                      >
                        {isCreatingNote ? 'Saving...' : 'Save Note'}
                      </Button>
                    </div>
                  </Card>

                  {/* Notes List */}
                  <div className="space-y-3">
                    {sessionNotes.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-8">No notes yet</p>
                    ) : (
                      sessionNotes.map((note) => (
                        <Card key={note.id}>
                          <div className="p-3">
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-xs font-medium text-gray-600">
                                {note.note_type?.replace('_', ' ').toUpperCase() || 'NOTE'}
                              </span>
                              {note.is_private && (
                                <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                                  Private
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-800 mb-1">{note.note_content}</p>
                            <p className="text-xs text-gray-500">
                              {formatTime(note.note_timestamp)}
                            </p>
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
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
            <Button variant="outline" onClick={() => router.push('/provider/appointments')}>
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

        {/* Join Card */}
        {!joinResponse && (
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Ready to Start?</h3>
              <p className="text-gray-600 mb-6">
                You can join the session 15 minutes before the scheduled start time.
              </p>
              <Button onClick={handleJoinSession} disabled={isJoining} className="w-full">
                {isJoining ? 'Joining...' : 'Start Video Session'}
              </Button>
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
          </div>
        </Card>
      </main>
    </div>
  )
}
