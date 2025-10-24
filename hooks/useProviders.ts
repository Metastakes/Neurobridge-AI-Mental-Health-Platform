// hooks/useProviders.ts
import { useState, useEffect, useCallback } from 'react';
import { providerApi } from '../utils/api';

export interface Provider {
  id: number;
  name: string;
  email: string;
  specialty: string | null;
  bio: string | null;
  years_of_experience: number | null;
  accepts_new_patients: boolean;
  hourly_rate: number | null;
  languages_spoken: string | null;
  education: string | null;
  certifications: string | null;
  license_number: string | null;
}

interface UseProvidersResult {
  providers: Provider[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useProviders(filters?: {
  specialty?: string;
  acceptsNewPatients?: boolean;
  search?: string;
}): UseProvidersResult {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await providerApi.getAll(filters);

      if (response.data?.providers) {
        setProviders(response.data.providers);
      } else if (response.error) {
        setError(response.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch providers');
    } finally {
      setLoading(false);
    }
  }, [filters?.specialty, filters?.acceptsNewPatients, filters?.search]);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  return {
    providers,
    loading,
    error,
    refetch: fetchProviders,
  };
}

export function useAvailableProviders(): UseProvidersResult {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await providerApi.getAvailable();

      if (response.data?.providers) {
        setProviders(response.data.providers);
      } else if (response.error) {
        setError(response.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch available providers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  return {
    providers,
    loading,
    error,
    refetch: fetchProviders,
  };
}

export function useProvider(id: number | null) {
  const [provider, setProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProvider = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await providerApi.getById(id);

      if (response.data?.provider) {
        setProvider(response.data.provider);
      } else if (response.error) {
        setError(response.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch provider');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProvider();
  }, [fetchProvider]);

  return {
    provider,
    loading,
    error,
    refetch: fetchProvider,
  };
}
