"""Authentication, profile, and eligibility API views.

Google OAuth is implemented directly against Google's OAuth 2.0 endpoints so
the backend does not depend on an external auth package. The eligibility views
preserve the request/response contract of the original FastAPI service.
"""

import json
import secrets
import urllib.parse

import requests
from django.conf import settings
from django.contrib.auth import get_user_model, login, logout
from django.utils.crypto import constant_time_compare
from django.views.decorators.csrf import csrf_exempt, ensure_csrf_cookie
from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from config.throttles import EvaluationRateThrottle
from eligibility_service import (  # type: ignore
    DeterministicEligibilityEngine,
    EligibilityRuleRecord,
    StudentProfileRecord,
)
from scholarships.models import Scholarship

from .models import UserProfile
from .serializers import UserProfileSerializer

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"


def _oauth_config():
    return {
        "client_id": settings.GOOGLE_OAUTH_CLIENT_ID,
        "client_secret": settings.GOOGLE_OAUTH_CLIENT_SECRET,
        "redirect_uri": settings.GOOGLE_OAUTH_REDIRECT_URI,
    }


@api_view(["GET"])
@permission_classes([AllowAny])
@ensure_csrf_cookie
def csrf_token(request):
    """Set the CSRF cookie so browser clients can send authenticated writes."""
    return Response({"detail": "CSRF cookie set"})


@api_view(["GET"])
@permission_classes([AllowAny])
def google_login(request):
    """Return the Google consent URL and store a CSRF ``state`` in session."""
    config = _oauth_config()
    if not config["client_id"]:
        return Response(
            {"error": "Google OAuth not configured"}, status=status.HTTP_503_SERVICE_UNAVAILABLE
        )

    state = secrets.token_urlsafe(32)
    request.session["google_oauth_state"] = state

    params = {
        "client_id": config["client_id"],
        "redirect_uri": config["redirect_uri"],
        "response_type": "code",
        "scope": "profile email",
        "access_type": "offline",
        "prompt": "select_account",
        "state": state,
    }
    auth_url = GOOGLE_AUTH_URL + "?" + urllib.parse.urlencode(params)
    return Response({"auth_url": auth_url, "state": state})


@api_view(["GET"])
@permission_classes([AllowAny])
def google_callback(request):
    """Handle the OAuth callback, create/link the user, and start a session."""
    code = request.GET.get("code")
    returned_state = request.GET.get("state")
    expected_state = request.session.pop("google_oauth_state", None)

    if not expected_state or not returned_state:
        return Response({"error": "Missing OAuth state"}, status=status.HTTP_400_BAD_REQUEST)
    if not constant_time_compare(expected_state, returned_state):
        return Response({"error": "Invalid OAuth state"}, status=status.HTTP_400_BAD_REQUEST)

    if not code:
        return Response(
            {"error": "Authorization code not provided"}, status=status.HTTP_400_BAD_REQUEST
        )

    config = _oauth_config()
    if not config["client_id"] or not config["client_secret"]:
        return Response(
            {"error": "Google OAuth not configured"}, status=status.HTTP_503_SERVICE_UNAVAILABLE
        )

    try:
        token_response = requests.post(
            GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": config["client_id"],
                "client_secret": config["client_secret"],
                "redirect_uri": config["redirect_uri"],
                "grant_type": "authorization_code",
            },
            timeout=10,
        )
    except requests.RequestException:
        return Response(
            {"error": "Could not reach Google token service"},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    if token_response.status_code != 200:
        return Response(
            {"error": "Failed to exchange authorization code"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    access_token = token_response.json().get("access_token")
    try:
        userinfo_response = requests.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=10,
        )
    except requests.RequestException:
        return Response(
            {"error": "Could not reach Google userinfo service"},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    if userinfo_response.status_code != 200:
        return Response(
            {"error": "Failed to fetch user information"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user_data = userinfo_response.json()
    email = user_data.get("email", "")
    if not email:
        return Response(
            {"error": "Google account did not return an email address"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    first_name = user_data.get("given_name", "")
    last_name = user_data.get("family_name", "")
    picture = user_data.get("picture", "")
    display_name = f"{first_name} {last_name}".strip() or email.split("@")[0]

    User = get_user_model()
    user = User.objects.filter(email=email).first()
    if user is None:
        base_username = email.split("@")[0] or user_data.get("sub", "google-user")
        username = base_username
        suffix = 1
        while User.objects.filter(username=username).exists():
            suffix += 1
            username = f"{base_username}{suffix}"
        user = User.objects.create_user(
            username=username,
            email=email,
            password=None,
            first_name=first_name,
            last_name=last_name,
        )

    profile, _ = UserProfile.objects.get_or_create(user=user)
    profile.display_name = display_name
    if picture:
        profile.photo_url = picture
    profile.save()

    login(request, user)

    return Response(
        {
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
            },
            "profile": {
                "display_name": profile.display_name,
                "photo_url": profile.photo_url,
            },
            "token": request.session.session_key,
        }
    )


@api_view(["GET"])
@permission_classes([AllowAny])
def google_session(request):
    """Return the currently authenticated user, if any."""
    if not request.user.is_authenticated:
        return Response({"authenticated": False})

    profile = UserProfile.objects.filter(user=request.user).first()
    return Response(
        {
            "authenticated": True,
            "user": {
                "id": request.user.id,
                "username": request.user.username,
                "email": request.user.email,
                "first_name": request.user.first_name,
                "last_name": request.user.last_name,
            },
            "profile": {
                "display_name": profile.display_name if profile else "",
                "photo_url": profile.photo_url if profile else "",
            },
        }
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def google_logout(request):
    """End the current session.

    State-changing, so it requires a POST and honours CSRF for authenticated
    session users (DRF's ``SessionAuthentication`` enforces CSRF).
    """
    logout(request)
    return Response({"detail": "Logged out"})


def _build_profile(profile_data):
    return StudentProfileRecord(
        uid=profile_data.get("uid", "anonymous"),
        email=profile_data.get("email", ""),
        citizenship=profile_data.get("citizenship", ""),
        residence_country=profile_data.get("residence_country", ""),
        education_level=profile_data.get("education_level", "bachelors"),
        target_degree=profile_data.get("target_degree", "masters"),
        institution_name=profile_data.get("institution_name", ""),
        grading_scale=profile_data.get("grading_scale", "gpa_4_0"),
        gpa=profile_data.get("gpa"),
        max_gpa=profile_data.get("max_gpa", 4.0),
        graduation_year=profile_data.get("graduation_year", ""),
        primary_field=profile_data.get("primary_field", ""),
        work_experience_years=profile_data.get("work_experience_years", 0.0),
        english_test_type=profile_data.get("english_test_type", "none"),
        english_score=profile_data.get("english_score"),
        has_english_medium_instruction=profile_data.get(
            "has_english_medium_instruction", False
        ),
        has_supervisor_contact=profile_data.get("has_supervisor_contact"),
        custom_attributes=profile_data.get("custom_attributes", {}),
    )


def _build_rules(rules_data):
    rules = []
    for index, rule_data in enumerate(rules_data or []):
        rules.append(
            EligibilityRuleRecord(
                rule_id=rule_data.get("rule_id", f"rule-{index}"),
                rule_type=rule_data.get("rule_type", "general"),
                title=rule_data.get("title", ""),
                description=rule_data.get("description", ""),
                is_mandatory=rule_data.get("is_mandatory", True),
                source_citation=rule_data.get(
                    "source_citation", "Official Provider Terms"
                ),
                parameters=rule_data.get("parameters", {}),
                requires_human_appraisal=rule_data.get(
                    "requires_human_appraisal", False
                ),
            )
        )
    return rules


def _rules_from_scholarship(scholarship):
    rules = []
    for rule in scholarship.eligibility_rules.all():
        try:
            parameters = json.loads(rule.rule_payload or "{}")
        except (TypeError, ValueError):
            parameters = {}
        rules.append(
            EligibilityRuleRecord(
                rule_id=str(rule.id),
                rule_type=rule.rule_type,
                title=rule.title,
                description=rule.description,
                is_mandatory=rule.is_mandatory,
                source_citation=rule.source_citation,
                parameters=parameters,
                requires_human_appraisal=rule.rule_type == "manual_review",
            )
        )
    return rules


def _serialize_evaluation(evaluation):
    return {
        "scholarship_id": evaluation.scholarship_id,
        "outcome": evaluation.outcome.value,
        "match_percentage": evaluation.match_percentage,
        "criteria_results": [
            {
                "rule_id": result.rule_id,
                "rule_type": result.rule_type,
                "title": result.title,
                "status": result.status.value,
                "is_mandatory": result.is_mandatory,
                "explanation": result.explanation,
                "source_citation": result.source_citation,
                "student_value": result.student_value
                if result.student_value is not None
                else "",
                "required_value": result.required_value
                if result.required_value is not None
                else "",
            }
            for result in evaluation.criteria_results
        ],
        "summary": evaluation.summary,
        "mandatory_failed_count": evaluation.mandatory_failed_count,
        "missing_info_count": evaluation.missing_info_count,
        "manual_review_count": evaluation.manual_review_count,
        "met_criteria_count": evaluation.met_criteria_count,
        "total_criteria_count": evaluation.total_criteria_count,
    }


@csrf_exempt  # Stateless compute endpoint: no session state is read or written.
@api_view(["POST"])
@throttle_classes([EvaluationRateThrottle])
@permission_classes([AllowAny])
def evaluate_compat(request):
    """FastAPI-compatible ``POST /api/v1/evaluate`` endpoint.

    Accepts ``{scholarship_id, profile, rules}`` and never requires the
    scholarship to exist in the database.
    """
    payload = request.data if isinstance(request.data, dict) else {}
    profile = _build_profile(payload.get("profile", {}))
    rules = _build_rules(payload.get("rules", []))
    evaluation = DeterministicEligibilityEngine().evaluate(
        payload.get("scholarship_id", "custom-eval"), rules, profile
    )
    return Response(_serialize_evaluation(evaluation))


@csrf_exempt  # Stateless compute endpoint: no session state is read or written.
@api_view(["POST"])
@throttle_classes([EvaluationRateThrottle])
@permission_classes([AllowAny])
def evaluate_eligibility(request):
    """Database-aware eligibility evaluation.

    If ``rules`` are omitted and the scholarship exists in PostgreSQL, its
    stored eligibility rules are used.
    """
    payload = request.data if isinstance(request.data, dict) else {}
    scholarship_id = payload.get("scholarship_id", "custom-eval")
    rules_data = payload.get("rules") or []

    rules = _build_rules(rules_data)
    if not rules and scholarship_id:
        scholarship = Scholarship.objects.filter(slug=scholarship_id).first()
        if scholarship is None:
            return Response(
                {"error": "Scholarship not found"}, status=status.HTTP_404_NOT_FOUND
            )
        rules = _rules_from_scholarship(scholarship)

    profile = _build_profile(payload.get("profile", {}))
    evaluation = DeterministicEligibilityEngine().evaluate(
        scholarship_id, rules, profile
    )
    return Response(_serialize_evaluation(evaluation))


class UserProfileViewSet(viewsets.ModelViewSet):
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return UserProfile.objects.none()
        return UserProfile.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
