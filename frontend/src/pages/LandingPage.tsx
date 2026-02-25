import { Link } from "react-router-dom";
import { useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import {
  motion,
  useInView,
  useScroll,
  useTransform,
  type Variants,
} from "framer-motion";
import {
  Truck,
  FileText,
  ShieldCheck,
  Route,
  Clock4,
  Map,
  ChevronRight,
  CalendarDays,
  ArrowRight,
  Check,
} from "lucide-react";

/* ── fonts ──────────────────────────────────────────────────────────────── */
function useGoogleFonts() {
  useEffect(() => {
    if (document.getElementById("lp-fonts")) return;
    const l = document.createElement("link");
    l.id = "lp-fonts";
    l.rel = "stylesheet";
    l.href =
      "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,700;12..96,800&family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap";
    document.head.appendChild(l);
  }, []);
}

/* ── tokens ─────────────────────────────────────────────────────────────── */
const C = {
  bg: "#08090e",
  surface: "#0f1118",
  border: "rgba(255,255,255,0.07)",
  amber: "#f59e0b",
  orange: "#ea580c",
  grad: "linear-gradient(135deg,#f59e0b,#ea580c)",
  muted: "rgba(255,255,255,0.45)",
  faint: "rgba(255,255,255,0.07)",
};

const DISPLAY = "'Bricolage Grotesque', sans-serif";
const MONO = "'DM Mono', monospace";
const BODY = "'DM Sans', sans-serif";

/* ── animation presets ──────────────────────────────────────────────────── */
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: EASE } },
};
const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

/* ── InView wrapper ─────────────────────────────────────────────────────── */
function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }}
      transition={{ duration: 0.65, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

/* ── Noise overlay ──────────────────────────────────────────────────────── */
function Noise() {
  return (
    <svg
      className="pointer-events-none fixed inset-0 h-full w-full opacity-[0.025] mix-blend-overlay"
      style={{ zIndex: 100 }}
    >
      <filter id="noise">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.65"
          numOctaves="3"
          stitchTiles="stitch"
        />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#noise)" />
    </svg>
  );
}

/* ── Animated ticker ────────────────────────────────────────────────────── */
const TICKER_ITEMS = [
  "FMCSA PART 395 COMPLIANT",
  "70-HR CYCLE TRACKING",
  "ELD DAILY LOG PDFs",
  "OPTIMISED STOP SCHEDULING",
  "INTERACTIVE ROUTE MAP",
  "11-HR DRIVE LIMIT ENFORCED",
  "30-MIN BREAK RULE",
  "MULTI-DAY BREAKDOWN",
];

function Ticker() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div
      className="overflow-hidden py-3"
      style={{
        borderTop: `1px solid ${C.border}`,
        borderBottom: `1px solid ${C.border}`,
      }}
    >
      <motion.div
        className="flex gap-8 whitespace-nowrap"
        animate={{ x: [0, "-50%"] }}
        transition={{ duration: 28, ease: "linear", repeat: Infinity }}
      >
        {items.map((item, i) => (
          <span
            key={i}
            className="flex items-center gap-3 text-xs font-medium"
            style={{ fontFamily: MONO, color: C.muted, letterSpacing: "0.1em" }}
          >
            <span
              className="inline-block h-1 w-1 rounded-full shrink-0"
              style={{ background: C.amber }}
            />
            {item}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

/* ── Hero dot grid ──────────────────────────────────────────────────────── */
function DotGrid() {
  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.09) 1px, transparent 1px)`,
        backgroundSize: "28px 28px",
        maskImage:
          "radial-gradient(ellipse 80% 90% at 50% 40%, black 30%, transparent 100%)",
        WebkitMaskImage:
          "radial-gradient(ellipse 80% 90% at 50% 40%, black 30%, transparent 100%)",
      }}
    />
  );
}

/* ── Glow orb ───────────────────────────────────────────────────────────── */
function GlowOrb({
  top,
  left,
  color,
  size = 600,
}: {
  top: string;
  left: string;
  color: string;
  size?: number;
}) {
  return (
    <div
      className="pointer-events-none absolute rounded-full"
      style={{
        top,
        left,
        width: size,
        height: size,
        background: color,
        filter: "blur(120px)",
        transform: "translate(-50%,-50%)",
        opacity: 0.18,
      }}
    />
  );
}

/* ── Route SVG decoration ───────────────────────────────────────────────── */
function AnimatedRoute() {
  return (
    <div className="relative w-full max-w-lg mx-auto" style={{ height: 90 }}>
      <svg
        viewBox="0 0 480 90"
        fill="none"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0" />
            <stop offset="20%" stopColor="#f59e0b" />
            <stop offset="80%" stopColor="#ea580c" />
            <stop offset="100%" stopColor="#ea580c" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Road */}
        <path
          d="M 10 45 C 110 10 160 80 240 45 C 320 10 370 80 470 45"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="20"
          strokeLinecap="round"
        />
        {/* Route line */}
        <motion.path
          d="M 10 45 C 110 10 160 80 240 45 C 320 10 370 80 470 45"
          stroke="url(#rg)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="8 5"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2, ease: "easeInOut", delay: 1 }}
        />
        {/* Dots */}
        {[
          { cx: 10, cy: 45, color: C.amber, delay: 1.2 },
          { cx: 240, cy: 45, color: "#fb923c", delay: 1.6 },
          { cx: 470, cy: 45, color: "#ef4444", delay: 2 },
        ].map((d) => (
          <motion.circle
            key={d.cx}
            cx={d.cx}
            cy={d.cy}
            r={6}
            fill={d.color}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.4, 1], opacity: 1 }}
            transition={{ duration: 0.5, delay: d.delay, ease: "backOut" }}
          />
        ))}
        {/* Pulse rings */}
        {[
          { cx: 10, cy: 45, color: C.amber, delay: 1.5 },
          { cx: 240, cy: 45, color: "#fb923c", delay: 1.9 },
          { cx: 470, cy: 45, color: "#ef4444", delay: 2.3 },
        ].map((d, i) => (
          <motion.circle
            key={`p${i}`}
            cx={d.cx}
            cy={d.cy}
            r={6}
            stroke={d.color}
            strokeWidth="1.5"
            fill="none"
            initial={{ scale: 1, opacity: 0.8 }}
            animate={{ scale: 3, opacity: 0 }}
            transition={{
              duration: 1.6,
              delay: d.delay,
              repeat: Infinity,
              ease: "easeOut",
            }}
          />
        ))}
      </svg>

      {/* Labels */}
      {[
        { label: "Current", left: "0%", color: C.amber },
        { label: "Pickup", left: "47%", color: "#fb923c" },
        { label: "Dropoff", left: "94%", color: "#ef4444" },
      ].map((l) => (
        <motion.span
          key={l.label}
          className="absolute -bottom-1 text-xs font-medium"
          style={{
            left: l.left,
            color: C.muted,
            fontFamily: MONO,
            fontSize: "0.65rem",
            letterSpacing: "0.08em",
            transform:
              l.label === "Dropoff"
                ? "translateX(-100%)"
                : l.label === "Pickup"
                  ? "translateX(-50%)"
                  : undefined,
          }}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.2, duration: 0.5 }}
        >
          {l.label.toUpperCase()}
        </motion.span>
      ))}
    </div>
  );
}

/* ── Feature card (dark) ────────────────────────────────────────────────── */
function FeatureCard({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
}) {
  return (
    <motion.div
      className="relative flex flex-col gap-4 rounded-2xl p-6 overflow-hidden"
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
      }}
      whileHover={{ y: -4, borderColor: "rgba(245,158,11,0.25)" }}
      transition={{ duration: 0.25 }}
    >
      {/* corner glow on hover */}
      <motion.div
        className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full"
        style={{ background: C.amber, filter: "blur(50px)", opacity: 0 }}
        whileHover={{ opacity: 0.12 }}
        transition={{ duration: 0.3 }}
      />

      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{
          background: "rgba(245,158,11,0.1)",
          border: "1px solid rgba(245,158,11,0.2)",
        }}
      >
        <Icon
          className="w-4 h-4"
          style={{ color: C.amber }}
          strokeWidth={1.8}
        />
      </div>

      <div>
        <h3
          className="mb-2 text-white font-semibold"
          style={{
            fontFamily: DISPLAY,
            fontSize: "1.05rem",
            letterSpacing: "-0.01em",
          }}
        >
          {title}
        </h3>
        <p
          className="text-sm leading-relaxed"
          style={{ color: C.muted, fontFamily: BODY, fontWeight: 300 }}
        >
          {desc}
        </p>
      </div>
    </motion.div>
  );
}

/* ── Step (light section) ───────────────────────────────────────────────── */
function HowStep({
  n,
  title,
  desc,
  last = false,
}: {
  n: string;
  title: string;
  desc: string;
  last?: boolean;
}) {
  return (
    <div className="flex gap-5">
      <div className="flex flex-col items-center shrink-0">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm shrink-0"
          style={{ background: C.grad, fontFamily: DISPLAY }}
        >
          {n}
        </div>
        {!last && (
          <div
            className="w-px flex-1 mt-2"
            style={{
              background: "linear-gradient(to bottom, #f59e0b44, transparent)",
              minHeight: 40,
            }}
          />
        )}
      </div>
      <div className="pb-10">
        <p
          className="font-semibold text-slate-900 mb-1"
          style={{ fontFamily: DISPLAY, fontSize: "1.05rem" }}
        >
          {title}
        </p>
        <p
          className="text-sm text-slate-500 leading-relaxed"
          style={{ fontFamily: BODY, fontWeight: 400 }}
        >
          {desc}
        </p>
      </div>
    </div>
  );
}

/* ── Compliance badge row ───────────────────────────────────────────────── */
function CompliancePill({ label }: { label: string }) {
  return (
    <div
      className="flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium"
      style={{
        background: "rgba(245,158,11,0.08)",
        border: "1px solid rgba(245,158,11,0.2)",
        color: "#92400e",
        fontFamily: MONO,
        letterSpacing: "0.05em",
      }}
    >
      <Check className="w-3 h-3 text-amber-500" strokeWidth={2.5} />
      {label}
    </div>
  );
}

/* ── Nav actions (auth-aware) ───────────────────────────────────────────── */
function NavActions() {
  const { isAuthenticated, user, logout } = useAuth();

  if (isAuthenticated) {
    return (
      <div className="flex items-center gap-3">
        <span
          className="hidden sm:block text-sm"
          style={{ color: C.muted, fontFamily: BODY }}
        >
          {user?.username}
        </span>
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Link
            to="/dashboard"
            className="px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ background: C.grad, color: "#fff", fontFamily: BODY }}
          >
            Dashboard
          </Link>
        </motion.div>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <button
            onClick={logout}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ color: C.muted, fontFamily: BODY, background: "none", border: "none", cursor: "pointer" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
            onMouseLeave={(e) => (e.currentTarget.style.color = C.muted)}
          >
            Sign out
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Link
          to="/login"
          className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{ color: C.muted, fontFamily: BODY }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
          onMouseLeave={(e) => (e.currentTarget.style.color = C.muted)}
        >
          Sign in
        </Link>
      </motion.div>
      <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
        <Link
          to="/register"
          className="px-4 py-2 rounded-lg text-sm font-semibold"
          style={{ background: C.grad, color: "#fff", fontFamily: BODY }}
        >
          Get started
        </Link>
      </motion.div>
    </div>
  );
}

/* ── PAGE ───────────────────────────────────────────────────────────────── */
export default function LandingPage() {
  useGoogleFonts();

  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.6], [0, -60]);

  return (
    <div style={{ background: C.bg, overflowX: "hidden" }}>
      <Noise />

      {/* ── NAV ──────────────────────────────────────────────────────────── */}
      <motion.nav
        className="fixed inset-x-0 top-0 z-50 flex items-center justify-between px-6 py-4"
        style={{
          backdropFilter: "blur(16px)",
          borderBottom: `1px solid ${C.border}`,
          background: "rgba(8,9,14,0.7)",
        }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: C.grad }}
          >
            <Truck className="w-4 h-4 text-white" strokeWidth={2} />
          </div>
          <span
            className="font-extrabold tracking-widest text-white"
            style={{
              fontFamily: DISPLAY,
              fontSize: "1.05rem",
              letterSpacing: "0.12em",
            }}
          >
            Trip Planner
          </span>
        </div>

        <NavActions />
      </motion.nav>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-20 pb-16 overflow-hidden"
      >
        <DotGrid />
        <GlowOrb top="20%" left="20%" color={C.amber} size={700} />
        <GlowOrb top="70%" left="80%" color={C.orange} size={500} />

        <motion.div
          className="relative z-10 flex flex-col items-center text-center gap-8 max-w-4xl"
          style={{ opacity: heroOpacity, y: heroY }}
        >
          {/* Eyebrow */}
          <motion.div
            className="flex items-center gap-2 rounded-full border px-4 py-1.5"
            style={{
              borderColor: "rgba(245,158,11,0.35)",
              background: "rgba(245,158,11,0.07)",
              fontFamily: MONO,
              fontSize: "0.7rem",
              letterSpacing: "0.15em",
              color: C.amber,
            }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5, ease: "backOut" }}
          >
            <ShieldCheck className="w-3 h-3" />
            FMCSA HOURS-OF-SERVICE COMPLIANT
          </motion.div>

          {/* Headline */}
          <motion.h1
            style={{
              fontFamily: DISPLAY,
              fontSize: "clamp(3.2rem,10vw,7.5rem)",
              fontWeight: 800,
              lineHeight: 0.95,
              letterSpacing: "-0.025em",
              color: "#fff",
            }}
            variants={stagger}
            initial="hidden"
            animate="show"
          >
            {["Plan every", "mile.", "Stay legal."].map((line, i) => (
              <motion.span
                key={line}
                className="block"
                variants={fadeUp}
                custom={i}
                style={
                  i === 1
                    ? {
                        background: C.grad,
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }
                    : {}
                }
              >
                {line}
              </motion.span>
            ))}
          </motion.h1>

          {/* Sub */}
          <motion.p
            className="max-w-lg text-base leading-relaxed"
            style={{ color: C.muted, fontFamily: BODY, fontWeight: 300 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.6 }}
          >
            Trip Planner generates fully compliant truck driver routes — with
            optimised stop schedules, an interactive map, and downloadable ELD
            daily log PDFs — in seconds.
          </motion.p>

          {/* CTAs */}
          <motion.div
            className="flex flex-wrap items-center justify-center gap-3"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
          >
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Link
                to="/register"
                className="group flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-semibold"
                style={{
                  background: C.grad,
                  color: "#fff",
                  fontFamily: BODY,
                  boxShadow: "0 8px 32px rgba(245,158,11,0.25)",
                }}
              >
                Start planning free
                <motion.span
                  className="inline-block"
                  initial={{ x: 0 }}
                  whileHover={{ x: 4 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronRight className="w-4 h-4" />
                </motion.span>
              </Link>
            </motion.div>

            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link
                to="/login"
                className="flex items-center gap-2 rounded-xl border px-7 py-3.5 text-sm font-medium transition-colors"
                style={{
                  borderColor: "rgba(255,255,255,0.12)",
                  color: "rgba(255,255,255,0.7)",
                  fontFamily: BODY,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.22)";
                  e.currentTarget.style.color = "#fff";
                  e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
                  e.currentTarget.style.color = "rgba(255,255,255,0.7)";
                  e.currentTarget.style.background = "transparent";
                }}
              >
                Sign in
              </Link>
            </motion.div>
          </motion.div>

          {/* Route animation */}
          <motion.div
            className="w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.6 }}
          >
            <AnimatedRoute />
          </motion.div>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          className="absolute bottom-8 left-1/2 flex flex-col items-center gap-1"
          style={{ transform: "translateX(-50%)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5, duration: 0.8 }}
        >
          <span
            className="text-xs"
            style={{
              color: "rgba(255,255,255,0.25)",
              fontFamily: MONO,
              letterSpacing: "0.1em",
            }}
          >
            SCROLL
          </span>
          <motion.div
            className="w-px h-8"
            style={{
              background:
                "linear-gradient(to bottom, rgba(255,255,255,0.2), transparent)",
            }}
            animate={{ scaleY: [1, 0.5, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      </section>

      {/* ── TICKER ───────────────────────────────────────────────────────── */}
      <Ticker />

      {/* ── STATS ────────────────────────────────────────────────────────── */}
      <section
        className="py-16 px-6"
        style={{ background: C.surface, borderBottom: `1px solid ${C.border}` }}
      >
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { val: "70 hr", label: "Cycle Window" },
            { val: "11 hr", label: "Daily Drive Limit" },
            { val: "30 min", label: "Mandatory Break" },
            { val: "100%", label: "FMCSA Compliant" },
          ].map((s, i) => (
            <Reveal key={s.label} delay={i * 0.08}>
              <div className="flex flex-col items-center text-center gap-1">
                <span
                  className="text-white"
                  style={{
                    fontFamily: DISPLAY,
                    fontSize: "clamp(2rem,5vw,3rem)",
                    fontWeight: 800,
                    background: C.grad,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {s.val}
                </span>
                <span
                  className="text-xs uppercase tracking-widest"
                  style={{
                    color: C.muted,
                    fontFamily: MONO,
                    letterSpacing: "0.12em",
                  }}
                >
                  {s.label}
                </span>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── FEATURES (dark) ──────────────────────────────────────────────── */}
      <section className="py-28 px-6" style={{ background: C.bg }}>
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <p
              className="mb-3 text-xs font-semibold uppercase tracking-widest"
              style={{ color: C.amber, fontFamily: MONO }}
            >
              What Trip Planner does
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <h2
              className="mb-16 text-white"
              style={{
                fontFamily: DISPLAY,
                fontSize: "clamp(2rem,5vw,3.5rem)",
                fontWeight: 800,
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
              }}
            >
              Everything calculated.
              <span style={{ color: "rgba(255,255,255,0.25)" }}>
                {" "}
                Nothing guessed.
              </span>
            </h2>
          </Reveal>

          <motion.div
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
          >
            {[
              {
                icon: Route,
                title: "Optimised Route Planning",
                desc: "Enter current location, pickup, and dropoff. Trip Planner calculates the fastest legal path accounting for your remaining cycle hours.",
              },
              {
                icon: Clock4,
                title: "HOS-Aware Stop Scheduling",
                desc: "Automatically inserts required rest breaks, sleeper berth periods, and fuel stops within the 11-hr drive / 14-hr on-duty windows.",
              },
              {
                icon: Map,
                title: "Interactive Route Map",
                desc: "Visualise the full GeoJSON route with colour-coded stop pins — start, pickup, dropoff, fuel, and rest — on a live Leaflet map.",
              },
              {
                icon: FileText,
                title: "Downloadable ELD Log PDFs",
                desc: "Generate official-format Electronic Logging Device daily log sheets for every driving day, ready to present at inspection.",
              },
              {
                icon: CalendarDays,
                title: "Multi-Day Trip Breakdown",
                desc: "Per-day summary of driving, on-duty, off-duty, and sleeper hours plus cumulative mileage for each segment of the haul.",
              },
              {
                icon: ShieldCheck,
                title: "FMCSA Regulation Built-In",
                desc: "All logic is built around FMCSA Part 395 — 70-hr/8-day cycle, 30-minute break rule, and the 10-hour off-duty reset.",
              },
            ].map((f) => (
              <motion.div key={f.title} variants={fadeUp}>
                <FeatureCard {...f} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── HOW IT WORKS (light) ─────────────────────────────────────────── */}
      <section
        className="py-28 px-6 bg-slate-50"
        style={{ borderTop: "1px solid #e2e8f0" }}
      >
        <div className="max-w-5xl mx-auto grid gap-16 md:grid-cols-2 md:gap-24 items-start">
          {/* Left label + heading */}
          <div className="md:sticky md:top-32">
            <Reveal>
              <p
                className="mb-4 text-xs font-semibold uppercase tracking-widest"
                style={{ color: C.orange, fontFamily: MONO }}
              >
                How it works
              </p>
            </Reveal>
            <Reveal delay={0.1}>
              <h2
                className="mb-6 text-slate-900"
                style={{
                  fontFamily: DISPLAY,
                  fontSize: "clamp(2rem,4vw,3rem)",
                  fontWeight: 800,
                  lineHeight: 1.05,
                  letterSpacing: "-0.02em",
                }}
              >
                Three inputs.
                <br />
                A fully legal
                <br />
                <span
                  style={{
                    background: C.grad,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  trip plan.
                </span>
              </h2>
            </Reveal>
            <Reveal delay={0.2}>
              <p
                className="text-sm leading-relaxed text-slate-500 mb-8"
                style={{ fontFamily: BODY, fontWeight: 400 }}
              >
                No spreadsheets. No manual HOS calculations. Just enter three
                locations and your current cycle hours.
              </p>
            </Reveal>

            {/* Compliance pills */}
            <Reveal delay={0.3}>
              <div className="flex flex-wrap gap-2">
                {[
                  "11-hr Drive",
                  "14-hr On-Duty",
                  "70-hr Cycle",
                  "30-min Break",
                  "10-hr Reset",
                ].map((l) => (
                  <CompliancePill key={l} label={l} />
                ))}
              </div>
            </Reveal>
          </div>

          {/* Steps */}
          <div className="flex flex-col pt-2">
            {[
              {
                n: "01",
                title: "Create your account",
                desc: "Register in seconds. All trips are saved and accessible from your dashboard anytime.",
              },
              {
                n: "02",
                title: "Enter trip details",
                desc: "Provide your current location, pickup address, dropoff address, and your current 70-hour cycle usage.",
              },
              {
                n: "03",
                title: "Get your full trip plan",
                desc: "An interactive map, a detailed stop timeline, and ELD-ready daily log PDFs — all compliant with FMCSA Part 395.",
                last: true,
              },
            ].map((s, i) => (
              <Reveal key={s.n} delay={i * 0.15}>
                <HowStep {...s} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="px-6 py-28" style={{ background: C.bg }}>
        <Reveal>
          <div
            className="relative max-w-3xl mx-auto rounded-3xl p-12 text-center overflow-hidden"
            style={{
              border: `1px solid rgba(245,158,11,0.2)`,
              background:
                "linear-gradient(135deg,rgba(245,158,11,0.08),rgba(234,88,12,0.08))",
            }}
          >
            {/* glow */}
            <div
              className="pointer-events-none absolute inset-0 rounded-3xl"
              style={{
                background:
                  "radial-gradient(ellipse 70% 60% at 50% 0%, rgba(245,158,11,0.18), transparent 70%)",
              }}
            />
            {/* Animated ring */}
            <motion.div
              className="pointer-events-none absolute inset-0 rounded-3xl"
              style={{ border: "1px solid rgba(245,158,11,0.15)" }}
              animate={{ scale: [1, 1.02, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />

            <div className="relative z-10 flex flex-col items-center gap-6">
              <motion.div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{
                  background: C.grad,
                  boxShadow: "0 12px 40px rgba(245,158,11,0.35)",
                }}
                animate={{ y: [0, -6, 0] }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Truck className="w-7 h-7 text-white" strokeWidth={1.5} />
              </motion.div>

              <h2
                className="text-white"
                style={{
                  fontFamily: DISPLAY,
                  fontSize: "clamp(2rem,5vw,3.5rem)",
                  fontWeight: 800,
                  lineHeight: 1,
                  letterSpacing: "-0.02em",
                }}
              >
                Ready to plan
                <br />
                your next run?
              </h2>

              <p
                className="max-w-sm text-sm leading-relaxed"
                style={{ color: C.muted, fontFamily: BODY, fontWeight: 300 }}
              >
                Stay compliant and spend less time on paperwork. Your first trip
                plan is free.
              </p>

              <motion.div
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
              >
                <Link
                  to="/register"
                  className="group flex items-center gap-2 rounded-xl px-8 py-4 text-sm font-semibold"
                  style={{
                    background: C.grad,
                    color: "#fff",
                    fontFamily: BODY,
                    boxShadow: "0 0 50px rgba(245,158,11,0.3)",
                  }}
                >
                  Create free account
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </motion.div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer
        className="px-6 py-8"
        style={{ borderTop: `1px solid ${C.border}` }}
      >
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center"
              style={{ background: C.grad }}
            >
              <Truck className="w-3 h-3 text-white" strokeWidth={2} />
            </div>
            <span
              className="font-extrabold tracking-widest text-white"
              style={{
                fontFamily: DISPLAY,
                fontSize: "0.85rem",
                letterSpacing: "0.14em",
              }}
            >
              Trip Planner
            </span>
          </div>

          <div className="flex items-center gap-6">
            <Link
              to="/login"
              className="text-xs transition-colors"
              style={{ color: C.muted, fontFamily: BODY }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
              onMouseLeave={(e) => (e.currentTarget.style.color = C.muted)}
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="text-xs transition-colors"
              style={{ color: C.muted, fontFamily: BODY }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
              onMouseLeave={(e) => (e.currentTarget.style.color = C.muted)}
            >
              Register
            </Link>
          </div>

          <p
            className="text-xs"
            style={{
              color: "rgba(255,255,255,0.2)",
              fontFamily: MONO,
              letterSpacing: "0.05em",
            }}
          >
            Built for FMCSA Part 395 compliance · Not legal advice
          </p>
        </div>
      </footer>
    </div>
  );
}
