import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useLocation, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, Truck, Eye, EyeOff } from "lucide-react";
import axios from "axios";
import { useAuth } from "../stores/authStore";
import { useTheme } from "../stores/themeStore";
import ThemeToggle from "../components/ThemeToggle";
import type { LoginPayload } from "../types/trip";

const DISPLAY = "'Bricolage Grotesque', sans-serif";
const BODY = "'DM Sans', sans-serif";
const MONO = "'DM Mono', monospace";

function useFonts() {
  useEffect(() => {
    if (document.getElementById("app-fonts")) return;
    const l = document.createElement("link");
    l.id = "app-fonts";
    l.rel = "stylesheet";
    l.href =
      "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,800&family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap";
    document.head.appendChild(l);
  }, []);
}

export default function LoginPage() {
  useFonts();
  const { colors: C, isDark } = useTheme();
  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from =
    (location.state as { from?: { pathname: string } })?.from?.pathname ??
    "/dashboard";
  const [showPw, setShowPw] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginPayload>();

  if (!isLoading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = async (values: LoginPayload) => {
    try {
      await login(values);
      navigate(from, { replace: true });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setError("password", { message: "Invalid username or password." });
      } else {
        setError("password", { message: "Something went wrong. Try again." });
      }
    }
  };

  const inputStyle = (hasError: boolean) => ({
    background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
    border: `1px solid ${hasError ? "rgba(248,113,113,0.7)" : C.border}`,
    color: C.text,
    fontFamily: BODY,
  });

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative"
      style={{ background: C.bg }}
    >
      {/* Theme toggle — top right */}
      <div className="absolute top-5 right-5">
        <ThemeToggle />
      </div>

      {/* Logo */}
      <motion.div
        className="flex items-center gap-2.5 mb-10"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: C.grad }}
        >
          <Truck className="w-5 h-5 text-white" strokeWidth={2} />
        </div>
        <span
          className="font-extrabold tracking-widest"
          style={{
            color: C.text,
            fontFamily: DISPLAY,
            fontSize: "1.15rem",
            letterSpacing: "0.12em",
          }}
        >
          ELD Trip Planner
        </span>
      </motion.div>

      {/* Card */}
      <motion.div
        className="w-full max-w-sm rounded-2xl p-8 flex flex-col gap-6"
        style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          boxShadow: isDark
            ? "0 24px 64px rgba(0,0,0,0.45)"
            : "0 12px 40px rgba(0,0,0,0.10)",
        }}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
      >
        {/* Header */}
        <div className="flex flex-col gap-1">
          <p
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: C.amber, fontFamily: MONO }}
          >
            Welcome back
          </p>
          <h1
            className="font-extrabold"
            style={{
              color: C.text,
              fontFamily: DISPLAY,
              fontSize: "1.75rem",
              letterSpacing: "-0.02em",
              lineHeight: 1.15,
            }}
          >
            Sign in
          </h1>
          <p
            className="text-sm mt-0.5"
            style={{ color: C.muted, fontFamily: BODY }}
          >
            Access your ELD trip planner.
          </p>
        </div>

        <div style={{ height: 1, background: C.border }} />

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {/* Username */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="username"
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: C.muted, fontFamily: MONO }}
            >
              Username
            </label>
            <input
              id="username"
              placeholder="your_username"
              autoComplete="username"
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
              style={inputStyle(!!errors.username)}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = C.borderHover;
              }}
              {...register("username", { required: "Username is required." })}
            />
            {errors.username && (
              <p
                className="text-xs"
                style={{ color: "#f87171", fontFamily: BODY }}
              >
                {errors.username.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: C.muted, fontFamily: MONO }}
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPw ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full rounded-xl px-4 py-2.5 pr-10 text-sm outline-none transition-all"
                style={inputStyle(!!errors.password)}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = C.borderHover;
                }}
                {...register("password", { required: "Password is required." })}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{
                  color: C.muted,
                  cursor: "pointer",
                  background: "none",
                  border: "none",
                  padding: 0,
                }}
              >
                {showPw ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p
                className="text-xs"
                style={{ color: "#f87171", fontFamily: BODY }}
              >
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Submit */}
          <motion.button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold mt-1"
            style={{
              background: isSubmitting ? "rgba(245,158,11,0.45)" : C.grad,
              color: "#fff",
              fontFamily: BODY,
              cursor: isSubmitting ? "not-allowed" : "pointer",
              border: "none",
            }}
            whileHover={!isSubmitting ? { scale: 1.02 } : {}}
            whileTap={!isSubmitting ? { scale: 0.97 } : {}}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Signing in…
              </>
            ) : (
              "Sign in"
            )}
          </motion.button>
        </form>

        {/* Footer */}
        <p
          className="text-sm text-center"
          style={{ color: C.muted, fontFamily: BODY }}
        >
          Don't have an account?{" "}
          <Link
            to="/register"
            className="font-semibold transition-opacity hover:opacity-80"
            style={{ color: C.amber }}
          >
            Register
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
