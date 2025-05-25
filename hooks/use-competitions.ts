// Créer un hook personnalisé pour la gestion des compétitions

import { useState, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";

interface UseCompetitionsOptions {
  filters?: {
    country?: string;
    category?: string;
    status?: string;
    search?: string;
  };
  pagination?: {
    page?: number;
    limit?: number;
  };
}

export function useCompetitions(options: UseCompetitionsOptions = {}) {
  const { data: session } = useSession();
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);

  const fetchCompetitions = useCallback(async () => {
    if (!session) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      // Ajouter les filtres
      Object.entries(options.filters || {}).forEach(([key, value]) => {
        if (value && value !== "all") {
          params.append(key, value);
        }
      });

      // Ajouter la pagination
      if (options.pagination?.page) {
        params.append("page", options.pagination.page.toString());
      }
      if (options.pagination?.limit) {
        params.append("limit", options.pagination.limit.toString());
      }

      const url = `/api/competitions/public?${params.toString()}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Erreur lors du chargement");
      }

      const data = await response.json();
      setCompetitions(data.competitions || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [session, options.filters, options.pagination]);

  useEffect(() => {
    fetchCompetitions();
  }, [fetchCompetitions]);

  return {
    competitions,
    loading,
    error,
    total,
    refetch: fetchCompetitions,
  };
}
