"""
Pydantic Schemas for ScholarFind API & Ingestion Normalization with Graceful Fallback
"""
from datetime import datetime
from typing import List, Optional, Dict, Any

try:
    from pydantic import BaseModel, Field, HttpUrl, EmailStr
    HAS_PYDANTIC = True
except ImportError:
    HAS_PYDANTIC = False

    class BaseModel:
        def __init__(self, **kwargs):
            for k, v in kwargs.items():
                setattr(self, k, v)

        def dict(self) -> Dict[str, Any]:
            return self.__dict__

        def model_dump(self) -> Dict[str, Any]:
            return self.__dict__

    def Field(default=None, **kwargs):
        return default

    HttpUrl = str
    EmailStr = str

from backend.models import DegreeLevelEnum, RuleTypeEnum, TrackerStatusEnum


# --- Ingestion Normalized Schema ---

class RawSourceRecord(BaseModel):
    source_record_id: str
    title: str
    provider_name: str
    provider_category: str
    country_destinations: List[str]
    host_universities: List[str] = []
    study_levels: List[str]
    academic_fields: List[str]
    award_summary: str
    award_details: Optional[str] = None
    award_usd: float = 0.0
    deadline_iso: Optional[str] = None
    official_source_url: str
    official_apply_url: str
    eligibility_clauses: List[Dict[str, Any]]
    required_documents: List[str] = []
    academic_cycle: str


class NormalizedScholarship(BaseModel):
    slug: str
    title: str
    provider_name: str
    provider_category: str
    destination_countries: List[str]
    study_levels: List[DegreeLevelEnum]
    fields_of_study: List[str]
    total_award_value: str
    estimated_usd_value: float
    application_deadline: Optional[datetime]
    academic_year: str
    official_source_url: str
    official_application_url: str
    source_domain: str
    overview: str
    rules: List[Dict[str, Any]]
    documents: List[str]


# --- REST API Request & Response Schemas ---

class UserProfileCreate(BaseModel):
    citizenship: str
    residence_country: str
    education_level: DegreeLevelEnum
    institution_name: str
    grading_scale: str = "gpa_4_0"
    gpa: float
    max_gpa: float = 4.0
    graduation_year: str
    primary_field: str
    faculty_tags: List[str] = []
    target_degrees: List[DegreeLevelEnum] = []
    target_regions: List[str] = []
    target_countries: List[str] = []
    delivery_modality: str = "on_campus"
    intended_start_term: Optional[str] = "Fall 2026"
    work_experience_years: float = 0.0
    english_test_type: str = "none"
    english_score: Optional[str] = None
    has_english_medium_instruction: bool = False


class UserProfileResponse(UserProfileCreate):
    id: str
    user_id: str
    normalized_gpa: float
    updated_at: datetime


class ScholarshipCriterionResponse(BaseModel):
    id: str
    rule_type: RuleTypeEnum
    title: str
    description: str
    is_mandatory: bool
    source_citation: str


class ScholarshipResponse(BaseModel):
    id: str
    slug: str
    title: str
    provider_name: str
    provider_category: str
    destination_countries: List[str]
    study_levels: List[DegreeLevelEnum]
    fields_of_study: List[str]
    total_award_value: str
    estimated_usd_value: float
    application_deadline: Optional[datetime]
    days_remaining: Optional[int]
    academic_year: str
    official_source_url: str
    official_application_url: str
    source_domain: str
    overview: str
    criteria: List[ScholarshipCriterionResponse]
    required_documents: List[str]
    last_verified_at: datetime


class EligibilityOutcome(BaseModel):
    scholarship_id: str
    status: str  # likely_eligible | more_info_needed | ineligible | needs_review
    match_percentage: int
    matched_criteria_count: int
    mandatory_failed_count: int
    missing_criteria_count: int
    explanations: List[Dict[str, Any]]


class SaveScholarshipRequest(BaseModel):
    scholarship_id: str
    status: TrackerStatusEnum = TrackerStatusEnum.interested
    notes: Optional[str] = None


class TrackerUpdateRequest(BaseModel):
    status: TrackerStatusEnum
    notes: Optional[str] = None
    completed_documents: List[str] = []
