from django.contrib import admin
from .models import SavedScholarship


@admin.register(SavedScholarship)
class SavedScholarshipAdmin(admin.ModelAdmin):
    list_display = ('user', 'scholarship', 'status', 'saved_at')
    list_filter = ('status',)
    search_fields = ('user__username', 'scholarship__title')