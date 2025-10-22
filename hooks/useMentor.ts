/**
 * React Query hooks for mentor features
 * Handles mentor data, mentees (providers), and provider assignments
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mentorsApi } from '../services/api';

/**
 * Fetch mentor by ID with full data
 */
export function useMentor(mentorId: string) {
  return useQuery({
    queryKey: ['mentor', mentorId],
    queryFn: () => mentorsApi.getById(mentorId),
    enabled: !!mentorId,
  });
}

/**
 * Fetch mentor's assigned providers (mentees)
 */
export function useMentorMentees(mentorId: string) {
  return useQuery({
    queryKey: ['mentor-mentees', mentorId],
    queryFn: () => mentorsApi.getMentees(mentorId),
    enabled: !!mentorId,
  });
}

/**
 * Fetch mentor summary with stats
 */
export function useMentorSummary(mentorId: string) {
  return useQuery({
    queryKey: ['mentor-summary', mentorId],
    queryFn: () => mentorsApi.getSummary(mentorId),
    enabled: !!mentorId,
  });
}

/**
 * Assign a provider to this mentor
 */
export function useAssignProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ mentorId, providerId }: { mentorId: string; providerId: string }) =>
      mentorsApi.assignProvider(mentorId, providerId),
    onSuccess: (_, variables) => {
      // Invalidate mentor data to refresh mentee list
      queryClient.invalidateQueries({
        queryKey: ['mentor', variables.mentorId]
      });
      queryClient.invalidateQueries({
        queryKey: ['mentor-mentees', variables.mentorId]
      });
      queryClient.invalidateQueries({
        queryKey: ['mentor-summary', variables.mentorId]
      });
    },
  });
}

/**
 * Unassign a provider from this mentor
 */
export function useUnassignProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ mentorId, providerId }: { mentorId: string; providerId: string }) =>
      mentorsApi.unassignProvider(mentorId, providerId),
    onSuccess: (_, variables) => {
      // Invalidate mentor data to refresh mentee list
      queryClient.invalidateQueries({
        queryKey: ['mentor', variables.mentorId]
      });
      queryClient.invalidateQueries({
        queryKey: ['mentor-mentees', variables.mentorId]
      });
      queryClient.invalidateQueries({
        queryKey: ['mentor-summary', variables.mentorId]
      });
    },
  });
}

/**
 * Update mentor profile
 */
export function useUpdateMentor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ mentorId, data }: { mentorId: string; data: any }) =>
      mentorsApi.update(mentorId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['mentor', variables.mentorId]
      });
    },
  });
}
