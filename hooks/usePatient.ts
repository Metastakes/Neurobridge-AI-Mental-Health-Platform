/**
 * React Query hooks for Patient data
 * Replace mock data with real API calls
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { patientsApi, medicationsApi, diagnosesApi } from '../services/api';

/**
 * Get patient by ID with full data
 */
export function usePatient(patientId: string) {
  return useQuery({
    queryKey: ['patient', patientId],
    queryFn: () => patientsApi.getById(patientId),
    enabled: !!patientId,
  });
}

/**
 * Get patient's medications
 */
export function usePatientMedications(patientId: string) {
  return useQuery({
    queryKey: ['medications', patientId],
    queryFn: () => medicationsApi.getByPatient(patientId),
    enabled: !!patientId,
  });
}

/**
 * Add medication
 */
export function useAddMedication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: medicationsApi.create,
    onSuccess: (_, variables) => {
      // Invalidate and refetch patient data
      queryClient.invalidateQueries({ queryKey: ['patient', variables.patientId] });
      queryClient.invalidateQueries({ queryKey: ['medications', variables.patientId] });
    },
  });
}

/**
 * Remove medication
 */
export function useRemoveMedication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: medicationsApi.remove,
    onSuccess: () => {
      // Invalidate all patient queries
      queryClient.invalidateQueries({ queryKey: ['patient'] });
      queryClient.invalidateQueries({ queryKey: ['medications'] });
    },
  });
}

/**
 * Update patient
 */
export function useUpdatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      patientsApi.update(id, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['patient', variables.id] });
    },
  });
}

/**
 * Get gamification summary
 */
export function useGamificationSummary(patientId: string) {
  return useQuery({
    queryKey: ['gamification', patientId],
    queryFn: () => patientsApi.getGamificationSummary(patientId),
    enabled: !!patientId,
  });
}
