import { useState, useCallback } from "react";
import { useAppSelector } from "../store/hooks";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3000/api";
const STORAGE_KEY = "quickStoryIdeas";

type Idea = { emoji: string; text: string };

function readCache(): Idea[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function useQuickStoryIdeas(count = 6) {
  const token = useAppSelector((s) => s.auth.token);
  const [ideas, setIdeas] = useState<Idea[]>(readCache);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/generate/text/quick-story-ideas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ count }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to generate ideas");
      if (Array.isArray(data.ideas)) {
        setIdeas(data.ideas);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data.ideas));
        } catch {
          // storage unavailable — ideas still live in state
        }
      }
    } catch (e) {
      console.error("Failed to load ideas", e);
      throw e; // let the caller toast the reason
    } finally {
      setLoading(false);
    }
  }, [count, token]);

  return { ideas, loading, reload: load };
}
