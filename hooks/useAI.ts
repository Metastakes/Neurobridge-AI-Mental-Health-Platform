/**
 * React Query hooks for AI services
 */

import { useMutation } from '@tanstack/react-query';
import { aiApi } from '../services/api';

/**
 * Get AI medication suggestions
 */
export function useMedicationSuggestions() {
  return useMutation({
    mutationFn: ({
      patientId,
      proposedMedication,
    }: {
      patientId: string;
      proposedMedication: {
        name: string;
        dosage: string;
        category?: string;
      };
    }) => aiApi.getMedicationSuggestions(patientId, proposedMedication),
  });
}

/**
 * Get next best questions from AI
 */
export function useNextQuestions() {
  return useMutation({
    mutationFn: ({
      patientId,
      currentContext,
    }: {
      patientId: string;
      currentContext: string;
    }) => aiApi.getNextQuestions(patientId, currentContext),
  });
}

/**
 * Generate SOAP note
 */
export function useGenerateSOAPNote() {
  return useMutation({
    mutationFn: (encounterId: string) => aiApi.generateSOAPNote(encounterId),
  });
}
