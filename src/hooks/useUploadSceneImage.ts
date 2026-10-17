import { useState } from "react";
import { useAppSelector } from "../store/hooks";
import type { Scene } from "../store/slices/sceneSlice";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3000/api";

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

export function useUploadSceneImage(projectId: string) {
  const token = useAppSelector((s) => s.auth.token);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const upload = async (sceneId: string, file: File): Promise<Scene> => {
    setUploadingId(sceneId);
    try {
      const { data, contentType } = await fileToBase64(file);
      const res = await fetch(
        `${API_BASE}/project/${projectId}/scene/${sceneId}/upload`,
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
      return result.scene as Scene;
    } finally {
      setUploadingId(null);
    }
  };

  return { upload, uploadingId };
}
