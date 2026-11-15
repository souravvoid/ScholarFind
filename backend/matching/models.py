from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator


class ManualReviewFlag(models.Model):
    """Flags scholarship-profile pairs that require institutional committee review."""
    student = models.ForeignKey(
        "students.StudentProfile",
        on_delete=models.CASCADE,
        related_name='manual_review_student'
    )
    scholarship = models.ForeignKey(
        "scholarships.Scholarship",
        on_delete=models.CASCADE
    )
    reason = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    reviewed = models.BooleanField(default=False)
    reviewed_at = models.DateTimeField(blank=True, null=True)
    reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        blank=True, null=True,
        related_name='manual_review_reviewer'
    )

    class Meta:
        unique_together = ("student", "scholarship")

    def __str__(self):
        return f"Manual review: {self.student.username} - {self.scholarship.title}"


class WorkExperienceRecord(models.Model):
    """Tracks verified work experience for eligibility matching."""
    student = models.ForeignKey(
        "students.StudentProfile",
        on_delete=models.CASCADE
    )
    years = models.FloatField(validators=[MinValueValidator(0.0)])
    employer = models.CharField(max_length=255, blank=True, null=True)
    role = models.CharField(max_length=255, blank=True, null=True)
    verified = models.BooleanField(default=False)
    verification_date = models.DateTimeField(blank=True, null=True)
    source = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return f"{self.years} years at {self.employer or 'self-employed'}"
