'use client';

import { useState, useEffect } from 'react';
import { Subscription, PremiumToggleState } from '@/types';
import Link from 'next/link';

interface PremiumFeatureToggleProps {
  subscription: Subscription | null;
  className?: string;
}

export default function PremiumFeatureToggle({ subscription, className = '' }: PremiumFeatureToggleProps) {
  const [toggleState, setToggleState] = useState<PremiumToggleState>('basic');
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!subscription) {
      setToggleState('basic');
      return;
    }

    const { status, trial_end_date, grace_period_end, canceled_at, current_period_end } = subscription;

    if (status === 'trial' && trial_end_date) {
      const trialEnd = new Date(trial_end_date);
      const now = new Date();
      const days = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (days > 0) {
        setToggleState('trial');
        setDaysRemaining(days);
      } else {
        setToggleState('basic');
      }
    } else if (status === 'active') {
      setToggleState('active');
      setDaysRemaining(null);
    } else if (status === 'past_due' && grace_period_end) {
      const graceEnd = new Date(grace_period_end);
      const now = new Date();
      const days = Math.ceil((graceEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (days > 0) {
        setToggleState('payment_failed');
        setDaysRemaining(days);
      } else {
        setToggleState('basic');
      }
    } else if (status === 'canceled' && canceled_at && current_period_end) {
      const periodEnd = new Date(current_period_end);
      const now = new Date();

      if (now < periodEnd) {
        setToggleState('canceled');
        const days = Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        setDaysRemaining(days);
      } else {
        setToggleState('basic');
      }
    } else {
      setToggleState('basic');
    }
  }, [subscription]);

  const getTierName = (): string => {
    if (!subscription?.tier) return 'Basic';
    return subscription.tier.name;
  };

  const renderToggle = () => {
    switch (toggleState) {
      case 'basic':
        return (
          <Link href="/subscription/upgrade" className={`inline-flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors ${className}`}>
            <span className="text-sm font-medium">Basic</span>
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </Link>
        );

      case 'trial':
        return (
          <Link href="/subscription/manage" className={`inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors border-2 border-blue-300 ${className}`}>
            <div className="flex flex-col items-start">
              <span className="text-sm font-semibold">{getTierName()} Trial</span>
              <span className="text-xs">{daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} remaining</span>
            </div>
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </Link>
        );

      case 'active':
        return (
          <Link href="/subscription/manage" className={`inline-flex items-center px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors border-2 border-green-300 ${className}`}>
            <span className="text-sm font-semibold">{getTierName()}</span>
            <svg className="w-4 h-4 ml-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </Link>
        );

      case 'payment_failed':
        return (
          <Link href="/subscription/update-payment" className={`inline-flex items-center px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors border-2 border-yellow-400 ${className}`}>
            <div className="flex flex-col items-start">
              <span className="text-sm font-semibold">Payment Failed</span>
              <span className="text-xs">{daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} grace period</span>
            </div>
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </Link>
        );

      case 'canceled':
        return (
          <Link href="/subscription/reactivate" className={`inline-flex items-center px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors border-2 border-red-300 ${className}`}>
            <div className="flex flex-col items-start">
              <span className="text-sm font-semibold">{getTierName()} (Canceled)</span>
              <span className="text-xs">Access ends in {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}</span>
            </div>
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Link>
        );

      default:
        return null;
    }
  };

  return renderToggle();
}
