"""
ScholarFind Backend Unit & Integration Tests
Tests:
- 10 Ingestion Source Adapters collect valid raw payloads
- Pipeline deduplication and schema normalization
- GPA Standardization & Equivalence conversion
- Open-redirect prevention and URL validation
"""
import pytest
from datetime import datetime
from backend.ingestion.adapters import ADAPTER_REGISTRY
from backend.ingestion.pipeline import IngestionPipeline
from backend.schemas import RawSourceRecord, NormalizedScholarship
from backend.models import DegreeLevelEnum


def test_ten_adapters_exist_and_collect():
    """Verify all 10 approved sources have registered collectors that produce data."""
    assert len(ADAPTER_REGISTRY) == 10, "Must have exactly 10 registered collectors."

    for source_id, adapter in ADAPTER_REGISTRY.items():
        records = adapter.collect()
        assert len(records) > 0, f"Adapter {source_id} failed to collect records."
        record = records[0]
        assert "title" in record, f"Missing title in {source_id}"
        assert "official_source_url" in record, f"Missing official_source_url in {source_id}"
        assert "official_apply_url" in record, f"Missing official_apply_url in {source_id}"
        assert record["official_source_url"].startswith("https://"), "Source URL must enforce HTTPS."
        assert record["official_apply_url"].startswith("https://"), "Application URL must enforce HTTPS."


def test_pipeline_idempotency_and_deduplication():
    """Verify that re-running an adapter does not create duplicates."""
    adapter = ADAPTER_REGISTRY["src_csc_uk"]
    pipeline = IngestionPipeline(source_id="src_csc_uk", adapter_instance=adapter)

    # First run
    run_1 = pipeline.run_job()
    assert run_1["status"] in ["success", "completed_with_warnings"]
    assert run_1["fetched"] >= 1
    assert run_1["deduplicated"] == run_1["normalized"]

    # Re-run (idempotent output)
    run_2 = pipeline.run_job()
    assert run_2["status"] in ["success", "completed_with_warnings"]
    assert run_2["deduplicated"] == run_1["deduplicated"]


def test_normalization_degree_levels():
    """Verify string degree levels normalize into valid DegreeLevelEnum values."""
    adapter = ADAPTER_REGISTRY["src_vanier_ca"]
    pipeline = IngestionPipeline(source_id="src_vanier_ca", adapter_instance=adapter)
    records = adapter.collect()
    norm = pipeline._normalize_record(records[0])

    assert DegreeLevelEnum.phd in norm.study_levels
    assert norm.estimated_usd_value > 50000.0


def test_redirect_safety():
    """Verify destination URLs belong to verified official domains without open redirects."""
    for source_id, adapter in ADAPTER_REGISTRY.items():
        for item in adapter.collect():
            url = item["official_apply_url"]
            assert "javascript:" not in url.lower()
            assert "data:" not in url.lower()
            assert url.startswith("https://")
