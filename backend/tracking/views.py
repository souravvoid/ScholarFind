from rest_framework import viewsets
from .models import ApplicationTrackerEntry


class ApplicationTrackerEntryViewSet(viewsets.ModelViewSet):
    queryset = ApplicationTrackerEntry.objects.all()