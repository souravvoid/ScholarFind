"""
Eligibility evaluation serializers for ScholarFind Django migration.
Preserves FastAPI eligibility engine API contracts.
"""

from rest_framework import serializers
from .models import UserProfile


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