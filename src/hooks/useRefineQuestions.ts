import { useState } from "react";
import { useAppSelector } from "../store/hooks";
import type { QuizQuestion } from "../utils/types";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3000/api";

export function useRefineQuestions() {
  const token = useAppSelector((s) => s.auth.token);
  const [loading, setLoading] = useState(false);

  const fetchQuestions = async (story: string): Promise<QuizQuestion[]> => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/generate/text/refine-modal-questions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ story }),
        },
      );
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error ?? "Failed to generate questions");
      return data.questions as QuizQuestion[];
    } finally {
      setLoading(false);
    }
  };

  return { fetchQuestions, loading };
}
