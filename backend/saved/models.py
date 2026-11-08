from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator


class SavedScholarship(models.Model):
    class StatusChoices(models.TextChoices):
        INTERESTED = "interested"
        PREPARING = "preparing"
        READY = "ready"
        APPLIED = "applied"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='saved_scholarships'
    )
    scholarship = models.ForeignKey(
        "scholarships.Scholarship",
        on_delete=models.CASCADE,
        related_name='saved_list'
    )
    status = models.CharField(max_length=20, choices=StatusChoices.choices, default=StatusChoices.INTERESTED)
    notes = models.TextField(blank=True, null=True)
    saved_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("user", "scholarship")

    def __str__(self):
        return f"{self.user.username} - {self.scholarship.title}"
