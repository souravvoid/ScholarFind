"""Persistence helpers for normalized ingestion records.

The ingestion pipeline produces :class:`NormalizedScholarshipRecord` objects in
memory. These helpers are the single place that maps them onto the Django ORM,
so both the admin ingestion endpoint and the ``populate_scholarships``
management command share identical, idempotent write behaviour.
"""

import json
import logging
from datetime import datetime, timezone as dt_timezone
from typing import Iterable, List, Tuple

from django.utils import timezone
from django.utils.dateparse import parse_datetime
from django.utils.text import slugify

from .models import (
    RequiredDocument,
    Scholarship,
    ScholarshipEligibilityRule,
    ScholarshipProvider,
    ScholarshipSource,
)

logger = logging.getLogger("scholarfind.scholarships.persistence")

# Values allowed by ScholarshipEligibilityRule.RuleTypeChoices.
VALID_RULE_TYPES = {
    "citizenship",
    "degree_level",
    "academic_score",
    "field_of_study",
    "language",
    "work_experience",
    "manual_review",
}


def _csv(values: Iterable) -> str:
    return ", ".join(str(value) for value in values if value)


def _truncate(value: str, limit: int) -> str:
    value = value or ""
    return value[:limit]


def _parse_deadline(raw_value):
    if not raw_value:
        return None
    parsed = parse_datetime(raw_value)
    if parsed is None:
        try:
            parsed = datetime.fromisoformat(str(raw_value).replace("Z", "+00:00"))
        except (TypeError, ValueError):
            return None
    if timezone.is_naive(parsed):
        parsed = timezone.make_aware(parsed, dt_timezone.utc)
    return parsed


def _get_or_create_source(record):
    defaults = {
        "name": _truncate(record.provenance_metadata.get("source_name", record.source_id) or record.source_id, 255),
        "origin_agency": _truncate(record.provenance_metadata.get("origin_agency", "Official Agency"), 255),
        "country": _truncate((record.destination_countries or ["International"])[0], 100),
        "adapter_module": _truncate(record.source_id, 255),
        "access_method": _truncate(record.provenance_metadata.get("access_method", "Official public catalogue"), 100),
        "provenance_url": record.provenance_metadata.get("provenance_url") or record.official_source_url,
        "is_active": True,
        "last_ingested_at": timezone.now(),
    }
    source = ScholarshipSource.objects.filter(adapter_module=record.source_id).first()
    if source is None:
        return ScholarshipSource.objects.create(**defaults), True
    for field, value in defaults.items():
        setattr(source, field, value)
    source.save()
    return source, False


def _get_or_create_provider(record):
    website = record.official_source_url or "https://example.org"
    defaults = {
        "category": _truncate(record.provider_category or "Government Endowment", 100),
        "country": _truncate((record.destination_countries or ["International"])[0], 100),
        "website_url": website,
        "verified": True,
    }
    provider, created = ScholarshipProvider.objects.get_or_create(
        name=_truncate(record.provider_name, 255), defaults=defaults
    )
    if not created:
        for field, value in defaults.items():
            setattr(provider, field, value)
        provider.save()
    return provider, created


def persist_normalized_record(record) -> Tuple[Scholarship, bool]:
    """Upsert one normalized record and its rules/documents. Idempotent."""
    source, _ = _get_or_create_source(record)
    provider, _ = _get_or_create_provider(record)

    deadline = _parse_deadline(record.deadline_iso)
    overview = record.award_summary or ""
    if deadline is None:
        # The schema requires a deadline. Keep the row but make the missing
        # source data explicit instead of inventing a plausible date.
        deadline = timezone.now()
        overview = (overview + " Application deadline has not been published.").strip()
        logger.warning("No parseable deadline for %s; storing ingestion time.", record.slug)

    base_slug = slugify(record.slug or record.title)[:200]
    slug = base_slug
    existing = Scholarship.objects.filter(slug=slug).first()
    if existing is not None and existing.source_id != source.id:
        slug = f"{base_slug}-{slugify(record.source_id)}"[:255]
    defaults = {
        "title": _truncate(record.title, 255),
        "provider": provider,
        "source": source,
        "destination_countries": _csv(record.destination_countries),
        "host_institutions": _csv(record.host_institutions) or None,
        "study_levels": _csv(record.study_levels),
        "fields_of_study": _csv(record.academic_fields),
        "total_award_value": _truncate(record.award_summary, 255),
        "award_details": _truncate(
            f"{record.currency_code} {record.total_award_amount or ''}".strip(), 512
        )
        or None,
        "estimated_usd_value": record.estimated_usd_value or 0.0,
        "application_deadline": deadline,
        "academic_year": _truncate(record.academic_cycle or "Not specified", 50),
        "official_source_url": record.official_source_url,
        "official_application_url": record.official_application_url,
        "source_domain": _truncate(record.source_domain, 255),
        "overview": overview or "See the official provider page for full details.",
        "is_active": True,
    }
    scholarship, created = Scholarship.objects.update_or_create(
        slug=slug, defaults=defaults
    )

    scholarship.eligibility_rules.all().delete()
    for rule in record.rules:
        rule_type = rule.rule_type if rule.rule_type in VALID_RULE_TYPES else "manual_review"
        payload = dict(rule.parameters or {})
        if rule.rule_type not in VALID_RULE_TYPES:
            payload["original_rule_type"] = rule.rule_type
        ScholarshipEligibilityRule.objects.create(
            scholarship=scholarship,
            rule_type=rule_type,
            title=_truncate(rule.title or "Eligibility requirement", 255),
            description=rule.description or "",
            is_mandatory=bool(rule.is_mandatory),
            source_citation=_truncate(rule.source_citation or "", 512),
            rule_payload=json.dumps(payload, default=str),
        )

    scholarship.required_documents.all().delete()
    for document_name in record.required_documents:
        RequiredDocument.objects.create(
            scholarship=scholarship,
            document_name=_truncate(document_name, 255),
            is_mandatory=True,
        )

    return scholarship, created


def persist_records(records: Iterable) -> Tuple[int, int]:
    """Persist a batch, returning ``(created_count, updated_count)``."""
    created_count = 0
    updated_count = 0
    for record in records:
        _, created = persist_normalized_record(record)
        if created:
            created_count += 1
        else:
            updated_count += 1
    return created_count, updated_count


def records_for_source(storage, source_id: str) -> List:
    return [record for record in storage.all() if record.source_id == source_id]
