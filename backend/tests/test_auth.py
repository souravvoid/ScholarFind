"""Authentication API tests (register, login, me, logout).

Run with:

    cd backend && python3 -m pytest tests/test_auth.py -v
"""

import os
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

import django

django.setup()

import pytest
from django.contrib.auth import get_user_model
from django.core.cache import cache
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from accounts.models import UserProfile

pytestmark = pytest.mark.django_db

PASSWORD = "ScholarFind-2026!x"
REGISTER_URL = "/api/auth/register/"
LOGIN_URL = "/api/auth/login/"
LOGOUT_URL = "/api/auth/logout/"
ME_URL = "/api/auth/me/"


@pytest.fixture(autouse=True)
def _clear_throttle_cache():
    # Every test uses the same test-client IP; clear the rate-limit cache so
    # unrelated tests do not exhaust the login/register throttle.
    cache.clear()


@pytest.fixture
def client():
    return APIClient()


def _register(client, **overrides):
    payload = {
        "email": "ada@example.com",
        "password": PASSWORD,
        "password_confirm": PASSWORD,
        "display_name": "Ada Lovelace",
    }
    payload.update(overrides)
    return client.post(REGISTER_URL, payload, format="json")


def _authenticated_client(token):
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f"Token {token}")
    return client


def test_register_creates_user_profile_and_token(client):
    response = _register(client)
    assert response.status_code == 201

    body = response.json()
    assert body["token"]
    assert body["user"]["email"] == "ada@example.com"
    assert body["user"]["display_name"] == "Ada Lovelace"
    assert body["user"]["username"] == "ada"

    user = get_user_model().objects.get(email="ada@example.com")
    assert user.check_password(PASSWORD)
    assert UserProfile.objects.filter(user=user, display_name="Ada Lovelace").exists()
    assert Token.objects.filter(user=user, key=body["token"]).exists()


def test_register_rejects_duplicate_email_case_insensitively(client):
    assert _register(client).status_code == 201

    response = _register(client, email="ADA@example.com")
    assert response.status_code == 400
    assert "email" in response.json()


def test_register_rejects_mismatched_password_confirmation(client):
    response = _register(client, password_confirm="Different-Password-2026!")
    assert response.status_code == 400
    assert "password_confirm" in response.json()


def test_register_rejects_weak_password(client):
    response = _register(client, password="short", password_confirm="short")
    assert response.status_code == 400
    assert "password" in response.json()


def test_register_generates_unique_username_when_email_local_part_collides(client):
    assert _register(client).status_code == 201

    response = _register(client, email="ada@other.example")
    assert response.status_code == 201
    assert response.json()["user"]["username"] == "ada2"


def test_login_accepts_email_and_username(client):
    assert _register(client).status_code == 201

    by_email = client.post(
        LOGIN_URL,
        {"identifier": "ada@example.com", "password": PASSWORD},
        format="json",
    )
    assert by_email.status_code == 200
    assert by_email.json()["token"]

    by_username = client.post(
        LOGIN_URL,
        {"identifier": "ada", "password": PASSWORD},
        format="json",
    )
    assert by_username.status_code == 200
    assert by_username.json()["user"]["email"] == "ada@example.com"


def test_login_invalid_credentials_is_generic(client):
    assert _register(client).status_code == 201

    wrong_password = client.post(
        LOGIN_URL,
        {"identifier": "ada@example.com", "password": "Not-The-Password-2026!"},
        format="json",
    )
    unknown_email = client.post(
        LOGIN_URL,
        {"identifier": "nobody@example.com", "password": "Not-The-Password-2026!"},
        format="json",
    )

    assert wrong_password.status_code == 400
    assert unknown_email.status_code == 400
    assert wrong_password.json()["detail"] == unknown_email.json()["detail"]
    assert wrong_password.json()["detail"] == "Invalid email or password."


def test_me_requires_token_and_returns_current_user(client):
    token = _register(client).json()["token"]

    anonymous = client.get(ME_URL)
    assert anonymous.status_code in (401, 403)

    authed = _authenticated_client(token)
    response = authed.get(ME_URL)
    assert response.status_code == 200
    body = response.json()
    assert body["authenticated"] is True
    assert body["user"]["email"] == "ada@example.com"
    assert body["user"]["display_name"] == "Ada Lovelace"


def test_logout_revokes_token(client):
    token = _register(client).json()["token"]
    authed = _authenticated_client(token)

    assert authed.get(ME_URL).status_code == 200
    assert authed.post(LOGOUT_URL).status_code == 200

    assert Token.objects.filter(key=token).exists() is False
    assert authed.get(ME_URL).status_code in (401, 403)
