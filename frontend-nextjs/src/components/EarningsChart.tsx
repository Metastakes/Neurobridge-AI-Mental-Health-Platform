'use client'

import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import type { EarningsDashboard } from '@/types'

interface EarningsChartProps {
  data: EarningsDashboard
}

export function EarningsChart({ data }: EarningsChartProps) {
  // Format earnings breakdown for bar chart
  const earningsData = [
    {
      name: 'Session Revenue',
      amount: data.earnings_breakdown.session_revenue_cents / 100,
    },
    {
      name: 'No-Show Fees',
      amount: data.earnings_breakdown.no_show_fees_cents / 100,
    },
    {
      name: 'Insurance Top-Up',
      amount: data.earnings_breakdown.insurance_topup_cents / 100,
    },
    {
      name: 'Late Cancel Fees',
      amount: data.earnings_breakdown.late_cancel_fees_cents / 100,
    },
    {
      name: 'Admin Fees',
      amount: data.earnings_breakdown.admin_fees_cents / 100, // Negative value
    },
  ]

  // Format payment type breakdown for pie chart
  const paymentTypeData = [
    {
      name: 'Cash Payments',
      value: data.payment_type_breakdown.cash_revenue_cents / 100,
    },
    {
      name: 'Insurance Payments',
      value: data.payment_type_breakdown.insurance_revenue_cents / 100,
    },
  ]

  const COLORS = ['#0ea5e9', '#06b6d4', '#14b8a6', '#10b981', '#f59e0b']
  const PIE_COLORS = ['#0ea5e9', '#06b6d4']

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value)
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Total Earnings</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(data.total_earnings_cents / 100)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Completed</p>
            <p className="text-2xl font-bold text-green-600">{data.completed_appointments}</p>
            <p className="text-xs text-gray-500">of {data.total_appointments} total</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">No-Shows</p>
            <p className="text-2xl font-bold text-red-600">{data.no_show_count}</p>
            <p className="text-xs text-gray-500">
              Fees: {formatCurrency(data.earnings_breakdown.no_show_fees_cents / 100)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Cancelled</p>
            <p className="text-2xl font-bold text-yellow-600">{data.cancelled_count}</p>
            <p className="text-xs text-gray-500">
              Late fees: {formatCurrency(data.earnings_breakdown.late_cancel_fees_cents / 100)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Earnings Breakdown Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Earnings Breakdown</CardTitle>
          <p className="text-sm text-gray-600">Revenue by category</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={earningsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis tickFormatter={(value) => `$${value}`} />
              <Tooltip formatter={(value) => formatCurrency(value as number)} />
              <Bar dataKey="amount" fill="#0ea5e9" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Payment Type Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Payment Type Distribution</CardTitle>
            <p className="text-sm text-gray-600">Cash vs Insurance breakdown</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={paymentTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {paymentTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Type Totals</CardTitle>
            <p className="text-sm text-gray-600">GUARANTEE: Cash vs Insurance tracking</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <span className="font-medium text-gray-900">Cash Payments</span>
              <span className="text-lg font-bold text-blue-600">
                {formatCurrency(data.payment_type_breakdown.cash_revenue_cents / 100)}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-cyan-50 rounded-lg">
              <span className="font-medium text-gray-900">Insurance Payments</span>
              <span className="text-lg font-bold text-cyan-600">
                {formatCurrency(data.payment_type_breakdown.insurance_revenue_cents / 100)}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-teal-50 rounded-lg">
              <span className="font-medium text-gray-900">Insurance Top-Up</span>
              <span className="text-lg font-bold text-teal-600">
                {formatCurrency(data.earnings_breakdown.insurance_topup_cents / 100)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
