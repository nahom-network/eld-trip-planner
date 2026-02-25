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

    def test_register_with_first_last_name(self):
        payload = {
            **self._valid_payload(),
            "first_name": "John",
            "last_name": "Doe",
        }
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.json()
        self.assertEqual(data["user"]["first_name"], "John")
        self.assertEqual(data["user"]["last_name"], "Doe")

    def test_register_persists_first_last_name(self):
        payload = {
            **self._valid_payload(),
            "first_name": "John",
            "last_name": "Doe",
        }
        self.client.post(self.url, payload, format="json")
        user = User.objects.get(username="driver1")
        self.assertEqual(user.first_name, "John")
        self.assertEqual(user.last_name, "Doe")

    def test_register_without_first_last_name_still_works(self):
        """first_name and last_name are optional."""
        response = self.client.post(self.url, self._valid_payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = User.objects.first()
        self.assertEqual(user.first_name, "")
        self.assertEqual(user.last_name, "")

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

    def test_me_returns_first_last_name(self):
        self.user.first_name = "John"
        self.user.last_name = "Doe"
        self.user.save()
        self.client.force_authenticate(user=self.user)
        data = self.client.get(self.url).json()
        self.assertEqual(data["first_name"], "John")
        self.assertEqual(data["last_name"], "Doe")


class UpdateProfileTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = reverse("auth-me")
        self.user = User.objects.create_user(
            username="driver1", email="driver1@example.com", password="pass"
        )
        self.client.force_authenticate(user=self.user)

    def test_patch_username_returns_200(self):
        response = self.client.patch(
            self.url, {"username": "driver_new"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["username"], "driver_new")

    def test_patch_persists_username(self):
        self.client.patch(self.url, {"username": "driver_new"}, format="json")
        self.user.refresh_from_db()
        self.assertEqual(self.user.username, "driver_new")

    def test_patch_email_returns_200(self):
        response = self.client.patch(
            self.url, {"email": "new@example.com"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["email"], "new@example.com")

    def test_patch_first_last_name(self):
        response = self.client.patch(
            self.url, {"first_name": "John", "last_name": "Doe"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data["first_name"], "John")
        self.assertEqual(data["last_name"], "Doe")

    def test_patch_duplicate_username_returns_400(self):
        User.objects.create_user(username="taken", password="pass")
        response = self.client.patch(self.url, {"username": "taken"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_patch_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        response = self.client.patch(self.url, {"username": "x"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class ChangePasswordTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = reverse("auth-change-password")
        self.user = User.objects.create_user(username="driver1", password="oldpass123")
        self.client.force_authenticate(user=self.user)

    def test_change_password_returns_200(self):
        response = self.client.post(
            self.url,
            {
                "current_password": "oldpass123",
                "new_password": "newpass456!",
                "new_password_confirm": "newpass456!",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_change_password_wrong_current_returns_400(self):
        response = self.client.post(
            self.url,
            {
                "current_password": "wrongpass",
                "new_password": "newpass456!",
                "new_password_confirm": "newpass456!",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_change_password_mismatch_returns_400(self):
        response = self.client.post(
            self.url,
            {
                "current_password": "oldpass123",
                "new_password": "newpass456!",
                "new_password_confirm": "different!",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_change_password_actually_changes_it(self):
        self.client.post(
            self.url,
            {
                "current_password": "oldpass123",
                "new_password": "newpass456!",
                "new_password_confirm": "newpass456!",
            },
            format="json",
        )
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("newpass456!"))

    def test_change_password_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        response = self.client.post(self.url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class DeleteAccountTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = reverse("auth-me")
        self.user = User.objects.create_user(username="driver1", password="pass")
        self.client.force_authenticate(user=self.user)

    def test_delete_returns_204(self):
        response = self.client.delete(self.url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_delete_keeps_user_record(self):
        """Soft delete — user row still exists in the database."""
        self.client.delete(self.url)
        self.assertTrue(User.objects.filter(username="driver1").exists())

    def test_delete_sets_is_active_false(self):
        self.client.delete(self.url)
        self.user.refresh_from_db()
        self.assertFalse(self.user.is_active)

    def test_delete_prevents_login(self):
        self.client.delete(self.url)
        login_response = self.client.post(
            reverse("auth-token"),
            {"username": "driver1", "password": "pass"},
            format="json",
        )
        self.assertEqual(login_response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_delete_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        response = self.client.delete(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class LogoutTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = reverse("auth-logout")
        self.user = User.objects.create_user(username="driver1", password="pass")
        self.client.force_authenticate(user=self.user)

    def _get_refresh_token(self):
        from rest_framework_simplejwt.tokens import RefreshToken

        return str(RefreshToken.for_user(self.user))

    def test_logout_returns_205(self):
        response = self.client.post(
            self.url, {"refresh": self._get_refresh_token()}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_205_RESET_CONTENT)

    def test_logout_invalid_token_returns_400(self):
        response = self.client.post(
            self.url, {"refresh": "not-a-valid-token"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_logout_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        response = self.client.post(self.url, {"refresh": "token"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


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
