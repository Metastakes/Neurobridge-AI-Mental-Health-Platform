'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import Link from 'next/link'
import type { Appointment, PreSessionTask } from '@/types'
import { format } from 'date-fns'

export default function PatientDashboard() {
  const router = useRouter()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [tasks, setTasks] = useState<PreSessionTask[]>([])
  const [hasPaymentMethod, setHasPaymentMethod] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check authentication
    if (!apiClient.isAuthenticated() || apiClient.getCurrentRole() !== 'PATIENT') {
      router.push('/auth/login')
      return
    }

    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [appointmentsData, tasksData, paymentStatus] = await Promise.all([
        apiClient.getMyAppointments(),
        apiClient.getMyPreSessionTasks(),
        apiClient.getPaymentMethodStatus(),
      ])

      setAppointments(appointmentsData.slice(0, 5)) // Show 5 most recent
      setTasks(tasksData.filter((t) => t.status === 'PENDING'))
      setHasPaymentMethod(paymentStatus.has_payment_method)
    } catch (err) {
      console.error('Failed to load dashboard data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    apiClient.logout()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-primary-600">NeuroBridge - Patient Portal</h1>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Welcome Back!</h2>
          <p className="text-gray-600 mt-2">Manage your appointments and complete pre-session tasks</p>
        </div>

        {/* Payment Method Warning */}
        {!hasPaymentMethod && (
          <Alert type="warning" className="mb-6">
            <strong>Payment Method Required:</strong> You must add a payment method before booking appointments.{' '}
            <Link href="/patient/payment" className="underline font-medium">
              Add payment method now
            </Link>
          </Alert>
        )}

        {/* Pending Tasks Alert */}
        {tasks.length > 0 && (
          <Alert type="info" className="mb-6">
            <strong>Pending Pre-Session Tasks:</strong> You have {tasks.length} check-in(s) to complete.{' '}
            <Link href="/patient/pre-session" className="underline font-medium">
              Complete now
            </Link>
          </Alert>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link href="/patient/book">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="pt-6">
                <div className="text-primary-600 text-3xl mb-2">📅</div>
                <h3 className="text-lg font-semibold">Book Appointment</h3>
                <p className="text-sm text-gray-600">Schedule a session with a provider</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/patient/appointments">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="pt-6">
                <div className="text-primary-600 text-3xl mb-2">📋</div>
                <h3 className="text-lg font-semibold">My Appointments</h3>
                <p className="text-sm text-gray-600">View upcoming and past sessions</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/patient/pre-session">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="pt-6">
                <div className="text-primary-600 text-3xl mb-2">✅</div>
                <h3 className="text-lg font-semibold">Pre-Session Tasks</h3>
                <p className="text-sm text-gray-600">
                  {tasks.length > 0 ? `${tasks.length} pending` : 'All caught up!'}
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Upcoming Appointments */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            {appointments.length === 0 ? (
              <p className="text-gray-600 text-center py-8">
                No appointments scheduled.{' '}
                <Link href="/patient/book" className="text-primary-600 font-medium">
                  Book your first appointment
                </Link>
              </p>
            ) : (
              <div className="space-y-3">
                {appointments.map((apt) => (
                  <div key={apt.id} className="flex justify-between items-center p-4 border rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">
                        {format(new Date(apt.starts_at), 'EEEE, MMMM d, yyyy')}
                      </p>
                      <p className="text-sm text-gray-600">
                        {format(new Date(apt.starts_at), 'h:mm a')} - {format(new Date(apt.ends_at), 'h:mm a')}
                      </p>
                      <p className="text-xs text-gray-500">Status: {apt.status}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        ${(apt.amount_cents / 100).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-600">{apt.payment_type}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
