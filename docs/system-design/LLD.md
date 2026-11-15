# Low-Level Design

Django apps: accounts, students, scholarships, matching, saved, tracking. URLs versioned under /api/v1. Serializers validate input. Eligibility in eligibility_service.py. Permissions: AllowAny for reads, IsAuthenticated for profile/save/tracker. Token auth. Tests pytest-django. Migration status verified locally.