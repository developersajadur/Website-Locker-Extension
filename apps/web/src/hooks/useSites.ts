import { useState, useCallback } from 'react';
import type { Site } from '@/types';
import { sitesApi } from '@/services/sites.service';
import { getErrorMessage } from '@/lib/utils';

export function useSites() {
  const [sites, setSites] = useState<Site[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSites = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await sitesApi.getAll();
      setSites(res.data.data?.sites ?? []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addSite = useCallback(async (url: string, label?: string) => {
    const res = await sitesApi.create(url, label);
    const newSite = res.data.data?.site;
    if (newSite) {
      setSites((prev) => [newSite, ...prev]);
    }
    return newSite;
  }, []);

  const deleteSite = useCallback(async (id: string) => {
    await sitesApi.delete(id);
    setSites((prev) => prev.filter((s) => s.id !== id));
  }, []);

  return { sites, isLoading, error, fetchSites, addSite, deleteSite };
}
