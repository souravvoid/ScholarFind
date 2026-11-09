import json
import logging

from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response

from scholarships.models import IngestionJob
from scholarships.services import persist_records, records_for_source

from .pipeline import IngestionPipeline, IngestionStorageRepository
from .registry import PIPELINE_ADAPTERS, get_pipeline_adapter

logger = logging.getLogger("scholarfind.ingestion.admin")

PIPELINE_SOURCE_IDS = list(PIPELINE_ADAPTERS)


@api_view(["POST"])
@permission_classes([IsAdminUser])
def admin_ingest(request, source_id: str) -> Response:
    """Trigger ingestion for a verified source and persist it to PostgreSQL.

    Preserves the original ``POST /api/v1/admin/ingest/{source_id}`` result
    shape and adds persistence counters.
    """
    adapter = get_pipeline_adapter(source_id)
    if adapter is None:
        return Response(
            {
                "error": f"Source adapter '{source_id}' not found in registry.",
                "valid_sources": list(PIPELINE_SOURCE_IDS),
            },
            status=status.HTTP_404_NOT_FOUND,
        )

    job = IngestionJob.objects.create(
        source_id=source_id, status=IngestionJob.StatusChoices.RUNNING
    )

    # A per-request store makes the pipeline report the full record set, while
    # database writes below remain idempotent across repeated runs.
    storage = IngestionStorageRepository()
    pipeline = IngestionPipeline(
        source_id=source_id, adapter_instance=adapter, storage=storage
    )
    results = pipeline.run_job()

    records = records_for_source(storage, source_id)
    created_count, updated_count = persist_records(records)

    results["records_created"] = created_count
    results["records_updated"] = updated_count
    results["records_persisted"] = created_count + updated_count

    succeeded = results["status"] in ("success", "completed_with_warnings")
    job.status = (
        IngestionJob.StatusChoices.COMPLETED
        if succeeded
        else IngestionJob.StatusChoices.FAILED
    )
    job.records_fetched = results.get("records_fetched", 0)
    job.records_upserted = created_count + updated_count
    job.records_failed = len(results.get("errors", []))
    job.error_log = json.dumps(results.get("errors", []))
    job.completed_at = timezone.now()
    job.save()

    logger.info(
        "Ingestion completed for %s: status=%s new=%s updated=%s total=%s",
        source_id,
        results["status"],
        created_count,
        updated_count,
        len(records),
    )
    return Response(results)
