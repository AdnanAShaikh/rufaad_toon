import { useState } from "react";
import { useAppSelector } from "../store/hooks";
import type { Character } from "../store/slices/characterSlice";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3000/api";

export function useGenerateCharacterImage() {
  const token = useAppSelector((s) => s.auth.token);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const generate = async (characterId: string): Promise<Character> => {
    setLoadingId(characterId);
    try {
      const res = await fetch(
        `${API_BASE}/generate/image/character/${characterId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to generate image");
      return data.character as Character;
    } finally {
      setLoadingId(null);
    }
  };

  return { generate, loadingId };
}
