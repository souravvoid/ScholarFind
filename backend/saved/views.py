from rest_framework import viewsets
from .models import SavedScholarship

class SavedScholarshipViewSet(viewsets.ModelViewSet):
    queryset = SavedScholarship.objects.all()
