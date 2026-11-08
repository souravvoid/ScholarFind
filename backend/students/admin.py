from django.contrib import admin
from .models import StudentProfile


@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'education_level', 'grading_scale', 'gpa', 'target_degrees')
    search_fields = ('user__username', 'primary_field', 'citizenship')
    list_filter = ('education_level', 'grading_scale')