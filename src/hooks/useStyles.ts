// hooks/useStyles.ts
import { useState, useEffect } from "react";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3000/api";

export interface AnimationStyle {
  id: string;
  name: string;
  slug: string;
  category: string;
  pro: boolean;
  imageUrl: string | null;
  gradient: string | null;
}

export interface StyleFilter {
  name: string;
  count: number;
}

export function useStyles() {
  const [styles, setStyles] = useState<AnimationStyle[]>([]);
  const [filters, setFilters] = useState<StyleFilter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/style`);
        const data = await res.json();
        if (!cancelled && res.ok) {
          setStyles(data.styles);
          setFilters(data.filters);
        }
      } catch (e) {
        console.error("Failed to load styles", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { styles, filters, styleLoading: loading };
}
