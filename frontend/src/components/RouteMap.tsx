import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Trip, Stop, GeoJSONLineString } from "../types/trip";

// Fix default marker icons broken by Webpack/Vite asset hashing
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)
  ._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL(
    "leaflet/dist/images/marker-icon-2x.png",
    import.meta.url,
  ).href,
  iconUrl: new URL("leaflet/dist/images/marker-icon.png", import.meta.url).href,
  shadowUrl: new URL("leaflet/dist/images/marker-shadow.png", import.meta.url)
    .href,
});

const STOP_COLORS: Record<string, string> = {
  start: "#6366f1",
  pickup: "#22c55e",
  dropoff: "#ef4444",
  fuel: "#f59e0b",
  rest: "#8b5cf6",
  break: "#0ea5e9",
};

function stopIcon(type: string) {
  const color = STOP_COLORS[type] ?? "#6b7280";
  return L.divIcon({
    className: "",
    html: `<div style="width:14px;height:14px;background:${color};border:2px solid white;border-radius:50%;box-shadow:0 1px 3px rgba(0,0,0,.4)"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -10],
  });
}

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

// Visible fit bounds (what FitUSA snaps to)
const US_BOUNDS: L.LatLngBoundsExpression = [
  [22.0, -141.0], // SW
  [83.0, -52.0], // NE
];

// Hard pan limit — wider than US_BOUNDS so the edges aren't visible when
// zoomed out to minZoom; gives breathing room without letting the map go blank.
const MAX_BOUNDS: L.LatLngBoundsExpression = [
  [10.0, -160.0], // SW — extra room south + west
  [88.0, -35.0], // NE — extra room north + east
];

// const NORTH_AMERICA_BOUNDS: L.LatLngBoundsExpression = [
//   [22.0, -141.0], // SW (southern US + western Canada edge)
//   [83.0, -52.0],  // NE (Arctic Canada + Newfoundland)
// ];

function FitBounds({ polyline }: { polyline: GeoJSONLineString }) {
  const map = useMap();
  useEffect(() => {
    if (!polyline?.coordinates?.length) return;
    const bounds = L.latLngBounds(
      polyline.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]),
    );
    map.fitBounds(bounds, { padding: [60, 60] });
  }, [map, polyline]);
  return null;
}

function FitUSA() {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(US_BOUNDS, { padding: [20, 20] });
  }, [map]);
  return null;
}

interface RouteMapProps {
  trip: Trip;
}

export default function RouteMap({ trip }: RouteMapProps) {
  const hasRoute = (trip.route_polyline?.coordinates?.length ?? 0) > 0;

  return (
    // Wrapper creates an isolated stacking context so Leaflet's internal
    // z-indices (400–600) don't escape and overlap the sticky page header.
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        zIndex: 0,
        isolation: "isolate",
      }}
    >
      <MapContainer
        center={[39.5, -98.35]}
        zoom={4}
        minZoom={3}
        maxBounds={MAX_BOUNDS}
        maxBoundsViscosity={1.0}
        className="w-full h-full rounded-xl"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {trip.route_polyline && hasRoute && (
          <>
            <GeoJSON
              data={trip.route_polyline}
              style={{ color: "#4f46e5", weight: 4, opacity: 0.8 }}
            />
            <FitBounds polyline={trip.route_polyline} />
          </>
        )}

        {!hasRoute && <FitUSA />}

        {trip.stops
          .filter((stop: Stop) => stop.lat != null && stop.lng != null)
          .map((stop: Stop) => (
            <Marker
              key={stop.id}
              position={[stop.lat!, stop.lng!]}
              icon={stopIcon(stop.stop_type)}
            >
              <Popup>
                <div className="text-sm leading-relaxed">
                  <p className="font-semibold">{stop.stop_type_display}</p>
                  <p className="text-gray-600">{stop.location_name}</p>
                  <p className="text-gray-500 text-xs mt-1">
                    Arrival: {formatDatetime(stop.arrival_time)}
                  </p>
                  <p className="text-gray-500 text-xs">
                    Duration: {stop.duration_hours.toFixed(1)} hrs
                  </p>
                  {stop.notes && (
                    <p className="text-gray-400 text-xs italic mt-1">
                      {stop.notes}
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
      </MapContainer>
    </div>
  );
}
