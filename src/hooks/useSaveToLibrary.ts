import { useState } from "react";
import { useAppSelector } from "../store/hooks";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3000/api";

export function useSaveToLibrary(projectId: string) {
  const token = useAppSelector((s) => s.auth.token);
  const [savingId, setSavingId] = useState<string | null>(null);

  const save = async (characterId: string): Promise<void> => {
    setSavingId(characterId);
    try {
      const res = await fetch(
        `${API_BASE}/project/${projectId}/character/${characterId}/save-to-library`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save to library");
    } finally {
      setSavingId(null);
    }
  };

  return { save, savingId };
}
