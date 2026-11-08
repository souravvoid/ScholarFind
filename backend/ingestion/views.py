import logging
import os
from datetime import datetime
from typing import Dict, Any, List

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .pipeline import IngestionPipeline, DEFAULT_STORAGE, IngestionValidationError
from ingestion.adapters.csc_uk import CSCCommonwealthAdapter
from ingestion.adapters.daad_de import DAADHelmutSchmidtAdapter
from ingestion.adapters.fulbright_us import FulbrightProgramAdapter

logger = logging.getLogger("scholarfind.ingestion.admin")

# Adapter mapping
ADAPTERS: Dict[str, Any] = {
    "src_csc_uk": CSCCommonwealthAdapter,
    "src_daad_de": DAADHelmutSchmidtAdapter,
    "src_fulbright_us": FulbrightProgramAdapter,
}


@api_view(["POST"])
@permission_classes([AllowAny])
def admin_ingest(request, source_id: str) -> Response:
    """
    POST /api/v1/admin/ingest/{source_id}
    
    Trigger ingestion for a specific source ID.
    Integrates with existing 10 ingestion adapters (CSC UK, DAAD DE, Fulbright US, etc.).
    
    Pipeline: access policy verification, backoff fetch, parse, normalize, validate,
    idempotent storage, audit logging
    """
    # Validate source_id
    if source_id not in ADAPTERS:
        return Response(
            {
                "error": f"Unknown source_id: {source_id}. "
                f"Valid sources: {', '.join(ADAPTERS.keys())}"
            },
            status=400,
        )
    
    adapter_class = ADAPTERS[source_id]
    adapter = adapter_class()
    
    # Run the ingestion pipeline
    pipeline = IngestionPipeline(source_id=source_id, adapter=adapter, storage=DEFAULT_STORAGE)
    results = pipeline.run_job()
    
    logger.info(
        f"Ingestion completed for {source_id}: "
        f"status={results['status']}, "
        f"new={results['records_stored_new']}, "
        f"total={results['records_stored_total']}"
    )
    
    return Response(results)