import { useState, useEffect, useCallback } from "react";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { setCredentials } from "../store/slices/authSlice";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3000/api";

export interface Profile {
  id: string;
  email: string;
  name: string | null;
  imageUrl: string | null;
  role: string;
  credits?: number | null;
}

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

export function useProfile() {
  const token = useAppSelector((s) => s.auth.token);
  const authUser = useAppSelector((s) => s.auth.user);
  const dispatch = useAppDispatch();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const authHeaders = useCallback(
    (): HeadersInit => ({
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }),
    [token],
  );

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/user/me`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      if (res.ok) setProfile(data.user);
      else setError(data.error ?? "Failed to load profile");
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    reload();
  }, [reload]);

  // Keep the persisted auth user in sync so the dashboard/nav reflect changes.
  const syncAuthUser = useCallback(
    (updated: Profile) => {
      if (token && authUser) {
        dispatch(
          setCredentials({
            token,
            user: {
              id: updated.id,
              email: updated.email,
              name: updated.name,
            },
          }),
        );
      }
    },
    [dispatch, token, authUser],
  );

  const updateName = useCallback(
    async (name: string) => {
      setSaving(true);
      try {
        const res = await fetch(`${API_BASE}/user/me`, {
          method: "PATCH",
          headers: authHeaders(),
          body: JSON.stringify({ name }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to update name");
        setProfile(data.user);
        syncAuthUser(data.user);
      } finally {
        setSaving(false);
      }
    },
    [authHeaders, syncAuthUser],
  );

  const updateAvatar = useCallback(
    async (file: File) => {
      setSaving(true);
      try {
        const { data: b64, contentType } = await fileToBase64(file);
        const res = await fetch(`${API_BASE}/user/me/avatar`, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ data: b64, contentType }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to update avatar");
        setProfile(data.user);
        syncAuthUser(data.user);
      } finally {
        setSaving(false);
      }
    },
    [authHeaders, syncAuthUser],
  );

  return { profile, loading, error, saving, reload, updateName, updateAvatar };
}
