"""
Unit & Integration Tests for ScholarFind Data Ingestion Pipeline & Adapters
==========================================================================
Covers:
- Adapter access conditions & limitations documentation
- Raw data fetching and parsing
- Schema normalization & type transformation
- Validation rules (HTTPS enforcement, mandatory fields)
- Idempotency and deduplication across pipeline runs
- Ingestion metrics & audit logging
"""

import unittest
from datetime import datetime

from backend.ingestion.adapters.csc_uk import CSCCommonwealthAdapter
from backend.ingestion.pipeline import (
    IngestionPipeline,
    IngestionStorageRepository,
    IngestionValidationError
)
from backend.ingestion.base import (
    RawScholarshipRecord,
    RawEligibilityClause,
    NormalizedScholarshipRecord
)


class TestCSCCommonwealthAdapter(unittest.TestCase):
    def setUp(self):
        self.adapter = CSCCommonwealthAdapter()

    def test_access_conditions_documented(self):
        """Verify the adapter comprehensively documents license, provenance, rate limits, and access constraints."""
        conditions = self.adapter.get_access_conditions()
        self.assertIsInstance(conditions, dict)
        self.assertEqual(conditions["source_id"], "src_csc_uk")
        self.assertIn("Open Government Licence", conditions["license"])
        self.assertTrue(conditions["provenance_url"].startswith("https://"))
        self.assertGreater(conditions["rate_limit_per_second"], 0.0)
        self.assertIn("limitations", conditions)
        self.assertGreaterEqual(len(conditions["limitations"]), 2)

    def test_fetch_raw_data_produces_records(self):
        """Verify fetch_raw_data produces non-empty list of statutory notices."""
        raw_payloads = self.adapter.fetch_raw_data()
        self.assertIsInstance(raw_payloads, list)
        self.assertGreater(len(raw_payloads), 0)
        first = raw_payloads[0]
        self.assertIn("scheme_code", first)
        self.assertIn("title", first)
        self.assertIn("eligibility_clauses", first)
        self.assertIn("financial_terms", first)

    def test_parse_to_raw_records(self):
        """Verify parse converts raw dictionaries into typed RawScholarshipRecord objects."""
        raw_payloads = self.adapter.fetch_raw_data()
        records = self.adapter.parse(raw_payloads)
        self.assertGreater(len(records), 0)
        rec = records[0]
        self.assertIsInstance(rec, RawScholarshipRecord)
        self.assertTrue(rec.source_record_id.startswith("CSC-"))
        self.assertTrue(rec.title)
        self.assertTrue(rec.official_source_url.startswith("https://"))
        self.assertTrue(rec.official_application_url.startswith("https://"))
        self.assertGreater(len(rec.eligibility_clauses), 0)
        self.assertTrue(len(rec.raw_payload_checksum) > 0, "Checksum must be generated for deduplication.")


class TestIngestionPipelineStages(unittest.TestCase):
    def setUp(self):
        self.adapter = CSCCommonwealthAdapter()
        self.storage = IngestionStorageRepository()
        self.pipeline = IngestionPipeline(
            source_id="src_csc_uk",
            adapter_instance=self.adapter,
            storage=self.storage
        )

    def test_pipeline_full_run_lifecycle(self):
        """Verify end-to-end execution of the 6 pipeline stages."""
        result = self.pipeline.run_job()

        self.assertEqual(result["status"], "success")
        self.assertGreaterEqual(result["records_fetched"], 2)
        self.assertGreaterEqual(result["records_parsed"], 2)
        self.assertGreaterEqual(result["records_normalized"], 2)
        self.assertGreaterEqual(result["records_validated"], 2)
        self.assertEqual(result["records_stored_new"], result["records_validated"])
        self.assertEqual(len(result["errors"]), 0)
        self.assertIn("elapsed_ms", result)
        self.assertIn("access_conditions", result)

    def test_pipeline_idempotency(self):
        """Verify running the ingestion pipeline multiple times does not insert duplicate records."""
        # Run 1
        res1 = self.pipeline.run_job()
        count1 = self.storage.count()
        self.assertGreater(count1, 0)
        self.assertEqual(res1["records_stored_new"], count1)
        self.assertEqual(res1["duplicates_prevented"], 0)

        # Run 2: Re-run with identical data
        res2 = self.pipeline.run_job()
        count2 = self.storage.count()
        self.assertEqual(count1, count2, "Storage record count must remain identical after re-run.")
        self.assertEqual(res2["records_stored_new"], 0, "No new records should be inserted on duplicate run.")
        self.assertGreater(res2["duplicates_prevented"], 0, "Duplicates should be detected and prevented.")

    def test_normalization_integrity(self):
        """Verify normalization properly standardizes study levels, deadlines, and natural keys."""
        raw_payloads = self.adapter.fetch_raw_data()
        raw_recs = self.adapter.parse(raw_payloads)
        norm = self.pipeline._normalize_record(raw_recs[0])

        self.assertIsInstance(norm, NormalizedScholarshipRecord)
        self.assertEqual(norm.natural_key, f"src_csc_uk:{raw_recs[0].source_record_id}".lower())
        self.assertIn("masters", norm.study_levels)
        self.assertTrue(norm.source_domain.endswith("gov.uk"))
        self.assertIsNotNone(norm.deadline_iso)
        self.assertGreater(norm.estimated_usd_value, 10000.0)

    def test_validation_rejects_insecure_url(self):
        """Verify validation rejects HTTP or malformed URLs."""
        raw_payloads = self.adapter.fetch_raw_data()
        raw_recs = self.adapter.parse(raw_payloads)
        norm = self.pipeline._normalize_record(raw_recs[0])

        # Tamper with URL to insecure protocol
        norm.official_application_url = "http://insecure-site.org/apply"
        with self.assertRaises(IngestionValidationError):
            self.pipeline._validate_record(norm)

    def test_validation_rejects_empty_rules(self):
        """Verify validation rejects scholarships that possess no eligibility criteria."""
        raw_payloads = self.adapter.fetch_raw_data()
        raw_recs = self.adapter.parse(raw_payloads)
        norm = self.pipeline._normalize_record(raw_recs[0])

        norm.rules = []
        with self.assertRaises(IngestionValidationError):
            self.pipeline._validate_record(norm)


class TestDiverseSourcesIngestion(unittest.TestCase):
    """
    Validates the 3 diverse scholarship data sources:
    1. UK FCDO Commonwealth Scholarship (GBP currency, UK destination)
    2. Germany DAAD Helmut-Schmidt Programme (EUR currency, Germany destination)
    3. US Dept of State Fulbright Foreign Student (USD currency, US destination)
    """
    def setUp(self):
        from backend.ingestion.adapters.daad_de import DAADHelmutSchmidtAdapter
        from backend.ingestion.adapters.fulbright_us import FulbrightProgramAdapter
        self.csc_adapter = CSCCommonwealthAdapter()
        self.daad_adapter = DAADHelmutSchmidtAdapter()
        self.fulbright_adapter = FulbrightProgramAdapter()
        self.storage = IngestionStorageRepository()

    def test_all_three_sources_access_conditions_and_limitations(self):
        for adapter in [self.csc_adapter, self.daad_adapter, self.fulbright_adapter]:
            cond = adapter.get_access_conditions()
            self.assertIn("source_id", cond)
            self.assertIn("license", cond)
            self.assertIn("provenance_url", cond)
            self.assertIn("limitations", cond)
            self.assertGreaterEqual(len(cond["limitations"]), 2)
            self.assertTrue(cond["provenance_url"].startswith("https://"))

    def test_daad_adapter_ingestion_and_normalization(self):
        pipeline = IngestionPipeline(source_id="src_daad_de", adapter_instance=self.daad_adapter, storage=self.storage)
        result = pipeline.run_job()
        self.assertEqual(result["status"], "success")
        self.assertGreaterEqual(result["records_stored_new"], 1)

        # Check normalization specifics for DAAD
        records = [r for r in self.storage.all() if r.source_id == "src_daad_de"]
        self.assertGreater(len(records), 0)
        rec = records[0]
        self.assertEqual(rec.currency_code, "EUR")
        self.assertIn("Germany", rec.destination_countries)
        self.assertIn("masters", rec.study_levels)
        self.assertIn("daad.de", rec.source_domain)
        self.assertEqual(rec.provenance_metadata["license"], "German Open Government Data (§ 12a EGovG)")
        self.assertGreater(rec.estimated_usd_value, 0)

    def test_fulbright_adapter_ingestion_and_normalization(self):
        pipeline = IngestionPipeline(source_id="src_fulbright_us", adapter_instance=self.fulbright_adapter, storage=self.storage)
        result = pipeline.run_job()
        self.assertEqual(result["status"], "success")
        self.assertGreaterEqual(result["records_stored_new"], 1)

        # Check normalization specifics for Fulbright
        records = [r for r in self.storage.all() if r.source_id == "src_fulbright_us"]
        self.assertGreater(len(records), 0)
        rec = records[0]
        self.assertEqual(rec.currency_code, "USD")
        self.assertIn("United States", rec.destination_countries)
        self.assertTrue(any(lvl in ["masters", "phd"] for lvl in rec.study_levels))
        self.assertIn("fulbrightonline.org", rec.source_domain)
        self.assertIn("Fulbright-Hays Act", rec.provenance_metadata["license"])
        self.assertGreater(rec.estimated_usd_value, 50000.0)

    def test_multi_source_deduplication_and_idempotency(self):
        """Run all 3 sources in sequence, verify storage count, then re-run to confirm zero duplicates."""
        adapters = [
            ("src_csc_uk", self.csc_adapter),
            ("src_daad_de", self.daad_adapter),
            ("src_fulbright_us", self.fulbright_adapter)
        ]

        # Initial ingestion cycle
        for src_id, adapter in adapters:
            pipe = IngestionPipeline(source_id=src_id, adapter_instance=adapter, storage=self.storage)
            res = pipe.run_job()
            self.assertEqual(res["status"], "success")
            self.assertGreater(res["records_stored_new"], 0)

        initial_count = self.storage.count()
        self.assertGreaterEqual(initial_count, 4)

        # Re-run identical cycle
        for src_id, adapter in adapters:
            pipe = IngestionPipeline(source_id=src_id, adapter_instance=adapter, storage=self.storage)
            res = pipe.run_job()
            self.assertEqual(res["status"], "success")
            self.assertEqual(res["records_stored_new"], 0, "No duplicate records should be inserted on re-run.")
            self.assertGreater(res["duplicates_prevented"], 0, "All re-ingested records must be identified as duplicates.")

        self.assertEqual(self.storage.count(), initial_count, "Storage count must remain strictly constant.")


if __name__ == "__main__":
    unittest.main()

