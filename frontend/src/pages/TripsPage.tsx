import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Truck,
  LogOut,
  Route,
  Clock,
  AlertCircle,
  Loader2,
  ChevronRight,
  UserCircle,
  Trash2,
} from "lucide-react";
import { useAuth } from "../stores/authStore";
import { useTheme } from "../stores/themeStore";
import ThemeToggle from "../components/ThemeToggle";
import { listTrips, deleteTrip } from "../api/tripsApi";
import type { TripList, TripStatus, Paginated } from "../types/trip";

const DISPLAY = "'Bricolage Grotesque', sans-serif";
const MONO = "'DM Mono', monospace";
const BODY = "'DM Sans', sans-serif";

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

const STATUS_COLORS: Record<
  TripStatus,
  { bg: string; text: string; border: string }
> = {
  completed: {
    bg: "rgba(34,197,94,0.1)",
    text: "#4ade80",
    border: "rgba(34,197,94,0.3)",
  },
  pending: {
    bg: "rgba(245,158,11,0.1)",
    text: "#fbbf24",
    border: "rgba(245,158,11,0.3)",
  },
  error: {
    bg: "rgba(239,68,68,0.1)",
    text: "#f87171",
    border: "rgba(239,68,68,0.3)",
  },
};

function StatusPill({ status }: { status: TripStatus }) {
  const s = STATUS_COLORS[status];
  return (
    <span
      className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize"
      style={{
        background: s.bg,
        color: s.text,
        border: `1px solid ${s.border}`,
        fontFamily: MONO,
        letterSpacing: "0.05em",
      }}
    >
      {status}
    </span>
  );
}

function TripCard({
  trip,
  index,
  onDelete,
}: {
  trip: TripList;
  index: number;
  onDelete: (id: string) => void;
}) {
  const { colors: C, isDark } = useTheme();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const createdAt = new Date(trip.created_at).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{
        duration: 0.45,
        ease: [0.22, 1, 0.36, 1],
        delay: index * 0.07,
      }}
    >
      <motion.div
        className="rounded-2xl overflow-hidden"
        animate={{
          borderColor: confirmDelete ? "rgba(239,68,68,0.45)" : C.border,
        }}
        style={{ background: C.surface, border: `1px solid ${C.border}` }}
        transition={{ duration: 0.18 }}
      >
        {/* Red wash when confirming */}
        <AnimatePresence>
          {confirmDelete && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                background: isDark
                  ? "rgba(239,68,68,0.05)"
                  : "rgba(239,68,68,0.03)",
              }}
            />
          )}
        </AnimatePresence>

        {/* Card body — clicking navigates unless confirming */}
        <Link
          to={`/trips/${trip.id}`}
          className="block p-5 group"
          onClick={(e) => confirmDelete && e.preventDefault()}
          style={{ position: "relative" }}
        >
          <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-0.5 min-w-0">
                <p
                  className="font-semibold truncate"
                  style={{
                    color: C.text,
                    fontFamily: DISPLAY,
                    fontSize: "0.95rem",
                  }}
                >
                  {trip.current_location} → {trip.dropoff_location}
                </p>
                <p
                  className="text-xs truncate"
                  style={{ color: C.muted, fontFamily: BODY }}
                >
                  via {trip.pickup_location}
                </p>
              </div>
              <StatusPill status={trip.status} />
            </div>

            <div className="flex items-center gap-4">
              {trip.total_distance_miles != null && (
                <span
                  className="flex items-center gap-1.5 text-xs"
                  style={{ color: C.muted, fontFamily: BODY }}
                >
                  <Route className="w-3 h-3" style={{ color: C.amber }} />
                  {trip.total_distance_miles.toFixed(0)} mi
                </span>
              )}
              {trip.estimated_duration_hours != null && (
                <span
                  className="flex items-center gap-1.5 text-xs"
                  style={{ color: C.muted, fontFamily: BODY }}
                >
                  <Clock className="w-3 h-3" style={{ color: C.amber }} />
                  {trip.estimated_duration_hours.toFixed(1)} hrs
                </span>
              )}
              <span
                className="ml-auto text-xs"
                style={{ color: C.textFaint, fontFamily: MONO }}
              >
                {createdAt}
              </span>
              <ChevronRight
                className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: C.amber }}
              />
            </div>
          </div>
        </Link>

        {/* Bottom action bar */}
        <div
          style={{
            height: 1,
            background: confirmDelete ? "rgba(239,68,68,0.18)" : C.border,
          }}
        />

        <AnimatePresence mode="wait">
          {confirmDelete ? (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.18 }}
              className="flex items-center justify-between px-5 py-3 gap-3"
            >
              <p
                className="text-xs font-medium"
                style={{ color: "#f87171", fontFamily: BODY }}
              >
                Permanently delete this trip?
              </p>
              <div className="flex items-center gap-2 shrink-0">
                <motion.button
                  onClick={() => setConfirmDelete(false)}
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold"
                  style={{
                    background: "transparent",
                    border: `1px solid ${C.border}`,
                    color: C.muted,
                    fontFamily: BODY,
                    cursor: "pointer",
                  }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={() => onDelete(trip.id)}
                  className="rounded-lg px-3 py-1.5 text-xs font-bold"
                  style={{
                    background: "#ef4444",
                    color: "#fff",
                    fontFamily: BODY,
                    cursor: "pointer",
                    border: "none",
                  }}
                  whileHover={{ scale: 1.04, background: "#dc2626" }}
                  whileTap={{ scale: 0.96 }}
                >
                  Delete
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex justify-end px-4 py-2"
            >
              <motion.button
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium"
                style={{
                  background: "transparent",
                  border: "none",
                  color: C.muted,
                  fontFamily: BODY,
                  cursor: "pointer",
                }}
                whileHover={{ color: "#f87171" }}
                whileTap={{ scale: 0.95 }}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

export default function TripsPage() {
  useFonts();
  const { user, logout } = useAuth();
  const { colors: C } = useTheme();
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery<Paginated<TripList>>({
    queryKey: ["trips", page],
    queryFn: () => listTrips(page),
    placeholderData: (prev) => prev,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTrip,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["trips"] }),
  });

  const trips = data?.results;
  const hasPagination = !!(data?.next || page > 1);

  return (
    <div className="min-h-screen" style={{ background: C.bg }}>
      {/* ── Header ── */}
      <motion.header
        className="sticky top-0 z-40 flex items-center justify-between px-6 py-4"
        style={{
          backdropFilter: "blur(16px)",
          borderBottom: `1px solid ${C.border}`,
          background: C.navBg,
        }}
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <div className="flex items-center gap-2.5">
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
            Trip Planner
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            to="/profile"
            className="hidden sm:flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors"
            style={{ color: C.muted, fontFamily: BODY }}
          >
            <UserCircle className="w-4 h-4 shrink-0" />
            {user?.username}
          </Link>
          <ThemeToggle />
          <motion.button
            onClick={logout}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
            style={{
              color: C.muted,
              fontFamily: BODY,
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
            whileHover={{ color: "#fff" }}
            whileTap={{ scale: 0.97 }}
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </motion.button>
        </div>
      </motion.header>

      {/* ── Main ── */}
      <main className="max-w-2xl mx-auto px-4 py-10 flex flex-col gap-8">
        {/* Title row */}
        <motion.div
          className="flex items-end justify-between"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-widest mb-1"
              style={{ color: C.amber, fontFamily: "'DM Mono', monospace" }}
            >
              Dashboard
            </p>
            <h1
              style={{
                color: C.text,
                fontFamily: DISPLAY,
                fontSize: "2rem",
                fontWeight: 800,
                letterSpacing: "-0.02em",
              }}
            >
              My Trips
            </h1>
          </div>
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
            <Link
              to="/trips/new"
              className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold"
              style={{ background: C.grad, color: "#fff", fontFamily: BODY }}
            >
              <Plus className="w-4 h-4" />
              New trip
            </Link>
          </motion.div>
        </motion.div>

        {/* Divider */}
        <div style={{ height: 1, background: C.border }} />

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Loader2 className="w-8 h-8" style={{ color: C.amber }} />
            </motion.div>
          </div>
        )}

        {/* Error */}
        {isError && (
          <motion.div
            className="flex flex-col items-center justify-center py-20 gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <AlertCircle className="w-8 h-8" style={{ color: "#f87171" }} />
            <p
              className="text-sm font-medium"
              style={{ color: "#f87171", fontFamily: BODY }}
            >
              Failed to load trips.
            </p>
          </motion.div>
        )}

        {/* Empty state */}
        {trips && trips.length === 0 && (
          <motion.div
            className="flex flex-col items-center justify-center py-20 gap-4"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{
                background: "rgba(245,158,11,0.1)",
                border: `1px solid rgba(245,158,11,0.2)`,
              }}
            >
              <Truck
                className="w-7 h-7"
                style={{ color: C.amber }}
                strokeWidth={1.5}
              />
            </div>
            <p className="text-sm" style={{ color: C.muted, fontFamily: BODY }}>
              No trips yet.
            </p>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Link
                to="/trips/new"
                className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold"
                style={{ background: C.grad, color: "#fff", fontFamily: BODY }}
              >
                <Plus className="w-4 h-4" />
                Plan your first trip
              </Link>
            </motion.div>
          </motion.div>
        )}

        {/* Trip list */}
        {trips && trips.length > 0 && (
          <AnimatePresence>
            <div className="flex flex-col gap-3">
              {trips.map((trip, i) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  index={i}
                  onDelete={(id) => deleteMutation.mutate(id)}
                />
              ))}
            </div>
          </AnimatePresence>
        )}

        {/* Pagination */}
        {data && hasPagination && (
          <motion.div
            className="flex items-center justify-between pt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!data.previous}
              className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-opacity disabled:opacity-30"
              style={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                color: C.text,
                fontFamily: BODY,
                cursor: data.previous ? "pointer" : "not-allowed",
              }}
            >
              ← Previous
            </button>
            <span
              className="text-xs"
              style={{ color: C.muted, fontFamily: "'DM Mono', monospace" }}
            >
              Page {page}
              {data.count ? ` · ${data.count} total` : ""}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!data.next}
              className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-opacity disabled:opacity-30"
              style={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                color: C.text,
                fontFamily: BODY,
                cursor: data.next ? "pointer" : "not-allowed",
              }}
            >
              Next →
            </button>
          </motion.div>
        )}
      </main>
    </div>
  );
}
