// hooks/useNarrators.ts
import { useState, useEffect, useCallback } from "react";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3000/api";

export interface Narrator {
  id: string;
  name: string;
  slug: string;
  description: string;
  previewUrl: string | null;
  pack: boolean;
  gender: string | null;
  language: string;
}

export function useNarrators() {
  const [narrators, setNarrators] = useState<Narrator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/narrator`);
      const data = await res.json();
      if (res.ok && Array.isArray(data.narrators)) {
        setNarrators(data.narrators);
      } else {
        setError(data.error ?? "Failed to load narrators");
      }
    } catch (e) {
      console.error("Failed to load narrators", e);
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reload();
  }, [reload]);

  return { narrators, loading, error, reload };
}
