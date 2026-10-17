import { useState, useEffect, useCallback } from "react";
import { useAppSelector } from "../store/hooks";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3000/api";

export interface MusicTrack {
  id: string;
  title: string;
  url: string;
  mood: string | null;
  active: boolean;
  userId: string | null;
  createdAt: string;
}

export function useProfileMusic() {
  const token = useAppSelector((s) => s.auth.token);
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const headers = useCallback(
    (): HeadersInit => ({
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }),
    [token],
  );

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/music`, { headers: headers() });
      const data = await res.json();
      if (res.ok)
        setTracks(data.yours ?? []); // only the user's own tracks
      else setError(data.error ?? "Failed to load music");
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [headers]);

  useEffect(() => {
    reload();
  }, [reload]);

  // Info-note for the delete confirm: how many of the user's projects use this.
  const checkUsage = useCallback(
    async (
      id: string,
    ): Promise<{ count: number; exampleTitle: string | null }> => {
      const res = await fetch(`${API_BASE}/music/usage/${id}`, {
        headers: headers(),
      });
      const data = await res.json();
      if (!res.ok) return { count: 0, exampleTitle: null };
      return {
        count: data.count ?? 0,
        exampleTitle: data.exampleTitle ?? null,
      };
    },
    [headers],
  );

  const remove = useCallback(
    async (id: string) => {
      const res = await fetch(`${API_BASE}/music/${id}`, {
        method: "DELETE",
        headers: headers(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to delete track");
      setTracks((prev) => prev.filter((t) => t.id !== id));
    },
    [headers],
  );

  return { tracks, loading, error, reload, checkUsage, remove };
}
