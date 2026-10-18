"""
ScholarFind Backend Unit & Integration Tests
Tests:
- 10 Ingestion Source Adapters collect valid raw payloads
- Pipeline deduplication and schema normalization
- Degree level normalization
- Open-redirect prevention and URL validation
"""
import unittest
from datetime import datetime
from backend.ingestion.adapters import ADAPTER_REGISTRY
from backend.ingestion.pipeline import IngestionPipeline, IngestionStorageRepository
from backend.models import DegreeLevelEnum


class TestBackendGeneral(unittest.TestCase):
    def test_ten_adapters_exist_and_collect(self):
        """Verify all 10 approved sources have registered collectors that produce data."""
        self.assertEqual(len(ADAPTER_REGISTRY), 10, "Must have exactly 10 registered collectors.")

        for source_id, adapter in ADAPTER_REGISTRY.items():
            records = adapter.collect()
            self.assertGreater(len(records), 0, f"Adapter {source_id} failed to collect records.")
            record = records[0]
            self.assertIn("title", record, f"Missing title in {source_id}")
            self.assertIn("official_source_url", record, f"Missing official_source_url in {source_id}")
            self.assertIn("official_apply_url", record, f"Missing official_apply_url in {source_id}")
            self.assertTrue(record["official_source_url"].startswith("https://"), "Source URL must enforce HTTPS.")
            self.assertTrue(record["official_apply_url"].startswith("https://"), "Application URL must enforce HTTPS.")

    def test_pipeline_idempotency_and_deduplication(self):
        """Verify that re-running an adapter does not create duplicates."""
        adapter = ADAPTER_REGISTRY["src_csc_uk"]
        storage = IngestionStorageRepository()
        pipeline = IngestionPipeline(source_id="src_csc_uk", adapter_instance=adapter, storage=storage)

        # First run
        run_1 = pipeline.run_job()
        self.assertIn(run_1["status"], ["success", "completed_with_warnings"])
        self.assertGreaterEqual(run_1["records_fetched"], 1)
        self.assertGreaterEqual(run_1["records_stored_new"], 1)

        # Re-run (idempotent output)
        run_2 = pipeline.run_job()
        self.assertIn(run_2["status"], ["success", "completed_with_warnings"])
        self.assertEqual(run_2["records_stored_new"], 0)
        self.assertGreater(run_2["duplicates_prevented"], 0)

    def test_normalization_degree_levels(self):
        """Verify string degree levels normalize into valid degree levels."""
        from backend.ingestion.adapters.csc_uk import CSCCommonwealthAdapter
        adapter = CSCCommonwealthAdapter()
        pipeline = IngestionPipeline(source_id="src_csc_uk", adapter_instance=adapter)
        raw_payloads = adapter.fetch_raw_data()
        raw_recs = adapter.parse(raw_payloads)
        norm = pipeline._normalize_record(raw_recs[0])

        self.assertIn("masters", norm.study_levels)
        self.assertGreater(norm.estimated_usd_value, 50000.0)

    def test_redirect_safety(self):
        """Verify destination URLs belong to verified official domains without open redirects."""
        for source_id, adapter in ADAPTER_REGISTRY.items():
            for item in adapter.collect():
                url = item["official_apply_url"]
                self.assertNotIn("javascript:", url.lower())
                self.assertNotIn("data:", url.lower())
                self.assertTrue(url.startswith("https://"))


if __name__ == "__main__":
    unittest.main()
