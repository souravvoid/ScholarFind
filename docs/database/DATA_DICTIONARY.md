# Data Dictionary — ScholarFind

Columns for the most important tables.

## scholarships_scholarship
| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | bigint (PK) | no | surrogate |
| slug | varchar(255) | no | unique, indexed |
| title | varchar(255) | no | indexed |
| provider_id | bigint (FK) | no | → provider |
| source_id | bigint (FK) | no | → source |
| hero_image | varchar(500) | yes | nullable URL |
| destination_countries | text | no | comma-separated |
| host_institutions | text | yes | |
| study_levels | text | no | comma-separated |
| fields_of_study | text | no | comma-separated |
| total_award_value | varchar(255) | no | |
| award_details | varchar(512) | yes | |
| coverage_types | text | no | default '' |
| funding_nature | text | no | default '' |
| estimated_usd_value | double | no | default 0 |
| application_deadline | timestamptz | yes | indexed |
| academic_year | varchar(50) | no | |
| official_source_url | varchar(500) | no | |
| official_application_url | varchar(500) | no | |
| source_domain | varchar(255) | no | |
| overview | text | no | |
| application_instructions | jsonb | no | default [] |
| last_verified_at | timestamptz | no | auto |
| is_active | bool | no | default true |
| created_at / updated_at | timestamptz | no | |

## accounts_userprofile
user (PK/FK auth_user), display_name varchar(255), photo_url varchar(512),
citizenship varchar(100), residence_country varchar(100).

## students_studentprofile
See SCHEMA_ANALYSIS.md; numeric fields validated at app layer (gpa 0–5).
