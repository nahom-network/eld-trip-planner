from rest_framework import serializers

from .models import DailyLog, Stop, Trip


class TripListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for the trip list endpoint."""

    created_at = serializers.DateTimeField(format="%Y-%m-%dT%H:%M:%S", read_only=True)

    class Meta:
        model = Trip
        fields = [
            "id",
            "current_location",
            "pickup_location",
            "dropoff_location",
            "current_cycle_used",
            "status",
            "total_distance_miles",
            "estimated_duration_hours",
            "created_at",
        ]
        read_only_fields = fields


class StopSerializer(serializers.ModelSerializer):
    stop_type_display = serializers.CharField(
        source="get_stop_type_display", read_only=True
    )
    arrival_time = serializers.DateTimeField(format="%Y-%m-%dT%H:%M:%S", read_only=True)
    departure_time = serializers.DateTimeField(
        format="%Y-%m-%dT%H:%M:%S", read_only=True
    )

    class Meta:
        model = Stop
        fields = [
            "id",
            "stop_type",
            "stop_type_display",
            "location_name",
            "lat",
            "lng",
            "arrival_time",
            "departure_time",
            "duration_hours",
            "cumulative_miles",
            "order",
            "notes",
        ]
        read_only_fields = fields


class DailyLogSerializer(serializers.ModelSerializer):
    pdf_url = serializers.SerializerMethodField()
    date = serializers.DateField(format="%Y-%m-%d", read_only=True)

    class Meta:
        model = DailyLog
        fields = [
            "id",
            "date",
            "day_number",
            "activities",
            "total_driving_hours",
            "total_on_duty_hours",
            "total_off_duty_hours",
            "total_sleeper_hours",
            "cycle_hours_used",
            "from_location",
            "to_location",
            "total_miles",
            "pdf_url",
        ]
        read_only_fields = fields

    def get_pdf_url(self, obj: DailyLog) -> str | None:
        if not obj.pdf_file:
            return None
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(obj.pdf_file.url)
        return obj.pdf_file.url


class TripCreateSerializer(serializers.Serializer):
    current_location = serializers.CharField(max_length=255)
    pickup_location = serializers.CharField(max_length=255)
    dropoff_location = serializers.CharField(max_length=255)
    current_cycle_used = serializers.FloatField(min_value=0.0, max_value=69.99)

    def validate_current_cycle_used(self, value: float) -> float:
        if value >= 70.0:
            raise serializers.ValidationError(
                "Current cycle hours used must be less than 70 (the 70-hr limit)."
            )
        return value


class TripDetailSerializer(serializers.ModelSerializer):
    stops = StopSerializer(many=True, read_only=True)
    daily_logs = DailyLogSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    created_at = serializers.DateTimeField(format="%Y-%m-%dT%H:%M:%S", read_only=True)

    class Meta:
        model = Trip
        fields = [
            "id",
            "current_location",
            "pickup_location",
            "dropoff_location",
            "current_cycle_used",
            "current_lat",
            "current_lng",
            "pickup_lat",
            "pickup_lng",
            "dropoff_lat",
            "dropoff_lng",
            "total_distance_miles",
            "estimated_duration_hours",
            "route_polyline",
            "status",
            "status_display",
            "error_message",
            "created_at",
            "stops",
            "daily_logs",
        ]
        read_only_fields = fields
