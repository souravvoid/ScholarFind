from rest_framework import viewsets
from .models import (
    ScholarshipProvider, ScholarshipSource, Scholarship,
    ScholarshipEligibilityRule, RequiredDocument, IngestionJob
)
from .serializers import (
    ScholarshipProviderSerializer, ScholarshipSourceSerializer, ScholarshipSerializer,
    ScholarshipEligibilityRuleSerializer, RequiredDocumentSerializer, IngestionJobSerializer
)

class ScholarshipProviderViewSet(viewsets.ModelViewSet):
    queryset = ScholarshipProvider.objects.all()
    serializer_class = ScholarshipProviderSerializer

class ScholarshipSourceViewSet(viewsets.ModelViewSet):
    queryset = ScholarshipSource.objects.all()
    serializer_class = ScholarshipSourceSerializer

class ScholarshipViewSet(viewsets.ModelViewSet):
    queryset = Scholarship.objects.all()
    serializer_class = ScholarshipSerializer

class ScholarshipEligibilityRuleViewSet(viewsets.ModelViewSet):
    queryset = ScholarshipEligibilityRule.objects.all()
    serializer_class = ScholarshipEligibilityRuleSerializer

class RequiredDocumentViewSet(viewsets.ModelViewSet):
    queryset = RequiredDocument.objects.all()
    serializer_class = RequiredDocumentSerializer

class IngestionJobViewSet(viewsets.ModelViewSet):
    queryset = IngestionJob.objects.all()
    serializer_class = IngestionJobSerializer
