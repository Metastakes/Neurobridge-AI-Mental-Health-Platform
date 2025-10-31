'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { EarningsChart } from '@/components/EarningsChart'
import type { EarningsDashboard } from '@/types'

export default function ProviderDashboard() {
  const router = useRouter()
  const [earnings, setEarnings] = useState<EarningsDashboard | null>(null)
  const [periodDays, setPeriodDays] = useState(30)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check authentication
    if (!apiClient.isAuthenticated() || apiClient.getCurrentRole() !== 'PROVIDER') {
      router.push('/auth/login')
      return
    }

    loadEarnings()
  }, [periodDays])

  const loadEarnings = async () => {
    try {
      const data = await apiClient.getEarningsDashboard(periodDays)
      setEarnings(data)
    } catch (err) {
      console.error('Failed to load earnings:', err)
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
            <h1 className="text-2xl font-bold text-primary-600">NeuroBridge - Provider Portal</h1>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Earnings Dashboard</h2>
              <p className="text-gray-600 mt-2">
                GUARANTEE: Complete earnings breakdown with cash vs insurance tracking
              </p>
            </div>
            <div className="flex space-x-2">
              <Button
                variant={periodDays === 7 ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setPeriodDays(7)}
              >
                7 Days
              </Button>
              <Button
                variant={periodDays === 30 ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setPeriodDays(30)}
              >
                30 Days
              </Button>
              <Button
                variant={periodDays === 90 ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setPeriodDays(90)}
              >
                90 Days
              </Button>
            </div>
          </div>
        </div>

        {earnings ? (
          <EarningsChart data={earnings} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>No earnings data available</CardTitle>
            </CardHeader>
          </Card>
        )}
      </main>
    </div>
  )
}
