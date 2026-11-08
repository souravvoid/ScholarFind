from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator


class ApplicationTrackerEntry(models.Model):
    class StatusChoices(models.TextChoices):
        INTERESTED = "interested"
        PREPARING = "preparing"
        READY = "ready"
        APPLIED = "applied"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='application_tracker'
    )
    scholarship = models.ForeignKey(
        "scholarships.Scholarship",
        on_delete=models.CASCADE,
        related_name='application_tracker_entries'
    )
    status = models.CharField(max_length=20, choices=StatusChoices.choices, default=StatusChoices.INTERESTED)
    completed_documents = models.TextField(blank=True, null=True)
    personal_deadline_target = models.DateTimeField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("user", "scholarship")

    def __str__(self):
        return f"{self.user.username} - {self.scholarship.title}"
