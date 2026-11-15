# Schema Analysis — ScholarFind

Per-table column summary (from `backend/*/models.py`).

## accounts_userprofile
user (PK/FK auth_user), display_name, photo_url (512), citizenship, residence_country.

## students_studentprofile
user (PK/FK), citizenship, residence_country, education_level, institution_name,
grading_scale, gpa (0–5), max_gpa (1–5), normalized_gpa, graduation_year,
primary_field, faculty_tags, target_degrees, target_regions, target_countries,
delivery_modality, intended_start_term, work_experience_years, english_test_type,
english_score, has_english_medium_instruction, updated_at.

## scholarships_scholarshipprovider
id, name (unique), category, country, website_url (500), verified, created_at.

## scholarships_scholarshipsource
id, name, origin_agency, country, adapter_module, access_method, provenance_url (500),
is_active, last_ingested_at.

## scholarships_scholarship
id, slug (unique, indexed), title (indexed), provider_id (FK), source_id (FK),
hero_image (500, nullable), destination_countries (text), host_institutions (text),
study_levels (text), fields_of_study (text), total_award_value, award_details (512),
coverage_types (text), funding_nature (text), estimated_usd_value, application_deadline
(indexed, nullable), academic_year, official_source_url (500), official_application_url (500),
source_domain, overview, application_instructions (JSON), last_verified_at, is_active,
created_at, updated_at.

## scholarships_scholarshipeligibilityrule
id, scholarship_id (FK), rule_type (choices), title, description, is_mandatory,
source_citation (512), rule_payload (text/JSON).

## scholarships_requireddocument
id, scholarship_id (FK), document_name, description, is_mandatory.

## scholarships_ingestionjob
id, source_id, status, records_fetched, records_upserted, records_failed,
error_log, started_at, completed_at.

## matching_manualreviewflag
id, student_id (FK), scholarship_id (FK), reason, created_at, reviewed,
reviewed_at, reviewer_id (FK auth_user, nullable). Unique (student, scholarship).

## matching_workexperiencerecord
id, student_id (FK), years, employer, role, verified, verification_date, source.

## saved_savedscholarship
id, user_id (FK), scholarship_id (FK), status, notes, saved_at, updated_at.
Unique (user, scholarship).

## tracking_applicationtrackerentry
id, user_id (FK), scholarship_id (FK), status, completed_documents,
personal_deadline_target, notes, updated_at. Unique (user, scholarship).

## auth_user (Django built-in)
id, username (unique), email, password (hashed), first_name, last_name, is_staff,
is_active, is_superuser, last_login, date_joined.
