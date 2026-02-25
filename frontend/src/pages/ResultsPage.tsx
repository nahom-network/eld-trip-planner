import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { lazy, Suspense, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Loader2,
  ArrowLeft,
  AlertCircle,
  MapPin,
  Clock,
  Route,
  Truck,
} from "lucide-react";
import { getTrip } from "../api/tripsApi";
import StopTimeline from "../components/StopTimeline";
import DailyLogsPanel from "../components/DailyLogsPanel";
import { useTheme } from "../stores/themeStore";
import ThemeToggle from "../components/ThemeToggle";

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

// Lazily import RouteMap so Leaflet (large, SSR-unsafe) only loads when needed
const RouteMap = lazy(() => import("../components/RouteMap"));

function FullscreenState({
  icon,
  title,
  subtitle,
  backTo,
  backLabel,
  spinning = false,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  backTo?: string;
  backLabel?: string;
  spinning?: boolean;
}) {
  const { colors: C } = useTheme();
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-5 px-8"
      style={{ background: C.bg }}
    >
      <motion.div
        animate={spinning ? { rotate: 360 } : {}}
        transition={
          spinning ? { duration: 1.1, repeat: Infinity, ease: "linear" } : {}
        }
      >
        {icon}
      </motion.div>
      <p
        className="font-semibold text-lg text-center"
        style={{ color: C.text, fontFamily: DISPLAY }}
      >
        {title}
      </p>
      {subtitle && (
        <p
          className="text-sm text-center max-w-xs"
          style={{ color: C.muted, fontFamily: BODY }}
        >
          {subtitle}
        </p>
      )}
      {backTo && backLabel && (
        <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
          <Link
            to={backTo}
            className="flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-semibold mt-2"
            style={{ background: C.grad, color: "#fff", fontFamily: BODY }}
          >
            <ArrowLeft className="w-4 h-4" /> {backLabel}
          </Link>
        </motion.div>
      )}
    </div>
  );
}

export default function ResultsPage() {
  useFonts();
  const { id } = useParams<{ id: string }>();
  const { colors: C } = useTheme();

  const {
    data: trip,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["trip", id],
    queryFn: () => getTrip(id!),
    enabled: !!id,
    retry: 1,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "pending" ? 2000 : false;
    },
  });

  if (isLoading) {
    return (
      <FullscreenState
        icon={<Loader2 className="w-12 h-12" style={{ color: C.amber }} />}
        title="Loading trip…"
        spinning
      />
    );
  }

  if (isError || !trip) {
    return (
      <FullscreenState
        icon={
          <AlertCircle className="w-10 h-10" style={{ color: "#f87171" }} />
        }
        title="Failed to load trip."
        subtitle={(error as Error)?.message ?? "Unknown error."}
        backTo="/dashboard"
        backLabel="Back to dashboard"
      />
    );
  }

  if (trip.status === "pending") {
    return (
      <FullscreenState
        icon={<Loader2 className="w-12 h-12" style={{ color: C.amber }} />}
        title="Planning your route…"
        subtitle="Calculating HOS-compliant stops. This usually takes a few seconds."
        spinning
      />
    );
  }

  if (trip.status === "error") {
    return (
      <FullscreenState
        icon={
          <AlertCircle className="w-10 h-10" style={{ color: "#f87171" }} />
        }
        title="Trip planning failed."
        subtitle={trip.error_message || "An unexpected error occurred."}
        backTo="/trips/new"
        backLabel="Try again"
      />
    );
  }

  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{ background: C.bg }}
    >
      {/* ── Header ── */}
      <motion.header
        className="sticky top-0 z-50 px-5 py-3 flex items-center justify-between gap-4 shrink-0"
        style={{
          backdropFilter: "blur(16px)",
          borderBottom: `1px solid ${C.border}`,
          background: C.navBg,
        }}
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        {/* Left: back + trip info */}
        <div className="flex items-center gap-3 min-w-0">
          <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.95 }}>
            <Link
              to="/dashboard"
              className="flex items-center justify-center w-8 h-8 rounded-xl shrink-0"
              style={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                color: C.muted,
              }}
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </motion.div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: C.grad }}
              >
                <Truck className="w-3.5 h-3.5 text-white" strokeWidth={2} />
              </div>
              <span
                className="font-extrabold tracking-widest truncate"
                style={{
                  color: C.text,
                  fontFamily: DISPLAY,
                  fontSize: "0.9rem",
                  letterSpacing: "0.1em",
                }}
              >
                Trip Planner
              </span>
              <span
                className="hidden sm:block rounded-full px-2 py-0.5 text-xs font-medium shrink-0"
                style={{
                  background: "rgba(245,158,11,0.12)",
                  color: C.amber,
                  border: `1px solid rgba(245,158,11,0.25)`,
                  fontFamily: MONO,
                }}
              >
                {trip.status_display}
              </span>
            </div>
            <p
              className="text-xs mt-0.5 truncate flex items-center gap-1"
              style={{ color: C.muted, fontFamily: BODY }}
            >
              <MapPin className="w-3 h-3 shrink-0" />
              {trip.current_location} → {trip.pickup_location} →{" "}
              {trip.dropoff_location}
            </p>
          </div>
        </div>

        {/* Right: stats + toggle */}
        <div className="flex items-center gap-3 shrink-0">
          {trip.total_distance_miles != null && (
            <span
              className="hidden sm:flex items-center gap-1 text-xs"
              style={{ color: C.muted, fontFamily: BODY }}
            >
              <Route className="w-3 h-3" style={{ color: C.amber }} />
              {trip.total_distance_miles.toFixed(0)} mi
            </span>
          )}
          {trip.estimated_duration_hours != null && (
            <span
              className="hidden sm:flex items-center gap-1 text-xs"
              style={{ color: C.muted, fontFamily: BODY }}
            >
              <Clock className="w-3 h-3" style={{ color: C.amber }} />
              {trip.estimated_duration_hours.toFixed(1)} hrs
            </span>
          )}
          <ThemeToggle />
        </div>
      </motion.header>

      {/* ── Map + Side panel ── */}
      <div
        className="flex flex-col lg:flex-row flex-1 overflow-hidden"
        style={{ minHeight: 0 }}
      >
        {/* Map */}
        <div className="flex-1 min-h-[320px] lg:min-h-0">
          <Suspense
            fallback={
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ background: C.surface }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 1.1,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                >
                  <Loader2 className="w-8 h-8" style={{ color: C.amber }} />
                </motion.div>
              </div>
            }
          >
            <RouteMap trip={trip} />
          </Suspense>
        </div>

        {/* Side panel */}
        <motion.aside
          className="w-full lg:w-[22rem] flex flex-col overflow-hidden shrink-0"
          style={{
            borderTop: `1px solid ${C.border}`,
            borderLeft: "none",
            background: C.surface,
          }}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
        >
          <div
            className="flex-1 overflow-y-auto"
            style={{
              ["--scrollbar-color" as string]: C.border,
            }}
          >
            <div className="p-5 flex flex-col gap-7">
              {/* Stops */}
              <section>
                <p
                  className="text-xs font-bold uppercase tracking-widest mb-4"
                  style={{ color: C.muted, fontFamily: MONO }}
                >
                  Stops
                </p>
                <StopTimeline stops={trip.stops} />
              </section>

              {/* Divider */}
              <div style={{ height: 1, background: C.border }} />

              {/* ELD Logs */}
              <section>
                <p
                  className="text-xs font-bold uppercase tracking-widest mb-4"
                  style={{ color: C.muted, fontFamily: MONO }}
                >
                  Daily ELD Logs
                </p>
                <DailyLogsPanel logs={trip.daily_logs} />
              </section>
            </div>
          </div>
        </motion.aside>
      </div>
    </div>
  );
}
