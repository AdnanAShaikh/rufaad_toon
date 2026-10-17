import { useState } from "react";
import { useAppSelector } from "../store/hooks";
import type { Scene } from "../store/slices/sceneSlice";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3000/api";

export function useGenerateSceneImage() {
  const token = useAppSelector((s) => s.auth.token);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const generate = async (sceneId: string): Promise<Scene> => {
    setLoadingId(sceneId);
    try {
      const res = await fetch(`${API_BASE}/generate/image/scene/${sceneId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to generate image");
      return data.scene as Scene;
    } finally {
      setLoadingId(null);
    }
  };

  return { generate, loadingId };
}
