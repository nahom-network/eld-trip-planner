import { motion } from "framer-motion";
import type { Stop, StopType } from "../types/trip";
import { useTheme } from "../context/ThemeContext";

const MONO = "'DM Mono', monospace";
const BODY = "'DM Sans', sans-serif";

const STOP_DOT_COLOR: Record<StopType, string> = {
  start: "#6366f1",
  pickup: "#22c55e",
  dropoff: "#ef4444",
  fuel: "#f59e0b",
  rest: "#8b5cf6",
  break: "#0ea5e9",
};

const STOP_META: Record<StopType, { label: string; icon: string }> = {
  start: { label: "Start", icon: "🚛" },
  pickup: { label: "Pickup", icon: "📦" },
  dropoff: { label: "Dropoff", icon: "🏁" },
  fuel: { label: "Fuel Stop", icon: "⛽" },
  rest: { label: "10-Hr Rest", icon: "🛏️" },
  break: { label: "30-Min Break", icon: "☕" },
};

function formatDatetime(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

interface StopTimelineProps {
  stops: Stop[];
}

export default function StopTimeline({ stops }: StopTimelineProps) {
  const { colors: C, isDark } = useTheme();

  if (!stops.length)
    return (
      <p className="text-sm" style={{ color: C.muted, fontFamily: BODY }}>
        No stops available.
      </p>
    );

  return (
    <ol
      className="relative ml-3 flex flex-col gap-0"
      style={{ borderLeft: `2px solid ${C.border}` }}
    >
      {stops.map((stop, idx) => {
        const dotColor = STOP_DOT_COLOR[stop.stop_type] ?? "#6366f1";
        const meta = STOP_META[stop.stop_type] ?? {
          label: stop.stop_type_display ?? stop.stop_type,
          icon: "📍",
        };
        return (
          <motion.li
            key={stop.id}
            className="ml-5 pb-7 last:pb-0 relative"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.38,
              ease: [0.22, 1, 0.36, 1],
              delay: idx * 0.06,
            }}
          >
            {/* Dot */}
            <span
              className="absolute -left-[1.65rem] flex items-center justify-center w-4 h-4 rounded-full"
              style={{
                background: dotColor,
                boxShadow: `0 0 8px ${dotColor}88`,
                marginTop: "2px",
              }}
            />

            <div className="flex flex-col gap-0.5">
              {/* Type pill */}
              <span
                className="rounded-full px-2.5 py-0.5 text-xs font-medium w-fit gap-1 inline-flex items-center"
                style={{
                  background: isDark ? `${dotColor}22` : `${dotColor}18`,
                  color: dotColor,
                  border: `1px solid ${dotColor}44`,
                  fontFamily: MONO,
                  letterSpacing: "0.04em",
                }}
              >
                {meta.icon} {meta.label}
              </span>
              <p
                className="text-sm font-medium"
                style={{ color: C.text, fontFamily: BODY }}
              >
                {stop.location_name}
              </p>
              <p
                className="text-xs"
                style={{ color: C.muted, fontFamily: BODY }}
              >
                {formatDatetime(stop.arrival_time)} ·{" "}
                {stop.duration_hours.toFixed(1)} hrs
              </p>
              {stop.cumulative_miles > 0 && (
                <p
                  className="text-xs"
                  style={{ color: C.textFaint, fontFamily: MONO }}
                >
                  {stop.cumulative_miles.toFixed(0)} mi cumulative
                </p>
              )}
            </div>
          </motion.li>
        );
      })}
    </ol>
  );
}
