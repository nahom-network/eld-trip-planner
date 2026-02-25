"""
TDD tests for the Trip API views.
All external HTTP calls (geocoding, OSRM) are mocked so tests run offline.
"""

import uuid
from unittest.mock import MagicMock, patch

from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from trip.models import DailyLog, Stop, Trip
from trip.services.hos_engine import CycleExceededError
from trip.services.route_service import (
    GeocodingError,
    RouteError,
    RouteLeg,
    RouteResult,
)

# ── Shared mocks ─────────────────────────────────────────────────────────────

MOCK_GEOCODE_COORDS = {
    "Chicago, IL": (41.8781, -87.6298),
    "Milwaukee, WI": (43.0389, -87.9065),
    "Indianapolis, IN": (39.7684, -86.1581),
}


def mock_geocode(location: str):
    return MOCK_GEOCODE_COORDS.get(location, (40.0, -80.0))


MOCK_ROUTE = RouteResult(
    distance_miles=340.0,
    duration_hours=5.5,
    polyline_geojson={
        "type": "LineString",
        "coordinates": [[-87.6, 41.8], [-86.2, 39.8]],
    },
    legs=[
        RouteLeg(distance_miles=90.0, duration_hours=1.5),
        RouteLeg(distance_miles=250.0, duration_hours=4.0),
    ],
)

VALID_PAYLOAD = {
    "current_location": "Chicago, IL",
    "pickup_location": "Milwaukee, WI",
    "dropoff_location": "Indianapolis, IN",
    "current_cycle_used": 20.0,
}


def patch_externals(func):
    """Decorator that mocks geocode + get_route for a test method."""
    func = patch("trip.views.geocode", side_effect=mock_geocode)(func)
    func = patch("trip.views.get_route", return_value=MOCK_ROUTE)(func)
    return func


# ── TripCreateView tests ─────────────────────────────────────────────────────


class TripCreateViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = reverse("trip-create")
        self.user = User.objects.create_user(username="testdriver", password="pass")
        self.client.force_authenticate(user=self.user)

    @patch_externals
    def test_create_trip_returns_201(self, mock_get_route, mock_geocode):
        response = self.client.post(self.url, VALID_PAYLOAD, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    @patch_externals
    def test_create_trip_persists_trip(self, mock_get_route, mock_geocode):
        self.client.post(self.url, VALID_PAYLOAD, format="json")
        self.assertEqual(Trip.objects.count(), 1)
        trip = Trip.objects.first()
        self.assertEqual(trip.status, "completed")

    @patch_externals
    def test_create_trip_persists_stops(self, mock_get_route, mock_geocode):
        self.client.post(self.url, VALID_PAYLOAD, format="json")
        trip = Trip.objects.first()
        self.assertGreater(trip.stops.count(), 0)

    @patch_externals
    def test_create_trip_persists_daily_logs(self, mock_get_route, mock_geocode):
        self.client.post(self.url, VALID_PAYLOAD, format="json")
        trip = Trip.objects.first()
        self.assertGreater(trip.daily_logs.count(), 0)

    @patch_externals
    def test_response_contains_route_polyline(self, mock_get_route, mock_geocode):
        response = self.client.post(self.url, VALID_PAYLOAD, format="json")
        data = response.json()
        self.assertIn("route_polyline", data)
        self.assertEqual(data["route_polyline"]["type"], "LineString")

    @patch_externals
    def test_response_contains_stops(self, mock_get_route, mock_geocode):
        response = self.client.post(self.url, VALID_PAYLOAD, format="json")
        data = response.json()
        self.assertIn("stops", data)
        self.assertIsInstance(data["stops"], list)
        self.assertGreater(len(data["stops"]), 0)

    @patch_externals
    def test_response_contains_daily_logs(self, mock_get_route, mock_geocode):
        response = self.client.post(self.url, VALID_PAYLOAD, format="json")
        data = response.json()
        self.assertIn("daily_logs", data)
        self.assertGreater(len(data["daily_logs"]), 0)

    @patch_externals
    def test_daily_log_has_pdf_url(self, mock_get_route, mock_geocode):
        response = self.client.post(self.url, VALID_PAYLOAD, format="json")
        data = response.json()
        log = data["daily_logs"][0]
        self.assertIn("pdf_url", log)
        self.assertIsNotNone(log["pdf_url"])

    def test_missing_current_location_returns_400(self):
        payload = {**VALID_PAYLOAD}
        del payload["current_location"]
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cycle_hours_70_returns_400(self):
        payload = {**VALID_PAYLOAD, "current_cycle_used": 70.0}
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_negative_cycle_hours_returns_400(self):
        payload = {**VALID_PAYLOAD, "current_cycle_used": -1.0}
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_geocoding_error_returns_422(self):
        with patch("trip.views.geocode", side_effect=GeocodingError("Not found")):
            response = self.client.post(self.url, VALID_PAYLOAD, format="json")
        self.assertEqual(response.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        self.assertIn("error", response.json())

    def test_route_error_returns_422(self):
        with patch("trip.views.geocode", side_effect=mock_geocode):
            with patch("trip.views.get_route", side_effect=RouteError("No route")):
                response = self.client.post(self.url, VALID_PAYLOAD, format="json")
        self.assertEqual(response.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)

    @patch_externals
    def test_trip_has_correct_distance(self, mock_get_route, mock_geocode):
        response = self.client.post(self.url, VALID_PAYLOAD, format="json")
        data = response.json()
        self.assertAlmostEqual(data["total_distance_miles"], 340.0, places=0)

    @patch_externals
    def test_stop_types_present(self, mock_get_route, mock_geocode):
        response = self.client.post(self.url, VALID_PAYLOAD, format="json")
        types = {s["stop_type"] for s in response.json()["stops"]}
        self.assertIn("start", types)
        self.assertIn("pickup", types)
        self.assertIn("dropoff", types)


# ── TripDetailView tests ──────────────────────────────────────────────────────


class TripDetailViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username="testdriver", password="pass")
        self.client.force_authenticate(user=self.user)

    @patch("trip.views.geocode", side_effect=mock_geocode)
    @patch("trip.views.get_route", return_value=MOCK_ROUTE)
    def _create_trip(self, mock_get_route, mock_geocode):
        url = reverse("trip-create")
        response = self.client.post(url, VALID_PAYLOAD, format="json")
        return response.json()

    def test_retrieve_trip_returns_200(self):
        created = self._create_trip()
        url = reverse("trip-detail", kwargs={"pk": created["id"]})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve_nonexistent_trip_returns_404(self):
        url = reverse("trip-detail", kwargs={"pk": uuid.uuid4()})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_retrieve_contains_stops(self):
        created = self._create_trip()
        url = reverse("trip-detail", kwargs={"pk": created["id"]})
        response = self.client.get(url)
        self.assertIn("stops", response.json())


# ── LogPDFView tests ──────────────────────────────────────────────────────────


class LogPDFViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username="testdriver", password="pass")
        self.client.force_authenticate(user=self.user)

    @patch("trip.views.geocode", side_effect=mock_geocode)
    @patch("trip.views.get_route", return_value=MOCK_ROUTE)
    def _create_trip(self, mock_get_route, mock_geocode):
        url = reverse("trip-create")
        response = self.client.post(url, VALID_PAYLOAD, format="json")
        return response.json()

    def test_pdf_endpoint_returns_pdf(self):
        trip_data = self._create_trip()
        trip_id = trip_data["id"]
        url = reverse("log-pdf", kwargs={"pk": trip_id, "day_number": 1})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response["Content-Type"], "application/pdf")

    def test_pdf_bytes_start_with_pdf_header(self):
        trip_data = self._create_trip()
        trip_id = trip_data["id"]
        url = reverse("log-pdf", kwargs={"pk": trip_id, "day_number": 1})
        response = self.client.get(url)
        content = b"".join(response.streaming_content)
        self.assertTrue(content.startswith(b"%PDF"))

    def test_pdf_nonexistent_log_returns_404(self):
        url = reverse("log-pdf", kwargs={"pk": uuid.uuid4(), "day_number": 1})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
