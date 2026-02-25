import { motion } from "framer-motion";
import { FileDown, Loader2 } from "lucide-react";
import type { DailyLog } from "../types/trip";
import { useTheme } from "../context/ThemeContext";

const MONO = "'DM Mono', monospace";
const BODY = "'DM Sans', sans-serif";

const STAT_DARK = {
  drive: { bg: "rgba(34,197,94,0.1)", text: "#4ade80" },
  duty: { bg: "rgba(14,165,233,0.1)", text: "#38bdf8" },
  off: { bg: "rgba(148,163,184,0.1)", text: "#94a3b8" },
  sleep: { bg: "rgba(139,92,246,0.1)", text: "#a78bfa" },
};

const STAT_LIGHT = {
  drive: { bg: "#dcfce7", text: "#166534" },
  duty: { bg: "#e0f2fe", text: "#0369a1" },
  off: { bg: "#f1f5f9", text: "#475569" },
  sleep: { bg: "#f3e8ff", text: "#7e22ce" },
};

interface DailyLogCardProps {
  log: DailyLog;
  index: number;
}

function DailyLogCard({ log, index }: DailyLogCardProps) {
  const { colors: C, isDark } = useTheme();
  const STAT = isDark ? STAT_DARK : STAT_LIGHT;

  const openPdf = () => {
    if (log.pdf_url) window.open(log.pdf_url, "_blank", "noopener,noreferrer");
  };

  return (
    <motion.div
      className="rounded-2xl p-4 flex flex-col gap-3"
      style={{
        background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
        border: `1px solid ${C.border}`,
      }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1],
        delay: index * 0.07,
      }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            className="font-semibold text-sm"
            style={{ color: C.text, fontFamily: BODY }}
          >
            Day {log.day_number}
          </p>
          <p
            className="text-xs mt-0.5"
            style={{ color: C.muted, fontFamily: BODY }}
          >
            {log.date} · {log.from_location} → {log.to_location}
          </p>
          <p
            className="text-xs mt-0.5"
            style={{ color: C.textFaint, fontFamily: MONO }}
          >
            {log.total_miles.toFixed(0)} mi · {log.cycle_hours_used.toFixed(1)}{" "}
            cycle hrs
          </p>
        </div>
        <motion.button
          onClick={openPdf}
          disabled={!log.pdf_url}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium shrink-0"
          style={{
            background: log.pdf_url ? C.grad : "rgba(255,255,255,0.06)",
            color: log.pdf_url ? "#fff" : C.muted,
            border: log.pdf_url ? "none" : `1px solid ${C.border}`,
            cursor: log.pdf_url ? "pointer" : "not-allowed",
            fontFamily: BODY,
            opacity: log.pdf_url ? 1 : 0.65,
          }}
          whileHover={log.pdf_url ? { scale: 1.04 } : {}}
          whileTap={log.pdf_url ? { scale: 0.97 } : {}}
          title={
            log.pdf_url
              ? "Download ELD log PDF"
              : "PDF is still being generated"
          }
        >
          {log.pdf_url ? (
            <>
              <FileDown className="w-3.5 h-3.5" /> PDF
            </>
          ) : (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating…
            </>
          )}
        </motion.button>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: C.border }} />

      {/* Stat chips */}
      <div className="grid grid-cols-2 gap-2">
        {[
          {
            key: "drive" as const,
            label: "Driving",
            value: log.total_driving_hours,
          },
          {
            key: "duty" as const,
            label: "On Duty",
            value: log.total_on_duty_hours,
          },
          {
            key: "off" as const,
            label: "Off Duty",
            value: log.total_off_duty_hours,
          },
          {
            key: "sleep" as const,
            label: "Sleeper Berth",
            value: log.total_sleeper_hours,
          },
        ].map(({ key, label, value }) => (
          <div
            key={key}
            className="rounded-lg px-2.5 py-1.5"
            style={{
              background: STAT[key].bg,
              color: STAT[key].text,
            }}
          >
            <p className="font-semibold text-xs" style={{ fontFamily: MONO }}>
              {value.toFixed(1)} hrs
            </p>
            <p className="text-xs opacity-75" style={{ fontFamily: BODY }}>
              {label}
            </p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

interface DailyLogsPanelProps {
  logs: DailyLog[];
}

export default function DailyLogsPanel({ logs }: DailyLogsPanelProps) {
  const { colors: C } = useTheme();

  if (!logs.length)
    return (
      <p className="text-sm" style={{ color: C.muted, fontFamily: BODY }}>
        No daily logs available.
      </p>
    );

  return (
    <div className="flex flex-col gap-3">
      {logs.map((log, i) => (
        <DailyLogCard key={log.id} log={log} index={i} />
      ))}
    </div>
  );
}
