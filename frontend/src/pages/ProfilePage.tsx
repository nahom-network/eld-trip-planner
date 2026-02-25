import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import {
  ArrowLeft,
  Truck,
  UserCircle,
  Lock,
  Trash2,
  Check,
  Eye,
  EyeOff,
  AlertTriangle,
  Pencil,
} from "lucide-react";
import { useTheme } from "../stores/themeStore";
import ThemeToggle from "../components/ThemeToggle";
import { useAuth, getStoredAccess } from "../stores/authStore";
import { updateProfile, changePassword, deleteAccount } from "../api/authApi";
import type {
  UpdateProfilePayload,
  ChangePasswordPayload,
} from "../types/trip";

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

// ── Reusable field component ───────────────────────────────────────────────
function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  disabled,
  readOnly,
  editable,
  isEditing,
  onToggleEdit,
  rightSlot,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  editable?: boolean;
  isEditing?: boolean;
  onToggleEdit?: () => void;
  rightSlot?: React.ReactNode;
}) {
  const { colors: C, isDark } = useTheme();
  const locked = editable && !isEditing;
  return (
    <div className="flex flex-col gap-1.5">
      <label
        className="text-xs font-semibold uppercase tracking-widest"
        style={{ color: C.muted, fontFamily: MONO }}
      >
        {label}
      </label>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly || locked}
          className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
          style={{
            background: disabled
              ? isDark
                ? "rgba(255,255,255,0.02)"
                : "rgba(0,0,0,0.02)"
              : locked
                ? isDark
                  ? "rgba(255,255,255,0.03)"
                  : "rgba(0,0,0,0.025)"
                : isDark
                  ? "rgba(255,255,255,0.05)"
                  : "rgba(0,0,0,0.04)",
            border: `1px solid ${C.border}`,
            color: disabled ? C.muted : C.text,
            fontFamily: BODY,
            paddingRight: editable || rightSlot ? "2.75rem" : undefined,
            cursor: locked ? "default" : undefined,
            opacity: disabled ? 0.55 : 1,
          }}
          onFocus={(e) => {
            if (!locked && !disabled)
              e.currentTarget.style.borderColor = C.borderHover;
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = C.border;
          }}
        />
        {editable && (
          <button
            type="button"
            onClick={onToggleEdit}
            className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
            style={{
              background: "none",
              border: "none",
              padding: 2,
              cursor: "pointer",
              color: isEditing ? C.amber : C.muted,
            }}
            title={isEditing ? "Lock field" : "Edit field"}
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )}
        {!editable && rightSlot && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {rightSlot}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Alert banner ───────────────────────────────────────────────────────────
function Alert({
  type,
  message,
}: {
  type: "success" | "error";
  message: string;
}) {
  const { isDark } = useTheme();
  const isError = type === "error";
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.25 }}
      className="rounded-xl px-4 py-2.5 text-sm"
      style={{
        background: isError
          ? isDark
            ? "rgba(239,68,68,0.12)"
            : "#fee2e2"
          : isDark
            ? "rgba(34,197,94,0.12)"
            : "#dcfce7",
        border: `1px solid ${isError ? "rgba(239,68,68,0.3)" : "rgba(34,197,94,0.3)"}`,
        color: isError ? "#f87171" : "#4ade80",
        fontFamily: BODY,
      }}
    >
      {message}
    </motion.div>
  );
}

// ── Section card ─────────────────────────────────────────────────────────
function SectionCard({
  icon,
  title,
  subtitle,
  children,
  delay = 0,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  delay?: number;
}) {
  const { colors: C } = useTheme();
  return (
    <motion.div
      className="rounded-2xl p-6 flex flex-col gap-5"
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay }}
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "rgba(245,158,11,0.12)" }}
          >
            {icon}
          </div>
          <h2
            className="font-bold"
            style={{ color: C.text, fontFamily: DISPLAY, fontSize: "1rem" }}
          >
            {title}
          </h2>
        </div>
        {subtitle && (
          <p className="text-xs" style={{ color: C.muted, fontFamily: BODY }}>
            {subtitle}
          </p>
        )}
      </div>
      <div style={{ height: 1, background: C.border }} />
      {children}
    </motion.div>
  );
}

// ── Profile info section ───────────────────────────────────────────────────
function ProfileSection() {
  const { user, updateUser } = useAuth();
  const { colors: C } = useTheme();

  const [firstName, setFirstName] = useState(user?.first_name ?? "");
  const [lastName, setLastName] = useState(user?.last_name ?? "");
  const [username, setUsername] = useState(user?.username ?? "");
  const email = user?.email ?? "";

  // Per-field edit toggle
  const [editingFirst, setEditingFirst] = useState(false);
  const [editingLast, setEditingLast] = useState(false);
  const [editingUsername, setEditingUsername] = useState(false);

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  const mutation = useMutation({
    mutationFn: (payload: UpdateProfilePayload) => {
      const token = getStoredAccess();
      if (!token) throw new Error("Not authenticated");
      return updateProfile(token, payload);
    },
    onSuccess: (updated) => {
      updateUser(updated);
      // Lock all fields after a successful save
      setEditingFirst(false);
      setEditingLast(false);
      setEditingUsername(false);
      setFeedback({ type: "success", msg: "Profile updated successfully." });
      setTimeout(() => setFeedback(null), 3500);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? "Failed to update profile.";
      setFeedback({ type: "error", msg });
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: UpdateProfilePayload = {};
    if (username !== user?.username) payload.username = username;
    if (firstName !== (user?.first_name ?? "")) payload.first_name = firstName;
    if (lastName !== (user?.last_name ?? "")) payload.last_name = lastName;
    if (!Object.keys(payload).length) {
      setFeedback({ type: "success", msg: "Nothing to update." });
      setTimeout(() => setFeedback(null), 2500);
      return;
    }
    mutation.mutate(payload);
  }

  const anyEditing = editingFirst || editingLast || editingUsername;

  return (
    <SectionCard
      icon={<UserCircle className="w-4 h-4" style={{ color: C.amber }} />}
      title="Account Info"
      subtitle="Click the pencil icon next to a field to edit it."
      delay={0.1}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="First name"
            value={firstName}
            onChange={setFirstName}
            placeholder="John"
            disabled={mutation.isPending}
            editable
            isEditing={editingFirst}
            onToggleEdit={() => setEditingFirst((v) => !v)}
          />
          <Field
            label="Last name"
            value={lastName}
            onChange={setLastName}
            placeholder="Doe"
            disabled={mutation.isPending}
            editable
            isEditing={editingLast}
            onToggleEdit={() => setEditingLast((v) => !v)}
          />
        </div>
        <Field
          label="Username"
          value={username}
          onChange={setUsername}
          placeholder="johndoe"
          disabled={mutation.isPending}
          editable
          isEditing={editingUsername}
          onToggleEdit={() => setEditingUsername((v) => !v)}
        />
        <Field
          label="Email"
          value={email}
          onChange={() => {}}
          type="email"
          placeholder="john@example.com"
          disabled
        />
        <AnimatePresence mode="wait">
          {feedback && (
            <Alert key="fb" type={feedback.type} message={feedback.msg} />
          )}
        </AnimatePresence>
        {anyEditing && (
          <div className="flex justify-end">
            <motion.button
              type="submit"
              disabled={mutation.isPending}
              className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold"
              style={{
                background: mutation.isPending
                  ? "rgba(245,158,11,0.45)"
                  : C.grad,
                color: "#fff",
                fontFamily: BODY,
                cursor: mutation.isPending ? "not-allowed" : "pointer",
                border: "none",
              }}
              whileHover={!mutation.isPending ? { scale: 1.04 } : {}}
              whileTap={!mutation.isPending ? { scale: 0.97 } : {}}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {mutation.isPending ? (
                <>
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin inline-block" />
                  Saving…
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" /> Save changes
                </>
              )}
            </motion.button>
          </div>
        )}
      </form>
    </SectionCard>
  );
}

// ── Change password section ────────────────────────────────────────────────
function PasswordSection() {
  const { colors: C } = useTheme();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  const mutation = useMutation({
    mutationFn: (payload: ChangePasswordPayload) => {
      const token = getStoredAccess();
      if (!token) throw new Error("Not authenticated");
      return changePassword(token, payload);
    },
    onSuccess: () => {
      setCurrent("");
      setNext("");
      setConfirm("");
      setFeedback({ type: "success", msg: "Password changed successfully." });
      setTimeout(() => setFeedback(null), 3500);
    },
    onError: (err: unknown) => {
      const data = (err as { response?: { data?: Record<string, string[]> } })
        ?.response?.data;
      const msg =
        data?.non_field_errors?.[0] ??
        data?.current_password?.[0] ??
        data?.new_password?.[0] ??
        "Failed to change password.";
      setFeedback({ type: "error", msg });
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (next !== confirm) {
      setFeedback({ type: "error", msg: "New passwords do not match." });
      return;
    }
    mutation.mutate({
      current_password: current,
      new_password: next,
      new_password_confirm: confirm,
    });
  }

  const eyeStyle = { color: C.muted, cursor: "pointer", width: 16, height: 16 };

  return (
    <SectionCard
      icon={<Lock className="w-4 h-4" style={{ color: C.amber }} />}
      title="Change Password"
      subtitle="Choose a strong password you don't use elsewhere."
      delay={0.18}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field
          label="Current password"
          value={current}
          onChange={setCurrent}
          type={showCurrent ? "text" : "password"}
          placeholder="••••••••"
          disabled={mutation.isPending}
          rightSlot={
            <button type="button" onClick={() => setShowCurrent((v) => !v)}>
              {showCurrent ? (
                <EyeOff style={eyeStyle} />
              ) : (
                <Eye style={eyeStyle} />
              )}
            </button>
          }
        />
        <Field
          label="New password"
          value={next}
          onChange={setNext}
          type={showNew ? "text" : "password"}
          placeholder="min 8 characters"
          disabled={mutation.isPending}
          rightSlot={
            <button type="button" onClick={() => setShowNew((v) => !v)}>
              {showNew ? <EyeOff style={eyeStyle} /> : <Eye style={eyeStyle} />}
            </button>
          }
        />
        <Field
          label="Confirm new password"
          value={confirm}
          onChange={setConfirm}
          type={showNew ? "text" : "password"}
          placeholder="repeat new password"
          disabled={mutation.isPending}
        />
        <AnimatePresence mode="wait">
          {feedback && (
            <Alert key="fb" type={feedback.type} message={feedback.msg} />
          )}
        </AnimatePresence>
        <div className="flex justify-end">
          <motion.button
            type="submit"
            disabled={mutation.isPending || !current || !next || !confirm}
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold"
            style={{
              background:
                mutation.isPending || !current || !next || !confirm
                  ? "rgba(245,158,11,0.35)"
                  : C.grad,
              color: "#fff",
              fontFamily: BODY,
              cursor:
                mutation.isPending || !current || !next || !confirm
                  ? "not-allowed"
                  : "pointer",
              border: "none",
            }}
            whileHover={
              !mutation.isPending && current && next && confirm
                ? { scale: 1.04 }
                : {}
            }
            whileTap={
              !mutation.isPending && current && next && confirm
                ? { scale: 0.97 }
                : {}
            }
          >
            {mutation.isPending ? (
              <>
                <span className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin inline-block" />
                Updating…
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" /> Update password
              </>
            )}
          </motion.button>
        </div>
      </form>
    </SectionCard>
  );
}

// ── Danger zone ────────────────────────────────────────────────────────────
function DangerSection() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { colors: C, isDark } = useTheme();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => {
      const token = getStoredAccess();
      if (!token) throw new Error("Not authenticated");
      return deleteAccount(token);
    },
    onSuccess: () => {
      logout();
      navigate("/", { replace: true });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? "Failed to delete account.";
      setError(msg);
    },
  });

  return (
    <motion.div
      className="rounded-2xl p-6 flex flex-col gap-4"
      style={{
        background: isDark ? "rgba(239,68,68,0.06)" : "#fff5f5",
        border: "1px solid rgba(239,68,68,0.22)",
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: 0.26 }}
    >
      <div className="flex items-center gap-2">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: "rgba(239,68,68,0.15)" }}
        >
          <Trash2 className="w-4 h-4" style={{ color: "#f87171" }} />
        </div>
        <h2
          className="font-bold"
          style={{ color: "#f87171", fontFamily: DISPLAY, fontSize: "1rem" }}
        >
          Danger Zone
        </h2>
      </div>
      <div style={{ height: 1, background: "rgba(239,68,68,0.15)" }} />

      <p className="text-sm" style={{ color: C.muted, fontFamily: BODY }}>
        Permanently deactivate your account and all associated trips. This
        action cannot be undone.
      </p>

      <AnimatePresence>
        {confirming && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div
              className="flex items-start gap-3 rounded-xl p-4 mt-1"
              style={{
                background: isDark ? "rgba(239,68,68,0.1)" : "#fee2e2",
                border: "1px solid rgba(239,68,68,0.25)",
              }}
            >
              <AlertTriangle
                className="w-4 h-4 shrink-0 mt-0.5"
                style={{ color: "#f87171" }}
              />
              <p
                className="text-sm"
                style={{
                  color: isDark ? "#fca5a5" : "#991b1b",
                  fontFamily: BODY,
                }}
              >
                Are you sure? All your trips and ELD logs will be permanently
                deactivated. You cannot recover this data.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && <Alert type="error" message={error} />}

      <div className="flex items-center gap-3">
        {!confirming ? (
          <motion.button
            onClick={() => setConfirming(true)}
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold"
            style={{
              background: "rgba(239,68,68,0.12)",
              color: "#f87171",
              border: "1px solid rgba(239,68,68,0.25)",
              fontFamily: BODY,
              cursor: "pointer",
            }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <Trash2 className="w-3.5 h-3.5" /> Deactivate my account
          </motion.button>
        ) : (
          <>
            <motion.button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
              className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold"
              style={{
                background: mutation.isPending
                  ? "rgba(239,68,68,0.45)"
                  : "#ef4444",
                color: "#fff",
                fontFamily: BODY,
                cursor: mutation.isPending ? "not-allowed" : "pointer",
                border: "none",
              }}
              whileHover={!mutation.isPending ? { scale: 1.03 } : {}}
              whileTap={!mutation.isPending ? { scale: 0.97 } : {}}
            >
              {mutation.isPending ? (
                <>
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin inline-block" />
                  Deleting…
                </>
              ) : (
                "Yes, deactivate"
              )}
            </motion.button>
            <motion.button
              onClick={() => {
                setConfirming(false);
                setError(null);
              }}
              className="rounded-xl px-4 py-2.5 text-sm"
              style={{
                color: C.muted,
                fontFamily: BODY,
                cursor: "pointer",
                background: "none",
                border: `1px solid ${C.border}`,
              }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              Cancel
            </motion.button>
          </>
        )}
      </div>
    </motion.div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  useFonts();
  const { colors: C } = useTheme();
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: C.bg }}>
      {/* Header */}
      <motion.header
        className="sticky top-0 z-40 flex items-center justify-between px-6 py-4 shrink-0"
        style={{
          backdropFilter: "blur(16px)",
          borderBottom: `1px solid ${C.border}`,
          background: C.navBg,
        }}
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <div className="flex items-center gap-3">
          <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.95 }}>
            <Link
              to="/dashboard"
              className="flex items-center justify-center w-8 h-8 rounded-xl"
              style={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                color: C.muted,
              }}
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </motion.div>
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: C.grad }}
            >
              <Truck className="w-4 h-4 text-white" strokeWidth={2} />
            </div>
            <span
              className="font-extrabold tracking-widest"
              style={{
                color: C.text,
                fontFamily: DISPLAY,
                fontSize: "1.05rem",
                letterSpacing: "0.1em",
              }}
            >
              ELD Trip Planner
            </span>
          </div>
        </div>
        <ThemeToggle />
      </motion.header>

      {/* Content */}
      <div className="flex-1 flex justify-center px-4 py-10">
        <div className="w-full max-w-lg flex flex-col gap-5">
          {/* Page title */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-widest mb-1"
              style={{ color: C.amber, fontFamily: MONO }}
            >
              Settings
            </p>
            <h1
              className="font-extrabold"
              style={{
                color: C.text,
                fontFamily: DISPLAY,
                fontSize: "2rem",
                letterSpacing: "-0.02em",
              }}
            >
              {user?.first_name ? `${user.first_name}'s Profile` : "My Profile"}
            </h1>
          </motion.div>

          <ProfileSection />
          <PasswordSection />
          <DangerSection />
        </div>
      </div>
    </div>
  );
}
