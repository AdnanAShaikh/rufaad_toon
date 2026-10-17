import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { loginUser } from "../store/slices/authSlice";

const LoginScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { status } = useAppSelector((s) => s.auth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const isLoading = status === "loading";

  const handleSubmit = async () => {
    if (!email || !password) {
      toast.error("Please enter your email and password.");
      return;
    }
    const result = await dispatch(loginUser({ email, password }));
    if (loginUser.fulfilled.match(result)) {
      toast.success("Welcome back!");
      navigate("/");
    } else {
      toast.error((result.payload as string) ?? "Login failed.");
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <div className="flex min-h-screen">
      {/* Left brand panel */}
      <div className="hidden w-1/2 flex-col justify-between bg-secondary-500 p-12 text-white lg:flex">
        <div className="text-2xl font-extrabold tracking-tight">
          Rufaad<span className="text-primary-300">Toon</span>
        </div>
        <div>
          <h2 className="max-w-sm text-4xl font-bold leading-tight">
            Turn a sentence into a scene.
          </h2>
          <p className="mt-4 max-w-sm text-primary-100/80">
            Your AI animation studio. Write, generate, and edit — all in one
            place.
          </p>
        </div>
        <div className="text-sm text-primary-100/50">Welcome back.</div>
      </div>

      {/* Right form panel */}
      <div className="flex w-full items-center justify-center bg-white px-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold text-secondary-700">Sign in</h1>
          <p className="mt-1 text-sm text-stone-500">
            Enter your details to access your projects.
          </p>

          <div className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-secondary-700">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-secondary-700">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-stone-200 bg-white px-4 py-2.5 pr-12 text-sm outline-none transition-colors focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-xs font-semibold text-stone-400 hover:text-secondary-600"
                  tabIndex={-1}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full rounded-lg bg-primary-500 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Signing in…" : "Sign in"}
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-stone-500">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-semibold text-primary-600 hover:text-primary-700"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
