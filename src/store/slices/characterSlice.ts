import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";

// Project-scoped character (a copy; independent after creation)
export interface Character {
  id: string;
  name: string;
  imagePrompt: string;
  imageUrl: string | null;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

interface CharacterState {
  items: Character[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: CharacterState = {
  items: [],
  status: "idle",
  error: null,
};

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3000/api";

const authHeaders = (getState: () => unknown) => {
  const token = (getState() as RootState).auth.token;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// ---- Create (dual write: project character + library pool entry) ----
interface CreatePayload {
  projectId: string;
  name: string;
  imagePrompt: string;
  imageUrl?: string;
}

export const createCharacter = createAsyncThunk<
  Character,
  CreatePayload,
  { state: RootState }
>(
  "characters/create",
  async ({ projectId, ...body }, { getState, rejectWithValue }) => {
    const res = await fetch(`${API_BASE}/project/${projectId}/character`, {
      method: "POST",
      headers: authHeaders(getState),
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok)
      return rejectWithValue(data.error ?? "Failed to create character");
    return data.character as Character;
  },
);

// ---- Import a library character into this project (copy) ----
interface ImportPayload {
  projectId: string;
  libraryCharacterId: string;
}

export const importCharacter = createAsyncThunk<
  Character,
  ImportPayload,
  { state: RootState }
>(
  "characters/import",
  async ({ projectId, libraryCharacterId }, { getState, rejectWithValue }) => {
    const res = await fetch(
      `${API_BASE}/project/${projectId}/character/import`,
      {
        method: "POST",
        headers: authHeaders(getState),
        body: JSON.stringify({ libraryCharacterId }),
      },
    );
    const data = await res.json();
    if (!res.ok)
      return rejectWithValue(data.error ?? "Failed to import character");
    return data.character as Character;
  },
);

// ---- Update image prompt only (project copy) ----
interface UpdatePayload {
  projectId: string;
  id: string;
  imagePrompt: string;
}

export const updateCharacter = createAsyncThunk<
  Character,
  UpdatePayload,
  { state: RootState }
>(
  "characters/update",
  async ({ projectId, id, imagePrompt }, { getState, rejectWithValue }) => {
    const res = await fetch(
      `${API_BASE}/project/${projectId}/character/${id}`,
      {
        method: "PATCH",
        headers: authHeaders(getState),
        body: JSON.stringify({ imagePrompt }),
      },
    );
    const data = await res.json();
    if (!res.ok)
      return rejectWithValue(data.error ?? "Failed to update character");
    return data.character as Character;
  },
);

// ---- Delete (project-scoped only; library entry untouched) ----
interface DeletePayload {
  projectId: string;
  id: string;
}

export const deleteCharacter = createAsyncThunk<
  string,
  DeletePayload,
  { state: RootState }
>(
  "characters/delete",
  async ({ projectId, id }, { getState, rejectWithValue }) => {
    const res = await fetch(
      `${API_BASE}/project/${projectId}/character/${id}`,
      {
        method: "DELETE",
        headers: authHeaders(getState),
      },
    );
    const data = await res.json();
    if (!res.ok)
      return rejectWithValue(data.error ?? "Failed to delete character");
    return data.id as string;
  },
);

const characterSlice = createSlice({
  name: "characters",
  initialState,
  reducers: {
    // Seed from a loaded project's characters (fetchProjectById result)
    setCharacters(state, action: PayloadAction<Character[]>) {
      state.items = action.payload;
      state.status = "succeeded";
    },
    clearCharacters(state) {
      state.items = [];
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createCharacter.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(importCharacter.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(updateCharacter.fulfilled, (state, action) => {
        const i = state.items.findIndex((c) => c.id === action.payload.id);
        if (i !== -1) state.items[i] = action.payload;
      })
      .addCase(deleteCharacter.fulfilled, (state, action) => {
        state.items = state.items.filter((c) => c.id !== action.payload);
      })
      // shared pending/rejected across the mutating thunks
      .addMatcher(
        (a) => a.type.startsWith("characters/") && a.type.endsWith("/pending"),
        (state) => {
          state.status = "loading";
          state.error = null;
        },
      )
      .addMatcher(
        (a) => a.type.startsWith("characters/") && a.type.endsWith("/rejected"),
        (state, action: PayloadAction<unknown>) => {
          state.status = "failed";
          state.error =
            (action.payload as string) ?? "Character request failed";
        },
      )
      .addMatcher(
        (a) =>
          a.type.startsWith("characters/") && a.type.endsWith("/fulfilled"),
        (state) => {
          state.status = "succeeded";
        },
      );
  },
});

export const { setCharacters, clearCharacters } = characterSlice.actions;
export default characterSlice.reducer;
