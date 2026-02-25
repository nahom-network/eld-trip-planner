import { Link } from "react-router-dom";
import { useEffect, useRef } from "react";
import {
  MapPin,
  FileText,
  ShieldCheck,
  Route,
  Clock4,
  ChevronRight,
  Truck,
  CalendarDays,
  Map,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

/* ─── Animated route SVG ─────────────────────────────────────────────── */
function RoutePath() {
  return (
    <svg
      viewBox="0 0 800 120"
      preserveAspectRatio="none"
      className="w-full h-full"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0" />
          <stop offset="30%" stopColor="#f59e0b" stopOpacity="1" />
          <stop offset="70%" stopColor="#ea580c" stopOpacity="1" />
          <stop offset="100%" stopColor="#ea580c" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Road base */}
      <path
        d="M 0 80 Q 200 20 400 80 Q 600 140 800 80"
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="24"
        strokeLinecap="round"
      />
      {/* Road center line animated */}
      <path
        d="M 0 80 Q 200 20 400 80 Q 600 140 800 80"
        fill="none"
        stroke="url(#routeGrad)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="12 8"
        style={{ animation: "dashMove 3s linear infinite" }}
      />
      {/* Origin dot */}
      <circle cx="80" cy="74" r="6" fill="#f59e0b">
        <animate
          attributeName="r"
          values="6;9;6"
          dur="2s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          values="1;0.5;1"
          dur="2s"
          repeatCount="indefinite"
        />
      </circle>
      {/* Pickup dot */}
      <circle cx="400" cy="80" r="6" fill="#fb923c">
        <animate
          attributeName="r"
          values="6;9;6"
          dur="2s"
          begin="0.6s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          values="1;0.5;1"
          dur="2s"
          begin="0.6s"
          repeatCount="indefinite"
        />
      </circle>
      {/* Destination dot */}
      <circle cx="720" cy="74" r="6" fill="#ef4444">
        <animate
          attributeName="r"
          values="6;9;6"
          dur="2s"
          begin="1.2s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          values="1;0.5;1"
          dur="2s"
          begin="1.2s"
          repeatCount="indefinite"
        />
      </circle>
    </svg>
  );
}

/* ─── Animated counter ───────────────────────────────────────────────── */
function StatCounter({
  target,
  suffix = "",
}: {
  target: number;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let start = 0;
    const duration = 1800;
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target).toLocaleString() + suffix;
      if (progress < 1) requestAnimationFrame(step);
    };
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          requestAnimationFrame(step);
          obs.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [target, suffix]);
  return <span ref={ref}>0{suffix}</span>;
}

/* ─── Feature card ───────────────────────────────────────────────────── */
function Feature({
  icon: Icon,
  title,
  desc,
  delay,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
  delay: number;
}) {
  return (
    <div
      className="group relative flex flex-col gap-4 rounded-2xl border p-7 transition-transform duration-300 hover:-translate-y-1"
      style={{
        background: "rgba(255,255,255,0.03)",
        borderColor: "rgba(255,255,255,0.08)",
        animationDelay: `${delay}ms`,
      }}
    >
      <div
        className="flex h-12 w-12 items-center justify-center rounded-xl"
        style={{ background: "rgba(245,158,11,0.12)" }}
      >
        <Icon className="h-5 w-5 text-amber-400" strokeWidth={1.8} />
      </div>
      <h3
        className="text-lg font-semibold leading-snug text-white"
        style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: "1.2rem",
          letterSpacing: "0.02em",
        }}
      >
        {title}
      </h3>
      <p
        className="text-sm leading-relaxed"
        style={{
          color: "rgba(255,255,255,0.5)",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {desc}
      </p>
      {/* hover glow */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ boxShadow: "inset 0 0 40px rgba(245,158,11,0.05)" }}
      />
    </div>
  );
}

/* ─── Step ───────────────────────────────────────────────────────────── */
function Step({ n, title, desc }: { n: string; title: string; desc: string }) {
  return (
    <div className="flex gap-5">
      <div className="flex flex-col items-center gap-1 shrink-0">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold"
          style={{
            background: "linear-gradient(135deg,#f59e0b,#ea580c)",
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: "1.1rem",
            letterSpacing: "0.05em",
          }}
        >
          {n}
        </div>
        <div
          className="flex-1 w-px"
          style={{ background: "rgba(255,255,255,0.08)", minHeight: "2rem" }}
        />
      </div>
      <div className="pb-8">
        <p
          className="mb-1.5 font-semibold text-white"
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: "1.15rem",
            letterSpacing: "0.03em",
          }}
        >
          {title}
        </p>
        <p
          className="text-sm leading-relaxed"
          style={{
            color: "rgba(255,255,255,0.5)",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {desc}
        </p>
      </div>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────── */
export default function LandingPage() {
  useFonts();

  return (
    <div
      style={{
        background: "#07080f",
        color: "#fff",
        fontFamily: "'DM Sans', sans-serif",
        overflowX: "hidden",
      }}
    >
      {/* Keyframes */}
      <style>{`
        @keyframes dashMove { to { stroke-dashoffset: -80; } }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.7s ease both; }
      `}</style>

      {/* ── Nav ── */}
      <nav
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        className="fixed inset-x-0 top-0 z-50 flex items-center justify-between px-6 py-4 backdrop-blur-md"
      >
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: "linear-gradient(135deg,#f59e0b,#ea580c)" }}
          >
            <Truck className="h-4 w-4 text-white" strokeWidth={2} />
          </div>
          <span
            className="font-bold tracking-wide text-white"
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: "1.15rem",
              letterSpacing: "0.08em",
            }}
          >
            SPOTTER
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            style={{
              color: "rgba(255,255,255,0.65)",
              fontFamily: "'DM Sans', sans-serif",
            }}
            onMouseEnter={(e) =>
              ((e.target as HTMLElement).style.color = "#fff")
            }
            onMouseLeave={(e) =>
              ((e.target as HTMLElement).style.color = "rgba(255,255,255,0.65)")
            }
          >
            Sign in
          </Link>
          <Link
            to="/register"
            className="rounded-lg px-4 py-2 text-sm font-semibold transition-all"
            style={{
              background: "linear-gradient(135deg,#f59e0b,#ea580c)",
              color: "#fff",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-6 pt-20 pb-10">
        {/* Grid background */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        {/* Radial glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(245,158,11,0.07) 0%, transparent 70%)",
          }}
        />

        <div className="relative z-10 flex max-w-4xl flex-col items-center gap-8 text-center">
          {/* Badge */}
          <div
            className="fade-up inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium"
            style={{
              borderColor: "rgba(245,158,11,0.35)",
              color: "#f59e0b",
              background: "rgba(245,158,11,0.08)",
              fontFamily: "'DM Sans', sans-serif",
              animationDelay: "0ms",
            }}
          >
            <ShieldCheck className="h-3 w-3" />
            FMCSA Hours-of-Service Compliant
          </div>

          {/* Headline */}
          <h1
            className="fade-up leading-none text-white"
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: "clamp(3.5rem, 10vw, 7.5rem)",
              fontWeight: 900,
              letterSpacing: "-0.01em",
              animationDelay: "80ms",
            }}
          >
            PLAN EVERY{" "}
            <span
              style={{
                background: "linear-gradient(90deg,#f59e0b,#ea580c)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              MILE.
            </span>
            <br />
            STAY LEGAL.
          </h1>

          {/* Sub */}
          <p
            className="fade-up max-w-xl text-base leading-relaxed"
            style={{
              color: "rgba(255,255,255,0.55)",
              animationDelay: "180ms",
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 300,
            }}
          >
            Spotter generates fully compliant truck driver routes — with
            optimised stop schedules, an interactive map, and downloadable ELD
            Daily Log PDFs — in seconds.
          </p>

          {/* CTAs */}
          <div
            className="fade-up flex flex-wrap items-center justify-center gap-3"
            style={{ animationDelay: "280ms" }}
          >
            <Link
              to="/register"
              className="group flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-semibold shadow-lg transition-all duration-200 hover:shadow-amber-500/20 hover:brightness-110"
              style={{
                background: "linear-gradient(135deg,#f59e0b,#ea580c)",
                color: "#fff",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Start planning for free
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/login"
              className="flex items-center gap-2 rounded-xl border px-7 py-3.5 text-sm font-medium transition-all duration-200 hover:bg-white/5"
              style={{
                borderColor: "rgba(255,255,255,0.15)",
                color: "rgba(255,255,255,0.75)",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Sign in
            </Link>
          </div>
        </div>

        {/* Route animation */}
        <div
          className="fade-up relative mt-16 w-full max-w-3xl"
          style={{ animationDelay: "400ms", height: "120px" }}
        >
          <RoutePath />
          <div className="absolute bottom-0 left-[9%] flex flex-col items-center gap-1">
            <MapPin className="h-4 w-4 text-amber-400" />
            <span
              className="text-xs"
              style={{
                color: "rgba(255,255,255,0.4)",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Current
            </span>
          </div>
          <div className="absolute bottom-0 left-[48%] flex flex-col items-center gap-1">
            <MapPin className="h-4 w-4 text-orange-400" />
            <span
              className="text-xs"
              style={{
                color: "rgba(255,255,255,0.4)",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Pickup
            </span>
          </div>
          <div className="absolute bottom-0 right-[9%] flex flex-col items-center gap-1">
            <MapPin className="h-4 w-4 text-red-400" />
            <span
              className="text-xs"
              style={{
                color: "rgba(255,255,255,0.4)",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Dropoff
            </span>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section
        style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div
          className="mx-auto grid max-w-4xl grid-cols-2 gap-px md:grid-cols-4"
          style={{ background: "rgba(255,255,255,0.06)" }}
        >
          {[
            { value: 70, suffix: " hr", label: "HOS Cycle Tracked" },
            { value: 11, suffix: " hr", label: "Daily Drive Limit" },
            { value: 30, suffix: " min", label: "Mandatory Break" },
            { value: 100, suffix: "%", label: "FMCSA Compliant" },
          ].map((s) => (
            <div
              key={s.label}
              className="flex flex-col items-center gap-1 p-8"
              style={{ background: "#07080f" }}
            >
              <span
                className="text-4xl font-black text-white"
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  letterSpacing: "-0.01em",
                }}
              >
                <StatCounter target={s.value} suffix={s.suffix} />
              </span>
              <span
                className="text-center text-xs"
                style={{
                  color: "rgba(255,255,255,0.4)",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="mx-auto max-w-5xl px-6 py-28">
        <div className="mb-14 flex flex-col gap-3">
          <p
            className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-500"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            What it does
          </p>
          <h2
            className="text-white"
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
              fontWeight: 700,
              letterSpacing: "-0.01em",
              lineHeight: 1.1,
            }}
          >
            Everything a driver needs,
            <br />
            <span style={{ color: "rgba(255,255,255,0.35)" }}>
              automatically calculated.
            </span>
          </h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Feature
            icon={Route}
            title="Optimised Route Planning"
            desc="Enter your current location, pickup, and dropoff. Spotter calculates the fastest legal path, accounting for your remaining cycle hours."
            delay={0}
          />
          <Feature
            icon={Clock4}
            title="HOS-Aware Stop Scheduling"
            desc="Automatically inserts required rest breaks, sleeper berth periods, and fuel stops to keep you inside the 11-hour drive / 14-hour on-duty windows."
            delay={80}
          />
          <Feature
            icon={Map}
            title="Interactive Route Map"
            desc="Visualise the full GeoJSON route with colour-coded stop pins — start, pickup, dropoff, fuel, and rest — rendered on a live Leaflet map."
            delay={160}
          />
          <Feature
            icon={FileText}
            title="Downloadable ELD Log PDFs"
            desc="Generate official-format Electronic Logging Device daily log sheets for every driving day, ready to present at inspection."
            delay={240}
          />
          <Feature
            icon={CalendarDays}
            title="Multi-Day Trip Breakdown"
            desc="See a per-day summary of driving, on-duty, off-duty, and sleeper hours, plus cumulative mileage for each segment."
            delay={320}
          />
          <Feature
            icon={ShieldCheck}
            title="FMCSA Regulation Built-In"
            desc="All scheduling logic is built around FMCSA Part 395 — the 70-hour/8-day cycle, 30-minute break rule, and 10-hour off-duty reset."
            delay={400}
          />
        </div>
      </section>

      {/* ── How it works ── */}
      <section
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        className="mx-auto max-w-5xl px-6 py-28"
      >
        <div className="grid gap-16 md:grid-cols-2 md:gap-24">
          <div>
            <p
              className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-amber-500"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              How it works
            </p>
            <h2
              className="mb-6 text-white"
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: "clamp(2rem, 4vw, 3rem)",
                fontWeight: 700,
                lineHeight: 1.1,
              }}
            >
              From address
              <br />
              to legal trip
              <br />
              <span style={{ color: "#f59e0b" }}>in seconds.</span>
            </h2>
            <p
              className="text-sm leading-relaxed"
              style={{
                color: "rgba(255,255,255,0.45)",
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 300,
              }}
            >
              No spreadsheets. No manual HOS calculations. Just enter three
              locations and your current cycle hours — we handle the rest.
            </p>
          </div>

          <div className="flex flex-col pt-2">
            <Step
              n="1"
              title="Create your account"
              desc="Register in seconds. All trips are saved to your account and accessible anytime."
            />
            <Step
              n="2"
              title="Enter trip details"
              desc="Provide your current location, pickup address, dropoff address, and your current 70-hour cycle usage."
            />
            <Step
              n="3"
              title="Get your full trip plan"
              desc="Spotter returns an interactive map, a detailed stop timeline, and ELD-ready daily log PDFs — all compliant with FMCSA regulations."
            />
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        className="px-6 py-28"
      >
        <div
          className="relative mx-auto max-w-3xl overflow-hidden rounded-3xl p-12 text-center"
          style={{
            background:
              "linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(234,88,12,0.12) 100%)",
            border: "1px solid rgba(245,158,11,0.2)",
          }}
        >
          {/* Glow */}
          <div
            className="pointer-events-none absolute inset-0 rounded-3xl"
            style={{
              background:
                "radial-gradient(ellipse 60% 80% at 50% 0%, rgba(245,158,11,0.15), transparent 70%)",
            }}
          />
          <div className="relative z-10 flex flex-col items-center gap-6">
            <Truck className="h-10 w-10 text-amber-400" strokeWidth={1.5} />
            <h2
              className="text-white"
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: "clamp(2rem, 5vw, 3.5rem)",
                fontWeight: 800,
                lineHeight: 1.1,
              }}
            >
              READY TO PLAN
              <br />
              YOUR NEXT RUN?
            </h2>
            <p
              className="max-w-sm text-sm leading-relaxed"
              style={{
                color: "rgba(255,255,255,0.5)",
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 300,
              }}
            >
              Join other drivers using Spotter to stay compliant and spend less
              time on paperwork.
            </p>
            <Link
              to="/register"
              className="group flex items-center gap-2 rounded-xl px-8 py-3.5 text-sm font-semibold transition-all duration-200 hover:brightness-110"
              style={{
                background: "linear-gradient(135deg,#f59e0b,#ea580c)",
                color: "#fff",
                fontFamily: "'DM Sans', sans-serif",
                boxShadow: "0 0 40px rgba(245,158,11,0.3)",
              }}
            >
              Create free account
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        className="px-6 py-8"
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div
              className="flex h-6 w-6 items-center justify-center rounded-md"
              style={{ background: "linear-gradient(135deg,#f59e0b,#ea580c)" }}
            >
              <Truck className="h-3 w-3 text-white" strokeWidth={2} />
            </div>
            <span
              className="font-bold tracking-widest text-white"
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: "0.9rem",
              }}
            >
              SPOTTER
            </span>
          </div>
          <p
            className="text-xs"
            style={{
              color: "rgba(255,255,255,0.25)",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Built for FMCSA Part 395 compliance. Not legal advice.
          </p>
        </div>
      </footer>
    </div>
  );
}
