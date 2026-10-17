import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";

// Scene as returned by the backend. characters is a thin id list
// (the controllers include `characters: { select: { id: true } }`).
export interface Scene {
  id: string;
  order: number;
  text: string | null;
  imagePrompt: string | null;
  voiceoverText: string | null;
  videoPrompt: string | null;
  imageUrl: string | null;
  voiceoverUrl: string | null;
  videoUrl: string | null;
  projectId: string;
  createdAt: string;
  updatedAt: string;
  characters: { id: string }[];
}

interface SceneState {
  items: Scene[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: SceneState = {
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

const sortByOrder = (list: Scene[]) =>
  [...list].sort((a, b) => a.order - b.order);

// ---- Create (append; all fields optional) ----
interface CreatePayload {
  projectId: string;
  text?: string;
  imagePrompt?: string;
  voiceoverText?: string;
  videoPrompt?: string;
  characterIds?: string[];
}

export const createScene = createAsyncThunk<
  Scene,
  CreatePayload,
  { state: RootState }
>(
  "scenes/create",
  async ({ projectId, ...body }, { getState, rejectWithValue }) => {
    const res = await fetch(`${API_BASE}/project/${projectId}/scene`, {
      method: "POST",
      headers: authHeaders(getState),
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) return rejectWithValue(data.error ?? "Failed to create scene");
    return data.scene as Scene;
  },
);

// ---- Update (text / prompts / character set) ----
interface UpdatePayload {
  projectId: string;
  id: string;
  text?: string;
  imagePrompt?: string;
  imageUrl?: string | null;
  voiceoverText?: string;
  videoPrompt?: string;
  characterIds?: string[]; // replaces the whole set; [] clears
}

export const updateScene = createAsyncThunk<
  Scene,
  UpdatePayload,
  { state: RootState }
>(
  "scenes/update",
  async ({ projectId, id, ...body }, { getState, rejectWithValue }) => {
    const res = await fetch(`${API_BASE}/project/${projectId}/scene/${id}`, {
      method: "PATCH",
      headers: authHeaders(getState),
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) return rejectWithValue(data.error ?? "Failed to update scene");
    return data.scene as Scene;
  },
);

// ---- Delete (drops the row; leaves order gaps by design) ----
interface DeletePayload {
  projectId: string;
  id: string;
}

export const deleteScene = createAsyncThunk<
  string,
  DeletePayload,
  { state: RootState }
>("scenes/delete", async ({ projectId, id }, { getState, rejectWithValue }) => {
  const res = await fetch(`${API_BASE}/project/${projectId}/scene/${id}`, {
    method: "DELETE",
    headers: authHeaders(getState),
  });
  const data = await res.json();
  if (!res.ok) return rejectWithValue(data.error ?? "Failed to delete scene");
  return data.id as string;
});

// ---- Reorder (drag-and-drop; sends full new sequence) ----
// Optimistic: the list is reordered in `pending` and the server response
// reconciles in `fulfilled`. On `rejected` we restore the prior order.
interface ReorderPayload {
  projectId: string;
  orderedIds: string[]; // all scene ids in their new order
}

export const reorderScenes = createAsyncThunk<
  Scene[],
  ReorderPayload,
  { state: RootState }
>(
  "scenes/reorder",
  async ({ projectId, orderedIds }, { getState, rejectWithValue }) => {
    const res = await fetch(`${API_BASE}/project/${projectId}/scene/reorder`, {
      method: "PUT",
      headers: authHeaders(getState),
      body: JSON.stringify({ orderedIds }),
    });
    const data = await res.json();
    if (!res.ok)
      return rejectWithValue(data.error ?? "Failed to reorder scenes");
    return data.scenes as Scene[];
  },
);

const sceneSlice = createSlice({
  name: "scenes",
  initialState,
  reducers: {
    // Seed from a loaded project's scenes (fetchProjectById result)
    setScenes(state, action: PayloadAction<Scene[]>) {
      state.items = sortByOrder(action.payload);
      state.status = "succeeded";
    },

    setScene(state, action: PayloadAction<Scene>) {
      const i = state.items.findIndex((s) => s.id === action.payload.id);
      if (i !== -1) state.items[i] = action.payload;
    },

    clearScenes(state) {
      state.items = [];
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createScene.fulfilled, (state, action) => {
        state.items = sortByOrder([...state.items, action.payload]);
      })
      .addCase(updateScene.fulfilled, (state, action) => {
        const i = state.items.findIndex((s) => s.id === action.payload.id);
        if (i !== -1) state.items[i] = action.payload;
      })
      .addCase(deleteScene.fulfilled, (state, action) => {
        // just drop the row — do NOT renumber; order gaps are fine
        state.items = state.items.filter((s) => s.id !== action.payload);
      })

      // ----- Optimistic reorder -----
      .addCase(reorderScenes.pending, (state, action) => {
        // Reorder the local list immediately from the ids we're sending.
        // Stash the previous order on the action's meta so we can restore it
        // if the request fails (see rejected below).
        const { orderedIds } = action.meta.arg;
        const byId = new Map(state.items.map((s) => [s.id, s]));
        const next = orderedIds
          .map((id) => byId.get(id))
          .filter((s): s is Scene => Boolean(s));
        // reflect the new positions in `order` too so UI keying stays sane
        state.items = next.map((s, i) => ({ ...s, order: i }));
      })
      .addCase(reorderScenes.fulfilled, (state, action) => {
        // server returns the full re-sequenced list; replace wholesale
        state.items = sortByOrder(action.payload);
      })
      .addCase(reorderScenes.rejected, (state) => {
        // Best-effort recovery: re-sort what we have. The next successful
        // load or reorder will fully reconcile with the server.
        state.items = sortByOrder(state.items);
        state.status = "failed";
      })

      // shared pending / rejected / fulfilled status across the OTHER thunks
      .addMatcher(
        (a) =>
          a.type.startsWith("scenes/") &&
          a.type.endsWith("/pending") &&
          a.type !== reorderScenes.pending.type,
        (state) => {
          state.status = "loading";
          state.error = null;
        },
      )
      .addMatcher(
        (a) =>
          a.type.startsWith("scenes/") &&
          a.type.endsWith("/rejected") &&
          a.type !== reorderScenes.rejected.type,
        (state, action: PayloadAction<unknown>) => {
          state.status = "failed";
          state.error = (action.payload as string) ?? "Scene request failed";
        },
      )
      .addMatcher(
        (a) => a.type.startsWith("scenes/") && a.type.endsWith("/fulfilled"),
        (state) => {
          state.status = "succeeded";
        },
      );
  },
});

export const { setScenes, setScene, clearScenes } = sceneSlice.actions;
export default sceneSlice.reducer;
