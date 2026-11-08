from django.contrib import admin
from .models import ApplicationTrackerEntry


@admin.register(ApplicationTrackerEntry)
class ApplicationTrackerEntryAdmin(admin.ModelAdmin):
    list_display = ('user', 'scholarship', 'status', 'personal_deadline_target', 'updated_at')
    list_filter = ('status',)
    search_fields = ('user__username', 'scholarship__title')