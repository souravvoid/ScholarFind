"""Integration tests for the Django/DRF backend against PostgreSQL.

Run with:

    cd backend && python3 -m pytest tests/test_api_integration.py -v
"""

import os
import sys
from datetime import timedelta
from pathlib import Path

# Keep this module importable by the legacy `unittest discover` runner used by
# `npm run test:backend`. Those tests are pytest functions and are skipped by
# unittest, but the Django imports below still need configured settings.
BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

import django

django.setup()

import pytest
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from scholarships.models import (
    RequiredDocument,
    Scholarship,
    ScholarshipEligibilityRule,
    ScholarshipProvider,
    ScholarshipSource,
)

pytestmark = pytest.mark.django_db


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def user():
    return get_user_model().objects.create_user(
        username="student", password="test-password", email="student@example.com"
    )


@pytest.fixture
def other_user():
    return get_user_model().objects.create_user(
        username="other", password="test-password", email="other@example.com"
    )


def _token_client(user):
    token = Token.objects.create(user=user)
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
    return client


@pytest.fixture
def auth_client(user):
    return _token_client(user)


@pytest.fixture
def other_client(other_user):
    return _token_client(other_user)


@pytest.fixture
def staff_client():
    staff = get_user_model().objects.create_user(
        username="staff", password="test-password", is_staff=True
    )
    return _token_client(staff)


@pytest.fixture
def catalogue():
    provider = ScholarshipProvider.objects.create(
        name="Commonwealth Scholarship Commission",
        category="Government Endowment",
        country="United Kingdom",
        website_url="https://cscuk.fcdo.gov.uk",
    )
    source = ScholarshipSource.objects.create(
        name="Commonwealth Scholarship Commission in the UK",
        origin_agency="FCDO",
        country="United Kingdom",
        adapter_module="src_csc_uk",
        access_method="Official public catalogue",
        provenance_url="https://www.gov.uk",
    )
    scholarship = Scholarship.objects.create(
        slug="csc-masters-2026",
        title="Commonwealth Master's Scholarship 2026",
        provider=provider,
        source=source,
        destination_countries="United Kingdom",
        study_levels="masters",
        fields_of_study="Science, Health Systems",
        total_award_value="Full tuition + stipend",
        estimated_usd_value=54000.0,
        application_deadline=timezone.now() + timedelta(days=90),
        academic_year="2026/2027",
        official_source_url="https://www.gov.uk",
        official_application_url="https://cscuk.fcdo.gov.uk",
        source_domain="gov.uk",
        overview="Fully funded master's programme.",
    )
    rule = ScholarshipEligibilityRule.objects.create(
        scholarship=scholarship,
        rule_type="academic_score",
        title="Minimum 2:1",
        description="At least 75% normalized GPA.",
        is_mandatory=True,
        source_citation="CSC terms",
        rule_payload='{"min_gpa_normalized": 75.0}',
    )
    RequiredDocument.objects.create(
        scholarship=scholarship, document_name="Transcript", is_mandatory=True
    )
    return scholarship, rule


def _profile(**overrides):
    data = {
        "uid": "student-1",
        "citizenship": "Nigeria",
        "target_degree": "masters",
        "grading_scale": "gpa_4_0",
        "gpa": 3.82,
        "max_gpa": 4.0,
        "has_english_medium_instruction": True,
    }
    data.update(overrides)
    return data


# --- Health and sources ---------------------------------------------------


def test_health_endpoint(client):
    response = client.get("/api/v1/health/")
    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "healthy"
    assert payload["service"] == "scholarfind-api"
    assert payload["registered_sources"] == 10
    assert payload["stored_scholarships"] == 0


def test_sources_endpoint(client):
    response = client.get("/api/v1/sources/")
    assert response.status_code == 200
    payload = response.json()
    assert len(payload) == 10
    for source in payload:
        assert source["status"] == "verified"
        assert source["is_authoritative"] is True
        assert source["license"]


# --- Scholarship catalogue ------------------------------------------------


def test_scholarship_list_preserves_envelope(client, catalogue):
    response = client.get("/api/v1/scholarships/")
    assert response.status_code == 200
    payload = response.json()
    assert payload["page"] == 1
    assert payload["page_size"] == 10
    assert payload["total_count"] == 1
    item = payload["results"][0]
    assert item["id"] == "csc-masters-2026"
    assert item["destination_countries"] == ["United Kingdom"]
    assert item["study_levels"] == ["masters"]
    assert item["provider_name"] == "Commonwealth Scholarship Commission"


def test_scholarship_filters(client, catalogue):
    assert client.get("/api/v1/scholarships/?query=Commonwealth").json()["total_count"] == 1
    assert client.get("/api/v1/scholarships/?query=Nonexistent").json()["total_count"] == 0
    assert (
        client.get("/api/v1/scholarships/?destination=United%20Kingdom").json()[
            "total_count"
        ]
        == 1
    )
    assert (
        client.get("/api/v1/scholarships/?degree_level=masters").json()["total_count"]
        == 1
    )
    assert client.get("/api/v1/scholarships/?degree_level=phd").json()["total_count"] == 0


def test_scholarship_invalid_pagination(client):
    response = client.get("/api/v1/scholarships/?page=abc")
    assert response.status_code == 400


def test_catalogue_is_read_only(client):
    response = client.post(
        "/api/v1/scholarships/",
        {"slug": "new", "title": "New scholarship"},
        format="json",
    )
    assert response.status_code == 405


# --- Eligibility ----------------------------------------------------------


def test_evaluate_compat_matches_fastapi_contract(client):
    payload = {
        "scholarship_id": "custom-eval",
        "profile": _profile(),
        "rules": [
            {
                "rule_id": "rule-1",
                "rule_type": "citizenship",
                "title": "Citizenship",
                "description": "Nigerian citizens only.",
                "is_mandatory": True,
                "parameters": {"allowed_countries": ["Nigeria"]},
            },
            {
                "rule_id": "rule-2",
                "rule_type": "academic_score",
                "title": "Minimum grade",
                "description": "At least 75%.",
                "is_mandatory": True,
                "parameters": {"min_gpa_normalized": 75.0},
            },
        ],
    }
    response = client.post("/api/v1/evaluate/", payload, format="json")
    assert response.status_code == 200
    body = response.json()
    assert body["outcome"] == "Likely eligible"
    assert body["scholarship_id"] == "custom-eval"
    assert body["mandatory_failed_count"] == 0
    assert len(body["criteria_results"]) == 2
    assert {item["status"] for item in body["criteria_results"]} == {"meets"}
    for key in (
        "match_percentage",
        "summary",
        "missing_info_count",
        "manual_review_count",
        "met_criteria_count",
        "total_criteria_count",
    ):
        assert key in body


def test_evaluate_uses_database_rules(client, catalogue):
    scholarship, rule = catalogue
    response = client.post(
        "/api/v1/eligibility/",
        {"scholarship_id": scholarship.slug, "profile": _profile()},
        format="json",
    )
    assert response.status_code == 200
    body = response.json()
    assert body["outcome"] == "Likely eligible"
    assert body["criteria_results"][0]["rule_id"] == str(rule.id)


def test_evaluate_unknown_scholarship_returns_404(client):
    response = client.post(
        "/api/v1/eligibility/",
        {"scholarship_id": "does-not-exist", "profile": _profile()},
        format="json",
    )
    assert response.status_code == 404


# --- Authentication -------------------------------------------------------


def test_token_auth_flow(client):
    get_user_model().objects.create_user(username="alice", password="secret-password")
    response = client.post(
        "/api/auth/token/",
        {"username": "alice", "password": "secret-password"},
        format="json",
    )
    assert response.status_code == 200
    token = response.json()["token"]
    assert token

    authed = APIClient()
    authed.credentials(HTTP_AUTHORIZATION=f"Token {token}")
    assert authed.get("/api/v1/user-profiles/").status_code == 200


def test_profile_endpoints_require_authentication(client):
    response = client.get("/api/v1/student-profiles/")
    assert response.status_code in (401, 403)


def test_student_profile_create_computes_normalized_gpa(auth_client):
    response = auth_client.post(
        "/api/v1/student-profiles/",
        {
            "citizenship": "Nigeria",
            "residence_country": "Nigeria",
            "education_level": "bachelors",
            "institution_name": "University of Lagos",
            "grading_scale": "gpa_4_0",
            "gpa": 3.82,
            "max_gpa": 4.0,
            "graduation_year": "2025",
            "primary_field": "Computer Science",
        },
        format="json",
    )
    assert response.status_code == 201
    body = response.json()
    assert body["normalized_gpa"] == pytest.approx(95.5)


# --- Saved scholarships ---------------------------------------------------


def test_saved_scholarships_are_private_and_unique(auth_client, other_client, catalogue):
    scholarship, _ = catalogue

    created = auth_client.post(
        "/api/v1/saved-scholarships/",
        {"scholarship": scholarship.id, "status": "interested"},
        format="json",
    )
    assert created.status_code == 201
    saved_id = created.json()["id"]

    duplicate = auth_client.post(
        "/api/v1/saved-scholarships/",
        {"scholarship": scholarship.id, "status": "preparing"},
        format="json",
    )
    assert duplicate.status_code == 400

    assert len(auth_client.get("/api/v1/saved-scholarships/").json()) == 1
    assert other_client.get("/api/v1/saved-scholarships/").json() == []
    assert (
        other_client.get(f"/api/v1/saved-scholarships/{saved_id}/").status_code == 404
    )


# --- Ingestion admin ------------------------------------------------------


def test_ingestion_requires_staff(client, auth_client):
    assert client.post("/api/v1/admin/ingest/src_csc_uk/").status_code in (401, 403)
    assert auth_client.post("/api/v1/admin/ingest/src_csc_uk/").status_code in (401, 403)


def test_ingestion_persists_records(staff_client):
    response = staff_client.post("/api/v1/admin/ingest/src_csc_uk/")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] in ("success", "completed_with_warnings")
    assert body["records_persisted"] >= 2
    assert Scholarship.objects.count() >= 2
    assert ScholarshipSource.objects.filter(adapter_module="src_csc_uk").exists()


def test_ingestion_unknown_source_returns_404(staff_client):
    response = staff_client.post("/api/v1/admin/ingest/not-a-source/")
    assert response.status_code == 404


# --- Google OAuth (configuration-gated) -----------------------------------


def test_google_login_unconfigured_returns_503(client, settings):
    settings.GOOGLE_OAUTH_CLIENT_ID = ""
    response = client.get("/api/auth/google/login/")
    assert response.status_code == 503


def test_google_callback_without_code_returns_400(client):
    response = client.get("/api/auth/google/callback/")
    assert response.status_code == 400


def test_google_session_anonymous(client):
    response = client.get("/api/auth/google/session/")
    assert response.status_code == 200
    assert response.json() == {"authenticated": False}


def test_google_logout(client):
    response = client.post("/api/auth/google/logout/")
    assert response.status_code == 200
    assert response.json()["detail"] == "Logged out"
