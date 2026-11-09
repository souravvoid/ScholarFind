"""
Authentication and eligibility serializers for ScholarFind Django.

Authentication uses Django's built-in user model plus DRF tokens. Email is the
public login identifier; usernames are still generated because Django's default
user model requires one.
"""

import re

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from .models import UserProfile

USERNAME_FALLBACK = "student"
USERNAME_ALLOWED = re.compile(r"[^\w.@+-]", re.UNICODE)


def _clean_username(value: str) -> str:
    cleaned = USERNAME_ALLOWED.sub("", (value or "").strip())
    return cleaned[:150] or USERNAME_FALLBACK


class RegisterSerializer(serializers.Serializer):
    """Create a Django user + ScholarFind profile and return a DRF token."""

    email = serializers.EmailField(max_length=254)
    password = serializers.CharField(
        write_only=True, trim_whitespace=False, style={"input_type": "password"}
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=False,
        trim_whitespace=False,
        style={"input_type": "password"},
    )
    display_name = serializers.CharField(
        required=False, allow_blank=True, max_length=255
    )
    username = serializers.CharField(
        required=False, allow_blank=True, max_length=150
    )

    def validate_email(self, value):
        email = value.strip().lower()
        User = get_user_model()
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError(
                "An account with this email already exists."
            )
        return email

    def validate_username(self, value):
        value = (value or "").strip()
        if not value:
            return ""
        username = _clean_username(value)
        if username == USERNAME_FALLBACK and value != USERNAME_FALLBACK:
            raise serializers.ValidationError(
                "Username may only contain letters, numbers and @/./+/-/_."
            )
        User = get_user_model()
        if User.objects.filter(username__iexact=username).exists():
            raise serializers.ValidationError("This username is already taken.")
        return username

    def validate(self, attrs):
        password = attrs.get("password", "")
        password_confirm = attrs.get("password_confirm")

        if password_confirm is not None and password != password_confirm:
            raise serializers.ValidationError(
                {"password_confirm": "Passwords do not match."}
            )

        candidate_username = attrs.get("username") or _clean_username(
            attrs.get("email", "").split("@")[0]
        )
        candidate = get_user_model()(
            username=candidate_username,
            email=attrs.get("email", ""),
        )
        try:
            validate_password(password, user=candidate)
        except DjangoValidationError as exc:
            raise serializers.ValidationError({"password": list(exc.messages)})

        return attrs

    def create(self, validated_data):
        User = get_user_model()
        email = validated_data["email"]

        base_username = validated_data.get("username") or _clean_username(
            email.split("@")[0]
        )
        username = base_username
        suffix = 1
        while User.objects.filter(username__iexact=username).exists():
            suffix += 1
            username = f"{base_username}{suffix}"

        display_name = (validated_data.get("display_name") or "").strip()
        if not display_name:
            display_name = username
        first_name, _, last_name = display_name.partition(" ")

        user = User.objects.create_user(
            username=username,
            email=email,
            password=validated_data["password"],
            first_name=first_name[:150],
            last_name=last_name[:150],
        )
        UserProfile.objects.create(user=user, display_name=display_name[:255])
        return user


class LoginSerializer(serializers.Serializer):
    """Accept either an email address or a username as the identifier."""

    identifier = serializers.CharField(max_length=254)
    password = serializers.CharField(
        write_only=True, trim_whitespace=False, style={"input_type": "password"}
    )


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = '__all__'
        read_only_fields = ('user',)


class EvaluatedCriterionResultSerializer(serializers.Serializer):
    rule_id = serializers.CharField()
    rule_type = serializers.CharField()
    title = serializers.CharField()
    status = serializers.ChoiceField(choices=[
        ('meets', 'meets'),
        ('fails', 'fails'),
        ('more_info_needed', 'more_info_needed'),
        ('needs_manual_review', 'needs_manual_review'),
    ])
    is_mandatory = serializers.BooleanField()
    explanation = serializers.CharField()
    source_citation = serializers.CharField()
    student_value = serializers.CharField(required=False, allow_blank=True)
    required_value = serializers.CharField()


class EligibilityEvaluationSerializer(serializers.Serializer):
    scholarship_id = serializers.CharField()
    outcome = serializers.ChoiceField(choices=[
        ('Likely eligible', 'Likely eligible'),
        ('More information needed', 'More information needed'),
        ('Does not meet criterion', 'Does not meet criterion'),
        ('Needs manual review', 'Needs manual review'),
    ])
    match_percentage = serializers.IntegerField()
    criteria_results = EvaluatedCriterionResultSerializer(many=True)
    summary = serializers.CharField()
    mandatory_failed_count = serializers.IntegerField()
    missing_info_count = serializers.IntegerField()
    manual_review_count = serializers.IntegerField()
    met_criteria_count = serializers.IntegerField()
    total_criteria_count = serializers.IntegerField()