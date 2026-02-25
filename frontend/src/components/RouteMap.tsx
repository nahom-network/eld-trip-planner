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

function FitBounds({ polyline }: { polyline: GeoJSONLineString }) {
  const map = useMap();
  useEffect(() => {
    if (!polyline?.coordinates?.length) return;
    const bounds = L.latLngBounds(
      polyline.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]),
    );
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [map, polyline]);
  return null;
}

interface RouteMapProps {
  trip: Trip;
}

// Continental US bounds with a small buffer so borders don't feel too tight
// const US_BOUNDS: L.LatLngBoundsExpression = [
//   [22.0, -128.0], // SW — below Hawaii / west of CA
//   [52.0, -62.0], // NE — above Canada border / east of ME
// ];

export default function RouteMap({ trip }: RouteMapProps) {
  return (
    <MapContainer
      center={[39.5, -98.35]}
      zoom={4}
      minZoom={4}
      //   maxBounds={US_BOUNDS}
      maxBoundsViscosity={1.0}
      className="w-full h-full rounded-xl"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {trip.route_polyline &&
        (trip.route_polyline.coordinates?.length ?? 0) > 0 && (
          <>
            <GeoJSON
              data={trip.route_polyline}
              style={{ color: "#4f46e5", weight: 4, opacity: 0.8 }}
            />
            <FitBounds polyline={trip.route_polyline} />
          </>
        )}

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
  );
}
