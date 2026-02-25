import { FileDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { DailyLog } from "../types/trip";

interface DailyLogCardProps {
  log: DailyLog;
}

function DailyLogCard({ log }: DailyLogCardProps) {
  const openPdf = () => {
    if (log.pdf_url) window.open(log.pdf_url, "_blank", "noopener,noreferrer");
  };

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
        <div>
          <p className="font-semibold text-sm">Day {log.day_number}</p>
          <p className="text-xs text-muted-foreground">
            {log.date} · {log.from_location} → {log.to_location}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {log.total_miles.toFixed(0)} mi · {log.cycle_hours_used.toFixed(1)}{" "}
            cycle hrs used
          </p>
        </div>
        <Button
          size="sm"
          variant={log.pdf_url ? "default" : "outline"}
          disabled={!log.pdf_url}
          onClick={openPdf}
          className="gap-1.5 shrink-0"
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
        </Button>
      </CardHeader>
      <Separator />
      <CardContent className="pt-3">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <Stat
            label="Driving"
            value={log.total_driving_hours}
            cls="text-green-700 bg-green-50"
          />
          <Stat
            label="On Duty"
            value={log.total_on_duty_hours}
            cls="text-sky-700 bg-sky-50"
          />
          <Stat
            label="Off Duty"
            value={log.total_off_duty_hours}
            cls="text-slate-600 bg-slate-50"
          />
          <Stat
            label="Sleeper Berth"
            value={log.total_sleeper_hours}
            cls="text-purple-700 bg-purple-50"
          />
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({
  label,
  value,
  cls,
}: {
  label: string;
  value: number;
  cls: string;
}) {
  return (
    <div className={`rounded-lg px-2.5 py-1.5 ${cls}`}>
      <p className="font-semibold">{value.toFixed(1)} hrs</p>
      <p className="text-muted-foreground">{label}</p>
    </div>
  );
}

interface DailyLogsPanelProps {
  logs: DailyLog[];
}

export default function DailyLogsPanel({ logs }: DailyLogsPanelProps) {
  if (!logs.length)
    return (
      <p className="text-muted-foreground text-sm">No daily logs available.</p>
    );

  return (
    <div className="flex flex-col gap-3">
      {logs.map((log) => (
        <DailyLogCard key={log.id} log={log} />
      ))}
    </div>
  );
}
