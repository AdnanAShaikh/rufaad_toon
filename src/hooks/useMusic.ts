import { useState, useEffect, useCallback } from "react";
import { useAppSelector } from "../store/hooks";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3000/api";

export interface MusicTrack {
  id: string;
  title: string;
  url: string;
  mood: string | null;
  duration: number | null;
  userId: string | null; // null = global track
  createdAt: string;
}

// strip the "data:audio/mpeg;base64," prefix → raw base64
function fileToBase64(
  file: File,
): Promise<{ data: string; contentType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve({ data: result.split(",")[1], contentType: file.type });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function useMusic() {
  const token = useAppSelector((s) => s.auth.token);

  const [yours, setYours] = useState<MusicTrack[]>([]);
  const [library, setLibrary] = useState<MusicTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const authHeaders = useCallback(
    (): HeadersInit => ({
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }),
    [token],
  );

  // ---- Browse: fetch global + my tracks ----
  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/music`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      if (res.ok) {
        setYours(data.yours ?? []);
        setLibrary(data.library ?? []);
      } else {
        setError(data.error ?? "Failed to load music");
      }
    } catch (e) {
      console.error("Failed to load music", e);
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    reload();
  }, [reload]);

  // ---- Upload a track (user-scoped) ----
  const upload = useCallback(
    async (file: File, title: string, mood?: string): Promise<MusicTrack> => {
      setUploading(true);
      try {
        const { data, contentType } = await fileToBase64(file);
        const res = await fetch(`${API_BASE}/music/upload`, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ title, data, contentType, mood }),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error ?? "Upload failed");
        // prepend to "yours" so it shows immediately
        setYours((prev) => [result.track, ...prev]);
        return result.track as MusicTrack;
      } finally {
        setUploading(false);
      }
    },
    [authHeaders],
  );

  // ---- Delete a track (owner only) ----
  const remove = useCallback(
    async (id: string): Promise<void> => {
      const res = await fetch(`${API_BASE}/music/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? "Delete failed");
      setYours((prev) => prev.filter((t) => t.id !== id));
      setLibrary((prev) => prev.filter((t) => t.id !== id));
    },
    [authHeaders],
  );

  return {
    yours,
    library,
    loading,
    error,
    uploading,
    reload,
    upload,
    remove,
  };
}
