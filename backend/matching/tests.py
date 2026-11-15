from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from matching.models import ManualReviewFlag, WorkExperienceRecord
from scholarships.models import Scholarship, ScholarshipProvider, ScholarshipSource
from students.models import StudentProfile


class MatchingAPIOwnershipTests(TestCase):
    def setUp(self):
        user_model = get_user_model()
        self.user = user_model.objects.create_user(username="student")
        self.other_user = user_model.objects.create_user(username="other-student")
        self._create_student_profile(self.user)
        self._create_student_profile(self.other_user)

        provider = ScholarshipProvider.objects.create(
            name="Test Provider",
            category="Government",
            country="United Kingdom",
            website_url="https://provider.example",
        )
        source = ScholarshipSource.objects.create(
            name="Test Source",
            origin_agency="Test Agency",
            country="United Kingdom",
            adapter_module="test",
            access_method="Official catalogue",
            provenance_url="https://source.example",
        )
        self.scholarship = Scholarship.objects.create(
            slug="matching-ownership-test",
            title="Matching Ownership Test Scholarship",
            provider=provider,
            source=source,
            destination_countries="United Kingdom",
            study_levels="masters",
            fields_of_study="Science",
            total_award_value="Tuition",
            application_deadline="2027-01-01T00:00:00Z",
            academic_year="2027",
            official_source_url="https://source.example/scholarship",
            official_application_url="https://provider.example/apply",
            source_domain="provider.example",
            overview="Test scholarship",
        )
        self.client = self._authenticated_client(self.user)
        self.other_client = self._authenticated_client(self.other_user)

    @staticmethod
    def _create_student_profile(user):
        return StudentProfile.objects.create(
            user=user,
            citizenship="Nigeria",
            residence_country="Nigeria",
            institution_name="Test University",
            grading_scale="gpa_4_0",
            gpa=3.5,
            max_gpa=4.0,
            normalized_gpa=87.5,
            graduation_year="2025",
            primary_field="Science",
        )

    @staticmethod
    def _authenticated_client(user):
        client = APIClient()
        client.force_authenticate(user=user)
        # Keep server-side errors as responses so a broken endpoint fails at
        # the behavior assertion rather than escaping the test client.
        client.raise_request_exception = False
        return client

    def test_manual_review_flag_student_relation_targets_student_profile(self):
        self.assertIs(
            ManualReviewFlag._meta.get_field("student").remote_field.model,
            StudentProfile,
        )

    def test_manual_review_flags_are_created_and_listed_only_for_the_owner(self):
        url = reverse("manual-review-flag-list")
        own_response = self.client.post(
            url,
            {"scholarship": self.scholarship.pk, "reason": "Needs review"},
            format="json",
        )
        other_response = self.other_client.post(
            url,
            {"scholarship": self.scholarship.pk, "reason": "Other user's review"},
            format="json",
        )

        self.assertEqual(own_response.status_code, 201)
        self.assertEqual(other_response.status_code, 201)

        own_list = self.client.get(url)
        other_list = self.other_client.get(url)

        self.assertEqual(own_list.status_code, 200)
        self.assertEqual(other_list.status_code, 200)
        self.assertEqual(
            [item["id"] for item in own_list.json()],
            [own_response.json()["id"]],
        )
        self.assertEqual(
            [item["id"] for item in other_list.json()],
            [other_response.json()["id"]],
        )

    def test_work_experience_student_relation_targets_student_profile(self):
        self.assertIs(
            WorkExperienceRecord._meta.get_field("student").remote_field.model,
            StudentProfile,
        )

    def test_work_experience_records_are_created_and_listed_only_for_the_owner(self):
        url = reverse("work-experience-record-list")
        own_response = self.client.post(
            url,
            {"years": 2.5, "employer": "Example Co", "role": "Analyst"},
            format="json",
        )
        other_response = self.other_client.post(
            url,
            {"years": 1.0, "employer": "Other Co", "role": "Researcher"},
            format="json",
        )

        self.assertEqual(own_response.status_code, 201)
        self.assertEqual(other_response.status_code, 201)

        own_list = self.client.get(url)
        other_list = self.other_client.get(url)

        self.assertEqual(own_list.status_code, 200)
        self.assertEqual(other_list.status_code, 200)
        self.assertEqual(
            [item["id"] for item in own_list.json()],
            [own_response.json()["id"]],
        )
        self.assertEqual(
            [item["id"] for item in other_list.json()],
            [other_response.json()["id"]],
        )
