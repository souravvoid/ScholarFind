from django.contrib import admin
from .models import (
    ScholarshipProvider, ScholarshipSource, Scholarship,
    ScholarshipEligibilityRule, RequiredDocument, IngestionJob
)


@admin.register(ScholarshipProvider)
class ScholarshipProviderAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'country', 'verified')
    list_filter = ('verified', 'category')
    search_fields = ('name', 'country')


@admin.register(ScholarshipSource)
class ScholarshipSourceAdmin(admin.ModelAdmin):
    list_display = ('name', 'origin_agency', 'country', 'is_active')
    list_filter = ('is_active', 'origin_agency')
    search_fields = ('name', 'origin_agency')


@admin.register(Scholarship)
class ScholarshipAdmin(admin.ModelAdmin):
    list_display = ('title', 'provider', 'source', 'study_levels', 'is_active')
    list_filter = ('is_active', 'provider')
    search_fields = ('title', 'provider__name', 'source__name')


@admin.register(ScholarshipEligibilityRule)
class ScholarshipEligibilityRuleAdmin(admin.ModelAdmin):
    list_display = ('scholarship', 'rule_type', 'title', 'is_mandatory')
    list_filter = ('rule_type', 'is_mandatory')
    search_fields = ('title', 'scholarship__title')


@admin.register(RequiredDocument)
class RequiredDocumentAdmin(admin.ModelAdmin):
    list_display = ('scholarship', 'document_name', 'is_mandatory')
    list_filter = ('is_mandatory',)
    search_fields = ('document_name', 'scholarship__title')


@admin.register(IngestionJob)
class IngestionJobAdmin(admin.ModelAdmin):
    list_display = ('source_id', 'status', 'records_fetched', 'records_upserted', 'started_at')
    list_filter = ('status',)
    readonly_fields = ('source_id', 'started_at', 'completed_at')