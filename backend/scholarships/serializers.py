import json
import math

from rest_framework import serializers

from .models import (
    IngestionJob,
    RequiredDocument,
    Scholarship,
    ScholarshipEligibilityRule,
    ScholarshipProvider,
    ScholarshipSource,
)


class ScholarshipProviderSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScholarshipProvider
        fields = "__all__"


class ScholarshipSourceSerializer(serializers.ModelSerializer):
    scholarship_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = ScholarshipSource
        fields = "__all__"


class ScholarshipSerializer(serializers.ModelSerializer):
    class Meta:
        model = Scholarship
        fields = "__all__"


def _number(value):
    if isinstance(value, bool):
        return None
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    return number if math.isfinite(number) else None


def _string_list(value):
    if not isinstance(value, list) or not all(isinstance(item, str) for item in value):
        return None
    return value


def _normalize_rule(rule):
    """Return only rule parameters understood by the client evaluator."""
    try:
        raw = json.loads(rule.rule_payload or "{}")
    except (TypeError, ValueError):
        raw = None

    if not isinstance(raw, dict):
        return "manual_review", {}, rule.rule_type

    rule_type = rule.rule_type
    aliases = {
        "citizenship": {
            "allowed_countries": "allowed_citizenships",
            "prohibited_countries": "prohibited_citizenships",
        },
        "degree_level": {"allowed_degrees": "required_degrees"},
        "field_of_study": {"allowed_fields": "applicable_fields"},
    }
    parameters = {
        aliases.get(rule_type, {}).get(key, key): value for key, value in raw.items()
    }
    allowed_keys = {
        "citizenship": {"allowed_citizenships", "prohibited_citizenships"},
        "degree_level": {"required_degrees"},
        "academic_score": {"min_gpa_normalized"},
        "field_of_study": {"applicable_fields"},
        "language": {"requires_english_cert", "accepts_medium_of_instruction_waiver", "min_ielts"},
        "work_experience": {"min_work_years"},
        "manual_review": set(),
    }
    if rule_type not in allowed_keys or set(parameters) - allowed_keys[rule_type]:
        return "manual_review", {}, rule.rule_type

    normalized = {}
    for key, value in parameters.items():
        if key in {
            "allowed_citizenships",
            "prohibited_citizenships",
            "required_degrees",
            "applicable_fields",
        }:
            values = _string_list(value)
            if values is None:
                return "manual_review", {}, rule.rule_type
            normalized[key] = values
        elif key in {"min_gpa_normalized", "min_ielts", "min_work_years"}:
            number = _number(value)
            if number is None:
                return "manual_review", {}, rule.rule_type
            normalized[key] = number
        elif key in {"requires_english_cert", "accepts_medium_of_instruction_waiver"}:
            if not isinstance(value, bool):
                return "manual_review", {}, rule.rule_type
            normalized[key] = value

    if rule_type == "academic_score" and "min_gpa_normalized" in normalized:
        if not 0 <= normalized["min_gpa_normalized"] <= 100:
            return "manual_review", {}, rule.rule_type
    if rule_type == "language" and "min_ielts" in normalized:
        if not 0 <= normalized["min_ielts"] <= 9:
            return "manual_review", {}, rule.rule_type
    if rule_type == "work_experience" and "min_work_years" in normalized:
        if normalized["min_work_years"] < 0:
            return "manual_review", {}, rule.rule_type

    return rule_type, normalized, None


class ScholarshipEligibilityRulePublicSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    rule_type = serializers.SerializerMethodField()
    rule_payload = serializers.SerializerMethodField()
    original_rule_type = serializers.SerializerMethodField()

    class Meta:
        model = ScholarshipEligibilityRule
        fields = (
            "id",
            "rule_type",
            "title",
            "description",
            "is_mandatory",
            "source_citation",
            "rule_payload",
            "original_rule_type",
        )

    def _normalized(self, obj):
        if not hasattr(obj, "_public_rule"):
            obj._public_rule = _normalize_rule(obj)
        return obj._public_rule

    def get_rule_type(self, obj):
        return self._normalized(obj)[0]

    def get_rule_payload(self, obj):
        return self._normalized(obj)[1]

    def get_original_rule_type(self, obj):
        return self._normalized(obj)[2]


class RequiredDocumentPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = RequiredDocument
        fields = ("id", "document_name", "description", "is_mandatory")


class ScholarshipSummarySerializer(serializers.ModelSerializer):
    id = serializers.CharField(source="slug", read_only=True)
    provider_name = serializers.CharField(source="provider.name", read_only=True)
    provider_category = serializers.CharField(source="provider.category", read_only=True)
    destination_countries = serializers.SerializerMethodField()
    study_levels = serializers.SerializerMethodField()
    fields_of_study = serializers.SerializerMethodField()
    coverage_types = serializers.SerializerMethodField()
    funding_nature = serializers.SerializerMethodField()
    criteria = ScholarshipEligibilityRulePublicSerializer(
        source="eligibility_rules", many=True, read_only=True
    )

    class Meta:
        model = Scholarship
        fields = (
            "id",
            "slug",
            "title",
            "provider_name",
            "provider_category",
            "hero_image",
            "destination_countries",
            "host_institutions",
            "study_levels",
            "fields_of_study",
            "total_award_value",
            "award_details",
            "coverage_types",
            "funding_nature",
            "estimated_usd_value",
            "application_deadline",
            "academic_year",
            "last_verified_at",
            "official_source_url",
            "official_application_url",
            "source_domain",
            "overview",
            "criteria",
        )

    @staticmethod
    def _split(value):
        return [item.strip() for item in (value or "").split(",") if item.strip()]

    def get_destination_countries(self, obj):
        return self._split(obj.destination_countries)

    def get_study_levels(self, obj):
        return self._split(obj.study_levels)

    def get_fields_of_study(self, obj):
        return self._split(obj.fields_of_study)

    def get_coverage_types(self, obj):
        return self._split(obj.coverage_types)

    def get_funding_nature(self, obj):
        return self._split(obj.funding_nature)


class ScholarshipDetailSerializer(ScholarshipSummarySerializer):
    required_documents = RequiredDocumentPublicSerializer(
        many=True, read_only=True
    )
    provenance = serializers.SerializerMethodField()

    class Meta(ScholarshipSummarySerializer.Meta):
        fields = ScholarshipSummarySerializer.Meta.fields + (
            "application_instructions",
            "required_documents",
            "provenance",
        )

    def get_provenance(self, obj):
        source = obj.source
        return {
            "source_name": source.name,
            "source_record_url": source.provenance_url,
            "collected_at": source.last_ingested_at,
            "source_id": source.adapter_module,
        }


class ScholarshipEligibilityRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScholarshipEligibilityRule
        fields = "__all__"


class RequiredDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = RequiredDocument
        fields = "__all__"


class IngestionJobSerializer(serializers.ModelSerializer):
    class Meta:
        model = IngestionJob
        fields = "__all__"
