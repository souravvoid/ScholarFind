from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator


class DegreeLevelChoices(models.TextChoices):
    BACHELORS = "bachelors"
    MASTERS = "masters"
    PHD = "phd"
    POSTDOC = "postdoc"


class StudentProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        primary_key=True,
        related_name="student_profile"
    )
    citizenship = models.CharField(max_length=100)
    residence_country = models.CharField(max_length=100)
    education_level = models.CharField(
        max_length=20,
        choices=DegreeLevelChoices.choices,
        default=DegreeLevelChoices.BACHELORS
    )
    institution_name = models.CharField(max_length=255)
    grading_scale = models.CharField(max_length=50, default="gpa_4_0")
    gpa = models.FloatField(validators=[MinValueValidator(0.0), MaxValueValidator(5.0)])
    max_gpa = models.FloatField(default=4.0, validators=[MinValueValidator(1.0), MaxValueValidator(5.0)])
    normalized_gpa = models.FloatField(null=False)
    graduation_year = models.CharField(max_length=50)
    primary_field = models.CharField(max_length=255)
    faculty_tags = models.TextField(blank=True)
    target_degrees = models.TextField(
        blank=True,
        help_text="Comma-separated list of target degree levels"
    )
    target_regions = models.TextField(
        blank=True,
        help_text="Comma-separated list of target regions/countries"
    )
    target_countries = models.TextField(
        blank=True,
        help_text="Comma-separated list of target countries"
    )
    delivery_modality = models.CharField(
        max_length=50,
        default="on_campus"
    )
    intended_start_term = models.CharField(max_length=50, blank=True, null=True)
    work_experience_years = models.FloatField(
        default=0.0,
        validators=[MinValueValidator(0.0)]
    )
    english_test_type = models.CharField(max_length=50, default="none")
    english_score = models.CharField(max_length=50, blank=True, null=True)
    has_english_medium_instruction = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Profile for {self.user.username}"
    
    class Meta:
        verbose_name = "Student Profile"
        verbose_name_plural = "Student Profiles"
