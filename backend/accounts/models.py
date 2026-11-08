from django.db import models
from django.conf import settings


class UserProfile(models.Model):
    """Extended user profile for ScholarFind."""
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        primary_key=True,
        related_name='accounts_profile'
    )
    display_name = models.CharField(max_length=255, blank=True)
    photo_url = models.URLField(max_length=512, blank=True)
    citizenship = models.CharField(max_length=100, blank=True)
    residence_country = models.CharField(max_length=100, blank=True)
    
    def __str__(self):
        return f"Profile for {self.user.username}"
    
    class Meta:
        verbose_name = "User Profile"
        verbose_name_plural = "User Profiles"
