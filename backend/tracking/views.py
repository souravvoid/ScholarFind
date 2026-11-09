from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import ApplicationTrackerEntry
from .serializers import ApplicationTrackerEntrySerializer


class ApplicationTrackerEntryViewSet(viewsets.ModelViewSet):
    """Tracker entries are private to the authenticated user."""

    serializer_class = ApplicationTrackerEntrySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return ApplicationTrackerEntry.objects.none()
        return ApplicationTrackerEntry.objects.filter(
            user=self.request.user
        ).select_related("scholarship")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
