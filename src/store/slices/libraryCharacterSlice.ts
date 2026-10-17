import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";

// Reusable per-user character pool entry
export interface LibraryCharacter {
  id: string;
  name: string;
  imagePrompt: string;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  sourceProjectTitle?: string | null;
  aspectRatio?: string | null;
}

interface LibraryCharacterState {
  items: LibraryCharacter[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: LibraryCharacterState = {
  items: [],
  status: "idle",
  error: null,
};

// ---- Update a pool entry ----
interface UpdatePayload {
  id: string;
  name?: string;
  imagePrompt?: string;
  imageUrl?: string | null;
}

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3000/api";

const authHeaders = (getState: () => unknown) => {
  const token = (getState() as RootState).auth.token;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// ---- List the user's pool (for the import picker) ----
export const fetchLibraryCharacters = createAsyncThunk<
  LibraryCharacter[],
  void,
  { state: RootState }
>("libraryCharacters/fetch", async (_, { getState, rejectWithValue }) => {
  const res = await fetch(`${API_BASE}/library-character`, {
    headers: authHeaders(getState),
  });
  const data = await res.json();
  if (!res.ok)
    return rejectWithValue(data.error ?? "Failed to load library characters");
  return data.libraryCharacters as LibraryCharacter[];
});

export const createLibraryCharacter = createAsyncThunk<
  LibraryCharacter,
  {
    name: string;
    imagePrompt: string;
    imageUrl?: string | null;
    aspectRatio: string;
  },
  { state: RootState }
>("libraryCharacters/create", async (body, { getState, rejectWithValue }) => {
  const res = await fetch(`${API_BASE}/library-character`, {
    method: "POST",
    headers: authHeaders(getState),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok)
    return rejectWithValue(data.error ?? "Failed to create library character");
  return data.libraryCharacter as LibraryCharacter;
});

export const updateLibraryCharacter = createAsyncThunk<
  LibraryCharacter,
  UpdatePayload,
  { state: RootState }
>(
  "libraryCharacters/update",
  async ({ id, ...body }, { getState, rejectWithValue }) => {
    const res = await fetch(`${API_BASE}/library-character/${id}`, {
      method: "PATCH",
      headers: authHeaders(getState),
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok)
      return rejectWithValue(
        data.error ?? "Failed to update library character",
      );
    return data.libraryCharacter as LibraryCharacter;
  },
);

// ---- Delete a pool entry ----
export const deleteLibraryCharacter = createAsyncThunk<
  string,
  string,
  { state: RootState }
>("libraryCharacters/delete", async (id, { getState, rejectWithValue }) => {
  const res = await fetch(`${API_BASE}/library-character/${id}`, {
    method: "DELETE",
    headers: authHeaders(getState),
  });
  const data = await res.json();
  if (!res.ok)
    return rejectWithValue(data.error ?? "Failed to delete library character");
  return data.id as string;
});

const libraryCharacterSlice = createSlice({
  name: "libraryCharacters",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchLibraryCharacters.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(
        fetchLibraryCharacters.fulfilled,
        (state, action: PayloadAction<LibraryCharacter[]>) => {
          state.status = "succeeded";
          state.items = action.payload;
        },
      )
      .addCase(fetchLibraryCharacters.rejected, (state, action) => {
        state.status = "failed";
        state.error =
          (action.payload as string) ?? "Failed to load library characters";
      })
      .addCase(
        updateLibraryCharacter.fulfilled,
        (state, action: PayloadAction<LibraryCharacter>) => {
          const i = state.items.findIndex((c) => c.id === action.payload.id);
          if (i !== -1) state.items[i] = action.payload;
        },
      )
      .addCase(
        deleteLibraryCharacter.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.items = state.items.filter((c) => c.id !== action.payload);
        },
      )

      .addCase(
        createLibraryCharacter.fulfilled,
        (state, action: PayloadAction<LibraryCharacter>) => {
          state.items.unshift(action.payload);
        },
      );
  },
});

export default libraryCharacterSlice.reducer;
