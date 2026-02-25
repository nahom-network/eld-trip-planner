import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { lazy, Suspense } from "react";
import {
  Loader2,
  ArrowLeft,
  AlertCircle,
  MapPin,
  Clock,
  Route,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getTrip } from "../api/tripsApi";
import StopTimeline from "../components/StopTimeline";
import DailyLogsPanel from "../components/DailyLogsPanel";

// Lazily import RouteMap so Leaflet (large, SSR-unsafe) only loads when needed
const RouteMap = lazy(() => import("../components/RouteMap"));

export default function ResultsPage() {
  const { id } = useParams<{ id: string }>();

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
    // Poll every 2 s while the backend is still processing
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "pending" ? 2000 : false;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-muted/40">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-primary font-medium">Loading trip…</p>
      </div>
    );
  }

  if (isError || !trip) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 p-8">
        <AlertCircle className="w-10 h-10 text-destructive" />
        <p className="text-destructive font-semibold text-lg">
          Failed to load trip.
        </p>
        <p className="text-muted-foreground text-sm">
          {(error as Error)?.message ?? "Unknown error."}
        </p>
        <Button variant="outline" asChild className="mt-2">
          <Link to="/">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to planner
          </Link>
        </Button>
      </div>
    );
  }

  // Trip is still processing
  if (trip.status === "pending") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-muted/40">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-primary font-semibold text-lg">
          Planning your route…
        </p>
        <p className="text-muted-foreground text-sm">
          Calculating HOS-compliant stops. This usually takes a few seconds.
        </p>
      </div>
    );
  }

  // Trip failed on the server
  if (trip.status === "error") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 p-8">
        <AlertCircle className="w-10 h-10 text-destructive" />
        <p className="text-destructive font-semibold text-lg">
          Trip planning failed.
        </p>
        <p className="text-muted-foreground text-sm">
          {trip.error_message || "An unexpected error occurred."}
        </p>
        <Button variant="outline" asChild className="mt-2">
          <Link to="/">
            <ArrowLeft className="w-4 h-4 mr-1" /> Try again
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background border-b px-6 py-3 flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold">Trip #{trip.id}</h1>
            <Badge variant="secondary">{trip.status_display}</Badge>
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {trip.current_location} → {trip.pickup_location} →{" "}
            {trip.dropoff_location}
          </p>
          {(trip.total_distance_miles || trip.estimated_duration_hours) && (
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              {trip.total_distance_miles && (
                <span className="flex items-center gap-1">
                  <Route className="w-3 h-3" />
                  {trip.total_distance_miles.toFixed(0)} mi
                </span>
              )}
              {trip.estimated_duration_hours && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {trip.estimated_duration_hours.toFixed(1)} hrs
                </span>
              )}
            </p>
          )}
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/dashboard">
            <ArrowLeft className="w-4 h-4 mr-1" /> New Trip
          </Link>
        </Button>
      </header>

      {/* Main layout: map left, side panel right */}
      <div className="flex flex-col lg:flex-row h-[calc(100vh-72px)]">
        {/* Map */}
        <div className="flex-1 min-h-[320px] lg:min-h-0">
          <Suspense
            fallback={
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            }
          >
            <RouteMap trip={trip} />
          </Suspense>
        </div>

        {/* Side panel */}
        <aside className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l bg-background">
          <ScrollArea className="h-full">
            <div className="p-5 flex flex-col gap-7">
              {/* Stops */}
              <section>
                <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
                  Stops
                </h2>
                <StopTimeline stops={trip.stops} />
              </section>

              <Separator />

              {/* ELD Logs */}
              <section>
                <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
                  Daily ELD Logs
                </h2>
                <DailyLogsPanel logs={trip.daily_logs} />
              </section>
            </div>
          </ScrollArea>
        </aside>
      </div>
    </div>
  );
}
