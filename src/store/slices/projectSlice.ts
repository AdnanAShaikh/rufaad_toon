import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";
import type { Character } from "./characterSlice";
import type { Scene } from "./sceneSlice";

export interface AnimationStyle {
  id: string;
  name: string;
  slug: string;
  gradient: string | null;
  imageUrl: string | null;
}

// Shape returned by the backend (Prisma model)
export interface Project {
  id: string;
  title: string;
  aspectRatio: string;
  styleId: string | null; // the FK
  style: AnimationStyle | null; // the included relation object
  sceneCount: number;
  progress: number;
  isRufaadGuide: boolean;
  thumb: string | null;
  frame: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoryDataDetail {
  id: string;
  starterPrompt: string;
  finalPrompt: string | null;
  language: string;
  numScenes: number;
}

export interface ProjectDetail extends Project {
  finalVideoUrl: string | null;
  renderStatus: string;
  renderedAt: string | null;
  story: StoryDataDetail | null;
  characters: Character[];
  scenes: Scene[];
  narrator: string | null;
  speakingStyle: string | null;
  musicStyle: string | null;
  musicPrompt: string | null;
  voicePrompt: string | null;
  musicUrl: string | null;
  musicTitle?: string | null;
}

export interface UpdateProjectPayload {
  id: string;
  // Project fields
  title?: string;
  aspectRatio?: string;
  styleSlug?: string;
  thumb?: string | null;
  frame?: string;
  // StoryData fields
  starterPrompt?: string;
  finalPrompt?: string | null;
  language?: string;
  numScenes?: number;
  progress?: number;
  narrator?: string;
  speakingStyle?: string;
  musicStyle?: string;
  musicPrompt?: string;
  voicePrompt?: string;
  musicUrl?: string | null;
  musicTitle?: string | null;
}

// --------- INITIAL STATE -------------
interface ProjectState {
  items: Project[];
  current: ProjectDetail | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: ProjectState = {
  items: [],
  current: null,
  status: "idle",
  error: null,
};

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3000/api";

// Helper: build auth headers from the token in the store
const authHeaders = (getState: () => unknown) => {
  const token = (getState() as RootState).auth.token;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const fetchProjects = createAsyncThunk<
  Project[],
  void,
  { state: RootState }
>("projects/fetch", async (_, { getState, rejectWithValue }) => {
  const res = await fetch(`${API_BASE}/project`, {
    headers: authHeaders(getState),
  });
  const data = await res.json();
  if (!res.ok) return rejectWithValue(data.error ?? "Failed to load projects");
  return data.projects as Project[];
});

interface CreatePayload {
  title: string;
  aspectRatio?: string;
  isRufaadGuide?: boolean;
  frame?: string;
}

export const createProject = createAsyncThunk<
  Project,
  CreatePayload,
  { state: RootState }
>("projects/create", async (payload, { getState, rejectWithValue }) => {
  const res = await fetch(`${API_BASE}/project/create`, {
    method: "POST",
    headers: authHeaders(getState),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) return rejectWithValue(data.error ?? "Failed to create project");
  return data.project as Project;
});

export const renameProject = createAsyncThunk<
  Project,
  { id: string; title: string },
  { state: RootState }
>("projects/rename", async ({ id, title }, { getState, rejectWithValue }) => {
  const res = await fetch(`${API_BASE}/project/${id}`, {
    method: "PATCH",
    headers: authHeaders(getState),
    body: JSON.stringify({ title }),
  });
  const data = await res.json();
  if (!res.ok) return rejectWithValue(data.error ?? "Failed to rename project");
  return data.project as Project;
});

export const deleteProject = createAsyncThunk<
  string,
  string,
  { state: RootState }
>("projects/delete", async (id, { getState, rejectWithValue }) => {
  const res = await fetch(`${API_BASE}/project/${id}`, {
    method: "DELETE",
    headers: authHeaders(getState),
  });
  const data = await res.json();
  if (!res.ok) return rejectWithValue(data.error ?? "Failed to delete project");
  return data.id as string;
});

export const fetchProjectById = createAsyncThunk<
  ProjectDetail,
  string,
  { state: RootState }
>("projects/fetchById", async (id, { getState, rejectWithValue }) => {
  const res = await fetch(`${API_BASE}/project/${id}`, {
    headers: authHeaders(getState),
  });
  const data = await res.json();
  if (!res.ok) return rejectWithValue(data.error ?? "Failed to load project");
  return data.project as ProjectDetail;
});

export const updateProject = createAsyncThunk<
  ProjectDetail,
  UpdateProjectPayload,
  { state: RootState }
>("projects/update", async ({ id, ...body }, { getState, rejectWithValue }) => {
  const res = await fetch(`${API_BASE}/project/${id}`, {
    method: "PATCH",
    headers: authHeaders(getState),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) return rejectWithValue(data.error ?? "Failed to update project");
  return data.project as ProjectDetail;
});

const projectSlice = createSlice({
  name: "projects",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(
        fetchProjects.fulfilled,
        (state, action: PayloadAction<Project[]>) => {
          state.status = "succeeded";
          state.items = action.payload;
        },
      )
      .addCase(fetchProjects.rejected, (state, action) => {
        state.status = "failed";
        state.error = (action.payload as string) ?? "Failed to load projects";
      })
      .addCase(
        createProject.fulfilled,
        (state, action: PayloadAction<Project>) => {
          state.items.unshift(action.payload);
        },
      )
      .addCase(
        renameProject.fulfilled,
        (state, action: PayloadAction<Project>) => {
          const i = state.items.findIndex((p) => p.id === action.payload.id);
          if (i !== -1) state.items[i] = action.payload;
        },
      )
      .addCase(
        deleteProject.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.items = state.items.filter((p) => p.id !== action.payload);
        },
      )

      .addCase(fetchProjectById.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(
        fetchProjectById.fulfilled,
        (state, action: PayloadAction<ProjectDetail>) => {
          state.status = "succeeded";
          state.current = action.payload;
        },
      )
      .addCase(fetchProjectById.rejected, (state, action) => {
        state.status = "failed";
        state.error = (action.payload as string) ?? "Failed to load project";
      })

      .addCase(
        updateProject.fulfilled,
        (state, action: PayloadAction<ProjectDetail>) => {
          // Refresh the loaded detail if it's the same project
          if (state.current?.id === action.payload.id) {
            state.current = { ...state.current, ...action.payload };
          }
          // Keep the dashboard list row in sync
          const i = state.items.findIndex((p) => p.id === action.payload.id);
          if (i !== -1)
            state.items[i] = { ...state.items[i], ...action.payload };
        },
      );
  },
});

export default projectSlice.reducer;
