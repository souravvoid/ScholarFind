from django.core.paginator import Paginator
from django.db.models import Count, Q
from rest_framework import viewsets
from rest_framework.response import Response

from .models import (
    IngestionJob,
    RequiredDocument,
    Scholarship,
    ScholarshipEligibilityRule,
    ScholarshipProvider,
    ScholarshipSource,
)
from .serializers import (
    IngestionJobSerializer,
    RequiredDocumentSerializer,
    ScholarshipEligibilityRuleSerializer,
    ScholarshipDetailSerializer,
    ScholarshipProviderSerializer,
    ScholarshipSummarySerializer,
    ScholarshipSerializer,
    ScholarshipSourceSerializer,
)


class _CatalogueReadOnlyViewSet(viewsets.ReadOnlyModelViewSet):
    """Catalogue data is read-only through the API.

    Writes happen through the admin ingestion endpoint or the Django admin,
    never through public API clients.
    """


class ScholarshipProviderViewSet(_CatalogueReadOnlyViewSet):
    queryset = ScholarshipProvider.objects.all()
    serializer_class = ScholarshipProviderSerializer


class ScholarshipSourceViewSet(_CatalogueReadOnlyViewSet):
    queryset = ScholarshipSource.objects.annotate(scholarship_count=Count("scholarships"))
    serializer_class = ScholarshipSourceSerializer


class ScholarshipViewSet(_CatalogueReadOnlyViewSet):
    queryset = (
        Scholarship.objects.select_related("provider", "source")
        .prefetch_related("eligibility_rules", "required_documents")
        .filter(is_active=True)
        .order_by("title")
    )
    lookup_field = "slug"

    def get_serializer_class(self):
        if self.action == "retrieve":
            return ScholarshipDetailSerializer
        if self.action == "list":
            return ScholarshipSummarySerializer
        return ScholarshipSerializer

    def list(self, request):
        """Preserve the FastAPI paginated search envelope."""
        try:
            page = max(1, int(request.query_params.get("page", 1)))
            page_size = int(request.query_params.get("page_size", 10))
        except (TypeError, ValueError):
            return Response(
                {"error": "page and page_size must be integers"}, status=400
            )
        page_size = min(max(1, page_size), 50)

        queryset = self.get_queryset()
        query = request.query_params.get("query")
        destination = request.query_params.get("destination")
        degree_level = request.query_params.get("degree_level")

        if query:
            queryset = queryset.filter(
                Q(title__icontains=query)
                | Q(provider__name__icontains=query)
                | Q(fields_of_study__icontains=query)
                | Q(overview__icontains=query)
            )
        if destination:
            queryset = queryset.filter(destination_countries__icontains=destination)
        if degree_level:
            queryset = queryset.filter(study_levels__icontains=degree_level)

        paginator = Paginator(queryset, page_size)
        page_obj = paginator.get_page(page)

        return Response({
            "page": page_obj.number,
            "page_size": page_size,
            "total_count": paginator.count,
            "results": self.get_serializer(page_obj.object_list, many=True).data,
        })


class ScholarshipEligibilityRuleViewSet(_CatalogueReadOnlyViewSet):
    queryset = ScholarshipEligibilityRule.objects.all()
    serializer_class = ScholarshipEligibilityRuleSerializer


class RequiredDocumentViewSet(_CatalogueReadOnlyViewSet):
    queryset = RequiredDocument.objects.all()
    serializer_class = RequiredDocumentSerializer


class IngestionJobViewSet(_CatalogueReadOnlyViewSet):
    queryset = IngestionJob.objects.all()
    serializer_class = IngestionJobSerializer
