"""
Route service: geocoding via OpenCage + routing via OSRM (public demo server).
OpenCage is free up to 2,500 requests/day. Set OPENCAGE_API_KEY in your .env.
OSRM requires no API key.
"""

import os
from dataclasses import dataclass, field
from typing import List, Tuple

import requests

OPENCAGE_URL = "https://api.opencagedata.com/geocode/v1/json"
OSRM_BASE_URL = "http://router.project-osrm.org/route/v1/driving"

HEADERS = {"User-Agent": "TripPlannerELDApp/1.0"}


class GeocodingError(Exception):
    pass


class RouteError(Exception):
    pass


@dataclass
class RouteLeg:
    """Distance / duration for one section of the route (e.g. current→pickup)."""

    distance_miles: float
    duration_hours: float


@dataclass
class RouteResult:
    distance_miles: float
    duration_hours: float
    polyline_geojson: (
        dict  # GeoJSON LineString {"type":"LineString","coordinates":[...]}
    )
    legs: List[RouteLeg] = field(default_factory=list)


def geocode(location: str) -> Tuple[float, float]:
    """
    Return (lat, lng) for the given location string using OpenCage.
    Requires OPENCAGE_API_KEY environment variable.
    Raises GeocodingError when the location cannot be resolved.
    """
    api_key = os.getenv("OPENCAGE_API_KEY", "")
    if not api_key:
        raise GeocodingError(
            "OPENCAGE_API_KEY is not set. Get a free key at https://opencagedata.com/"
        )

    try:
        response = requests.get(
            OPENCAGE_URL,
            params={"q": location, "key": api_key, "limit": 1, "no_annotations": 1},
            headers=HEADERS,
            timeout=10,
        )
        response.raise_for_status()
    except requests.RequestException as exc:
        raise GeocodingError(f"Network error geocoding '{location}': {exc}") from exc

    data = response.json()
    results = data.get("results", [])
    if not results:
        raise GeocodingError(f"No geocoding results for '{location}'")

    geometry = results[0]["geometry"]
    return float(geometry["lat"]), float(geometry["lng"])


def get_route(waypoints: List[Tuple[float, float]]) -> RouteResult:
    """
    Return a RouteResult for a list of (lat, lng) waypoints.
    Calls the OSRM demo server.
    Raises RouteError on failure.
    """
    if len(waypoints) < 2:
        raise RouteError("At least two waypoints are required")

    # OSRM expects lng,lat order
    coords_str = ";".join(f"{lng},{lat}" for lat, lng in waypoints)
    url = f"{OSRM_BASE_URL}/{coords_str}"

    try:
        response = requests.get(
            url,
            params={"overview": "full", "geometries": "geojson", "steps": "false"},
            headers=HEADERS,
            timeout=15,
        )
        response.raise_for_status()
    except requests.RequestException as exc:
        raise RouteError(f"Network error fetching route: {exc}") from exc

    data = response.json()
    if data.get("code") != "Ok":
        raise RouteError(
            f"OSRM returned non-Ok code: {data.get('code')} — {data.get('message', '')}"
        )

    route = data["routes"][0]
    total_distance_m = route["distance"]
    total_duration_s = route["duration"]

    total_distance_miles = total_distance_m / 1609.344
    total_duration_hours = total_duration_s / 3600.0

    polyline_geojson = route["geometry"]  # GeoJSON LineString

    legs = []
    for leg in route.get("legs", []):
        legs.append(
            RouteLeg(
                distance_miles=leg["distance"] / 1609.344,
                duration_hours=leg["duration"] / 3600.0,
            )
        )

    return RouteResult(
        distance_miles=total_distance_miles,
        duration_hours=total_duration_hours,
        polyline_geojson=polyline_geojson,
        legs=legs,
    )
