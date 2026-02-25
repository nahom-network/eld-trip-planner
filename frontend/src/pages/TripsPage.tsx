import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Plus,
  Truck,
  LogOut,
  Route,
  Clock,
  AlertCircle,
  Loader2,
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
import { useAuth } from "../context/AuthContext";
import { listTrips } from "../api/tripsApi";
import type { TripList, TripStatus } from "../types/trip";

const STATUS_VARIANT: Record<
  TripStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  completed: "default",
  pending: "secondary",
  error: "destructive",
};

function TripCard({ trip }: { trip: TripList }) {
  const createdAt = new Date(trip.created_at).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Link to={`/trips/${trip.id}`} className="block group">
      <Card className="transition-shadow group-hover:shadow-md">
        <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
          <div className="flex flex-col gap-0.5 min-w-0">
            <CardTitle className="text-sm font-semibold truncate">
              {trip.current_location} → {trip.dropoff_location}
            </CardTitle>
            <CardDescription className="text-xs truncate">
              via {trip.pickup_location}
            </CardDescription>
          </div>
          <Badge
            variant={STATUS_VARIANT[trip.status]}
            className="shrink-0 ml-2 capitalize"
          >
            {trip.status}
          </Badge>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {trip.total_distance_miles != null && (
              <span className="flex items-center gap-1">
                <Route className="w-3 h-3" />
                {trip.total_distance_miles.toFixed(0)} mi
              </span>
            )}
            {trip.estimated_duration_hours != null && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {trip.estimated_duration_hours.toFixed(1)} hrs
              </span>
            )}
            <span className="ml-auto">{createdAt}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function TripsPage() {
  const { user, logout } = useAuth();

  const {
    data: trips,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["trips"],
    queryFn: listTrips,
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-background border-b px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Truck className="w-5 h-5 text-primary" />
          <span className="font-bold text-base">Trip Planner</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground hidden sm:block">
            {user?.username}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="gap-1.5"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </Button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-6">
        {/* Page title + new trip button */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">My Trips</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              All your planned routes in one place.
            </p>
          </div>
          <Button asChild size="sm" className="gap-1.5">
            <Link to="/trips/new">
              <Plus className="w-4 h-4" />
              New trip
            </Link>
          </Button>
        </div>

        <Separator />

        {/* Trip list */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-destructive">
            <AlertCircle className="w-8 h-8" />
            <p className="text-sm font-medium">Failed to load trips.</p>
          </div>
        )}

        {trips && trips.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
            <Truck className="w-10 h-10" />
            <p className="text-sm">No trips yet.</p>
            <Button
              asChild
              size="sm"
              variant="outline"
              className="gap-1.5 mt-1"
            >
              <Link to="/trips/new">
                <Plus className="w-4 h-4" />
                Plan your first trip
              </Link>
            </Button>
          </div>
        )}

        {trips && trips.length > 0 && (
          <div className="flex flex-col gap-3">
            {trips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
