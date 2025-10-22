/**
 * React Query hooks for gamification features
 * Handles achievements, points, events tracking
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gamificationApi } from '../services/api';
import type {
  PatientAchievement,
  GamificationEvent,
  TrackEventRequest,
  GamificationSummary
} from '../types/api.types';

/**
 * Fetch patient's achievements
 */
export function usePatientAchievements(patientId: string) {
  return useQuery({
    queryKey: ['achievements', patientId],
    queryFn: () => gamificationApi.getAchievements(patientId),
    enabled: !!patientId,
  });
}

/**
 * Fetch gamification summary (points, level, etc.)
 */
export function useGamificationSummary(patientId: string) {
  return useQuery<GamificationSummary>({
    queryKey: ['gamification-summary', patientId],
    queryFn: () => gamificationApi.getSummary(patientId),
    enabled: !!patientId,
    // Refresh every 30 seconds to keep points updated
    refetchInterval: 30000,
  });
}

/**
 * Track a gamification event (earns points)
 */
export function useTrackEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: TrackEventRequest) =>
      gamificationApi.trackEvent(request),
    onSuccess: (_, variables) => {
      // Invalidate gamification summary to refresh points
      queryClient.invalidateQueries({
        queryKey: ['gamification-summary', variables.patientId]
      });

      // Invalidate achievements in case new ones were unlocked
      queryClient.invalidateQueries({
        queryKey: ['achievements', variables.patientId]
      });
    },
  });
}

/**
 * Fetch all available achievements (catalog)
 */
export function useAchievementsCatalog() {
  return useQuery({
    queryKey: ['achievements-catalog'],
    queryFn: () => gamificationApi.getAchievementsCatalog(),
    // Cache for 5 minutes since catalog doesn't change often
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Helper hook to track common events with proper typing
 */
export function useTrackCommonEvents(patientId: string) {
  const trackEvent = useTrackEvent();

  return {
    trackSessionReview: () => trackEvent.mutate({
      patientId,
      eventType: 'SESSION_REVIEW',
      metadata: { timestamp: new Date().toISOString() },
    }),

    trackMedicationTaken: (medicationId: string) => trackEvent.mutate({
      patientId,
      eventType: 'MEDICATION_TAKEN',
      metadata: { medicationId },
    }),

    trackGoalCompleted: (goalId: string) => trackEvent.mutate({
      patientId,
      eventType: 'GOAL_COMPLETED',
      metadata: { goalId },
    }),

    trackSessionAttended: (sessionId: string) => trackEvent.mutate({
      patientId,
      eventType: 'SESSION_ATTENDED',
      metadata: { sessionId },
    }),

    trackCheckIn: () => trackEvent.mutate({
      patientId,
      eventType: 'DAILY_CHECK_IN',
      metadata: { timestamp: new Date().toISOString() },
    }),
  };
}
