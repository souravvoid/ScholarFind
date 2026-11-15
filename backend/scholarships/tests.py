from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from scholarships.models import (
    RequiredDocument,
    Scholarship,
    ScholarshipEligibilityRule,
    ScholarshipProvider,
    ScholarshipSource,
)


class ScholarshipCatalogueAPITests(TestCase):
    def setUp(self):
        provider = ScholarshipProvider.objects.create(
            name="Example Provider",
            category="Government",
            country="India",
            website_url="https://provider.example",
        )
        source = ScholarshipSource.objects.create(
            name="Example Source",
            origin_agency="Example Agency",
            country="India",
            adapter_module="example",
            access_method="Official page",
            provenance_url="https://source.example",
        )
        self.scholarship = Scholarship.objects.create(
            slug="example-award",
            title="Example Award",
            provider=provider,
            source=source,
            destination_countries="India, Nepal",
            host_institutions="Example University",
            study_levels="bachelors, masters",
            fields_of_study="Science, Engineering",
            total_award_value="Tuition support",
            award_details=None,
            application_deadline=None,
            academic_year="2026/2027",
            official_source_url="https://source.example/award",
            official_application_url="https://provider.example/apply",
            source_domain="provider.example",
            overview="An example opportunity.",
            application_instructions=[],
        )
        self.rule = ScholarshipEligibilityRule.objects.create(
            scholarship=self.scholarship,
            rule_type="citizenship",
            title="Eligible citizenship",
            description="Applicants from India or Nepal.",
            is_mandatory=True,
            source_citation="Official terms",
            rule_payload='{"allowed_countries": ["India", "Nepal"]}',
        )
        RequiredDocument.objects.create(
            scholarship=self.scholarship,
            document_name="Transcript",
            description="Academic transcript",
            is_mandatory=True,
        )
        self.client = APIClient()

    def test_list_uses_typed_summary_and_canonical_slug_id(self):
        response = self.client.get(reverse("scholarship-list"))
        self.assertEqual(response.status_code, 200)
        item = response.json()["results"][0]
        self.assertEqual(item["id"], "example-award")
        self.assertEqual(item["destination_countries"], ["India", "Nepal"])
        self.assertEqual(item["application_deadline"], None)
        self.assertEqual(item["criteria"][0]["rule_payload"], {
            "allowed_citizenships": ["India", "Nepal"]
        })

    def test_detail_is_retrievable_by_slug_and_includes_typed_relations(self):
        response = self.client.get(
            reverse("scholarship-detail", kwargs={"slug": "example-award"})
        )
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["id"], "example-award")
        self.assertEqual(payload["required_documents"][0]["document_name"], "Transcript")
        self.assertEqual(payload["criteria"][0]["id"], str(self.rule.pk))
        self.assertEqual(payload["provenance"]["source_name"], "Example Source")
        self.assertIsNone(payload["provenance"]["collected_at"])
        self.assertEqual(payload["application_instructions"], [])

    def test_unknown_or_invalid_rule_parameters_require_manual_review(self):
        self.rule.rule_payload = '{"min_gpa_normalized": 101}'
        self.rule.save(update_fields=["rule_payload"])
        response = self.client.get(reverse("scholarship-list"))
        criterion = response.json()["results"][0]["criteria"][0]
        self.assertEqual(criterion["rule_type"], "manual_review")
        self.assertEqual(criterion["rule_payload"], {})
        self.assertEqual(criterion["original_rule_type"], "citizenship")

    def test_unknown_slug_is_not_found(self):
        response = self.client.get(
            reverse("scholarship-detail", kwargs={"slug": "unknown-award"})
        )
        self.assertEqual(response.status_code, 404)

    def test_catalogue_api_is_public_and_read_only(self):
        anonymous_response = self.client.get(reverse("scholarship-list"))
        self.assertEqual(anonymous_response.status_code, 200)

        user = get_user_model().objects.create_user(username="catalogue-reader")
        self.client.force_authenticate(user=user)
        write_response = self.client.post(
            reverse("scholarship-list"),
            {"slug": "another-award", "title": "Another"},
            format="json",
        )
        self.assertEqual(write_response.status_code, 405)
