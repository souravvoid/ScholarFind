"""
ScholarFind Database Schema — SQLAlchemy 2.0 ORM Models
"""
import enum
from datetime import datetime
from typing import List, Optional
from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
    Enum,
    UniqueConstraint,
    Index
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class DegreeLevelEnum(str, enum.Enum):
    bachelors = "bachelors"
    masters = "masters"
    phd = "phd"
    postdoc = "postdoc"


class RuleTypeEnum(str, enum.Enum):
    citizenship = "citizenship"
    degree_level = "degree_level"
    field_of_study = "field_of_study"
    academic_score = "academic_score"
    language = "language"
    work_experience = "work_experience"
    deadline = "deadline"


class TrackerStatusEnum(str, enum.Enum):
    interested = "interested"
    preparing = "preparing"
    ready = "ready"
    applied = "applied"


class IngestionStatusEnum(str, enum.Enum):
    pending = "pending"
    running = "running"
    completed = "completed"
    failed = "failed"


# --- Users & Profiles ---

class User(Base):
    __tablename__ = "users"

    id = Column(String(128), primary_key=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    display_name = Column(String(255), nullable=True)
    photo_url = Column(String(512), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    profile = relationship("StudentProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    saved_scholarships = relationship("SavedScholarship", back_populates="user", cascade="all, delete-orphan")
    tracker_entries = relationship("ApplicationTrackerEntry", back_populates="user", cascade="all, delete-orphan")


class StudentProfile(Base):
    __tablename__ = "student_profiles"

    id = Column(String(128), primary_key=True)
    user_id = Column(String(128), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    citizenship = Column(String(100), nullable=False)
    residence_country = Column(String(100), nullable=False)
    education_level = Column(Enum(DegreeLevelEnum), nullable=False)
    institution_name = Column(String(255), nullable=False)
    grading_scale = Column(String(50), default="gpa_4_0", nullable=False)
    gpa = Column(Float, nullable=False)
    max_gpa = Column(Float, default=4.0, nullable=False)
    normalized_gpa = Column(Float, nullable=False)  # Standardized 0.0 - 100.0 score
    graduation_year = Column(String(50), nullable=False)
    primary_field = Column(String(255), nullable=False)
    faculty_tags = Column(Text, nullable=True)  # JSON-serialized list
    target_degrees = Column(Text, nullable=True)  # JSON-serialized list
    target_regions = Column(Text, nullable=True)  # JSON-serialized list
    target_countries = Column(Text, nullable=True)  # JSON-serialized list
    delivery_modality = Column(String(50), default="on_campus", nullable=False)
    intended_start_term = Column(String(50), nullable=True)
    work_experience_years = Column(Float, default=0.0, nullable=False)
    english_test_type = Column(String(50), default="none", nullable=False)
    english_score = Column(String(50), nullable=True)
    has_english_medium_instruction = Column(Boolean, default=False, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="profile")


# --- Providers, Sources, & Scholarships ---

class ScholarshipProvider(Base):
    __tablename__ = "scholarship_providers"

    id = Column(String(128), primary_key=True)
    name = Column(String(255), unique=True, nullable=False, index=True)
    category = Column(String(100), nullable=False)  # University Trust, Government, Foundation, etc.
    country = Column(String(100), nullable=False)
    website_url = Column(String(512), nullable=False)
    verified = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    scholarships = relationship("Scholarship", back_populates="provider")


class ScholarshipSource(Base):
    __tablename__ = "scholarship_sources"

    id = Column(String(128), primary_key=True)
    name = Column(String(255), nullable=False)
    origin_agency = Column(String(255), nullable=False)
    country = Column(String(100), nullable=False)
    adapter_module = Column(String(255), nullable=False)
    access_method = Column(String(100), nullable=False)
    provenance_url = Column(String(512), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    last_ingested_at = Column(DateTime, nullable=True)

    scholarships = relationship("Scholarship", back_populates="source")
    ingestion_jobs = relationship("IngestionJob", back_populates="source")


class Scholarship(Base):
    __tablename__ = "scholarships"

    id = Column(String(128), primary_key=True)
    slug = Column(String(255), unique=True, nullable=False, index=True)
    title = Column(String(255), nullable=False, index=True)
    provider_id = Column(String(128), ForeignKey("scholarship_providers.id"), nullable=False)
    source_id = Column(String(128), ForeignKey("scholarship_sources.id"), nullable=False)
    hero_image = Column(String(512), nullable=True)
    destination_countries = Column(Text, nullable=False)  # JSON-serialized array
    host_institutions = Column(Text, nullable=True)  # JSON-serialized array
    study_levels = Column(Text, nullable=False)  # JSON-serialized array
    fields_of_study = Column(Text, nullable=False)  # JSON-serialized array
    total_award_value = Column(String(255), nullable=False)
    award_details = Column(String(512), nullable=True)
    estimated_usd_value = Column(Float, default=0.0, nullable=False)
    application_deadline = Column(DateTime, nullable=True, index=True)
    academic_year = Column(String(50), nullable=False)
    official_source_url = Column(String(512), nullable=False)
    official_application_url = Column(String(512), nullable=False)
    source_domain = Column(String(255), nullable=False)
    overview = Column(Text, nullable=False)
    last_verified_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    provider = relationship("ScholarshipProvider", back_populates="scholarships")
    source = relationship("ScholarshipSource", back_populates="scholarships")
    eligibility_rules = relationship("ScholarshipEligibilityRule", back_populates="scholarship", cascade="all, delete-orphan")
    required_documents = relationship("RequiredDocument", back_populates="scholarship", cascade="all, delete-orphan")
    saved_entries = relationship("SavedScholarship", back_populates="scholarship")


class ScholarshipEligibilityRule(Base):
    __tablename__ = "scholarship_eligibility_rules"

    id = Column(String(128), primary_key=True)
    scholarship_id = Column(String(128), ForeignKey("scholarships.id", ondelete="CASCADE"), nullable=False)
    rule_type = Column(Enum(RuleTypeEnum), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    is_mandatory = Column(Boolean, default=True, nullable=False)
    source_citation = Column(String(512), nullable=False)
    rule_payload = Column(Text, nullable=True)  # JSON-serialized rule parameters (allowed countries, min_gpa, etc.)

    scholarship = relationship("Scholarship", back_populates="eligibility_rules")


class RequiredDocument(Base):
    __tablename__ = "required_documents"

    id = Column(String(128), primary_key=True)
    scholarship_id = Column(String(128), ForeignKey("scholarships.id", ondelete="CASCADE"), nullable=False)
    document_name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    is_mandatory = Column(Boolean, default=True, nullable=False)

    scholarship = relationship("Scholarship", back_populates="required_documents")


# --- Student Actions & Application Tracking ---

class SavedScholarship(Base):
    __tablename__ = "saved_scholarships"

    id = Column(String(128), primary_key=True)
    user_id = Column(String(128), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    scholarship_id = Column(String(128), ForeignKey("scholarships.id", ondelete="CASCADE"), nullable=False)
    status = Column(Enum(TrackerStatusEnum), default=TrackerStatusEnum.interested, nullable=False)
    notes = Column(Text, nullable=True)
    saved_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("user_id", "scholarship_id", name="uq_user_saved_scholarship"),
        Index("idx_user_saved", "user_id"),
    )

    user = relationship("User", back_populates="saved_scholarships")
    scholarship = relationship("Scholarship", back_populates="saved_entries")


class ApplicationTrackerEntry(Base):
    __tablename__ = "application_tracker_entries"

    id = Column(String(128), primary_key=True)
    user_id = Column(String(128), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    scholarship_id = Column(String(128), ForeignKey("scholarships.id", ondelete="CASCADE"), nullable=False)
    status = Column(Enum(TrackerStatusEnum), default=TrackerStatusEnum.interested, nullable=False)
    completed_documents = Column(Text, nullable=True)  # JSON-serialized list of completed doc names
    personal_deadline_target = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("user_id", "scholarship_id", name="uq_user_tracker_entry"),
    )

    user = relationship("User", back_populates="tracker_entries")


# --- Ingestion Pipeline Auditing & Provance ---

class IngestionJob(Base):
    __tablename__ = "ingestion_jobs"

    id = Column(String(128), primary_key=True)
    source_id = Column(String(128), ForeignKey("scholarship_sources.id"), nullable=False)
    status = Column(Enum(IngestionStatusEnum), default=IngestionStatusEnum.pending, nullable=False)
    records_fetched = Column(Integer, default=0, nullable=False)
    records_upserted = Column(Integer, default=0, nullable=False)
    records_failed = Column(Integer, default=0, nullable=False)
    error_log = Column(Text, nullable=True)
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)

    source = relationship("ScholarshipSource", back_populates="ingestion_jobs")
