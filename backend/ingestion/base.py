"""
ScholarFind Modular Ingestion Pipeline — Base Adapter and Record Types
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Dict, Any, Optional
import hashlib
import json


@dataclass
class RawEligibilityClause:
    rule_type: str
    title: str
    description: str
    is_mandatory: bool
    source_citation: str
    parameters: Dict[str, Any] = field(default_factory=dict)


@dataclass
class RawScholarshipRecord:
    source_record_id: str
    title: str
    provider_name: str
    provider_category: str
    destination_countries: List[str]
    host_institutions: List[str]
    study_levels: List[str]
    academic_fields: List[str]
    award_summary: str
    award_details: Optional[str]
    raw_award_currency: str
    raw_award_amount: Optional[float]
    raw_deadline: str
    academic_cycle: str
    official_source_url: str
    official_application_url: str
    required_documents: List[str]
    application_instructions: List[str]
    eligibility_clauses: List[RawEligibilityClause]
    raw_payload_checksum: str = ""

    def compute_checksum(self) -> str:
        data_string = f"{self.source_record_id}:{self.title}:{self.raw_deadline}:{self.award_summary}"
        return hashlib.sha256(data_string.encode("utf-8")).hexdigest()


@dataclass
class NormalizedRule:
    rule_id: str
    rule_type: str
    title: str
    description: str
    is_mandatory: bool
    source_citation: str
    parameters: Dict[str, Any]


@dataclass
class NormalizedScholarshipRecord:
    natural_key: str
    source_id: str
    source_record_id: str
    title: str
    slug: str
    provider_name: str
    provider_category: str
    destination_countries: List[str]
    host_institutions: List[str]
    study_levels: List[str]  # e.g., ['masters', 'phd']
    academic_fields: List[str]
    award_summary: str
    award_details: Optional[str]
    currency_code: str
    total_award_amount: Optional[float]
    estimated_usd_value: float
    deadline_iso: Optional[str]
    days_remaining: Optional[int]
    academic_cycle: str
    official_source_url: str
    official_application_url: str
    source_domain: str
    required_documents: List[str]
    application_instructions: List[str]
    rules: List[NormalizedRule]
    collection_timestamp: str
    provenance_metadata: Dict[str, Any]


class BaseSourceAdapter(ABC):
    """
    Abstract Base Class for all ScholarFind scholarship source collectors.
    Each adapter encapsulates source-specific protocol handling, rate-limiting,
    and access policies.
    """
    source_id: str
    source_name: str
    origin_agency: str
    country_of_origin: str
    provenance_url: str
    access_method: str
    license_type: str
    rate_limit_per_second: float = 1.0

    @abstractmethod
    def get_access_conditions(self) -> Dict[str, Any]:
        """Returns documented access terms, robots.txt status, rate limits, and legal constraints."""
        pass

    @abstractmethod
    def fetch_raw_data(self) -> List[Dict[str, Any]]:
        """Fetches raw data from the official approved mechanism."""
        pass

    @abstractmethod
    def parse(self, raw_data: List[Dict[str, Any]]) -> List[RawScholarshipRecord]:
        """Parses raw source payloads into typed RawScholarshipRecord structures."""
        pass
