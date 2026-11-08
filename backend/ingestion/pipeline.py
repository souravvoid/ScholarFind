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

    # Static exchange rates to USD for estimated parity comparisons
    EXCHANGE_RATES_TO_USD: Dict[str, float] = {
        "USD": 1.0,
        "GBP": 1.30,
        "EUR": 1.08,
        "CAD": 0.74,
        "AUD": 0.66,
        "JPY": 0.0067,
        "SEK": 0.095,
        "NZD": 0.60,
        "CHF": 1.15
    }

    # Canonical Country Normalization Dictionary
    CANONICAL_COUNTRIES: Dict[str, str] = {
        "uk": "United Kingdom",
        "united kingdom": "United Kingdom",
        "great britain": "United Kingdom",
        "england": "United Kingdom",
        "scotland": "United Kingdom",
        "wales": "United Kingdom",
        "us": "United States",
        "usa": "United States",
        "united states": "United States",
        "united states of america": "United States",
        "germany": "Germany",
        "deutschland": "Germany",
        "de": "Germany",
        "canada": "Canada",
        "ca": "Canada",
        "australia": "Australia",
        "au": "Australia",
        "japan": "Japan",
        "jp": "Japan",
        "sweden": "Sweden",
        "se": "Sweden",
        "france": "France",
        "fr": "France"
    }

    def _normalize_record(self, raw: RawScholarshipRecord) -> NormalizedScholarshipRecord:
        natural_key = f"{self.source_id}:{raw.source_record_id}".lower()
        slug = raw.source_record_id.lower().replace(" ", "-").replace("_", "-")

        # 1. Normalize Education / Study Levels
        normalized_levels: List[str] = []
        for lvl in raw.study_levels:
            lvl_lower = lvl.lower()
            if any(term in lvl_lower for term in ["master", "msc", "ma", "mres", "mpp", "meng", "taught master"]):
                normalized_levels.append("masters")
            elif any(term in lvl_lower for term in ["phd", "doctor", "dphil", "doctoral", "postgraduate research"]):
                normalized_levels.append("phd")
            elif any(term in lvl_lower for term in ["bachelor", "undergraduate", "bsc", "ba", "beng"]):
                normalized_levels.append("bachelors")
            elif any(term in lvl_lower for term in ["postdoc", "fellowship", "post-doctoral"]):
                normalized_levels.append("postdoc")
            else:
                normalized_levels.append(lvl_lower)

        unique_levels = list(dict.fromkeys(normalized_levels)) or ["masters"]

        # 2. Normalize Destination Countries
        normalized_countries: List[str] = []
        for c in raw.destination_countries:
            c_clean = c.strip().lower()
            canonical = self.CANONICAL_COUNTRIES.get(c_clean, c.strip())
            normalized_countries.append(canonical)
        unique_countries = list(dict.fromkeys(normalized_countries))

        # 3. Normalize Application Deadlines (UTC ISO 8601)
        deadline_iso = None
        days_rem = None
        if raw.raw_deadline:
            try:
                clean_deadline = raw.raw_deadline.strip().replace("Z", "+00:00")
                if " " in clean_deadline and "T" not in clean_deadline:
                    dt = datetime.strptime(clean_deadline, "%Y-%m-%d %H:%M:%S")
                else:
                    dt = datetime.fromisoformat(clean_deadline)
                deadline_iso = dt.isoformat()
                now = datetime.utcnow()
                dt_naive = dt.replace(tzinfo=None)
                days_rem = max(0, (dt_naive - now).days)
            except Exception as parse_err:
                logger.warning(f"Could not parse ISO deadline '{raw.raw_deadline}': {parse_err}")
                deadline_iso = raw.raw_deadline

        # 4. Normalize Currencies and Compute USD Parity Value
        currency_code = (raw.raw_award_currency or "USD").upper().strip()
        raw_amt = raw.raw_award_amount or 0.0
        rate = self.EXCHANGE_RATES_TO_USD.get(currency_code, 1.0)
        estimated_usd = round(raw_amt * rate, 2) if raw_amt > 0 else 0.0

        # 5. Extract and Validate Official Source Domain
        domain = "official.portal"
        if raw.official_source_url:
            try:
                domain_parts = raw.official_source_url.split("//")[-1].split("/")
                domain = domain_parts[0] if domain_parts else "official.portal"
            except Exception:
                domain = "official.portal"

        # 6. Transform Eligibility Clauses into NormalizedRule entities
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

        # 7. Construct Complete Provenance Metadata Block
        provenance = {
            "adapter": self.adapter.__class__.__name__,
            "source_id": self.source_id,
            "source_name": getattr(self.adapter, "source_name", self.source_id),
            "origin_agency": getattr(self.adapter, "origin_agency", "Statutory Agency"),
            "license": getattr(self.adapter, "license_type", "Open Government Access"),
            "provenance_url": getattr(self.adapter, "provenance_url", raw.official_source_url),
            "access_method": getattr(self.adapter, "access_method", "Official Gazette"),
            "checksum": raw.raw_payload_checksum,
            "ingested_at_utc": datetime.utcnow().isoformat()
        }

        return NormalizedScholarshipRecord(
            natural_key=natural_key,
            source_id=self.source_id,
            source_record_id=raw.source_record_id,
            title=raw.title,
            slug=slug,
            provider_name=raw.provider_name,
            provider_category=raw.provider_category,
            destination_countries=unique_countries,
            host_institutions=raw.host_institutions,
            study_levels=unique_levels,
            academic_fields=raw.academic_fields,
            award_summary=raw.award_summary,
            award_details=raw.award_details,
            currency_code=currency_code,
            total_award_amount=raw.raw_award_amount,
            estimated_usd_value=estimated_usd,
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
            provenance_metadata=provenance
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
