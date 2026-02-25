"""
TDD tests for authentication endpoints.
"""

from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient


class RegisterViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = reverse("auth-register")

    def _valid_payload(self, username="driver1"):
        return {
            "username": username,
            "email": f"{username}@example.com",
            "password": "securepass123",
            "password_confirm": "securepass123",
        }

    def test_register_returns_201(self):
        response = self.client.post(self.url, self._valid_payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_register_creates_user(self):
        self.client.post(self.url, self._valid_payload(), format="json")
        self.assertEqual(User.objects.count(), 1)
        self.assertEqual(User.objects.first().username, "driver1")

    def test_register_returns_tokens(self):
        response = self.client.post(self.url, self._valid_payload(), format="json")
        data = response.json()
        self.assertIn("access", data)
        self.assertIn("refresh", data)

    def test_register_returns_user_info(self):
        response = self.client.post(self.url, self._valid_payload(), format="json")
        data = response.json()
        self.assertIn("user", data)
        self.assertEqual(data["user"]["username"], "driver1")

    def test_register_duplicate_username_returns_400(self):
        User.objects.create_user(username="driver1", password="pass")
        response = self.client.post(self.url, self._valid_payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_password_mismatch_returns_400(self):
        payload = self._valid_payload()
        payload["password_confirm"] = "differentpass"
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_short_password_returns_400(self):
        payload = self._valid_payload()
        payload["password"] = "short"
        payload["password_confirm"] = "short"
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_missing_username_returns_400(self):
        payload = self._valid_payload()
        del payload["username"]
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class TokenObtainTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = reverse("auth-token")
        User.objects.create_user(username="driver1", password="securepass123")

    def test_login_returns_200(self):
        response = self.client.post(
            self.url,
            {"username": "driver1", "password": "securepass123"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_login_returns_access_and_refresh(self):
        response = self.client.post(
            self.url,
            {"username": "driver1", "password": "securepass123"},
            format="json",
        )
        data = response.json()
        self.assertIn("access", data)
        self.assertIn("refresh", data)

    def test_wrong_credentials_returns_401(self):
        response = self.client.post(
            self.url,
            {"username": "driver1", "password": "wrongpass"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class MeViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = reverse("auth-me")
        self.user = User.objects.create_user(
            username="driver1", email="driver1@example.com", password="pass"
        )

    def test_me_unauthenticated_returns_401(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_authenticated_returns_200(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_me_returns_correct_user(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.url)
        data = response.json()
        self.assertEqual(data["username"], "driver1")
        self.assertEqual(data["email"], "driver1@example.com")


class TripAuthProtectionTest(TestCase):
    """Verify trip endpoints reject unauthenticated requests."""

    def setUp(self):
        self.client = APIClient()

    def test_create_trip_unauthenticated_returns_401(self):
        response = self.client.post(reverse("trip-create"), {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_trips_unauthenticated_returns_401(self):
        response = self.client.get(reverse("trip-create"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
