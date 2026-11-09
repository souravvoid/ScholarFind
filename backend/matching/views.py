from rest_framework import viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated

from .models import ManualReviewFlag, WorkExperienceRecord
from .serializers import ManualReviewFlagSerializer, WorkExperienceRecordSerializer


def _student_profile(request):
    profile = getattr(request.user, "student_profile", None)
    if profile is None:
        raise ValidationError(
            {"detail": "Create a student profile before using this endpoint."}
        )
    return profile


class ManualReviewFlagViewSet(viewsets.ModelViewSet):
    serializer_class = ManualReviewFlagSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return ManualReviewFlag.objects.none()
        return ManualReviewFlag.objects.filter(
            student__user=self.request.user
        ).select_related("scholarship")

    def perform_create(self, serializer):
        serializer.save(student=_student_profile(self.request))


class WorkExperienceRecordViewSet(viewsets.ModelViewSet):
    serializer_class = WorkExperienceRecordSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return WorkExperienceRecord.objects.none()
        return WorkExperienceRecord.objects.filter(student__user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(student=_student_profile(self.request))
