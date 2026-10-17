import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import DashboardScreen from "./screens/DashboardScreen";
import { useAppSelector } from "./store/hooks";
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import RufaadGuideScreen from "./screens/RufaadGuide/RufaadGuideScreen";
import ProfileScreen from "./screens/ProfileScreen";

// ---------- App / Router ----------
const App: React.FC = () => {
  const user = useAppSelector((s) => s.auth.user);

  return (
    <Routes>
      <Route
        path="/profile"
        element={user ? <ProfileScreen /> : <Navigate to="/" replace />}
      />

      <Route
        path="/"
        element={user ? <DashboardScreen /> : <Navigate to="/login" replace />}
      />

      {/* Auth routes: bounce to dashboard if already logged in */}
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <LoginScreen />}
      />

      <Route
        path="/register"
        element={user ? <Navigate to="/" replace /> : <RegisterScreen />}
      />

      <Route path="/generate/:id" element={<RufaadGuideScreen />} />
      {/* <Route path="/generate" element={<RufaadGuideScreen />} /> */}

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
