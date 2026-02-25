import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, Truck, Eye, EyeOff } from "lucide-react";
import axios from "axios";
import { useAuth } from "../stores/authStore";
import { useTheme } from "../stores/themeStore";
import ThemeToggle from "../components/ThemeToggle";
import type { RegisterPayload } from "../types/trip";

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

export default function RegisterPage() {
  useFonts();
  const { colors: C, isDark } = useTheme();
  const { register: authRegister, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterPayload>();

  if (!isLoading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const password = watch("password");

  const onSubmit = async (values: RegisterPayload) => {
    try {
      await authRegister(values);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 400) {
        const detail = err.response.data as Record<string, string[]>;
        for (const [field, messages] of Object.entries(detail)) {
          setError(field as keyof RegisterPayload, {
            message: Array.isArray(messages) ? messages[0] : String(messages),
          });
        }
      } else {
        setError("username", { message: "Something went wrong. Try again." });
      }
    }
  };

  const inputStyle = (hasError: boolean) => ({
    background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
    border: `1px solid ${hasError ? "rgba(248,113,113,0.7)" : C.border}`,
    color: C.text,
    fontFamily: BODY,
  });

  const eyeBtn = {
    color: C.muted,
    cursor: "pointer" as const,
    background: "none",
    border: "none",
    padding: 0,
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative"
      style={{ background: C.bg }}
    >
      {/* Theme toggle */}
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
            Get started
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
            Create account
          </h1>
          <p
            className="text-sm mt-0.5"
            style={{ color: C.muted, fontFamily: BODY }}
          >
            Start planning ELD-compliant routes.
          </p>
        </div>

        <div style={{ height: 1, background: C.border }} />

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {/* Username */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="reg-username"
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: C.muted, fontFamily: MONO }}
            >
              Username
            </label>
            <input
              id="reg-username"
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

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="reg-email"
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: C.muted, fontFamily: MONO }}
            >
              Email
            </label>
            <input
              id="reg-email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
              style={inputStyle(!!errors.email)}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = C.borderHover;
              }}
              {...register("email", {
                required: "Email is required.",
                pattern: {
                  value: /\S+@\S+\.\S+/,
                  message: "Enter a valid email.",
                },
              })}
            />
            {errors.email && (
              <p
                className="text-xs"
                style={{ color: "#f87171", fontFamily: BODY }}
              >
                {errors.email.message}
              </p>
            )}
          </div>

          {/* First name + Last name */}
          <div className="flex gap-3">
            <div className="flex flex-1 flex-col gap-1.5">
              <label
                htmlFor="reg-first-name"
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: C.muted, fontFamily: MONO }}
              >
                First name
              </label>
              <input
                id="reg-first-name"
                placeholder="John"
                autoComplete="given-name"
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
                style={inputStyle(false)}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = C.borderHover;
                }}
                {...register("first_name")}
              />
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              <label
                htmlFor="reg-last-name"
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: C.muted, fontFamily: MONO }}
              >
                Last name
              </label>
              <input
                id="reg-last-name"
                placeholder="Doe"
                autoComplete="family-name"
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
                style={inputStyle(false)}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = C.borderHover;
                }}
                {...register("last_name")}
              />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="reg-password"
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: C.muted, fontFamily: MONO }}
            >
              Password
            </label>
            <div className="relative">
              <input
                id="reg-password"
                type={showPw ? "text" : "password"}
                placeholder="min 8 characters"
                autoComplete="new-password"
                className="w-full rounded-xl px-4 py-2.5 pr-10 text-sm outline-none transition-all"
                style={inputStyle(!!errors.password)}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = C.borderHover;
                }}
                {...register("password", {
                  required: "Password is required.",
                  minLength: { value: 8, message: "At least 8 characters." },
                })}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                style={eyeBtn}
                className="absolute right-3 top-1/2 -translate-y-1/2"
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

          {/* Confirm password */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="reg-confirm"
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: C.muted, fontFamily: MONO }}
            >
              Confirm password
            </label>
            <div className="relative">
              <input
                id="reg-confirm"
                type={showPw ? "text" : "password"}
                placeholder="repeat password"
                autoComplete="new-password"
                className="w-full rounded-xl px-4 py-2.5 pr-10 text-sm outline-none transition-all"
                style={inputStyle(!!errors.password_confirm)}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = C.borderHover;
                }}
                {...register("password_confirm", {
                  required: "Please confirm your password.",
                  validate: (v) => v === password || "Passwords do not match.",
                })}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                style={eyeBtn}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                {showPw ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {errors.password_confirm && (
              <p
                className="text-xs"
                style={{ color: "#f87171", fontFamily: BODY }}
              >
                {errors.password_confirm.message}
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
                <Loader2 className="w-4 h-4 animate-spin" /> Creating account…
              </>
            ) : (
              "Create account"
            )}
          </motion.button>
        </form>

        {/* Footer */}
        <p
          className="text-sm text-center"
          style={{ color: C.muted, fontFamily: BODY }}
        >
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold transition-opacity hover:opacity-80"
            style={{ color: C.amber }}
          >
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
