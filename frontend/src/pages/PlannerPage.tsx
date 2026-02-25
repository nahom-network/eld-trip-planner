import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Truck, ArrowLeft } from "lucide-react";
import TripForm from "../components/TripForm";
import { useTheme } from "../context/ThemeContext";
import ThemeToggle from "../components/ThemeToggle";

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

export default function PlannerPage() {
  useFonts();
  const { colors: C } = useTheme();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: C.bg }}>
      {/* ── Header ── */}
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
              SPOTTER
            </span>
          </div>
        </div>
        <ThemeToggle />
      </motion.header>

      {/* ── Form card ── */}
      <div className="flex-1 flex items-start justify-center px-4 py-12">
        <motion.div
          className="w-full max-w-lg"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
        >
          {/* Card */}
          <div
            className="rounded-2xl p-8 flex flex-col gap-6"
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
            }}
          >
            {/* Card header */}
            <div className="flex flex-col gap-1.5">
              <p
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: C.amber, fontFamily: MONO }}
              >
                Trip Planner
              </p>
              <h1
                className="font-extrabold"
                style={{
                  color: C.text,
                  fontFamily: DISPLAY,
                  fontSize: "1.65rem",
                  letterSpacing: "-0.02em",
                  lineHeight: 1.15,
                }}
              >
                Plan your route
              </h1>
              <p
                className="text-sm"
                style={{ color: C.muted, fontFamily: BODY }}
              >
                Enter your locations and available cycle hours to generate an
                ELD-compliant route.
              </p>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: C.border }} />

            {/* Form */}
            <TripForm />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
