'use client'

import React, { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { apiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || '')

interface PaymentFormProps {
  onSuccess: () => void
}

function PaymentForm({ onSuccess }: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!stripe || !elements) {
      return
    }

    setIsLoading(true)

    try {
      const cardElement = elements.getElement(CardElement)
      if (!cardElement) {
        throw new Error('Card element not found')
      }

      // Create payment method
      const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      })

      if (stripeError || !paymentMethod) {
        throw new Error(stripeError?.message || 'Failed to create payment method')
      }

      // Save payment method to backend
      await apiClient.updatePaymentMethod(paymentMethod.id)

      setSuccess(true)
      setTimeout(() => {
        onSuccess()
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'Failed to add payment method')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <Alert type="success" title="Success!">
        Payment method added successfully. You can now book appointments.
      </Alert>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <Alert type="error">{error}</Alert>}

      <div className="p-4 border border-gray-300 rounded-lg">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#9e2146',
              },
            },
          }}
        />
      </div>

      <Button type="submit" disabled={!stripe || isLoading} isLoading={isLoading} className="w-full">
        {isLoading ? 'Adding...' : 'Add Payment Method'}
      </Button>

      <p className="text-xs text-gray-500 text-center">
        Your payment information is securely processed by Stripe. We never store your card details.
      </p>
    </form>
  )
}

export function PaymentMethodForm({ onSuccess }: { onSuccess: () => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Payment Method</CardTitle>
        <p className="text-sm text-gray-600 mt-1">
          GUARANTEE: A valid payment method is required to book appointments
        </p>
      </CardHeader>
      <CardContent>
        <Elements stripe={stripePromise}>
          <PaymentForm onSuccess={onSuccess} />
        </Elements>
      </CardContent>
    </Card>
  )
}
