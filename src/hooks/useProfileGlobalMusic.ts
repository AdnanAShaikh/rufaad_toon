import { useState, useEffect, useCallback } from "react";
import { useAppSelector } from "../store/hooks";
import type { MusicTrack } from "./useProfileMusic";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3000/api";

export function useProfileGlobalMusic() {
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
        setTracks(data.library ?? []); // global tracks (admin sees archived too)
      else setError(data.error ?? "Failed to load global music");
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [headers]);

  useEffect(() => {
    reload();
  }, [reload]);

  const checkUsage = useCallback(
    async (id: string): Promise<{ count: number }> => {
      const res = await fetch(`${API_BASE}/music/usage/${id}`, {
        headers: headers(),
      });
      const data = await res.json();
      if (!res.ok) return { count: 0 };
      return { count: data.count ?? 0 };
    },
    [headers],
  );

  const archive = useCallback(
    async (id: string, active: boolean) => {
      const res = await fetch(`${API_BASE}/music/${id}/archive`, {
        method: "PATCH",
        headers: headers(),
        body: JSON.stringify({ active }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update track");
      setTracks((prev) => prev.map((t) => (t.id === id ? data.track : t)));
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

  return { tracks, loading, error, reload, checkUsage, archive, remove };
}
