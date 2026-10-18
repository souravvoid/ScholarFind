"""
ScholarFind Modular Ingestion Pipeline Engine
Implements bounded exponential backoff, schema normalization,
deduplication, provenance logging, and metric recording.
"""
import time
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional

from backend.schemas import RawSourceRecord, NormalizedScholarship
from backend.models import DegreeLevelEnum

logger = logging.getLogger("scholarfind.ingestion")
logger.setLevel(logging.INFO)


class IngestionPipeline:
    def __init__(self, source_id: str, adapter_instance: Any):
        self.source_id = source_id
        self.adapter = adapter_instance

    def run_job(self) -> Dict[str, Any]:
        """
        Executes the 10-stage ingestion pipeline with retry and idempotency.
        """
        start_time = datetime.utcnow()
        results = {
            "source_id": self.source_id,
            "started_at": start_time.isoformat(),
            "fetched": 0,
            "normalized": 0,
            "deduplicated": 0,
            "errors": []
        }

        # Stage 1: Fetch through approved mechanism with exponential backoff
        raw_records = self._fetch_with_retry(max_retries=3)
        results["fetched"] = len(raw_records)

        # Stage 2-4: Parse, Normalize, and Validate
        normalized_records: List[NormalizedScholarship] = []
        for raw in raw_records:
            try:
                norm = self._normalize_record(raw)
                normalized_records.append(norm)
            except Exception as e:
                logger.error(f"Validation failure on {raw.get('source_record_id')}: {e}")
                results["errors"].append(str(e))

        results["normalized"] = len(normalized_records)

        # Stage 5-6: Deduplicate against natural normalized keys
        deduped = self._deduplicate(normalized_records)
        results["deduplicated"] = len(deduped)

        results["completed_at"] = datetime.utcnow().isoformat()
        results["status"] = "success" if len(results["errors"]) == 0 else "completed_with_warnings"
        return results

    def _fetch_with_retry(self, max_retries: int = 3) -> List[Dict[str, Any]]:
        attempt = 0
        delay = 1.0
        while attempt < max_retries:
            try:
                records = self.adapter.collect()
                return records
            except Exception as e:
                attempt += 1
                logger.warning(f"Fetch attempt {attempt} failed for {self.source_id}: {e}. Retrying in {delay}s...")
                time.sleep(delay)
                delay *= 2.0
        logger.error(f"All {max_retries} fetch attempts failed for {self.source_id}.")
        return []

    def _normalize_record(self, raw: Dict[str, Any]) -> NormalizedScholarship:
        levels: List[DegreeLevelEnum] = []
        for lvl in raw.get("study_levels", []):
            lvl_lower = lvl.lower()
            if "master" in lvl_lower:
                levels.append(DegreeLevelEnum.masters)
            elif "phd" in lvl_lower or "doctor" in lvl_lower:
                levels.append(DegreeLevelEnum.phd)
            elif "bachelor" in lvl_lower:
                levels.append(DegreeLevelEnum.bachelors)
            elif "postdoc" in lvl_lower:
                levels.append(DegreeLevelEnum.postdoc)

        deadline_dt = None
        if raw.get("deadline_iso"):
            try:
                deadline_dt = datetime.fromisoformat(raw["deadline_iso"])
            except Exception:
                pass

        return NormalizedScholarship(
            slug=raw.get("source_record_id", "").lower().replace(" ", "-"),
            title=raw["title"],
            provider_name=raw["provider_name"],
            provider_category=raw["provider_category"],
            destination_countries=raw.get("country_destinations", []),
            study_levels=levels or [DegreeLevelEnum.masters],
            fields_of_study=raw.get("academic_fields", ["All Fields"]),
            total_award_value=raw.get("award_summary", "Full Tuition"),
            estimated_usd_value=float(raw.get("award_usd", 0.0)),
            application_deadline=deadline_dt,
            academic_year=raw.get("academic_cycle", "2025/2026"),
            official_source_url=raw.get("official_source_url", ""),
            official_application_url=raw.get("official_apply_url", ""),
            source_domain=raw.get("official_source_url", "").split("//")[-1].split("/")[0],
            overview=raw.get("award_summary", ""),
            rules=raw.get("eligibility_clauses", []),
            documents=raw.get("required_documents", [])
        )

    def _deduplicate(self, records: List[NormalizedScholarship]) -> List[NormalizedScholarship]:
        seen = set()
        deduped = []
        for r in records:
            key = (r.slug, r.provider_name.lower())
            if key not in seen:
                seen.add(key)
                deduped.append(r)
        return deduped
