
from django.db import models


class ScholarshipProvider(models.Model):
    name = models.CharField(max_length=255, unique=True)
    category = models.CharField(max_length=100)
    country = models.CharField(max_length=100)
    website_url = models.URLField()
    verified = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class ScholarshipSource(models.Model):
    name = models.CharField(max_length=255)
    origin_agency = models.CharField(max_length=255)
    country = models.CharField(max_length=100)
    adapter_module = models.CharField(max_length=255)
    access_method = models.CharField(max_length=100)
    provenance_url = models.URLField()
    is_active = models.BooleanField(default=True)
    last_ingested_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.name


class Scholarship(models.Model):
    slug = models.SlugField(max_length=255, unique=True, db_index=True)
    title = models.CharField(max_length=255, db_index=True)
    provider = models.ForeignKey(
        ScholarshipProvider,
        on_delete=models.CASCADE,
        related_name="scholarships"
    )
    source = models.ForeignKey(
        ScholarshipSource,
        on_delete=models.CASCADE,
        related_name="scholarships"
    )
    hero_image = models.URLField(blank=True, null=True)
    destination_countries = models.TextField()
    host_institutions = models.TextField(blank=True, null=True)
    study_levels = models.TextField()  # Comma-separated
    fields_of_study = models.TextField()  # Comma-separated
    total_award_value = models.CharField(max_length=255)
    award_details = models.CharField(max_length=512, blank=True, null=True)
    estimated_usd_value = models.FloatField(default=0.0)
    application_deadline = models.DateTimeField(db_index=True)
    academic_year = models.CharField(max_length=50)
    official_source_url = models.URLField()
    official_application_url = models.URLField()
    source_domain = models.CharField(max_length=255)
    overview = models.TextField()
    last_verified_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title


class ScholarshipEligibilityRule(models.Model):
    class RuleTypeChoices(models.TextChoices):
        CITIZENSHIP = "citizenship"
        DEGREE_LEVEL = "degree_level"
        ACADEMIC_SCORE = "academic_score"
        FIELD_OF_STUDY = "field_of_study"
        LANGUAGE = "language"
        WORK_EXPERIENCE = "work_experience"
        MANUAL_REVIEW = "manual_review"

    scholarship = models.ForeignKey(
        Scholarship,
        on_delete=models.CASCADE,
        related_name="eligibility_rules"
    )
    rule_type = models.CharField(max_length=50, choices=RuleTypeChoices.choices)
    title = models.CharField(max_length=255)
    description = models.TextField()
    is_mandatory = models.BooleanField(default=True)
    source_citation = models.CharField(max_length=512)
    rule_payload = models.TextField(blank=True, null=True)


class RequiredDocument(models.Model):
    scholarship = models.ForeignKey(
        Scholarship,
        on_delete=models.CASCADE,
        related_name="required_documents"
    )
    document_name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    is_mandatory = models.BooleanField(default=True)

    def __str__(self):
        return self.document_name


class IngestionJob(models.Model):
    class StatusChoices(models.TextChoices):
        PENDING = "pending"
        RUNNING = "running"
        COMPLETED = "completed"
        FAILED = "failed"

    source_id = models.CharField(max_length=100)
    status = models.CharField(max_length=20, choices=StatusChoices.choices, default=StatusChoices.PENDING)
    records_fetched = models.IntegerField(default=0)
    records_upserted = models.IntegerField(default=0)
    records_failed = models.IntegerField(default=0)
    error_log = models.TextField(blank=True, null=True)
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return f"{self.source_id} - {self.status}"
