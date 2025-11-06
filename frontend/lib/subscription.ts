/**
 * Subscription API utilities
 * Client-side functions for managing subscriptions
 */

import { SubscriptionTier, Subscription, PaymentMethod, FeatureAccess } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Get all subscription tiers
 */
export async function getSubscriptionTiers(): Promise<SubscriptionTier[]> {
  const response = await fetch(`${API_URL}/api/subscription/tiers`);

  if (!response.ok) {
    throw new Error('Failed to fetch subscription tiers');
  }

  const data = await response.json();
  return data.tiers;
}

/**
 * Get user's current subscription
 */
export async function getCurrentSubscription(userId: string): Promise<Subscription | null> {
  // This would typically call Supabase directly
  // For now, return null - implement with Supabase client
  return null;
}

/**
 * Verify payment method with $1 authorization
 */
export async function verifyPaymentMethod(
  userId: string,
  paymentMethodId: string
): Promise<boolean> {
  const response = await fetch(`${API_URL}/api/subscription/verify-payment-method`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-ID': userId
    },
    body: JSON.stringify({ payment_method_id: paymentMethodId })
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || 'Failed to verify payment method');
  }

  return true;
}

/**
 * Start a trial subscription
 */
export async function startTrial(
  userId: string,
  tierName: string
): Promise<{ subscription_id: string; status: string; trial_end: string }> {
  const response = await fetch(`${API_URL}/api/subscription/start-trial`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-ID': userId
    },
    body: JSON.stringify({ tier_name: tierName })
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || 'Failed to start trial');
  }

  return response.json();
}

/**
 * Upgrade subscription to a new tier
 */
export async function upgradeSubscription(
  userId: string,
  tierName: string,
  billingCycle: 'monthly' | 'yearly' = 'monthly'
): Promise<{ subscription_id: string; status: string; tier: string }> {
  const response = await fetch(`${API_URL}/api/subscription/upgrade`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-ID': userId
    },
    body: JSON.stringify({
      tier_name: tierName,
      billing_cycle: billingCycle
    })
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || 'Failed to upgrade subscription');
  }

  return response.json();
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(
  userId: string,
  immediate: boolean = false
): Promise<boolean> {
  const response = await fetch(`${API_URL}/api/subscription/cancel?immediate=${immediate}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-ID': userId
    }
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || 'Failed to cancel subscription');
  }

  return true;
}

/**
 * Check if user has access to a premium feature
 */
export async function checkFeatureAccess(
  userId: string,
  featureName: string
): Promise<FeatureAccess> {
  const response = await fetch(`${API_URL}/api/subscription/check-feature-access`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-ID': userId
    },
    body: JSON.stringify({ feature_name: featureName })
  });

  if (!response.ok) {
    throw new Error('Failed to check feature access');
  }

  return response.json();
}

/**
 * Client-side feature gate hook
 * Returns whether user has access and provides upgrade prompt if not
 */
export function useFeatureAccess(featureName: string) {
  // TODO: Implement with React hooks
  // This would check subscription status and return:
  // - hasAccess: boolean
  // - showUpgradePrompt: () => void
  // - isLoading: boolean
}

/**
 * Format price for display
 */
export function formatPrice(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0
  }).format(amount);
}

/**
 * Calculate days remaining in trial or subscription
 */
export function calculateDaysRemaining(endDate: string): number {
  const end = new Date(endDate);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Get subscription status display text
 */
export function getSubscriptionStatusText(subscription: Subscription | null): string {
  if (!subscription) return 'Basic (Free)';

  const { status, tier } = subscription;

  if (status === 'trial') {
    return `${tier?.name} Trial`;
  } else if (status === 'active') {
    return tier?.name || 'Active';
  } else if (status === 'past_due') {
    return 'Payment Failed';
  } else if (status === 'canceled') {
    return `${tier?.name} (Canceled)`;
  } else {
    return 'Expired';
  }
}

/**
 * Get subscription status color class
 */
export function getSubscriptionStatusColor(subscription: Subscription | null): string {
  if (!subscription) return 'gray';

  const { status } = subscription;

  switch (status) {
    case 'trial':
      return 'blue';
    case 'active':
      return 'green';
    case 'past_due':
      return 'yellow';
    case 'canceled':
      return 'red';
    default:
      return 'gray';
  }
}
