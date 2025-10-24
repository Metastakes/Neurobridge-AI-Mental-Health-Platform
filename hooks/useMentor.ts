// hooks/useMentor.ts
import { useState, useEffect, useCallback } from 'react';
import { mentorApi } from '../utils/api';

export interface Mentor {
  id: number;
  name: string;
  email: string;
  phone: string | null;
}

export interface Mentee {
  id: number;
  name: string;
  email: string;
  specialty: string | null;
  patient_count: number;
}

export interface MentorStatistics {
  total_mentees: number;
  total_patients_supervised: number;
  total_appointments_supervised: number;
  completed_appointments: number;
}

export interface MenteeDetails {
  mentee: {
    id: number;
    name: string;
    email: string;
    specialty: string | null;
    bio: string | null;
    license_number: string | null;
  };
  patients: Array<{
    id: number;
    name: string;
    email: string;
    diagnosis: string | null;
  }>;
  recent_appointments: Array<{
    id: number;
    appointment_type: string;
    scheduled_start: string;
    scheduled_end: string;
    status: string;
    patient_name: string;
  }>;
}

// Hook to get current mentor profile
export function useCurrentMentor() {
  const [mentor, setMentor] = useState<Mentor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMentor = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await mentorApi.getCurrent();

      if (response.data?.mentor) {
        setMentor(response.data.mentor);
      } else if (response.error) {
        setError(response.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch mentor data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMentor();
  }, [fetchMentor]);

  return {
    mentor,
    loading,
    error,
    refetch: fetchMentor,
  };
}

// Hook to get mentor's mentees
export function useMentees() {
  const [mentees, setMentees] = useState<Mentee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMentees = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await mentorApi.getMentees();

      if (response.data?.mentees) {
        setMentees(response.data.mentees);
      } else if (response.error) {
        setError(response.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch mentees');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMentees();
  }, [fetchMentees]);

  return {
    mentees,
    loading,
    error,
    refetch: fetchMentees,
  };
}

// Hook to get mentor statistics
export function useMentorStatistics() {
  const [statistics, setStatistics] = useState<MentorStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatistics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await mentorApi.getStatistics();

      if (response.data?.statistics) {
        setStatistics(response.data.statistics);
      } else if (response.error) {
        setError(response.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch statistics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  return {
    statistics,
    loading,
    error,
    refetch: fetchStatistics,
  };
}

// Hook to get detailed information about a specific mentee
export function useMenteeDetails(menteeId: number | null) {
  const [details, setDetails] = useState<MenteeDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetails = useCallback(async () => {
    if (!menteeId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await mentorApi.getMenteeDetails(menteeId);

      if (response.data) {
        setDetails(response.data);
      } else if (response.error) {
        setError(response.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch mentee details');
    } finally {
      setLoading(false);
    }
  }, [menteeId]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  return {
    details,
    loading,
    error,
    refetch: fetchDetails,
  };
}
