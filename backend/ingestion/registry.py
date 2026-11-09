"""
Pipeline adapter registry compatibility layer.

The verified ``ADAPTER_REGISTRY`` exposes ten collectors. Three of them
(CSC UK, DAAD DE, Fulbright US) implement the full :class:`BaseSourceAdapter`
contract; the remaining seven only expose ``collect()``.

This module wraps the lightweight collectors in a pipeline-compatible adapter
so that every registered source can be executed by ``IngestionPipeline`` and
persisted to PostgreSQL.
"""

from typing import Any, Dict, List

from .base import BaseSourceAdapter, RawEligibilityClause, RawScholarshipRecord
from .adapters import ADAPTER_REGISTRY

# Keys that belong to a clause's envelope rather than its rule parameters.
_CLAUSE_META_KEYS = {
    "type",
    "rule_type",
    "title",
    "description",
    "mandatory",
    "is_mandatory",
    "source_citation",
}


class CollectorAdapter(BaseSourceAdapter):
    """Adapts a lightweight ``collect()`` source to the pipeline interface."""

    def __init__(self, source_id: str, collector: Any):
        self.source_id = source_id
        self._collector = collector
        self.source_name = getattr(collector, "source_name", source_id)
        self.origin_agency = getattr(collector, "origin_agency", "Official Agency")
        self.country_of_origin = getattr(collector, "country_of_origin", "International")
        self.provenance_url = getattr(collector, "provenance_url", "")
        self.access_method = getattr(collector, "access_method", "Official public catalogue")
        self.license_type = getattr(collector, "license_type", "Open Government Access")
        self.rate_limit_per_second = getattr(collector, "rate_limit_per_second", 1.0)

    def get_access_conditions(self) -> Dict[str, Any]:
        inner = getattr(self._collector, "get_access_conditions", None)
        if callable(inner):
            return inner()
        return {
            "source_id": self.source_id,
            "source_name": self.source_name,
            "origin_agency": self.origin_agency,
            "license": self.license_type,
            "provenance_url": self.provenance_url or "https://www.gov.uk",
            "access_method": self.access_method,
            "rate_limit_per_second": self.rate_limit_per_second,
            "limitations": [
                "Records are collected from the provider's public catalogue.",
                "Award amounts are indicative and must be verified with the provider.",
            ],
        }

    def fetch_raw_data(self) -> List[Dict[str, Any]]:
        return self._collector.collect()

    def parse(self, raw_data: List[Dict[str, Any]]) -> List[RawScholarshipRecord]:
        records: List[RawScholarshipRecord] = []
        for item in raw_data:
            clauses: List[RawEligibilityClause] = []
            for clause in item.get("eligibility_clauses", []):
                if not isinstance(clause, dict):
                    continue
                rule_type = clause.get("type") or clause.get("rule_type") or "manual_review"
                parameters = {
                    key: value
                    for key, value in clause.items()
                    if key not in _CLAUSE_META_KEYS
                }
                clauses.append(
                    RawEligibilityClause(
                        rule_type=rule_type,
                        title=clause.get("title")
                        or f"{rule_type.replace('_', ' ').title()} requirement",
                        description=clause.get("description")
                        or f"Applicant must satisfy the {rule_type.replace('_', ' ')} requirement.",
                        is_mandatory=clause.get(
                            "mandatory", clause.get("is_mandatory", True)
                        ),
                        source_citation=clause.get(
                            "source_citation",
                            f"{self.source_name} published terms",
                        ),
                        parameters=parameters,
                    )
                )

            record = RawScholarshipRecord(
                source_record_id=item.get(
                    "source_record_id", item.get("slug", item.get("id", ""))
                ),
                title=item.get("title", ""),
                provider_name=item.get("provider_name", ""),
                provider_category=item.get("provider_category", "Government Endowment"),
                destination_countries=item.get(
                    "country_destinations", item.get("destination_countries", [])
                ),
                host_institutions=item.get("host_institutions", []),
                study_levels=item.get("study_levels", []),
                academic_fields=item.get(
                    "academic_fields", item.get("fields_of_study", [])
                ),
                award_summary=item.get("award_summary", ""),
                award_details=item.get("award_details"),
                raw_award_currency=item.get("currency_code", "USD"),
                raw_award_amount=item.get(
                    "award_usd", item.get("estimated_usd_value")
                ),
                raw_deadline=item.get(
                    "deadline_iso", item.get("application_deadline", "")
                ),
                academic_cycle=item.get("academic_cycle", ""),
                official_source_url=item.get("official_source_url", ""),
                official_application_url=item.get(
                    "official_apply_url", item.get("official_application_url", "")
                ),
                required_documents=item.get("required_documents", []),
                application_instructions=item.get("application_instructions", []),
                eligibility_clauses=clauses,
            )
            record.raw_payload_checksum = record.compute_checksum()
            records.append(record)
        return records


def get_pipeline_adapter(source_id: str):
    """Return a pipeline-compatible adapter for ``source_id``, or ``None``."""
    collector = ADAPTER_REGISTRY.get(source_id)
    if collector is None:
        return None
    if isinstance(collector, BaseSourceAdapter):
        return collector
    return CollectorAdapter(source_id, collector)


PIPELINE_ADAPTERS = {
    source_id: get_pipeline_adapter(source_id) for source_id in ADAPTER_REGISTRY
}

__all__ = [
    "CollectorAdapter",
    "PIPELINE_ADAPTERS",
    "get_pipeline_adapter",
]
