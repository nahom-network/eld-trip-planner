import logging
import os
from datetime import datetime, timezone

from django.core.files.base import ContentFile
from django.http import FileResponse, Http404
from drf_spectacular.utils import OpenApiParameter, OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.generics import CreateAPIView, ListCreateAPIView, RetrieveAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import DailyLog, Stop, Trip
from .serializers import TripCreateSerializer, TripDetailSerializer, TripListSerializer
from .services.eld_generator import ELDGenerator, ELDLogInput
from .services.hos_engine import CycleExceededError, HOSPlanner
from .services.route_service import GeocodingError, RouteError, geocode, get_route


@extend_schema(tags=["system"])
class HealthCheckView(APIView):
    """Lightweight liveness probe. No database query."""

    permission_classes = [AllowAny]

    @extend_schema(
        summary="Health check",
        description='Returns `{"status": "ok"}` when the server is running.',
        responses={
            200: {
                "type": "object",
                "properties": {"status": {"type": "string", "example": "ok"}},
            }
        },
    )
    def get(self, request):
        return Response({"status": "ok"}, status=status.HTTP_200_OK)


logger = logging.getLogger(__name__)


@extend_schema(tags=["trips"])
class TripCreateView(ListCreateAPIView):
    """
    Plan a truck driver trip.

    Geocodes all three locations, fetches an OSRM driving route, runs the
    full FMCSA 70-hr/8-day HOS engine, and generates a filled ELD Daily Log
    PDF for every driving day.  Returns the complete trip detail including
    GeoJSON route polyline, ordered stop list, and PDF download URLs.
    """

    serializer_class = TripCreateSerializer

    def get_queryset(self):
        return (
            Trip.objects.prefetch_related("stops", "daily_logs")
            .filter(user=self.request.user)
            .order_by("-created_at")
        )

    def get_serializer_class(self):
        if self.request.method == "GET":
            return TripListSerializer
        return TripCreateSerializer

    @extend_schema(
        summary="List planned trips",
        responses={200: TripListSerializer(many=True)},
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @extend_schema(
        summary="Create and plan a trip",
        request=TripCreateSerializer,
        responses={
            201: TripDetailSerializer,
            400: OpenApiResponse(
                description="Validation error or 70-hr cycle already exhausted"
            ),
            422: OpenApiResponse(description="Geocoding or routing failure"),
        },
    )
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        trip = Trip.objects.create(
            current_location=data["current_location"],
            pickup_location=data["pickup_location"],
            dropoff_location=data["dropoff_location"],
            current_cycle_used=data["current_cycle_used"],
            status="pending",
            user=request.user,
        )

        try:
            trip = self._process_trip(trip, data)
        except (GeocodingError, RouteError) as exc:
            trip.status = "error"
            trip.error_message = str(exc)
            trip.save(update_fields=["status", "error_message"])
            return Response(
                {"error": str(exc)},
                status=status.HTTP_422_UNPROCESSABLE_ENTITY,
            )
        except CycleExceededError as exc:
            trip.status = "error"
            trip.error_message = str(exc)
            trip.save(update_fields=["status", "error_message"])
            return Response(
                {"error": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as exc:
            logger.exception("Unexpected error processing trip %s", trip.pk)
            trip.status = "error"
            trip.error_message = str(exc)
            trip.save(update_fields=["status", "error_message"])
            return Response(
                {"error": "Internal server error while processing trip."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        out_serializer = TripDetailSerializer(trip, context={"request": request})
        return Response(out_serializer.data, status=status.HTTP_201_CREATED)

    # ── Private helpers ──────────────────────────────────────────────────────

    def _process_trip(self, trip: Trip, data: dict) -> Trip:
        # 1. Geocode all three locations
        current_lat, current_lng = geocode(data["current_location"])
        pickup_lat, pickup_lng = geocode(data["pickup_location"])
        dropoff_lat, dropoff_lng = geocode(data["dropoff_location"])

        # 2. Fetch route (3 waypoints: current → pickup → dropoff)
        route = get_route(
            [
                (current_lat, current_lng),
                (pickup_lat, pickup_lng),
                (dropoff_lat, dropoff_lng),
            ]
        )

        # 3. Update trip with geo/route data
        trip.current_lat = current_lat
        trip.current_lng = current_lng
        trip.pickup_lat = pickup_lat
        trip.pickup_lng = pickup_lng
        trip.dropoff_lat = dropoff_lat
        trip.dropoff_lng = dropoff_lng
        trip.total_distance_miles = round(route.distance_miles, 2)
        trip.estimated_duration_hours = round(route.duration_hours, 2)
        trip.route_polyline = route.polyline_geojson
        trip.save(
            update_fields=[
                "current_lat",
                "current_lng",
                "pickup_lat",
                "pickup_lng",
                "dropoff_lat",
                "dropoff_lng",
                "total_distance_miles",
                "estimated_duration_hours",
                "route_polyline",
            ]
        )

        # 4. HOS planning
        leg0 = route.legs[0] if len(route.legs) >= 1 else None
        leg1 = route.legs[1] if len(route.legs) >= 2 else None

        # Fallback: split total evenly if individual legs missing
        if leg0 is None:
            leg0_miles, leg0_hrs = route.distance_miles / 2, route.duration_hours / 2
        else:
            leg0_miles, leg0_hrs = leg0.distance_miles, leg0.duration_hours

        if leg1 is None:
            leg1_miles, leg1_hrs = route.distance_miles / 2, route.duration_hours / 2
        else:
            leg1_miles, leg1_hrs = leg1.distance_miles, leg1.duration_hours

        start_time = datetime.now(timezone.utc).replace(
            hour=8, minute=0, second=0, microsecond=0
        )

        planner = HOSPlanner()
        plan = planner.plan(
            leg_current_to_pickup=(leg0_miles, max(leg0_hrs, 0.01)),
            leg_pickup_to_dropoff=(leg1_miles, max(leg1_hrs, 0.01)),
            current_location=data["current_location"],
            pickup_location=data["pickup_location"],
            dropoff_location=data["dropoff_location"],
            current_cycle_used=data["current_cycle_used"],
            start_time=start_time,
            current_lat=current_lat,
            current_lng=current_lng,
            pickup_lat=pickup_lat,
            pickup_lng=pickup_lng,
            dropoff_lat=dropoff_lat,
            dropoff_lng=dropoff_lng,
        )

        # 5. Persist stops
        stop_objs = []
        for stop_data in plan.stops:
            stop_objs.append(
                Stop(
                    trip=trip,
                    stop_type=stop_data.stop_type,
                    location_name=stop_data.location_name,
                    lat=stop_data.lat,
                    lng=stop_data.lng,
                    arrival_time=stop_data.arrival_time,
                    departure_time=stop_data.departure_time,
                    duration_hours=stop_data.duration_hours,
                    cumulative_miles=stop_data.cumulative_miles,
                    order=stop_data.order,
                    notes=stop_data.notes,
                )
            )
        Stop.objects.bulk_create(stop_objs)

        # 6. Persist daily logs + generate ELD PDFs
        eld_gen = ELDGenerator()
        for log_data in plan.daily_logs:
            log_input = ELDLogInput(
                log_date=log_data.date,
                day_number=log_data.day_number,
                activities=log_data.activities,
                total_driving_hours=log_data.total_driving_hours,
                total_on_duty_hours=log_data.total_on_duty_hours,
                total_off_duty_hours=log_data.total_off_duty_hours,
                total_sleeper_hours=log_data.total_sleeper_hours,
                cycle_hours_used=log_data.cycle_hours_used,
                from_location=log_data.from_location,
                to_location=log_data.to_location,
                total_miles=log_data.total_miles,
                trip_id=trip.pk,
            )
            pdf_bytes = eld_gen.generate(log_input)

            daily_log = DailyLog.objects.create(
                trip=trip,
                date=log_data.date,
                day_number=log_data.day_number,
                activities=log_data.activities,
                total_driving_hours=log_data.total_driving_hours,
                total_on_duty_hours=log_data.total_on_duty_hours,
                total_off_duty_hours=log_data.total_off_duty_hours,
                total_sleeper_hours=log_data.total_sleeper_hours,
                cycle_hours_used=log_data.cycle_hours_used,
                from_location=log_data.from_location,
                to_location=log_data.to_location,
                total_miles=log_data.total_miles,
            )
            filename = f"trip_{trip.pk}_day_{log_data.day_number}.pdf"
            daily_log.pdf_file.save(filename, ContentFile(pdf_bytes), save=True)

        trip.status = "completed"
        trip.save(update_fields=["status"])
        return trip


@extend_schema(tags=["trips"])
class TripDetailView(RetrieveAPIView):
    """Retrieve a previously planned trip with all stops, daily logs, and route polyline."""

    @extend_schema(summary="Retrieve a trip", responses={200: TripDetailSerializer})
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    def get_queryset(self):
        return Trip.objects.prefetch_related("stops", "daily_logs").filter(
            user=self.request.user
        )

    serializer_class = TripDetailSerializer

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx


@extend_schema(tags=["logs"])
class LogPDFView(APIView):
    """Download the generated ELD Daily Log Sheet PDF for a specific trip day."""

    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Download ELD log PDF",
        parameters=[
            OpenApiParameter("pk", int, OpenApiParameter.PATH, description="Trip ID"),
            OpenApiParameter(
                "day_number",
                int,
                OpenApiParameter.PATH,
                description="Log day number (1-based)",
            ),
        ],
        responses={
            200: OpenApiResponse(description="PDF file (application/pdf)"),
            404: OpenApiResponse(description="Trip or log not found"),
        },
    )
    def get(self, request, pk: int, day_number: int):
        try:
            log = DailyLog.objects.get(
                trip_id=pk, day_number=day_number, trip__user=request.user
            )
        except DailyLog.DoesNotExist:
            raise Http404("Daily log not found.")

        if not log.pdf_file:
            raise Http404("PDF not yet generated for this log.")

        response = FileResponse(
            log.pdf_file.open("rb"),
            content_type="application/pdf",
            as_attachment=False,
            filename=os.path.basename(log.pdf_file.name),
        )
        return response
