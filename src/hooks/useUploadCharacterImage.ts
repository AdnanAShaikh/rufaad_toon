// hooks/useUploadCharacterImage.ts
import { useState } from "react";
import { useAppSelector } from "../store/hooks";
import type { Character } from "../store/slices/characterSlice";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3000/api";

// strip the "data:image/png;base64," prefix → raw base64
function fileToBase64(
  file: File,
): Promise<{ data: string; contentType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      resolve({ data: base64, contentType: file.type });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function useUploadCharacterImage(projectId: string) {
  const token = useAppSelector((s) => s.auth.token);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const upload = async (
    characterId: string,
    file: File,
  ): Promise<Character> => {
    setUploadingId(characterId);
    try {
      const { data, contentType } = await fileToBase64(file);
      const res = await fetch(
        `${API_BASE}/project/${projectId}/character/${characterId}/upload`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ data, contentType }),
        },
      );
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? "Upload failed");
      return result.character as Character;
    } finally {
      setUploadingId(null);
    }
  };

  return { upload, uploadingId };
}
