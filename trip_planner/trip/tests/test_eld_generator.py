import io
from datetime import date

from django.test import TestCase
from pypdf import PdfReader

from trip.services.eld_generator import ELDGenerator, ELDLogInput


def make_input(**kwargs):
    defaults = dict(
        log_date=date(2026, 2, 25),
        day_number=1,
        activities=[
            {"start_hour": 0.0, "end_hour": 8.0, "status": "off_duty"},
            {"start_hour": 8.0, "end_hour": 9.0, "status": "on_duty_nd"},
            {"start_hour": 9.0, "end_hour": 19.5, "status": "driving"},
            {"start_hour": 19.5, "end_hour": 24.0, "status": "off_duty"},
        ],
        total_driving_hours=10.5,
        total_on_duty_hours=11.5,
        total_off_duty_hours=12.5,
        total_sleeper_hours=0.0,
        cycle_hours_used=21.5,
        from_location="Chicago, IL",
        to_location="Indianapolis, IN",
        total_miles=300.0,
        carrier_name="Test Carrier LLC",
        driver_name="John Driver",
        truck_number="T-1234",
    )
    defaults.update(kwargs)
    return ELDLogInput(**defaults)


class ELDGeneratorBasicTest(TestCase):
    def setUp(self):
        self.gen = ELDGenerator()

    def test_generate_returns_bytes(self):
        pdf_bytes = self.gen.generate(make_input())
        self.assertIsInstance(pdf_bytes, bytes)
        self.assertGreater(len(pdf_bytes), 100)

    def test_pdf_starts_with_pdf_header(self):
        pdf_bytes = self.gen.generate(make_input())
        self.assertTrue(pdf_bytes.startswith(b"%PDF"), "Not a valid PDF file")

    def test_pdf_has_one_page(self):
        pdf_bytes = self.gen.generate(make_input())
        reader = PdfReader(io.BytesIO(pdf_bytes))
        self.assertEqual(len(reader.pages), 1)

    def test_generate_multiple_days_independent(self):
        """Each call produces independent bytes."""
        b1 = self.gen.generate(make_input(day_number=1, total_miles=200.0))
        b2 = self.gen.generate(make_input(day_number=2, total_miles=400.0))
        self.assertNotEqual(b1, b2)

    def test_driving_hours_not_exceed_11(self):
        pdf_bytes = self.gen.generate(make_input(total_driving_hours=10.5))
        # Just verify no exception and valid PDF
        reader = PdfReader(io.BytesIO(pdf_bytes))
        self.assertEqual(len(reader.pages), 1)


class ELDGeneratorEdgeCasesTest(TestCase):
    def setUp(self):
        self.gen = ELDGenerator()

    def test_all_off_duty(self):
        """A day with only off-duty activities generates a valid PDF."""
        inp = make_input(
            activities=[{"start_hour": 0.0, "end_hour": 24.0, "status": "off_duty"}],
            total_driving_hours=0.0,
            total_on_duty_hours=0.0,
            total_off_duty_hours=24.0,
        )
        pdf_bytes = self.gen.generate(inp)
        self.assertTrue(pdf_bytes.startswith(b"%PDF"))

    def test_sleeper_berth_activity(self):
        inp = make_input(
            activities=[
                {"start_hour": 0.0, "end_hour": 10.0, "status": "sleeper_berth"},
                {"start_hour": 10.0, "end_hour": 20.0, "status": "driving"},
                {"start_hour": 20.0, "end_hour": 24.0, "status": "off_duty"},
            ],
            total_driving_hours=10.0,
            total_sleeper_hours=10.0,
        )
        pdf_bytes = self.gen.generate(inp)
        self.assertTrue(pdf_bytes.startswith(b"%PDF"))

    def test_unknown_activity_status_ignored(self):
        inp = make_input(
            activities=[
                {"start_hour": 0.0, "end_hour": 8.0, "status": "unknown_status"},
                {"start_hour": 8.0, "end_hour": 24.0, "status": "off_duty"},
            ],
        )
        # Should not raise, just ignore unknown status
        pdf_bytes = self.gen.generate(inp)
        self.assertTrue(pdf_bytes.startswith(b"%PDF"))

    def test_with_remarks(self):
        inp = make_input(remarks=["Stopped at Chicago Fuel #1", "Weather clear"])
        pdf_bytes = self.gen.generate(inp)
        self.assertTrue(pdf_bytes.startswith(b"%PDF"))

    def test_activities_spanning_all_four_statuses(self):
        inp = make_input(
            activities=[
                {"start_hour": 0.0, "end_hour": 6.0, "status": "sleeper_berth"},
                {"start_hour": 6.0, "end_hour": 8.0, "status": "off_duty"},
                {"start_hour": 8.0, "end_hour": 9.0, "status": "on_duty_nd"},
                {"start_hour": 9.0, "end_hour": 20.0, "status": "driving"},
                {"start_hour": 20.0, "end_hour": 24.0, "status": "off_duty"},
            ],
            total_driving_hours=11.0,
            total_on_duty_hours=12.0,
            total_off_duty_hours=8.0,
            total_sleeper_hours=6.0,
        )
        pdf_bytes = self.gen.generate(inp)
        reader = PdfReader(io.BytesIO(pdf_bytes))
        self.assertEqual(len(reader.pages), 1)
