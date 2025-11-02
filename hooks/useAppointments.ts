// hooks/useAppointments.ts
import { useState, useEffect, useCallback } from 'react';
import { appointmentApi } from '../utils/api';

export interface Appointment {
  id: number;
  patient_id: number;
  provider_id: number;
  patient_name: string;
  provider_name: string;
  appointment_type: string;
  scheduled_start: string;
  scheduled_end: string;
  status: string;
  google_calendar_event_id: string | null;
  notes: string | null;
  cancellation_reason: string | null;
}

interface UseAppointmentsResult {
  appointments: Appointment[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useAppointments(filters?: {
  patientId?: number;
  providerId?: number;
  status?: string;
  appointmentType?: string;
  startDate?: string;
  endDate?: string;
}): UseAppointmentsResult {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await appointmentApi.getAll(filters);

      if (response.data?.appointments) {
        setAppointments(response.data.appointments);
      } else if (response.error) {
        setError(response.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  }, [
    filters?.patientId,
    filters?.providerId,
    filters?.status,
    filters?.appointmentType,
    filters?.startDate,
    filters?.endDate,
  ]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  return {
    appointments,
    loading,
    error,
    refetch: fetchAppointments,
  };
}

export function useUpcomingAppointments(): UseAppointmentsResult {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await appointmentApi.getUpcoming();

      if (response.data?.appointments) {
        setAppointments(response.data.appointments);
      } else if (response.error) {
        setError(response.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch upcoming appointments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  return {
    appointments,
    loading,
    error,
    refetch: fetchAppointments,
  };
}

export function useAppointmentHistory(): UseAppointmentsResult {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await appointmentApi.getHistory();

      if (response.data?.appointments) {
        setAppointments(response.data.appointments);
      } else if (response.error) {
        setError(response.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch appointment history');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  return {
    appointments,
    loading,
    error,
    refetch: fetchAppointments,
  };
}

export async function bookAppointment(data: {
  providerId: number;
  appointmentType: string;
  scheduledStart: string;
  scheduledEnd: string;
  googleCalendarEventId?: string;
  notes?: string;
}): Promise<{ success: boolean; error?: string; appointment?: Appointment }> {
  try {
    const response = await appointmentApi.book(data);

    if (response.data?.appointment) {
      return { success: true, appointment: response.data.appointment };
    } else {
      return { success: false, error: response.error || 'Failed to book appointment' };
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to book appointment',
    };
  }
}

export async function cancelAppointment(
  appointmentId: number,
  cancellationReason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await appointmentApi.cancel(appointmentId, cancellationReason);

    if (response.data || !response.error) {
      return { success: true };
    } else {
      return { success: false, error: response.error || 'Failed to cancel appointment' };
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to cancel appointment',
    };
  }
}

export async function updateAppointmentStatus(
  appointmentId: number,
  status: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await appointmentApi.updateStatus(appointmentId, status);

    if (response.data || !response.error) {
      return { success: true };
    } else {
      return { success: false, error: response.error || 'Failed to update appointment status' };
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to update appointment status',
    };
  }
}
