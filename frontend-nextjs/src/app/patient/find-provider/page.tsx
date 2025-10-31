'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import type {
  ProviderSearchFilters,
  ProviderSearchResponse,
  ProviderSearchResult,
  Specialty,
  InsurancePlan,
} from '@/types'

export default function FindProvider() {
  const router = useRouter()
  const [searchResults, setSearchResults] = useState<ProviderSearchResult[]>([])
  const [specialties, setSpecialties] = useState<Specialty[]>([])
  const [insurancePlans, setInsurancePlans] = useState<InsurancePlan[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filter state
  const [filters, setFilters] = useState<ProviderSearchFilters>({
    skip: 0,
    limit: 20,
    sort_by: 'rating',
  })

  const [totalPages, setTotalPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    loadReferenceData()
  }, [])

  const loadReferenceData = async () => {
    try {
      const [specialtiesData, insuranceData] = await Promise.all([
        apiClient.getSpecialtiesForSearch(),
        apiClient.getInsurancePlansForSearch(),
      ])
      setSpecialties(specialtiesData)
      setInsurancePlans(insuranceData)
    } catch (err) {
      console.error('Failed to load reference data:', err)
    }
  }

  const handleSearch = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await apiClient.searchProviders(filters)
      setSearchResults(response.results)
      setTotalPages(response.total_pages)
      setCurrentPage(response.page_number)
    } catch (err: any) {
      console.error('Search failed:', err)
      setError(err.response?.data?.detail || 'Failed to search providers')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFilterChange = (field: keyof ProviderSearchFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [field]: value, skip: 0 }))
  }

  const handlePageChange = (newPage: number) => {
    const newSkip = (newPage - 1) * (filters.limit || 20)
    setFilters((prev) => ({ ...prev, skip: newSkip }))
    setCurrentPage(newPage)
  }

  const viewProviderDetail = (providerId: number) => {
    router.push(`/patient/provider/${providerId}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-primary-600">Find a Provider</h1>
            <Button variant="outline" onClick={() => router.push('/patient/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Search Filters</CardTitle>
          </CardHeader>
          <div className="p-6 space-y-4">
            {/* Specialty Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Specialties
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md p-3">
                {specialties.map((specialty) => (
                  <label key={specialty.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={(filters.specialty_ids || []).includes(specialty.id)}
                      onChange={(e) => {
                        const current = filters.specialty_ids || []
                        if (e.target.checked) {
                          handleFilterChange('specialty_ids', [...current, specialty.id])
                        } else {
                          handleFilterChange(
                            'specialty_ids',
                            current.filter((id) => id !== specialty.id)
                          )
                        }
                      }}
                    />
                    <span className="text-sm">{specialty.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Insurance Filter */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filters.accepts_medicare || false}
                    onChange={(e) => handleFilterChange('accepts_medicare', e.target.checked)}
                  />
                  <span className="text-sm font-medium">Accepts Medicare</span>
                </label>
              </div>
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filters.accepts_medicaid || false}
                    onChange={(e) => handleFilterChange('accepts_medicaid', e.target.checked)}
                  />
                  <span className="text-sm font-medium">Accepts Medicaid</span>
                </label>
              </div>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={filters.sort_by || 'rating'}
                onChange={(e) => handleFilterChange('sort_by', e.target.value)}
              >
                <option value="rating">Highest Rated</option>
                <option value="experience">Most Experienced</option>
                <option value="availability">Soonest Available</option>
              </select>
            </div>

            <Button onClick={handleSearch} disabled={isLoading} className="w-full">
              {isLoading ? 'Searching...' : 'Search Providers'}
            </Button>
          </div>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert variant="error" className="mb-4">
            {error}
          </Alert>
        )}

        {/* Search Results */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">
              {searchResults.length > 0
                ? `Found ${searchResults.length} Providers`
                : 'No results yet'}
            </h2>
          </div>

          {searchResults.map((provider) => (
            <Card key={provider.provider_id} className="hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      {provider.profile_photo_url && (
                        <img
                          src={provider.profile_photo_url}
                          alt={provider.name}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      )}
                      <div>
                        <h3 className="text-lg font-semibold">{provider.name}</h3>
                        <p className="text-sm text-gray-600">
                          {provider.provider_type} {provider.specialty && `• ${provider.specialty}`}
                        </p>
                        {provider.years_experience && (
                          <p className="text-sm text-gray-500">
                            {provider.years_experience} years experience
                          </p>
                        )}
                      </div>
                    </div>

                    {provider.bio && (
                      <p className="mt-3 text-sm text-gray-700 line-clamp-2">{provider.bio}</p>
                    )}

                    <div className="mt-3 flex flex-wrap gap-2">
                      {provider.accepts_new_patients && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                          Accepting New Patients
                        </span>
                      )}
                      {provider.accepts_medicare && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          Medicare
                        </span>
                      )}
                      {provider.accepts_medicaid && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          Medicaid
                        </span>
                      )}
                      {provider.insurance_plans_count > 0 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                          +{provider.insurance_plans_count} Insurance Plans
                        </span>
                      )}
                    </div>

                    <div className="mt-3 flex items-center space-x-4 text-sm text-gray-600">
                      {provider.rating_average && (
                        <span>⭐ {provider.rating_average.toFixed(1)} ({provider.rating_count} reviews)</span>
                      )}
                      {provider.earliest_availability_date && (
                        <span>Available: {provider.earliest_availability_date}</span>
                      )}
                    </div>
                  </div>

                  <Button onClick={() => viewProviderDetail(provider.provider_id)} size="sm">
                    View Profile
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
