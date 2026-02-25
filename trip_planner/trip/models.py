import uuid

from django.conf import settings
from django.db import models


class Trip(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("completed", "Completed"),
        ("error", "Error"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="trips",
        null=True,
        blank=True,
    )

    # Raw inputs
    current_location = models.CharField(max_length=255)
    pickup_location = models.CharField(max_length=255)
    dropoff_location = models.CharField(max_length=255)
    current_cycle_used = models.FloatField(
        help_text="Hours used in current 8-day cycle"
    )

    # Geocoded coordinates
    current_lat = models.FloatField(null=True, blank=True)
    current_lng = models.FloatField(null=True, blank=True)
    pickup_lat = models.FloatField(null=True, blank=True)
    pickup_lng = models.FloatField(null=True, blank=True)
    dropoff_lat = models.FloatField(null=True, blank=True)
    dropoff_lng = models.FloatField(null=True, blank=True)

    # Computed route data
    total_distance_miles = models.FloatField(null=True, blank=True)
    estimated_duration_hours = models.FloatField(null=True, blank=True)
    route_polyline = models.JSONField(
        null=True, blank=True, help_text="GeoJSON LineString for the full route"
    )

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    error_message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Trip #{self.pk}: {self.current_location} → {self.pickup_location} → {self.dropoff_location}"


class Stop(models.Model):
    STOP_TYPE_CHOICES = [
        ("start", "Start"),
        ("pickup", "Pickup"),
        ("dropoff", "Dropoff"),
        ("fuel", "Fuel Stop"),
        ("rest", "10-Hr Rest"),
        ("break", "30-Min Break"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name="stops")
    stop_type = models.CharField(max_length=20, choices=STOP_TYPE_CHOICES)
    location_name = models.CharField(max_length=255)
    lat = models.FloatField(null=True, blank=True)
    lng = models.FloatField(null=True, blank=True)
    arrival_time = models.DateTimeField(null=True, blank=True)
    departure_time = models.DateTimeField(null=True, blank=True)
    duration_hours = models.FloatField(default=0.0)
    cumulative_miles = models.FloatField(default=0.0)
    order = models.PositiveIntegerField(default=0)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return f"{self.get_stop_type_display()} @ {self.location_name} (Stop #{self.order})"


class DailyLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name="daily_logs")
    date = models.DateField()
    day_number = models.PositiveIntegerField()

    # Activities: list of {start_hour: float, end_hour: float, status: str}
    # status values: "off_duty", "sleeper_berth", "driving", "on_duty_nd"
    activities = models.JSONField(default=list)

    total_driving_hours = models.FloatField(default=0.0)
    total_on_duty_hours = models.FloatField(default=0.0)  # driving + on_duty_nd
    total_off_duty_hours = models.FloatField(default=0.0)
    total_sleeper_hours = models.FloatField(default=0.0)

    cycle_hours_used = models.FloatField(
        default=0.0, help_text="Cumulative cycle hours at end of day"
    )

    from_location = models.CharField(max_length=255, blank=True)
    to_location = models.CharField(max_length=255, blank=True)
    total_miles = models.FloatField(default=0.0)

    pdf_file = models.FileField(upload_to="eld_logs/", null=True, blank=True)

    class Meta:
        ordering = ["day_number"]
        unique_together = [("trip", "day_number")]

    def __str__(self):
        return f"Log Day {self.day_number} ({self.date}) — Trip #{self.trip_id}"
