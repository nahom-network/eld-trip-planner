from django.contrib import admin

from .models import DailyLog, Stop, Trip


class StopInline(admin.TabularInline):
    model = Stop
    extra = 0
    readonly_fields = (
        "stop_type",
        "location_name",
        "lat",
        "lng",
        "arrival_time",
        "departure_time",
        "duration_hours",
        "cumulative_miles",
        "order",
        "notes",
    )
    ordering = ("order",)


class DailyLogInline(admin.TabularInline):
    model = DailyLog
    extra = 0
    readonly_fields = (
        "day_number",
        "date",
        "total_driving_hours",
        "total_on_duty_hours",
        "total_off_duty_hours",
        "cycle_hours_used",
        "total_miles",
        "pdf_file",
    )
    ordering = ("day_number",)


@admin.register(Trip)
class TripAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "current_location",
        "pickup_location",
        "dropoff_location",
        "current_cycle_used",
        "total_distance_miles",
        "status",
        "created_at",
    )
    list_filter = ("status",)
    search_fields = ("current_location", "pickup_location", "dropoff_location")
    readonly_fields = (
        "current_lat",
        "current_lng",
        "pickup_lat",
        "pickup_lng",
        "dropoff_lat",
        "dropoff_lng",
        "total_distance_miles",
        "estimated_duration_hours",
        "route_polyline",
        "created_at",
        "updated_at",
    )
    inlines = [StopInline, DailyLogInline]
    ordering = ("-created_at",)


@admin.register(Stop)
class StopAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "trip",
        "stop_type",
        "location_name",
        "cumulative_miles",
        "order",
    )
    list_filter = ("stop_type",)
    search_fields = ("location_name",)
    ordering = ("trip", "order")


@admin.register(DailyLog)
class DailyLogAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "trip",
        "day_number",
        "date",
        "total_driving_hours",
        "total_on_duty_hours",
        "cycle_hours_used",
    )
    list_filter = ("date",)
    ordering = ("trip", "day_number")
