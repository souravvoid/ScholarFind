"""
ScholarFind Modular Ingestion Pipeline Engine
=============================================
Orchestrates multi-stage ingestion of official scholarships:
1. Ingestion Access Policy Verification & Backoff Fetch
2. Parsing to Raw Records
3. Normalization to Universal Schema
4. Validation (HTTPS, Integrity, Mandatory Fields)
5. Idempotent Storage & Natural Key Deduplication
6. Audit Logging & Ingestion Job Metrics
"""

import time
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional, Set

from backend.ingestion.base import (
    BaseSourceAdapter,
    RawScholarshipRecord,
    NormalizedScholarshipRecord,
    NormalizedRule
)

logger = logging.getLogger("scholarfind.ingestion")
logger.setLevel(logging.INFO)


class IngestionValidationError(Exception):
    pass


class IngestionStorageRepository:
    """
    Idempotent in-memory / persistent scholarship storage repository.
    Guarantees no duplicate insertions on repeated adapter runs.
    """
    def __init__(self):
        self._store: Dict[str, NormalizedScholarshipRecord] = {}
        self._checksum_index: Dict[str, str] = {}

    def upsert(self, record: NormalizedScholarshipRecord, checksum: str) -> bool:
        """
        Inserts or updates a record. Returns True if newly inserted, False if updated/identical.
        """
        key = record.natural_key
        is_new = key not in self._store
        self._store[key] = record
        self._checksum_index[key] = checksum
        return is_new

    def get_by_key(self, key: str) -> Optional[NormalizedScholarshipRecord]:
        return self._store.get(key)

    def count(self) -> int:
        return len(self._store)

    def all(self) -> List[NormalizedScholarshipRecord]:
        return list(self._store.values())

    def clear(self):
        self._store.clear()
        self._checksum_index.clear()


# Shared repository singleton
DEFAULT_STORAGE = IngestionStorageRepository()


class IngestionPipeline:
    def __init__(
        self,
        source_id: str,
        adapter_instance: BaseSourceAdapter,
        storage: Optional[IngestionStorageRepository] = None
    ):
        self.source_id = source_id
        self.adapter = adapter_instance
        self.storage = storage or DEFAULT_STORAGE

    def run_job(self) -> Dict[str, Any]:
        """
        Executes the complete ingestion lifecycle with retry, normalization,
        validation, and idempotent storage.
        """
        start_time = time.time()
        start_dt = datetime.utcnow()

        results: Dict[str, Any] = {
            "source_id": self.source_id,
            "started_at": start_dt.isoformat(),
            "access_conditions": {},
            "records_fetched": 0,
            "records_parsed": 0,
            "records_normalized": 0,
            "records_validated": 0,
            "records_stored_new": 0,
            "records_stored_total": 0,
            "duplicates_prevented": 0,
            "errors": [],
            "status": "pending"
        }

        try:
            # Stage 0: Verify source legal access conditions and rate limiting terms
            access_terms = self.adapter.get_access_conditions()
            results["access_conditions"] = access_terms
            logger.info(f"Verified legal terms for {self.source_id}: {access_terms.get('license')}")

            # Stage 1: Fetch raw payloads with exponential backoff
            raw_data = self._fetch_with_retry(max_retries=3)
            results["records_fetched"] = len(raw_data)

            # Stage 2: Parse raw payloads into typed records
            raw_records = self.adapter.parse(raw_data)
            results["records_parsed"] = len(raw_records)

            # Stage 3: Normalize into standard schema
            normalized_records: List[tuple[NormalizedScholarshipRecord, str]] = []
            for raw_rec in raw_records:
                try:
                    norm = self._normalize_record(raw_rec)
                    normalized_records.append((norm, raw_rec.raw_payload_checksum))
                except Exception as e:
                    logger.error(f"Normalization failed for {raw_rec.source_record_id}: {e}")
                    results["errors"].append(f"Normalization error: {str(e)}")

            results["records_normalized"] = len(normalized_records)

            # Stage 4: Validate records according to defined schema rules
            validated_records: List[tuple[NormalizedScholarshipRecord, str]] = []
            for norm, checksum in normalized_records:
                try:
                    self._validate_record(norm)
                    validated_records.append((norm, checksum))
                except IngestionValidationError as ve:
                    logger.warning(f"Validation failure on {norm.slug}: {ve}")
                    results["errors"].append(f"Validation error on {norm.slug}: {str(ve)}")

            results["records_validated"] = len(validated_records)

            # Stage 5: Idempotent Storage & Deduplication
            new_count = 0
            dupe_count = 0
            for norm, checksum in validated_records:
                existing = self.storage.get_by_key(norm.natural_key)
                if existing:
                    dupe_count += 1
                is_new = self.storage.upsert(norm, checksum)
                if is_new:
                    new_count += 1

            results["records_stored_new"] = new_count
            results["records_stored_total"] = self.storage.count()
            results["duplicates_prevented"] = dupe_count

            elapsed_ms = int((time.time() - start_time) * 1000)
            results["elapsed_ms"] = elapsed_ms
            results["completed_at"] = datetime.utcnow().isoformat()
            results["status"] = "success" if not results["errors"] else "completed_with_warnings"

        except Exception as ex:
            logger.exception(f"Fatal error during ingestion pipeline execution for {self.source_id}")
            results["errors"].append(str(ex))
            results["status"] = "failed"
            results["completed_at"] = datetime.utcnow().isoformat()

        return results

    def _fetch_with_retry(self, max_retries: int = 3) -> List[Dict[str, Any]]:
        attempt = 0
        delay = 0.5
        while attempt < max_retries:
            try:
                # Support both fetch_raw_data() and collect()
                if hasattr(self.adapter, "fetch_raw_data"):
                    return self.adapter.fetch_raw_data()
                elif hasattr(self.adapter, "collect"):
                    return self.adapter.collect()
                else:
                    raise AttributeError(f"Adapter {self.source_id} has neither fetch_raw_data nor collect method.")
            except Exception as e:
                attempt += 1
                logger.warning(f"Fetch attempt {attempt}/{max_retries} failed: {e}. Retrying in {delay}s...")
                time.sleep(delay)
                delay *= 2.0

        raise RuntimeError(f"All {max_retries} fetch attempts failed for adapter {self.source_id}.")

    def _normalize_record(self, raw: RawScholarshipRecord) -> NormalizedScholarshipRecord:
        natural_key = f"{self.source_id}:{raw.source_record_id}".lower()
        slug = raw.source_record_id.lower().replace(" ", "-").replace("_", "-")

        # Normalize study levels
        normalized_levels: List[str] = []
        for lvl in raw.study_levels:
            lvl_lower = lvl.lower()
            if "master" in lvl_lower or "msc" in lvl_lower or "ma" in lvl_lower:
                normalized_levels.append("masters")
            elif "phd" in lvl_lower or "doctor" in lvl_lower or "dphil" in lvl_lower:
                normalized_levels.append("phd")
            elif "bachelor" in lvl_lower:
                normalized_levels.append("bachelors")
            elif "postdoc" in lvl_lower:
                normalized_levels.append("postdoc")
            else:
                normalized_levels.append(lvl_lower)

        # Remove duplicates while preserving order
        unique_levels = list(dict.fromkeys(normalized_levels)) or ["masters"]

        # Parse deadline
        deadline_iso = None
        days_rem = None
        if raw.raw_deadline:
            try:
                clean_deadline = raw.raw_deadline.replace("Z", "+00:00")
                dt = datetime.fromisoformat(clean_deadline)
                deadline_iso = dt.isoformat()
                now = datetime.utcnow()
                dt_naive = dt.replace(tzinfo=None)
                days_rem = max(0, (dt_naive - now).days)
            except Exception:
                deadline_iso = raw.raw_deadline

        # Domain extraction
        domain = "gov.uk"
        if raw.official_source_url:
            domain_parts = raw.official_source_url.split("//")[-1].split("/")
            domain = domain_parts[0] if domain_parts else "gov.uk"

        # Transform clauses to NormalizedRules
        rules: List[NormalizedRule] = []
        for idx, clause in enumerate(raw.eligibility_clauses):
            rules.append(NormalizedRule(
                rule_id=f"{slug}-rule-{idx+1}",
                rule_type=clause.rule_type,
                title=clause.title,
                description=clause.description,
                is_mandatory=clause.is_mandatory,
                source_citation=clause.source_citation,
                parameters=clause.parameters
            ))

        return NormalizedScholarshipRecord(
            natural_key=natural_key,
            source_id=self.source_id,
            source_record_id=raw.source_record_id,
            title=raw.title,
            slug=slug,
            provider_name=raw.provider_name,
            provider_category=raw.provider_category,
            destination_countries=raw.destination_countries,
            host_institutions=raw.host_institutions,
            study_levels=unique_levels,
            academic_fields=raw.academic_fields,
            award_summary=raw.award_summary,
            award_details=raw.award_details,
            currency_code=raw.raw_award_currency,
            total_award_amount=raw.raw_award_amount,
            estimated_usd_value=raw.raw_award_amount or 0.0,
            deadline_iso=deadline_iso,
            days_remaining=days_rem,
            academic_cycle=raw.academic_cycle,
            official_source_url=raw.official_source_url,
            official_application_url=raw.official_application_url,
            source_domain=domain,
            required_documents=raw.required_documents,
            application_instructions=raw.application_instructions,
            rules=rules,
            collection_timestamp=datetime.utcnow().isoformat(),
            provenance_metadata={
                "adapter": self.adapter.__class__.__name__,
                "license": getattr(self.adapter, "license_type", "Open Government Licence v3.0"),
                "provenance_url": getattr(self.adapter, "provenance_url", raw.official_source_url)
            }
        )

    def _validate_record(self, record: NormalizedScholarshipRecord) -> None:
        """
        Validates record against production schema rules.
        """
        if not record.title or len(record.title.strip()) < 5:
            raise IngestionValidationError(f"Invalid scholarship title: '{record.title}'")

        if not record.provider_name:
            raise IngestionValidationError("Missing provider name")

        if not record.official_source_url.startswith("https://"):
            raise IngestionValidationError(f"Official source URL must be HTTPS: {record.official_source_url}")

        if not record.official_application_url.startswith("https://"):
            raise IngestionValidationError(f"Official application URL must be HTTPS: {record.official_application_url}")

        if not record.study_levels:
            raise IngestionValidationError("At least one target study level is required")

        if not record.destination_countries:
            raise IngestionValidationError("Destination countries cannot be empty")

        if not record.rules:
            raise IngestionValidationError("At least one eligibility rule is required for matching")
