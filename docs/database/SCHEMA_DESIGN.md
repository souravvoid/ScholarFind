# Schema Design

ScholarFind uses a modular Django monolith with PostgreSQL. Core entities:
User (Django auth), UserProfile, StudentProfile, ScholarshipProvider, ScholarshipSource, Scholarship,
ScholarshipEligibilityRule, RequiredDocument, SavedScholarship, ApplicationTrackerEntry,
ManualReviewFlag, WorkExperienceRecord, IngestionJob.

Primary keys: BigAutoField/OneToOne PK on user for profiles. Unique constraints: Scholarship.slug,
ScholarshipProvider.name, unique_together on (user,scholarship) for saved/tracker, (student,scholarship) for manual review.
Foreign keys use CASCADE for ownership and provider/source to scholarship; SET_NULL for reviewer.
List-like fields (destination_countries, study_levels, fields_of_study, faculty_tags, target_*) are stored as comma-separated text or JSON, documented as denormalized. No Institution or ScholarshipCategory table exists; added only if required.