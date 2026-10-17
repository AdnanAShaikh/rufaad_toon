import { useState } from "react";
import { useAppSelector } from "../store/hooks";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3000/api";

export function useGenerateTitle() {
  const [loading, setLoading] = useState(false);
  const token = useAppSelector((s) => s.auth.token);

  const generate = async (description: string): Promise<string | null> => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/generate/text/project-title`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ description }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to generate title");
      return data.title as string;
    } finally {
      setLoading(false);
    }
  };

  return { generate, loading };
}
