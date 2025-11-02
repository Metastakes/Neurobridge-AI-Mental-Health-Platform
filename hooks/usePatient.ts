// hooks/usePatient.ts
import { useState, useEffect, useCallback } from 'react';
import { patientApi } from '../utils/api';

export interface PatientData {
  id: number;
  user_id: number;
  email: string;
  name: string;
  phone: string | null;
  date_of_birth: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  insurance_provider: string | null;
  insurance_policy_number: string | null;
  medical_history: string | null;
  current_medications: string | null;
  allergies: string | null;
  provider_id: number | null;
  provider_name: string | null;
  provider_specialty: string | null;
}

interface UsePatientResult {
  patient: PatientData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updatePatient: (data: Partial<PatientData>) => Promise<{ success: boolean; error?: string }>;
}

export function useCurrentPatient(): UsePatientResult {
  const [patient, setPatient] = useState<PatientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPatient = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await patientApi.getCurrent();

      if (response.data?.patient) {
        setPatient(response.data.patient);
      } else if (response.error) {
        setError(response.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch patient data');
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePatient = useCallback(
    async (data: Partial<PatientData>) => {
      if (!patient) {
        return { success: false, error: 'No patient data available' };
      }

      try {
        const response = await patientApi.update(patient.id, data);

        if (response.data?.patient) {
          setPatient(response.data.patient);
          return { success: true };
        } else {
          return { success: false, error: response.error || 'Failed to update patient' };
        }
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Failed to update patient',
        };
      }
    },
    [patient]
  );

  useEffect(() => {
    fetchPatient();
  }, [fetchPatient]);

  return {
    patient,
    loading,
    error,
    refetch: fetchPatient,
    updatePatient,
  };
}

export function usePatient(patientId: number | null): UsePatientResult {
  const [patient, setPatient] = useState<PatientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPatient = useCallback(async () => {
    if (!patientId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await patientApi.getById(patientId);

      if (response.data?.patient) {
        setPatient(response.data.patient);
      } else if (response.error) {
        setError(response.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch patient data');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  const updatePatient = useCallback(
    async (data: Partial<PatientData>) => {
      if (!patientId) {
        return { success: false, error: 'No patient ID available' };
      }

      try {
        const response = await patientApi.update(patientId, data);

        if (response.data?.patient) {
          setPatient(response.data.patient);
          return { success: true };
        } else {
          return { success: false, error: response.error || 'Failed to update patient' };
        }
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Failed to update patient',
        };
      }
    },
    [patientId]
  );

  useEffect(() => {
    fetchPatient();
  }, [fetchPatient]);

  return {
    patient,
    loading,
    error,
    refetch: fetchPatient,
    updatePatient,
  };
}

export interface Medication {
  id: number;
  medication_name: string;
  dosage: string | null;
  frequency: string | null;
  provider_name: string | null;
  start_date: string;
  end_date: string | null;
  notes: string | null;
}

export function usePatientMedications(patientId: number | null) {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMedications = useCallback(async () => {
    if (!patientId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await patientApi.getMedications(patientId);

      if (response.data?.medications) {
        setMedications(response.data.medications);
      } else if (response.error) {
        setError(response.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch medications');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchMedications();
  }, [fetchMedications]);

  return {
    medications,
    loading,
    error,
    refetch: fetchMedications,
  };
}

export interface SessionNote {
  id: number;
  provider_name: string;
  note_type: string;
  session_date: string;
  duration_minutes: number | null;
  chief_complaint: string | null;
  assessment: string | null;
  plan: string | null;
  notes: string | null;
}

export function usePatientNotes(
  patientId: number | null,
  filters?: {
    providerId?: number;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }
) {
  const [notes, setNotes] = useState<SessionNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotes = useCallback(async () => {
    if (!patientId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await patientApi.getNotes(patientId, filters);

      if (response.data?.sessionNotes) {
        setNotes(response.data.sessionNotes);
      } else if (response.error) {
        setError(response.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch session notes');
    } finally {
      setLoading(false);
    }
  }, [patientId, filters?.providerId, filters?.startDate, filters?.endDate, filters?.limit]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  return {
    notes,
    loading,
    error,
    refetch: fetchNotes,
  };
}
