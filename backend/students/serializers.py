from rest_framework import serializers

from eligibility_service import standardize_gpa  # type: ignore

from .models import DegreeLevelChoices, StudentProfile


class StudentProfileSerializer(serializers.ModelSerializer):
    normalized_gpa = serializers.FloatField(read_only=True)

    class Meta:
        model = StudentProfile
        fields = "__all__"
        read_only_fields = ("user", "updated_at", "normalized_gpa")

    def _with_normalized_gpa(self, validated_data):
        gpa = validated_data.get("gpa", getattr(self.instance, "gpa", None))
        scale = validated_data.get(
            "grading_scale", getattr(self.instance, "grading_scale", "gpa_4_0")
        )
        max_gpa = validated_data.get(
            "max_gpa", getattr(self.instance, "max_gpa", 4.0)
        )
        normalized = standardize_gpa(gpa, scale, max_gpa)
        validated_data["normalized_gpa"] = normalized if normalized is not None else 0.0
        return validated_data

    def create(self, validated_data):
        return super().create(self._with_normalized_gpa(validated_data))

    def update(self, instance, validated_data):
        return super().update(instance, self._with_normalized_gpa(validated_data))
