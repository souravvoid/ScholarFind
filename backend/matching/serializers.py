from rest_framework import serializers

from .models import ManualReviewFlag, WorkExperienceRecord


class ManualReviewFlagSerializer(serializers.ModelSerializer):
    class Meta:
        model = ManualReviewFlag
        fields = "__all__"
        # Ownership and review state are assigned by the server, never by the client.
        read_only_fields = (
            "student",
            "created_at",
            "reviewed",
            "reviewed_at",
            "reviewer",
        )


class WorkExperienceRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkExperienceRecord
        fields = "__all__"
        # Ownership and verification state are server-controlled.
        read_only_fields = ("student", "verified", "verification_date")
