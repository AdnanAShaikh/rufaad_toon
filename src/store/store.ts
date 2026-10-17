import { configureStore } from "@reduxjs/toolkit";
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import authReducer from "./slices/authSlice";
import projectReducer from "./slices/projectSlice";
import characterReducer from "./slices/characterSlice";
import libraryCharacterReducer from "./slices/libraryCharacterSlice";
import sceneReducer from "./slices/sceneSlice";

// ← explicit localStorage storage object instead of import
const storage = {
  getItem: (key: string) => Promise.resolve(localStorage.getItem(key)),
  setItem: (key: string, value: string) =>
    Promise.resolve(localStorage.setItem(key, value)),
  removeItem: (key: string) => Promise.resolve(localStorage.removeItem(key)),
};

const authPersistConfig = {
  key: "auth",
  storage,
  whitelist: ["user", "token"], // only persist these fields, not status/error
};

const persistedAuthReducer = persistReducer(authPersistConfig, authReducer);

export const store = configureStore({
  reducer: {
    auth: persistedAuthReducer,
    projects: projectReducer,
    characters: characterReducer,
    libraryCharacters: libraryCharacterReducer,
    scenes: sceneReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // redux-persist dispatches these non-serializable actions
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
