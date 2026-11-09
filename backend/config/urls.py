"""URL configuration for the ScholarFind Django backend."""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from rest_framework import routers
from rest_framework.authtoken.views import obtain_auth_token

from accounts.views import (
    auth_login,
    auth_logout,
    csrf_token,
    current_user,
    evaluate_compat,
    evaluate_eligibility,
    google_callback,
    google_login,
    google_logout,
    google_session,
    register,
    UserProfileViewSet,
)
from config.views import health, sources
from ingestion.views import admin_ingest
from matching.views import ManualReviewFlagViewSet, WorkExperienceRecordViewSet
from saved.views import SavedScholarshipViewSet
from scholarships.views import (
    IngestionJobViewSet,
    RequiredDocumentViewSet,
    ScholarshipEligibilityRuleViewSet,
    ScholarshipProviderViewSet,
    ScholarshipSourceViewSet,
    ScholarshipViewSet,
)
from students.views import StudentProfileViewSet
from tracking.views import ApplicationTrackerEntryViewSet

router = routers.DefaultRouter()
router.register(r"scholarship-providers", ScholarshipProviderViewSet)
router.register(r"scholarship-sources", ScholarshipSourceViewSet)
router.register(r"scholarships", ScholarshipViewSet)
router.register(r"eligibility-rules", ScholarshipEligibilityRuleViewSet)
router.register(r"required-documents", RequiredDocumentViewSet)
router.register(r"ingestion-jobs", IngestionJobViewSet)
router.register(r"student-profiles", StudentProfileViewSet, basename="student-profile")
router.register(r"user-profiles", UserProfileViewSet, basename="user-profile")
router.register(r"manual-review-flags", ManualReviewFlagViewSet, basename="manual-review-flag")
router.register(r"work-experience-records", WorkExperienceRecordViewSet, basename="work-experience-record")
router.register(r"saved-scholarships", SavedScholarshipViewSet, basename="saved-scholarship")
router.register(
    r"application-tracker-entries",
    ApplicationTrackerEntryViewSet,
    basename="application-tracker-entry",
)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/", include(router.urls)),
    path("api/v1/health/", health, name="health"),
    path("api/v1/sources/", sources, name="sources"),
    # Original FastAPI contract: rules supplied in the request body.
    path("api/v1/evaluate/", evaluate_compat, name="evaluate"),
    # Database-aware variant used by the Django migration.
    path("api/v1/eligibility/", evaluate_eligibility, name="eligibility_evaluate"),
    path(
        "api/v1/eligibility/evaluate/",
        evaluate_eligibility,
        name="eligibility_evaluate_explicit",
    ),
    path("api/v1/admin/ingest/<str:source_id>/", admin_ingest, name="admin_ingest"),
    path("api/auth/register/", register, name="api_register"),
    path("api/auth/login/", auth_login, name="api_login"),
    path("api/auth/logout/", auth_logout, name="api_logout"),
    path("api/auth/me/", current_user, name="api_current_user"),
    path("api/auth/token/", obtain_auth_token, name="api_token_auth"),
    path("api/auth/csrf/", csrf_token, name="csrf_token"),
    path("api/auth/google/login/", google_login, name="google_login"),
    path("api/auth/google/callback/", google_callback, name="google_callback"),
    path("api/auth/google/session/", google_session, name="google_session"),
    path("api/auth/google/logout/", google_logout, name="google_logout"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
