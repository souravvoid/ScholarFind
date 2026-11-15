"""Load the curated catalogue bundle into the PostgreSQL catalogue.

The React client ships a bundled catalogue (``src/data/scholarshipsData.ts``)
that doubles as the offline fallback. When the Django API is reachable the
client trusts the API instead, so any record that only exists in the bundle
silently disappears from filters. This command imports the bundle so the API
and the offline fallback expose the same scholarships, hero images, funding
types, and eligibility rules.

The fixture is generated from the TypeScript source, never hand-edited:

    npx tsx scripts/export-catalogue-bundle.ts
    cd backend && python manage.py seed_catalogue_bundle

Records already present in the verified adapter catalogue are never
duplicated: the command recognises the same programme by title and copies the
missing presentation metadata (hero image, coverage, funding nature) onto the
existing record.
"""

import json
import re
import unicodedata
from datetime import datetime, time, timezone as dt_timezone
from pathlib import Path

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from django.utils.dateparse import parse_date
from django.utils.text import slugify

from scholarships.models import (
    RequiredDocument,
    Scholarship,
    ScholarshipEligibilityRule,
    ScholarshipProvider,
    ScholarshipSource,
)

FIXTURE_PATH = Path(__file__).resolve().parents[2] / "fixtures" / "bundled_catalogue.json"

VALID_RULE_TYPES = {
    "citizenship",
    "degree_level",
    "academic_score",
    "field_of_study",
    "language",
    "work_experience",
    "manual_review",
}

# Bundle criteria use camelCase keys; the public serializer only forwards the
# snake_case parameters the client evaluator understands.
RULE_PARAMETER_ALIASES = {
    "allowedCitizenships": "allowed_citizenships",
    "prohibitedCitizenships": "prohibited_citizenships",
    "requiredDegrees": "required_degrees",
    "applicableFields": "applicable_fields",
    "minGpaNormalized": "min_gpa_normalized",
    "minWorkYears": "min_work_years",
    "requiresEnglishCert": "requires_english_cert",
    "acceptsMediumOfInstructionWaiver": "accepts_medium_of_instruction_waiver",
    "minIelts": "min_ielts",
}


def _csv(values):
    return ", ".join(str(value) for value in values or [] if value)


def _normalize_title(title):
    ascii_title = (
        unicodedata.normalize("NFKD", title or "")
        .encode("ascii", "ignore")
        .decode("ascii")
    )
    ascii_title = ascii_title.lower()
    ascii_title = re.sub(r"\b20\d{2}(?:[/-]\d{2,4})?\b", " ", ascii_title)
    ascii_title = re.sub(r"[^a-z0-9]+", " ", ascii_title)
    return " ".join(ascii_title.split())


def _is_same_programme(left, right):
    if not left or not right:
        return False
    if left == right:
        return True
    short, long = (left, right) if len(left) <= len(right) else (right, left)
    # Require a meaningful phrase, not a single generic word, to match.
    return len(short.split()) >= 4 and f" {short} " in f" {long} "


def _deadline(raw_value):
    if not raw_value:
        return None
    parsed = parse_date(str(raw_value)[:10])
    if parsed is None:
        return None
    return datetime.combine(parsed, time.min, tzinfo=dt_timezone.utc)


class Command(BaseCommand):
    help = "Import the bundled client catalogue into the Django catalogue."

    def add_arguments(self, parser):
        parser.add_argument(
            "--fixture",
            default=str(FIXTURE_PATH),
            help="Path to the JSON bundle exported from the client catalogue.",
        )

    def handle(self, *args, **options):
        fixture_path = Path(options["fixture"])
        if not fixture_path.is_file():
            raise FileNotFoundError(
                f"Bundle fixture not found at {fixture_path}. "
                "Run `npx tsx scripts/export-catalogue-bundle.ts` first."
            )

        records = json.loads(fixture_path.read_text())
        if not isinstance(records, list):
            raise ValueError("Bundle fixture must contain a list of scholarships.")

        created = 0
        updated = 0
        linked = 0

        with transaction.atomic():
            existing = list(
                Scholarship.objects.select_related("provider", "source")
                .prefetch_related("eligibility_rules", "required_documents")
                .all()
            )
            existing_by_slug = {scholarship.slug: scholarship for scholarship in existing}
            existing_by_title = [
                (_normalize_title(scholarship.title), scholarship) for scholarship in existing
            ]

            for record in records:
                normalized = _normalize_title(record.get("title", ""))
                duplicate = next(
                    (
                        scholarship
                        for title, scholarship in existing_by_title
                        if _is_same_programme(title, normalized)
                    ),
                    None,
                )

                if duplicate is not None:
                    self._link_metadata(duplicate, record)
                    linked += 1
                    continue

                scholarship, was_created = self._upsert(record, existing_by_slug.get(record.get("slug")))
                existing_by_slug[scholarship.slug] = scholarship
                existing_by_title.append((normalized, scholarship))
                if was_created:
                    created += 1
                else:
                    updated += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Bundle import complete: created={created} updated={updated} "
                f"linked_to_existing={linked} catalogue_total={Scholarship.objects.count()}"
            )
        )

    def _link_metadata(self, scholarship, record):
        """Copy presentation metadata onto an existing verified record."""
        changed = False
        if not scholarship.hero_image and record.get("heroImage"):
            scholarship.hero_image = record["heroImage"]
            changed = True
        if not scholarship.coverage_types and record.get("coverageTypes"):
            scholarship.coverage_types = _csv(record["coverageTypes"])
            changed = True
        if not scholarship.funding_nature and record.get("fundingNature"):
            scholarship.funding_nature = _csv(record["fundingNature"])
            changed = True
        if changed:
            scholarship.save(
                update_fields=["hero_image", "coverage_types", "funding_nature", "updated_at"]
            )

    def _get_source(self, record):
        provenance = record.get("provenance") or {}
        source_id = provenance.get("sourceId") or f"bundle-{slugify(record.get('providerName', 'source'))}"
        defaults = {
            "name": (provenance.get("sourceName") or record.get("providerName") or source_id)[:255],
            "origin_agency": (provenance.get("sourceName") or record.get("providerName") or "")[:255],
            "country": (record.get("destinationCountries") or ["International"])[0][:100],
            "access_method": "Curated catalogue bundle",
            "provenance_url": provenance.get("sourceRecordUrl") or record.get("officialSourceUrl"),
            "is_active": True,
            "last_ingested_at": timezone.now(),
        }
        # Prefix keeps bundle provenance distinct from live ingestion adapters.
        return ScholarshipSource.objects.get_or_create(
            adapter_module=f"bundle:{source_id}"[:255], defaults=defaults
        )[0]

    def _get_provider(self, record):
        provider, _ = ScholarshipProvider.objects.get_or_create(
            name=(record.get("providerName") or "Unknown provider")[:255],
            defaults={
                "category": (record.get("providerCategory") or "Scholarship provider")[:100],
                "country": (record.get("destinationCountries") or ["International"])[0][:100],
                "website_url": record.get("officialSourceUrl"),
                "verified": True,
            },
        )
        return provider

    def _upsert(self, record, existing=None):
        slug = (record.get("slug") or slugify(record.get("title", "")))[:255]
        scholarship = existing or Scholarship(slug=slug)
        scholarship.slug = slug
        scholarship.title = (record.get("title") or "")[:255]
        scholarship.provider = self._get_provider(record)
        scholarship.source = self._get_source(record)
        scholarship.hero_image = record.get("heroImage") or None
        scholarship.destination_countries = _csv(record.get("destinationCountries"))
        scholarship.host_institutions = _csv(record.get("hostInstitutions")) or None
        scholarship.study_levels = _csv(record.get("studyLevels"))
        scholarship.fields_of_study = _csv(record.get("fieldsOfStudy"))
        scholarship.total_award_value = (record.get("totalAwardValue") or "Not published")[:255]
        scholarship.award_details = (record.get("awardDetails") or None)
        scholarship.coverage_types = _csv(record.get("coverageTypes"))
        scholarship.funding_nature = _csv(record.get("fundingNature"))
        scholarship.estimated_usd_value = float(record.get("estimatedUSDValue") or 0.0)
        scholarship.application_deadline = _deadline(record.get("applicationDeadline"))
        scholarship.academic_year = (record.get("academicYear") or "Not specified")[:50]
        scholarship.official_source_url = record.get("officialSourceUrl")
        scholarship.official_application_url = record.get("officialApplicationUrl")
        scholarship.source_domain = (record.get("sourceDomain") or "")[:255]
        scholarship.overview = record.get("overview") or "See the official provider page for details."
        scholarship.application_instructions = list(record.get("applicationInstructions") or [])
        scholarship.is_active = True

        was_created = scholarship.pk is None
        scholarship.save()

        scholarship.eligibility_rules.all().delete()
        for criterion in record.get("criteria") or []:
            rule_type = criterion.get("ruleType")
            payload = {}
            for key, value in criterion.items():
                alias = RULE_PARAMETER_ALIASES.get(key)
                if alias:
                    payload[alias] = value
            if rule_type not in VALID_RULE_TYPES:
                payload["original_rule_type"] = rule_type
                rule_type = "manual_review"
            ScholarshipEligibilityRule.objects.create(
                scholarship=scholarship,
                rule_type=rule_type,
                title=(criterion.get("title") or "Eligibility requirement")[:255],
                description=criterion.get("description") or "",
                is_mandatory=bool(criterion.get("isMandatory", True)),
                source_citation=(criterion.get("sourceCitation") or "")[:512],
                rule_payload=json.dumps(payload, default=str),
            )

        scholarship.required_documents.all().delete()
        for document_name in record.get("requiredDocuments") or []:
            RequiredDocument.objects.create(
                scholarship=scholarship,
                document_name=str(document_name)[:255],
                is_mandatory=True,
            )

        return scholarship, was_created
