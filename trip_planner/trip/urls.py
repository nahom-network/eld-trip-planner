from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .auth_views import MeView, RegisterView
from .views import HealthCheckView, LogPDFView, TripCreateView, TripDetailView

urlpatterns = [
    path("health/", HealthCheckView.as_view(), name="health"),
    # Auth
    path("auth/register/", RegisterView.as_view(), name="auth-register"),
    path("auth/token/", TokenObtainPairView.as_view(), name="auth-token"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="auth-token-refresh"),
    path("auth/me/", MeView.as_view(), name="auth-me"),
    # Trips
    path("trips/", TripCreateView.as_view(), name="trip-create"),
    path("trips/<uuid:pk>/", TripDetailView.as_view(), name="trip-detail"),
    path(
        "trips/<uuid:pk>/logs/<int:day_number>/pdf/",
        LogPDFView.as_view(),
        name="log-pdf",
    ),
]
