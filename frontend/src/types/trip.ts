// ── GeoJSON ────────────────────────────────────────────────────────────────
export interface GeoJSONLineString {
  type: "LineString";
  coordinates: [number, number][];
}

// ── Stop ───────────────────────────────────────────────────────────────────
/** Matches StopTypeEnum in the API schema */
export type StopType =
  | "start"
  | "pickup"
  | "dropoff"
  | "fuel"
  | "rest"
  | "break";

export interface Stop {
  id: string; // UUID
  stop_type: StopType;
  stop_type_display: string;
  location_name: string;
  lat: number | null;
  lng: number | null;
  arrival_time: string; // ISO datetime
  departure_time: string; // ISO datetime
  duration_hours: number;
  cumulative_miles: number;
  order: number;
  notes: string;
}

// ── Daily Log ──────────────────────────────────────────────────────────────
export interface DailyLog {
  id: string; // UUID
  date: string; // YYYY-MM-DD
  day_number: number; // 1-based
  activities: unknown;
  total_driving_hours: number;
  total_on_duty_hours: number;
  total_off_duty_hours: number;
  total_sleeper_hours: number;
  cycle_hours_used: number;
  from_location: string;
  to_location: string;
  total_miles: number;
  pdf_url: string | null;
}

// ── Trip ───────────────────────────────────────────────────────────────────
export type TripStatus = "pending" | "completed" | "error";

export interface Trip {
  id: string; // UUID
  current_location: string;
  pickup_location: string;
  dropoff_location: string;
  current_cycle_used: number;
  current_lat: number | null;
  current_lng: number | null;
  pickup_lat: number | null;
  pickup_lng: number | null;
  dropoff_lat: number | null;
  dropoff_lng: number | null;
  total_distance_miles: number | null;
  estimated_duration_hours: number | null;
  route_polyline: GeoJSONLineString | null;
  status: TripStatus;
  status_display: string;
  error_message: string;
  created_at: string;
  stops: Stop[];
  daily_logs: DailyLog[];
}

/** Lightweight shape returned by GET /api/trips/ */
export interface TripList {
  id: string; // UUID
  current_location: string;
  pickup_location: string;
  dropoff_location: string;
  current_cycle_used: number;
  status: TripStatus;
  total_distance_miles: number | null;
  estimated_duration_hours: number | null;
  created_at: string;
}

// ── Request / response ─────────────────────────────────────────────────────
export interface CreateTripPayload {
  current_location: string;
  pickup_location: string;
  dropoff_location: string;
  current_cycle_used: number;
}

/** POST /api/trips/ 201 response — same shape as TripCreate in the schema */
export interface CreateTripResponse {
  id: string; // UUID
}

// ── Auth ───────────────────────────────────────────────────────────────────
export interface User {
  id: number;
  username: string;
  email: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
}
