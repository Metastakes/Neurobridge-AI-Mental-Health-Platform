'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'

export default function RegisterPage() {
  const router = useRouter()
  const [userType, setUserType] = useState<'patient' | 'provider'>('patient')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      if (userType === 'patient') {
        await apiClient.registerPatient(formData)
        router.push('/patient/dashboard')
      } else {
        await apiClient.registerProvider({
          ...formData,
          provider_type: 'THERAPIST',
        })
        router.push('/provider/dashboard')
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed. Please check your information.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-600">NeuroBridge</h1>
          <p className="text-gray-600 mt-2">Create your account</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            {/* User Type Selection */}
            <div className="flex space-x-4 mb-6">
              <button
                type="button"
                onClick={() => setUserType('patient')}
                className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-colors ${
                  userType === 'patient'
                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }`}
              >
                I'm a Patient
              </button>
              <button
                type="button"
                onClick={() => setUserType('provider')}
                className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-colors ${
                  userType === 'provider'
                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }`}
              >
                I'm a Provider
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <Alert type="error">{error}</Alert>}

              <Input
                label="Full Name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />

              <Input
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />

              <Input
                label="Phone Number (Optional)"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(555) 123-4567"
              />

              <Input
                label="Password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                helpText="Must be at least 8 characters with uppercase, lowercase, number, and special character"
                required
              />

              <Button type="submit" isLoading={isLoading} className="w-full">
                {isLoading ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link href="/auth/login" className="text-primary-600 hover:text-primary-700 font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
