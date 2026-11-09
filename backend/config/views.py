"""Top-level API views that preserve the original FastAPI contracts."""

from datetime import datetime, timezone

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from ingestion.registry import PIPELINE_ADAPTERS
from scholarships.models import Scholarship


@api_view(["GET"])
@permission_classes([AllowAny])
def health(request):
    """``GET /api/v1/health`` — service status and catalogue counts."""
    return Response(
        {
            "status": "healthy",
            "service": "scholarfind-api",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "registered_sources": len(PIPELINE_ADAPTERS),
            "stored_scholarships": Scholarship.objects.filter(is_active=True).count(),
        }
    )


@api_view(["GET"])
@permission_classes([AllowAny])
def sources(request):
    """``GET /api/v1/sources`` — provenance summary for every source."""
    summaries = []
    for source_id, adapter in PIPELINE_ADAPTERS.items():
        conditions = adapter.get_access_conditions()
        summaries.append(
            {
                "source_id": source_id,
                "source_name": getattr(adapter, "source_name", source_id),
                "origin_agency": getattr(adapter, "origin_agency", "Official Agency"),
                "status": "verified",
                "is_authoritative": True,
                "license": conditions.get("license", "Open Government Access"),
            }
        )
    return Response(summaries)
