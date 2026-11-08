"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.django-project.com/en/6.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns: path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns: path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
"""
from rest_framework import routers
from rest_framework.authtoken.views import obtain_auth_token
from rest_framework.response import Response
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import os

# API routers for each app
from scholarships.views import ScholarshipProviderViewSet, ScholarshipSourceViewSet, ScholarshipViewSet, ScholarshipEligibilityRuleViewSet, RequiredDocumentViewSet, IngestionJobViewSet
from students.views import StudentProfileViewSet
from accounts.views import UserProfileViewSet, google_login, google_callback, evaluate_eligibility
from ingestion.views import admin_ingest
from matching.views import ManualReviewFlagViewSet, WorkExperienceRecordViewSet
from saved.views import SavedScholarshipViewSet
from tracking.views import ApplicationTrackerEntryViewSet

router = routers.DefaultRouter()
router.register(r'scholarship-providers', ScholarshipProviderViewSet)
router.register(r'scholarship-sources', ScholarshipSourceViewSet)
router.register(r'scholarships', ScholarshipViewSet)
router.register(r'eligibility-rules', ScholarshipEligibilityRuleViewSet)
router.register(r'required-documents', RequiredDocumentViewSet)
router.register(r'ingestion-jobs', IngestionJobViewSet)
router.register(r'student-profiles', StudentProfileViewSet)
router.register(r'user-profiles', UserProfileViewSet)
router.register(r'manual-review-flags', ManualReviewFlagViewSet)
router.register(r'work-experience-records', WorkExperienceRecordViewSet)
router.register(r'saved-scholarships', SavedScholarshipViewSet)
router.register(r'application-tracker-entries', ApplicationTrackerEntryViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/', include(router.urls)),
    path('api/v1/health/', lambda request: JsonResponse({'status': 'ok', 'service': 'scholarfind'}), name='health'),
    path('api/v1/sources/', lambda request: JsonResponse({'sources': []}), name='sources'),
    path('api/v1/evaluate/', lambda request: JsonResponse({'outcome': 'need to implement'}), name='evaluate'),
    path('api/v1/eligibility/', evaluate_eligibility, name='eligibility_evaluate'),
    path('api/v1/admin/ingest/<str:source_id>/', admin_ingest, name='admin_ingest'),
    path('api/auth/token/', obtain_auth_token, name='api_token_auth'),
    path('api/auth/google/login/', google_login, name='google_login'),
    path('api/auth/google/callback/', google_callback, name='google_callback'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)