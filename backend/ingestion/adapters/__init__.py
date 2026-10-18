"""
ScholarFind Source Ingestion Adapters Registry
10 Verified Authoritative Collegiate & Governmental Endowment Collectors
"""
from typing import List, Dict, Any

class CommonwealthAdapter:
    source_id = "src_csc_uk"
    source_name = "Commonwealth Scholarship Commission in the UK"
    origin_agency = "Foreign, Commonwealth & Development Office (FCDO)"

    def collect(self) -> List[Dict[str, Any]]:
        return [{
            "source_record_id": "cws-masters-2025-26",
            "title": "Commonwealth Master's Scholarship 2025/26",
            "provider_name": "Commonwealth Scholarship Commission",
            "provider_category": "Government Endowment",
            "country_destinations": ["United Kingdom"],
            "study_levels": ["masters"],
            "academic_fields": ["Science & Tech", "Health Systems", "Global Prosperity", "Peace & Governance"],
            "award_summary": "Full tuition + £1,347/mo + return flight",
            "award_usd": 54000.0,
            "deadline_iso": "2025-12-12T16:00:00",
            "official_source_url": "https://www.gov.uk/government/organisations/commonwealth-scholarship-commission-in-the-uk",
            "official_apply_url": "https://cscuk.fcdo.gov.uk/scholarships/commonwealth-masters-scholarships/",
            "academic_cycle": "2025/2026",
            "eligibility_clauses": [
                {"type": "citizenship", "mandatory": True, "allowed": ["Nigeria", "Ghana", "Kenya", "India", "Pakistan"]},
                {"type": "academic_score", "mandatory": True, "min_gpa_normalized": 75.0}
            ],
            "required_documents": ["Official transcripts", "References (2)", "Development Impact Statement"]
        }]


class DAADScholarshipAdapter:
    source_id = "src_daad_de"
    source_name = "DAAD German Academic Exchange Service"
    origin_agency = "Federal Foreign Office of Germany"

    def collect(self) -> List[Dict[str, Any]]:
        return [{
            "source_record_id": "daad-helmut-schmidt-2025",
            "title": "DAAD Helmut-Schmidt Programme (PPGG)",
            "provider_name": "Federal Foreign Office",
            "provider_category": "Government Endowment",
            "country_destinations": ["Germany"],
            "study_levels": ["masters"],
            "academic_fields": ["Public Policy", "Economics", "Governance", "Social Sciences"],
            "award_summary": "Full funding + €934/mo + health insurance",
            "award_usd": 42000.0,
            "deadline_iso": "2025-11-30T23:59:00",
            "official_source_url": "https://www.daad.de",
            "official_apply_url": "https://www.daad.de/en/study-and-research-in-germany/scholarships/helmut-schmidt-programme/",
            "academic_cycle": "2025/2026",
            "eligibility_clauses": [
                {"type": "citizenship", "mandatory": True, "dac_countries_only": True},
                {"type": "field_of_study", "mandatory": True, "allowed_fields": ["Public Policy", "Economics", "Law"]}
            ],
            "required_documents": ["DAAD Form", "Europass CV", "Motivation Letter", "Graduation Transcripts"]
        }]


class FulbrightAdapter:
    source_id = "src_fulbright_us"
    source_name = "Fulbright Foreign Student Program"
    origin_agency = "U.S. Department of State / IIE"

    def collect(self) -> List[Dict[str, Any]]:
        return [{
            "source_record_id": "fulbright-foreign-student-2026",
            "title": "Fulbright Foreign Student Program",
            "provider_name": "U.S. Department of State / IIE",
            "provider_category": "Government Endowment",
            "country_destinations": ["United States"],
            "study_levels": ["masters", "phd"],
            "academic_fields": ["All fields excluding clinical medical patient contact"],
            "award_summary": "Full tuition, monthly stipend, health & flights",
            "award_usd": 72000.0,
            "deadline_iso": "2026-06-01T23:59:00",
            "official_source_url": "https://foreign.fulbrightonline.org",
            "official_apply_url": "https://foreign.fulbrightonline.org/about/foreign-student-program",
            "academic_cycle": "2026/2027",
            "eligibility_clauses": [
                {"type": "citizenship", "mandatory": True, "non_us_only": True},
                {"type": "academic_score", "mandatory": True, "min_gpa_normalized": 78.0}
            ],
            "required_documents": ["Transcripts", "Study Objective", "Personal Statement", "Three References"]
        }]


class ErasmusMundusAdapter:
    source_id = "src_erasmus_eu"
    source_name = "Erasmus Mundus Joint Masters Catalogue"
    origin_agency = "European Education and Culture Executive Agency (EACEA)"

    def collect(self) -> List[Dict[str, Any]]:
        return [{
            "source_record_id": "emjmd-data-intelligence-2026",
            "title": "Erasmus Mundus Joint Master Degree in Data Intelligence",
            "provider_name": "European Commission EACEA",
            "provider_category": "Multilateral Agency",
            "country_destinations": ["France", "Italy", "Finland"],
            "study_levels": ["masters"],
            "academic_fields": ["Computer Science", "Data Science", "Machine Learning", "Mathematics"],
            "award_summary": "€1,400/mo stipend + full tuition waiver + travel",
            "award_usd": 49000.0,
            "deadline_iso": "2026-01-15T23:59:00",
            "official_source_url": "https://www.eacea.ec.europa.eu",
            "official_apply_url": "https://www.eacea.ec.europa.eu/scholarships/erasmus-mundus-catalogue_en",
            "academic_cycle": "2026/2027",
            "eligibility_clauses": [
                {"type": "citizenship", "mandatory": True, "global": True},
                {"type": "field_of_study", "mandatory": True, "stem_cs_only": True}
            ],
            "required_documents": ["BSc Degree Certificate", "Europass CV", "Statement of Purpose", "Two References"]
        }]


class CheveningAdapter:
    source_id = "src_chevening_uk"
    source_name = "Chevening Scholarships Secretariat"
    origin_agency = "Foreign, Commonwealth & Development Office (UK)"

    def collect(self) -> List[Dict[str, Any]]:
        return [{
            "source_record_id": "chevening-uk-2025",
            "title": "Chevening Scholarships UK",
            "provider_name": "UK FCDO",
            "provider_category": "Government Endowment",
            "country_destinations": ["United Kingdom"],
            "study_levels": ["masters"],
            "academic_fields": ["All eligible one-year taught Master’s courses"],
            "award_summary": "Full tuition + monthly living allowance + airfare",
            "award_usd": 52000.0,
            "deadline_iso": "2025-11-05T12:00:00",
            "official_source_url": "https://www.chevening.org",
            "official_apply_url": "https://www.chevening.org/scholarships/guidance/",
            "academic_cycle": "2025/2026",
            "eligibility_clauses": [
                {"type": "work_experience", "mandatory": True, "min_work_years": 2.0},
                {"type": "academic_score", "mandatory": True, "min_gpa_normalized": 75.0}
            ],
            "required_documents": ["Two references", "Valid passport", "Degree transcript", "Three UK course choices"]
        }]


class MEXTAdapter:
    source_id = "src_mext_jp"
    source_name = "MEXT Japanese Government Scholarship"
    origin_agency = "Ministry of Education, Culture, Sports, Science and Technology (Japan)"

    def collect(self) -> List[Dict[str, Any]]:
        return [{
            "source_record_id": "mext-japan-research-2026",
            "title": "MEXT Research Student Scholarship",
            "provider_name": "MEXT Government of Japan",
            "provider_category": "Government Endowment",
            "country_destinations": ["Japan"],
            "study_levels": ["masters", "phd"],
            "academic_fields": ["Humanities", "Social Sciences", "Natural Sciences", "Engineering", "Medicine"],
            "award_summary": "Full tuition + 144,000 JPY/mo + flights",
            "award_usd": 38000.0,
            "deadline_iso": "2026-05-20T17:00:00",
            "official_source_url": "https://www.studyinjapan.go.jp",
            "official_apply_url": "https://www.studyinjapan.go.jp/en/planning/scholarship/",
            "academic_cycle": "2026/2027",
            "eligibility_clauses": [
                {"type": "citizenship", "mandatory": True, "diplomatic_relations_only": True},
                {"type": "age", "mandatory": True, "max_age": 35}
            ],
            "required_documents": ["Field of Study & Research Plan", "Placement Preference Form", "Academic Transcripts"]
        }]


class SwedishInstituteAdapter:
    source_id = "src_si_se"
    source_name = "Swedish Institute Scholarships for Global Professionals"
    origin_agency = "Ministry for Foreign Affairs of Sweden"

    def collect(self) -> List[Dict[str, Any]]:
        return [{
            "source_record_id": "si-global-professionals-2026",
            "title": "SI Scholarship for Global Professionals (SISGP)",
            "provider_name": "Swedish Institute",
            "provider_category": "Government Endowment",
            "country_destinations": ["Sweden"],
            "study_levels": ["masters"],
            "academic_fields": ["Sustainability", "Innovation", "Technology", "Human Rights", "Public Health"],
            "award_summary": "Full tuition + 12,000 SEK/mo + travel grant",
            "award_usd": 46000.0,
            "deadline_iso": "2026-02-28T14:00:00",
            "official_source_url": "https://si.se",
            "official_apply_url": "https://si.se/en/apply/scholarships/",
            "academic_cycle": "2026/2027",
            "eligibility_clauses": [
                {"type": "work_experience", "mandatory": True, "min_work_hours": 3000},
                {"type": "citizenship", "mandatory": True, "si_eligible_list": True}
            ],
            "required_documents": ["Work and leadership proof forms", "CV", "Valid passport", "Motivation letter"]
        }]


class AustraliaAwardsAdapter:
    source_id = "src_australia_awards"
    source_name = "Australia Awards"
    origin_agency = "Department of Foreign Affairs and Trade (DFAT)"

    def collect(self) -> List[Dict[str, Any]]:
        return [{
            "source_record_id": "australia-awards-dfat-2026",
            "title": "Australia Awards Scholarships",
            "provider_name": "Australian DFAT",
            "provider_category": "Government Endowment",
            "country_destinations": ["Australia"],
            "study_levels": ["masters", "phd"],
            "academic_fields": ["Priority development sectors agreed by bilateral missions"],
            "award_summary": "Full tuition + living allowance + overseas health cover",
            "award_usd": 62000.0,
            "deadline_iso": "2026-04-30T23:59:00",
            "official_source_url": "https://www.dfat.gov.au",
            "official_apply_url": "https://www.dfat.gov.au/people-to-people/australia-awards",
            "academic_cycle": "2026/2027",
            "eligibility_clauses": [
                {"type": "citizenship", "mandatory": True, "partner_country_only": True},
                {"type": "academic_score", "mandatory": True, "min_gpa_normalized": 75.0}
            ],
            "required_documents": ["Certified ID", "Degree certificates", "Referee reports", "Development Impact Plan"]
        }]


class VanierAdapter:
    source_id = "src_vanier_ca"
    source_name = "Vanier Canada Graduate Scholarships"
    origin_agency = "Government of Canada / CIHR / NSERC / SSHRC"

    def collect(self) -> List[Dict[str, Any]]:
        return [{
            "source_record_id": "vanier-cgs-doctoral-2025",
            "title": "Vanier Canada Graduate Scholarships (Vanier CGS)",
            "provider_name": "Government of Canada",
            "provider_category": "Government Endowment",
            "country_destinations": ["Canada"],
            "study_levels": ["phd"],
            "academic_fields": ["Health", "Natural Sciences", "Engineering", "Social Sciences", "Humanities"],
            "award_summary": "$50,000 CAD/year for 3 years",
            "award_usd": 110000.0,
            "deadline_iso": "2025-11-01T20:00:00",
            "official_source_url": "https://vanier.gc.ca",
            "official_apply_url": "https://vanier.gc.ca/en/nomination_process-processus_de_mise_en_candidature.html",
            "academic_cycle": "2025/2026",
            "eligibility_clauses": [
                {"type": "degree_level", "mandatory": True, "required_degree": "phd"},
                {"type": "academic_score", "mandatory": True, "min_gpa_normalized": 85.0}
            ],
            "required_documents": ["CCV", "Research Proposal", "Leadership Statement", "Reference Letters"]
        }]


class RotaryFellowshipAdapter:
    source_id = "src_rotary_global"
    source_name = "The Rotary Foundation Peace Centers"
    origin_agency = "Rotary International Foundation"

    def collect(self) -> List[Dict[str, Any]]:
        return [{
            "source_record_id": "rotary-peace-fellowship-2026",
            "title": "Rotary Peace Fellowship",
            "provider_name": "The Rotary Foundation",
            "provider_category": "Private Foundation",
            "country_destinations": ["United Kingdom", "Japan", "Australia", "Sweden", "United States"],
            "study_levels": ["masters"],
            "academic_fields": ["Peace & Conflict Resolution", "International Development", "Public Policy"],
            "award_summary": "Fully funded: tuition, room, board & field study",
            "award_usd": 75000.0,
            "deadline_iso": "2026-05-15T23:59:00",
            "official_source_url": "https://www.rotary.org",
            "official_apply_url": "https://www.rotary.org/en/our-programs/peace-fellowships",
            "academic_cycle": "2026/2027",
            "eligibility_clauses": [
                {"type": "work_experience", "mandatory": True, "min_work_years": 3.0},
                {"type": "citizenship", "mandatory": True, "global": True}
            ],
            "required_documents": ["Resume / CV", "Essays on peace", "Two recommendations", "Transcripts"]
        }]

from backend.ingestion.adapters.csc_uk import CSCCommonwealthAdapter

ADAPTER_REGISTRY = {
    "src_csc_uk": CSCCommonwealthAdapter(),
    "src_daad_de": DAADScholarshipAdapter(),
    "src_fulbright_us": FulbrightAdapter(),
    "src_erasmus_eu": ErasmusMundusAdapter(),
    "src_chevening_uk": CheveningAdapter(),
    "src_mext_jp": MEXTAdapter(),
    "src_si_se": SwedishInstituteAdapter(),
    "src_australia_awards": AustraliaAwardsAdapter(),
    "src_vanier_ca": VanierAdapter(),
    "src_rotary_global": RotaryFellowshipAdapter(),
}
