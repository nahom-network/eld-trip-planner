from unittest.mock import MagicMock, patch

from django.test import TestCase

from trip.services.route_service import (
    GeocodingError,
    RouteError,
    RouteLeg,
    RouteResult,
    geocode,
    get_route,
)

OPENCAGE_RESPONSE = {
    "results": [
        {
            "geometry": {"lat": 41.8781, "lng": -87.6298},
            "formatted": "Chicago, Cook County, Illinois, United States",
        }
    ],
    "status": {"code": 200, "message": "OK"},
}

OSRM_RESPONSE = {
    "code": "Ok",
    "routes": [
        {
            "distance": 148139.0,  # ~92 miles
            "duration": 5400.0,  # 1.5 hours
            "geometry": {
                "type": "LineString",
                "coordinates": [[-87.6298, 41.8781], [-86.1581, 39.7684]],
            },
            "legs": [
                {"distance": 80000.0, "duration": 2700.0},
                {"distance": 68139.0, "duration": 2700.0},
            ],
        }
    ],
}


class GeocodeTest(TestCase):
    @patch("trip.services.route_service.os.getenv", return_value="test-api-key")
    @patch("trip.services.route_service.requests.get")
    def test_geocode_success(self, mock_get, mock_getenv):
        mock_resp = MagicMock()
        mock_resp.json.return_value = OPENCAGE_RESPONSE
        mock_resp.raise_for_status.return_value = None
        mock_get.return_value = mock_resp

        lat, lng = geocode("Chicago, IL")
        self.assertAlmostEqual(lat, 41.8781)
        self.assertAlmostEqual(lng, -87.6298)

    @patch("trip.services.route_service.os.getenv", return_value="test-api-key")
    @patch("trip.services.route_service.requests.get")
    def test_geocode_no_results_raises(self, mock_get, mock_getenv):
        mock_resp = MagicMock()
        mock_resp.json.return_value = {"results": [], "status": {"code": 200}}
        mock_resp.raise_for_status.return_value = None
        mock_get.return_value = mock_resp

        with self.assertRaises(GeocodingError) as ctx:
            geocode("NonexistentPlace123456")
        self.assertIn("No geocoding results", str(ctx.exception))

    def test_geocode_missing_api_key_raises(self):
        with self.assertRaises(GeocodingError) as ctx:
            with patch("trip.services.route_service.os.getenv", return_value=""):
                geocode("Chicago, IL")
        self.assertIn("OPENCAGE_API_KEY", str(ctx.exception))

    @patch("trip.services.route_service.os.getenv", return_value="test-api-key")
    @patch("trip.services.route_service.requests.get")
    def test_geocode_network_error_raises(self, mock_get, mock_getenv):
        import requests as req

        mock_get.side_effect = req.ConnectionError("network down")

        with self.assertRaises(GeocodingError) as ctx:
            geocode("Chicago, IL")
        self.assertIn("Network error", str(ctx.exception))


class GetRouteTest(TestCase):
    @patch("trip.services.route_service.requests.get")
    def test_get_route_success(self, mock_get):
        mock_resp = MagicMock()
        mock_resp.json.return_value = OSRM_RESPONSE
        mock_resp.raise_for_status.return_value = None
        mock_get.return_value = mock_resp

        result = get_route(
            [(41.8781, -87.6298), (43.0389, -87.9065), (39.7684, -86.1581)]
        )

        self.assertIsInstance(result, RouteResult)
        self.assertAlmostEqual(result.distance_miles, 148139.0 / 1609.344, places=1)
        self.assertAlmostEqual(result.duration_hours, 5400.0 / 3600.0, places=2)
        self.assertEqual(result.polyline_geojson["type"], "LineString")
        self.assertEqual(len(result.legs), 2)
        self.assertIsInstance(result.legs[0], RouteLeg)

    @patch("trip.services.route_service.requests.get")
    def test_get_route_osrm_error_code_raises(self, mock_get):
        mock_resp = MagicMock()
        mock_resp.json.return_value = {
            "code": "NoRoute",
            "message": "Could not find route",
        }
        mock_resp.raise_for_status.return_value = None
        mock_get.return_value = mock_resp

        with self.assertRaises(RouteError) as ctx:
            get_route([(0.0, 0.0), (1.0, 1.0)])
        self.assertIn("NoRoute", str(ctx.exception))

    @patch("trip.services.route_service.requests.get")
    def test_get_route_http_error_raises(self, mock_get):
        import requests as req

        mock_get.side_effect = req.HTTPError("500 Server Error")

        with self.assertRaises(RouteError):
            get_route([(41.8781, -87.6298), (39.7684, -86.1581)])

    def test_get_route_too_few_waypoints_raises(self):
        with self.assertRaises(RouteError) as ctx:
            get_route([(41.8781, -87.6298)])
        self.assertIn("two waypoints", str(ctx.exception))

    @patch("trip.services.route_service.requests.get")
    def test_leg_distances_sum_close_to_total(self, mock_get):
        mock_resp = MagicMock()
        mock_resp.json.return_value = OSRM_RESPONSE
        mock_resp.raise_for_status.return_value = None
        mock_get.return_value = mock_resp

        result = get_route(
            [(41.8781, -87.6298), (43.0389, -87.9065), (39.7684, -86.1581)]
        )
        legs_sum = sum(leg.distance_miles for leg in result.legs)
        self.assertAlmostEqual(legs_sum, result.distance_miles, places=1)
