'use client';

import { useState } from 'react';
import { SubscriptionTier, Subscription, PaymentMethod } from '@/types';

interface SubscriptionManagerProps {
  tiers: SubscriptionTier[];
  currentSubscription: Subscription | null;
  paymentMethods: PaymentMethod[];
}

export default function SubscriptionManager({
  tiers,
  currentSubscription,
  paymentMethods
}: SubscriptionManagerProps) {
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = async (tierName: string) => {
    setLoading(true);
    setError(null);

    try {
      // Check if payment method exists
      if (!paymentMethods.length) {
        // Redirect to add payment method
        window.location.href = '/subscription/add-payment';
        return;
      }

      const response = await fetch('/api/subscription/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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

      // Success - reload page
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTrial = async (tierName: string) => {
    setLoading(true);
    setError(null);

    try {
      // Check if payment method exists
      if (!paymentMethods.length) {
        // Redirect to add payment method
        window.location.href = `/subscription/add-payment?trial=${tierName}`;
        return;
      }

      const response = await fetch('/api/subscription/start-trial', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tier_name: tierName
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Failed to start trial');
      }

      // Success - reload page
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will retain access until the end of your billing period.')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      window.location.reload();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentTierName = () => {
    return currentSubscription?.tier?.name || 'Basic';
  };

  const getPrice = (tier: SubscriptionTier) => {
    return billingCycle === 'monthly' ? tier.price_monthly : tier.price_yearly;
  };

  const getSavingsPercentage = (tier: SubscriptionTier) => {
    const monthlyTotal = tier.price_monthly * 12;
    const yearlySavings = monthlyTotal - tier.price_yearly;
    return Math.round((yearlySavings / monthlyTotal) * 100);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Choose Your Plan
        </h1>
        <p className="text-xl text-gray-600">
          Upgrade your clinical training with premium features
        </p>

        {/* Billing Cycle Toggle */}
        <div className="mt-8 flex justify-center items-center gap-4">
          <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-gray-900' : 'text-gray-500'}`}>
            Monthly
          </span>
          <button
            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              billingCycle === 'yearly' ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className={`text-sm font-medium ${billingCycle === 'yearly' ? 'text-gray-900' : 'text-gray-500'}`}>
            Yearly
          </span>
          {billingCycle === 'yearly' && (
            <span className="ml-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Save up to 17%
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {tiers.map((tier) => {
          const isCurrent = tier.name === getCurrentTierName();
          const price = getPrice(tier);
          const isBasic = tier.name === 'Basic';
          const hasTrial = tier.trial_days > 0;

          return (
            <div
              key={tier.id}
              className={`relative rounded-2xl p-8 ${
                tier.name === 'Pro'
                  ? 'border-2 border-blue-500 shadow-xl'
                  : 'border border-gray-200 shadow-lg'
              }`}
            >
              {tier.name === 'Pro' && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <span className="inline-flex items-center px-4 py-1 rounded-full text-sm font-medium bg-blue-500 text-white">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{tier.display_name}</h3>
                <div className="mt-4">
                  <span className="text-5xl font-bold text-gray-900">${price}</span>
                  {!isBasic && (
                    <span className="text-gray-500 ml-2">
                      / {billingCycle === 'monthly' ? 'month' : 'year'}
                    </span>
                  )}
                </div>
                {billingCycle === 'yearly' && !isBasic && (
                  <p className="mt-2 text-sm text-green-600">
                    Save {getSavingsPercentage(tier)}%
                  </p>
                )}
              </div>

              {/* Features List */}
              <ul className="space-y-4 mb-8">
                {tier.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700 text-sm">{getFeatureName(feature)}</span>
                  </li>
                ))}
              </ul>

              {/* Action Button */}
              {isCurrent ? (
                <button
                  disabled
                  className="w-full py-3 px-4 rounded-lg bg-gray-100 text-gray-500 font-medium cursor-not-allowed"
                >
                  Current Plan
                </button>
              ) : isBasic ? (
                <button
                  disabled
                  className="w-full py-3 px-4 rounded-lg bg-gray-100 text-gray-500 font-medium cursor-not-allowed"
                >
                  Free Forever
                </button>
              ) : currentSubscription?.status === 'trial' || currentSubscription?.status === 'active' ? (
                <button
                  onClick={() => handleUpgrade(tier.name)}
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Upgrade'}
                </button>
              ) : hasTrial ? (
                <button
                  onClick={() => handleStartTrial(tier.name)}
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Processing...' : `Start ${tier.trial_days}-Day Free Trial`}
                </button>
              ) : (
                <button
                  onClick={() => handleUpgrade(tier.name)}
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Subscribe'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Cancel Subscription */}
      {currentSubscription && currentSubscription.status !== 'canceled' && currentSubscription.tier?.name !== 'Basic' && (
        <div className="mt-12 text-center">
          <button
            onClick={handleCancelSubscription}
            disabled={loading}
            className="text-red-600 hover:text-red-700 text-sm font-medium"
          >
            Cancel Subscription
          </button>
        </div>
      )}
    </div>
  );
}

function getFeatureName(feature: string): string {
  const featureNames: Record<string, string> = {
    'core_features': 'Real-time AI session assistant',
    'basic_gamification': 'XP, levels, and badges',
    'learning_pathways': 'Personalized Learning Pathways',
    'advanced_analytics': 'Advanced Analytics Dashboard',
    'research_hub': 'Research Hub & Clinical Intelligence',
    'clinical_challenges': 'Clinical Excellence Challenges'
  };

  return featureNames[feature] || feature;
}
