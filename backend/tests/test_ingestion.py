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


if __name__ == "__main__":
    unittest.main()
