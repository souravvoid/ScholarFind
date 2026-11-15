"""Tests for the bundled-catalogue import command."""

import json
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
from django.core.management import call_command
from rest_framework.test import APIClient

from scholarships.models import Scholarship, ScholarshipEligibilityRule, ScholarshipSource

pytestmark = pytest.mark.django_db


def _bundle_record(**overrides):
    record = {
        "slug": "sample-india-scholarship",
        "title": "Sample India Scholarship",
        "providerName": "Sample Foundation",
        "providerCategory": "Private Foundation",
        "heroImage": "https://images.example.org/sample.jpg",
        "destinationCountries": ["India"],
        "hostInstitutions": ["Sample University"],
        "studyLevels": ["bachelors", "masters"],
        "fieldsOfStudy": ["STEM", "Humanities"],
        "totalAwardValue": "INR 50,000 per annum",
        "awardDetails": "Tuition support",
        "coverageTypes": ["full_tuition", "stipend"],
        "fundingNature": ["merit", "need"],
        "estimatedUSDValue": 600.0,
        "applicationDeadline": "2026-11-30",
        "academicYear": "2026/2027",
        "officialSourceUrl": "https://foundation.example.org/scholarship",
        "officialApplicationUrl": "https://foundation.example.org/apply",
        "sourceDomain": "foundation.example.org",
        "overview": "A sample scholarship used to test the bundle import.",
        "requiredDocuments": ["Transcript"],
        "applicationInstructions": ["Apply online"],
        "criteria": [
            {
                "ruleType": "citizenship",
                "title": "Indian citizenship",
                "description": "Open to Indian citizens.",
                "isMandatory": True,
                "sourceCitation": "Scheme guidelines",
                "allowedCitizenships": ["India"],
            }
        ],
        "provenance": {
            "sourceName": "Sample Foundation",
            "sourceRecordUrl": "https://foundation.example.org/scholarship",
            "collectedAt": "2026-10-01T00:00:00Z",
            "sourceId": "src_sample",
        },
    }
    record.update(overrides)
    return record


def _write_fixture(tmp_path, records):
    path = tmp_path / "bundle.json"
    path.write_text(json.dumps(records))
    return str(path)


def test_seed_catalogue_bundle_imports_records_and_rules(tmp_path):
    call_command("seed_catalogue_bundle", fixture=_write_fixture(tmp_path, [_bundle_record()]), verbosity=0)

    scholarship = Scholarship.objects.get(slug="sample-india-scholarship")
    assert scholarship.hero_image == "https://images.example.org/sample.jpg"
    assert scholarship.destination_countries == "India"
    assert scholarship.coverage_types == "full_tuition, stipend"
    assert scholarship.funding_nature == "merit, need"
    assert scholarship.required_documents.count() == 1
    assert scholarship.source.adapter_module == "bundle:src_sample"

    rule = ScholarshipEligibilityRule.objects.get(scholarship=scholarship)
    assert rule.rule_type == "citizenship"
    assert json.loads(rule.rule_payload) == {"allowed_citizenships": ["India"]}


def test_seed_catalogue_bundle_links_existing_programme_without_duplicating(tmp_path):
    source = ScholarshipSource.objects.create(
        name="Adapter source",
        origin_agency="Adapter source",
        country="United Kingdom",
        adapter_module="src_csc_uk",
        access_method="Official site",
        provenance_url="https://example.org",
    )
    from scholarships.models import ScholarshipProvider

    provider = ScholarshipProvider.objects.create(
        name="Adapter provider",
        category="Government",
        country="United Kingdom",
        website_url="https://example.org",
    )
    existing = Scholarship.objects.create(
        slug="chevening-uk-2026",
        title="Chevening Scholarships UK 2026",
        provider=provider,
        source=source,
        destination_countries="United Kingdom",
        study_levels="masters",
        fields_of_study="All fields",
        total_award_value="Full tuition",
        estimated_usd_value=50000,
        academic_year="2026/2027",
        official_source_url="https://example.org",
        official_application_url="https://example.org/apply",
        source_domain="example.org",
        overview="Existing verified record.",
    )

    call_command(
        "seed_catalogue_bundle",
        fixture=_write_fixture(
            tmp_path,
            [
                _bundle_record(
                    slug="chevening-scholarship-uk",
                    title="Chevening Scholarships UK",
                    providerName="Chevening Secretariat",
                    destinationCountries=["United Kingdom"],
                )
            ],
        ),
        verbosity=0,
    )

    assert Scholarship.objects.count() == 1
    existing.refresh_from_db()
    assert existing.hero_image == "https://images.example.org/sample.jpg"
    assert existing.coverage_types == "full_tuition, stipend"
    assert existing.funding_nature == "merit, need"


def test_api_exposes_coverage_funding_and_hero_image(tmp_path):
    call_command("seed_catalogue_bundle", fixture=_write_fixture(tmp_path, [_bundle_record()]), verbosity=0)
    client = APIClient()

    listing = client.get("/api/v1/scholarships/?page_size=10").json()
    record = next(item for item in listing["results"] if item["slug"] == "sample-india-scholarship")
    assert record["hero_image"] == "https://images.example.org/sample.jpg"
    assert record["coverage_types"] == ["full_tuition", "stipend"]
    assert record["funding_nature"] == ["merit", "need"]

    detail = client.get("/api/v1/scholarships/sample-india-scholarship/").json()
    assert detail["criteria"][0]["rule_type"] == "citizenship"
    assert detail["criteria"][0]["rule_payload"] == {"allowed_citizenships": ["India"]}
