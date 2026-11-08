from rest_framework import viewsets
from .models import ManualReviewFlag, WorkExperienceRecord


class ManualReviewFlagViewSet(viewsets.ModelViewSet):
    queryset = ManualReviewFlag.objects.all()


class WorkExperienceRecordViewSet(viewsets.ModelViewSet):
    queryset = WorkExperienceRecord.objects.all()