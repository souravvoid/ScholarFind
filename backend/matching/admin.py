from django.contrib import admin
from .models import ManualReviewFlag, WorkExperienceRecord


@admin.register(ManualReviewFlag)
class ManualReviewFlagAdmin(admin.ModelAdmin):
    list_display = ('student', 'scholarship', 'reason', 'reviewed', 'created_at')
    list_filter = ('reviewed', 'created_at')
    search_fields = ('student__username', 'scholarship__title')


@admin.register(WorkExperienceRecord)
class WorkExperienceRecordAdmin(admin.ModelAdmin):
    list_display = ('student', 'years', 'employer', 'role', 'verified')
    list_filter = ('verified',)
    search_fields = ('student__username', 'employer', 'role')