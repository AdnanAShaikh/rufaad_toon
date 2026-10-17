import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { registerUser } from "../store/slices/authSlice";

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const RegisterScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { status } = useAppSelector((s) => s.auth);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  const isLoading = status === "loading";

  const validate = (): boolean => {
    const next: FieldErrors = {};

    if (!email) {
      next.email = "Email is required.";
    } else if (!EMAIL_RE.test(email)) {
      next.email = "Enter a valid email address.";
    }

    if (!password) {
      next.password = "Password is required.";
    } else if (password.length < 8) {
      next.password = "Password must be at least 8 characters.";
    }

    if (!confirmPassword) {
      next.confirmPassword = "Please confirm your password.";
    } else if (confirmPassword !== password) {
      next.confirmPassword = "Passwords do not match.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    const result = await dispatch(
      registerUser({ name: name || undefined, email, password }),
    );
    if (registerUser.fulfilled.match(result)) {
      toast.success("Account created! Please sign in.");
      navigate("/login");
    } else {
      toast.error((result.payload as string) ?? "Registration failed.");
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
  };

  const inputClass = (hasError?: string) =>
    `w-full rounded-lg border bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:ring-2 ${
      hasError
        ? "border-red-300 focus:border-red-400 focus:ring-red-100"
        : "border-stone-200 focus:border-primary-400 focus:ring-primary-100"
    }`;

  return (
    <div className="flex min-h-screen">
      {/* Left brand panel */}
      <div className="hidden w-1/2 flex-col justify-between bg-secondary-500 p-12 text-white lg:flex">
        <div className="text-2xl font-extrabold tracking-tight">
          Rufaad<span className="text-primary-300">Toon</span>
        </div>
        <div>
          <h2 className="max-w-sm text-4xl font-bold leading-tight">
            Start creating today.
          </h2>
          <p className="mt-4 max-w-sm text-primary-100/80">
            Join and bring your first animated story to life in minutes.
          </p>
        </div>
        <div className="text-sm text-primary-100/50">Free to get started.</div>
      </div>

      {/* Right form panel */}
      <div className="flex w-full items-center justify-center bg-white px-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold text-secondary-700">
            Create account
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Set up your studio in a few seconds.
          </p>

          <div className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-secondary-700">
                Name{" "}
                <span className="font-normal text-stone-400">(optional)</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Adnan"
                className={inputClass()}
              />
            </div>

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
                className={inputClass(errors.email)}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-600">{errors.email}</p>
              )}
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
                  placeholder="At least 8 characters"
                  className={`${inputClass(errors.password)} pr-12`}
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
              {errors.password && (
                <p className="mt-1 text-xs text-red-600">{errors.password}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-secondary-700">
                Confirm password
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="Re-enter your password"
                  className={`${inputClass(errors.confirmPassword)} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-xs font-semibold text-stone-400 hover:text-secondary-600"
                  tabIndex={-1}
                >
                  {showConfirm ? "Hide" : "Show"}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full rounded-lg bg-primary-500 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Creating account…" : "Create account"}
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-stone-500">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-primary-600 hover:text-primary-700"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterScreen;
