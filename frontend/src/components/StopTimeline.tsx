import { Badge } from "@/components/ui/badge";
import type { Stop, StopType } from "../types/trip";

const STOP_META: Record<
  StopType,
  {
    label: string;
    icon: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  start: { label: "Start", icon: "🚛", variant: "secondary" },
  pickup: { label: "Pickup", icon: "📦", variant: "default" },
  dropoff: { label: "Dropoff", icon: "🏁", variant: "destructive" },
  fuel: { label: "Fuel Stop", icon: "⛽", variant: "outline" },
  rest: { label: "10-Hr Rest", icon: "🛏️", variant: "outline" },
  break: { label: "30-Min Break", icon: "☕", variant: "outline" },
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
  if (!stops.length)
    return <p className="text-muted-foreground text-sm">No stops available.</p>;

  return (
    <ol className="relative border-l-2 border-gray-200 ml-3 flex flex-col gap-0">
      {stops.map((stop, idx) => {
        const meta = STOP_META[stop.stop_type] ?? {
          label: stop.stop_type_display ?? stop.stop_type,
          icon: "📍",
          variant: "outline" as const,
        };
        return (
          <li key={stop.id} className="ml-5 pb-7 last:pb-0">
            {/* Dot */}
            <span className="absolute -left-[9px] flex items-center justify-center w-4 h-4 rounded-full bg-white border-2 border-gray-300 text-xs">
              <span className="sr-only">{idx + 1}</span>
            </span>

            <div className="flex flex-col gap-0.5">
              <Badge variant={meta.variant} className="w-fit gap-1 text-xs">
                {meta.icon} {meta.label}
              </Badge>
              <p className="text-sm font-medium text-foreground">
                {stop.location_name}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDatetime(stop.arrival_time)} ·{" "}
                {stop.duration_hours.toFixed(1)} hrs
              </p>
              {stop.cumulative_miles > 0 && (
                <p className="text-xs text-muted-foreground">
                  {stop.cumulative_miles.toFixed(0)} mi cumulative
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
