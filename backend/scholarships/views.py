from django.core.paginator import Paginator
from django.db.models import Q
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
    ScholarshipProviderSerializer,
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
    queryset = ScholarshipSource.objects.all()
    serializer_class = ScholarshipSourceSerializer


def _as_list(value):
    if not value:
        return []
    return [item.strip() for item in str(value).split(",") if item.strip()]


class ScholarshipViewSet(_CatalogueReadOnlyViewSet):
    queryset = (
        Scholarship.objects.select_related("provider", "source")
        .filter(is_active=True)
        .order_by("title")
    )
    serializer_class = ScholarshipSerializer

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

        return Response(
            {
                "page": page_obj.number,
                "page_size": page_size,
                "total_count": paginator.count,
                "results": [
                    {
                        "id": scholarship.slug,
                        "slug": scholarship.slug,
                        "title": scholarship.title,
                        "provider_name": scholarship.provider.name,
                        "provider_category": scholarship.provider.category,
                        "destination_countries": _as_list(
                            scholarship.destination_countries
                        ),
                        "study_levels": _as_list(scholarship.study_levels),
                        "fields_of_study": _as_list(scholarship.fields_of_study),
                        "total_award_value": scholarship.total_award_value,
                        "estimated_usd_value": scholarship.estimated_usd_value,
                        "application_deadline": (
                            scholarship.application_deadline.isoformat()
                            if scholarship.application_deadline
                            else None
                        ),
                        "academic_year": scholarship.academic_year,
                        "official_source_url": scholarship.official_source_url,
                        "official_application_url": scholarship.official_application_url,
                        "source_domain": scholarship.source_domain,
                        "overview": scholarship.overview,
                    }
                    for scholarship in page_obj.object_list
                ],
            }
        )


class ScholarshipEligibilityRuleViewSet(_CatalogueReadOnlyViewSet):
    queryset = ScholarshipEligibilityRule.objects.all()
    serializer_class = ScholarshipEligibilityRuleSerializer


class RequiredDocumentViewSet(_CatalogueReadOnlyViewSet):
    queryset = RequiredDocument.objects.all()
    serializer_class = RequiredDocumentSerializer


class IngestionJobViewSet(_CatalogueReadOnlyViewSet):
    queryset = IngestionJob.objects.all()
    serializer_class = IngestionJobSerializer
