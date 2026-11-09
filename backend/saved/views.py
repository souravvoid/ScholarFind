from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import SavedScholarship
from .serializers import SavedScholarshipSerializer


class SavedScholarshipViewSet(viewsets.ModelViewSet):
    """Saved scholarships are private to the authenticated user."""

    serializer_class = SavedScholarshipSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return SavedScholarship.objects.none()
        return SavedScholarship.objects.filter(user=self.request.user).select_related(
            "scholarship"
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
