import datetime

from django.core.exceptions import ValidationError
from django.test import TestCase

from trip.models import DailyLog, Stop, Trip


class TripModelTest(TestCase):
    def setUp(self):
        self.trip = Trip.objects.create(
            current_location="Chicago, IL",
            pickup_location="Milwaukee, WI",
            dropoff_location="Indianapolis, IN",
            current_cycle_used=20.0,
        )

    def test_trip_creation(self):
        self.assertEqual(Trip.objects.count(), 1)
        self.assertEqual(self.trip.status, "pending")
        self.assertEqual(self.trip.current_cycle_used, 20.0)

    def test_trip_str(self):
        s = str(self.trip)
        self.assertIn("Chicago, IL", s)
        self.assertIn("Indianapolis, IN", s)

    def test_trip_defaults(self):
        self.assertIsNone(self.trip.current_lat)
        self.assertIsNone(self.trip.route_polyline)
        self.assertEqual(self.trip.error_message, "")

    def test_trip_status_choices(self):
        self.trip.status = "completed"
        self.trip.save()
        self.assertEqual(Trip.objects.get(pk=self.trip.pk).status, "completed")


class StopModelTest(TestCase):
    def setUp(self):
        self.trip = Trip.objects.create(
            current_location="Chicago, IL",
            pickup_location="Milwaukee, WI",
            dropoff_location="Indianapolis, IN",
            current_cycle_used=0.0,
        )

    def test_stop_creation(self):
        stop = Stop.objects.create(
            trip=self.trip,
            stop_type="start",
            location_name="Chicago, IL",
            lat=41.8781,
            lng=-87.6298,
            cumulative_miles=0.0,
            order=0,
        )
        self.assertEqual(Stop.objects.count(), 1)
        self.assertEqual(stop.trip, self.trip)

    def test_stop_str(self):
        stop = Stop.objects.create(
            trip=self.trip,
            stop_type="fuel",
            location_name="Gary, IN",
            order=1,
        )
        self.assertIn("Fuel Stop", str(stop))
        self.assertIn("Gary, IN", str(stop))

    def test_stop_ordering_by_order(self):
        Stop.objects.create(
            trip=self.trip, stop_type="start", location_name="A", order=0
        )
        Stop.objects.create(
            trip=self.trip, stop_type="pickup", location_name="B", order=2
        )
        Stop.objects.create(
            trip=self.trip, stop_type="rest", location_name="C", order=1
        )
        stops = list(
            Stop.objects.filter(trip=self.trip).values_list("order", flat=True)
        )
        self.assertEqual(stops, [0, 1, 2])

    def test_stop_related_name(self):
        Stop.objects.create(
            trip=self.trip, stop_type="start", location_name="A", order=0
        )
        Stop.objects.create(
            trip=self.trip, stop_type="dropoff", location_name="B", order=1
        )
        self.assertEqual(self.trip.stops.count(), 2)


class DailyLogModelTest(TestCase):
    def setUp(self):
        self.trip = Trip.objects.create(
            current_location="Chicago, IL",
            pickup_location="Milwaukee, WI",
            dropoff_location="Indianapolis, IN",
            current_cycle_used=10.0,
        )

    def test_daily_log_creation(self):
        log = DailyLog.objects.create(
            trip=self.trip,
            date=datetime.date(2026, 2, 25),
            day_number=1,
            activities=[
                {"start_hour": 0.0, "end_hour": 8.0, "status": "off_duty"},
                {"start_hour": 8.0, "end_hour": 9.0, "status": "on_duty_nd"},
                {"start_hour": 9.0, "end_hour": 19.0, "status": "driving"},
                {"start_hour": 19.0, "end_hour": 24.0, "status": "off_duty"},
            ],
            total_driving_hours=10.0,
            total_on_duty_hours=11.0,
            cycle_hours_used=21.0,
        )
        self.assertEqual(DailyLog.objects.count(), 1)
        self.assertEqual(len(log.activities), 4)

    def test_daily_log_str(self):
        log = DailyLog.objects.create(
            trip=self.trip,
            date=datetime.date(2026, 2, 25),
            day_number=1,
        )
        s = str(log)
        self.assertIn("Day 1", s)

    def test_daily_log_unique_together(self):
        DailyLog.objects.create(
            trip=self.trip, date=datetime.date(2026, 2, 25), day_number=1
        )
        from django.db import IntegrityError

        with self.assertRaises(IntegrityError):
            DailyLog.objects.create(
                trip=self.trip, date=datetime.date(2026, 2, 26), day_number=1
            )

    def test_daily_log_related_name(self):
        DailyLog.objects.create(
            trip=self.trip, date=datetime.date(2026, 2, 25), day_number=1
        )
        DailyLog.objects.create(
            trip=self.trip, date=datetime.date(2026, 2, 26), day_number=2
        )
        self.assertEqual(self.trip.daily_logs.count(), 2)
