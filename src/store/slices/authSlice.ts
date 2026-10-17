import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  imageUrl?: string | null; // ← add
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3000/api";

// redux-persist rehydrates user/token, so initial state is just empty
const initialState: AuthState = {
  user: null,
  token: null,
  status: "idle",
  error: null,
};

interface AuthResponse {
  user: AuthUser;
  token: string;
}

interface Credentials {
  email: string;
  password: string;
  name?: string;
}
export const registerUser = createAsyncThunk<{ message: string }, Credentials>(
  "auth/register",
  async (creds, { rejectWithValue }) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(creds),
    });
    const data = await res.json();
    if (!res.ok) return rejectWithValue(data.error ?? "Registration failed");
    return data as { message: string };
  },
);

export const loginUser = createAsyncThunk<AuthResponse, Credentials>(
  "auth/login",
  async (creds, { rejectWithValue }) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(creds),
    });
    const data = await res.json();
    if (!res.ok) return rejectWithValue(data.error ?? "Login failed");
    return data as AuthResponse;
  },
);

export const logoutUser = createAsyncThunk("auth/logout", async () => {
  await fetch(`${API_BASE}/auth/logout`, { method: "POST" });
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<AuthResponse>) {
      state.user = action.payload.user;
      state.token = action.payload.token;
    },
  },
  extraReducers: (builder) => {
    const onAuthSuccess = (
      state: AuthState,
      action: PayloadAction<AuthResponse>,
    ) => {
      state.status = "succeeded";
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.error = null;
    };

    builder
      .addCase(registerUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.status = "succeeded";
        state.error = null;
        // deliberately does NOT set user/token — user must log in
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = (action.payload as string) ?? "Registration failed";
      })

      .addCase(loginUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loginUser.fulfilled, onAuthSuccess)
      .addCase(loginUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = (action.payload as string) ?? "Login failed";
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.status = "idle";
      });
  },
});

export const { setCredentials } = authSlice.actions;
export default authSlice.reducer;
