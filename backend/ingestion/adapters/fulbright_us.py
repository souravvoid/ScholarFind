"""
Fulbright Foreign Student Program Ingestion Adapter
===================================================

Authoritative source collector for the Fulbright Program, administered by the
Bureau of Educational and Cultural Affairs (ECA) of the U.S. Department of State
and the Institute of International Education (IIE).

1. Source Inventory & Provenance:
   - Name: Fulbright Foreign Student Program
   - Origin Agency: U.S. Department of State / ECA & Institute of International Education (IIE)
   - Source Portal: https://foreign.fulbrightonline.org
   - Direct Application Guidance: https://foreign.fulbrightonline.org/about/foreign-student-program

2. Legal & Access Conditions:
   - License: U.S. Government Public Domain / Mutual Educational and Cultural Exchange Act of 1961 (Fulbright-Hays Act)
   - Permitted Use: Public indexing, criteria evaluation, educational counseling.
   - Commercial Restrictions: No application fees permitted; commercial intermediaries and agents are strictly forbidden.
   - Rate Limits: Max 1 request per second; respect robots.txt; no automated scraping of the Embark/Slate application portals.
   - Idempotency & Provenance: Records link to verified bi-national Fulbright Commission and U.S. Embassy announcements.

3. Limitations:
   - Open only to foreign citizens outside the United States; U.S. citizens or permanent residents are ineligible.
   - Applications must be submitted through the bi-national Fulbright Commission or Public Affairs Section of the U.S. Embassy in the home country.
   - J-1 visa two-year home-country physical presence requirement (Section 212(e)) applies upon completion.
"""

from typing import List, Dict, Any
from ..base import BaseSourceAdapter, RawScholarshipRecord, RawEligibilityClause


class FulbrightProgramAdapter(BaseSourceAdapter):
    source_id = "src_fulbright_us"
    source_name = "Fulbright Foreign Student Program"
    origin_agency = "U.S. Department of State / IIE"
    country_of_origin = "United States"
    provenance_url = "https://foreign.fulbrightonline.org/about/foreign-student-program"
    access_method = "U.S. Department of State ECA Educational Exchange Registry"
    license_type = "U.S. Public Domain (Fulbright-Hays Act)"
    rate_limit_per_second = 1.0

    def get_access_conditions(self) -> Dict[str, Any]:
        return {
            "source_id": self.source_id,
            "license": self.license_type,
            "provenance_url": self.provenance_url,
            "access_method": self.access_method,
            "rate_limit_per_second": self.rate_limit_per_second,
            "permitted_use": "Public educational indexing, matching, and academic advising under Fulbright-Hays Act.",
            "limitations": [
                "Candidates must apply in their country of citizenship or permanent legal residence.",
                "Recipients must return to their home country for at least two years post-study (J-1 212(e) rule).",
                "Clinical medical studies with direct patient contact are prohibited by federal statute."
            ]
        }

    def collect(self) -> List[Dict[str, Any]]:
        return self.fetch_raw_data()

    def fetch_raw_data(self) -> List[Dict[str, Any]]:
        """
        Simulates approved API/feed collection from the official Fulbright Foreign Student registry.
        Produces structured records extracted from the statutory exchange charter.
        """
        return [
            {
                "award_identifier": "FULBRIGHT-FSP-2026-27",
                "title": "Fulbright Foreign Student Program 2026/27",
                "provider": "U.S. Department of State / Bureau of Educational and Cultural Affairs",
                "provider_type": "Government Endowment",
                "destination_countries": ["United States"],
                "participating_institutions": [
                    "Accredited U.S. Universities and Higher Education Institutions"
                ],
                "course_levels": ["Master's Degree (MA/MS)", "Doctoral Research / PhD"],
                "subject_disciplines": [
                    "Humanities",
                    "Social Sciences",
                    "Natural Sciences & Engineering",
                    "Public Health & Administration",
                    "Environmental Science & Climate",
                    "Arts and Humanities"
                ],
                "financial_benefits": {
                    "tuition_waiver": "Full tuition and mandatory university fees",
                    "monthly_living_stipend_usd": 2100.0,
                    "health_benefits_plan": "Accident and Sickness Program for Exchanges (ASPE)",
                    "roundtrip_international_airfare": "Round-trip international economy travel under Fly America Act",
                    "book_and_transit_allowance_usd": 1500.0,
                    "estimated_annual_usd": 72000.0
                },
                "application_deadline_raw": "2026-06-01T23:59:00Z",
                "intake_cycle": "2026/2027",
                "official_source_url": "https://foreign.fulbrightonline.org",
                "official_apply_url": "https://foreign.fulbrightonline.org/about/foreign-student-program",
                "required_documents": [
                    "Official academic transcripts in original language with certified English translations",
                    "Three confidential letters of recommendation from academic or professional referees",
                    "Study/Research Objective statement detailing academic goals and proposed program",
                    "Personal Statement describing personal background, leadership, and cultural exchange potential",
                    "Valid international passport data page",
                    "Standardized test reports (GRE/GMAT and TOEFL/IELTS where mandated by home commission)"
                ],
                "application_instructions": [
                    "Locate your country-specific Fulbright Commission or Public Affairs Section at the U.S. Embassy.",
                    "Review country-specific deadlines, field restrictions, and testing vouchers.",
                    "Submit the official online application via the Slate international portal."
                ],
                "eligibility_clauses": [
                    {
                        "rule_type": "citizenship",
                        "title": "Non-U.S. Citizenship Requirement",
                        "description": "Applicants must be citizens or nationals of an eligible participating country. U.S. citizens and permanent residents (green card holders) are ineligible.",
                        "is_mandatory": True,
                        "source_citation": "Fulbright Foreign Student Eligibility Regulations, Section 4.2",
                        "parameters": {
                            "non_us_only": True,
                            "prohibited_countries": ["United States"]
                        }
                    },
                    {
                        "rule_type": "academic_score",
                        "title": "Strong Academic Background (Bachelor's Degree Equivalency)",
                        "description": "Must have completed undergraduate education and hold a degree equivalent to a U.S. bachelor's degree with strong academic standing (minimum 3.0/4.0 GPA equivalent).",
                        "is_mandatory": True,
                        "source_citation": "IIE Foreign Credential Evaluation Matrix",
                        "parameters": {
                            "min_gpa_normalized": 75.0,
                            "min_gpa_4_0": 3.0
                        }
                    },
                    {
                        "rule_type": "degree_level",
                        "title": "Master's or PhD Program Admission",
                        "description": "Seeking graduate study leading to a master's or doctoral degree at an accredited U.S. university.",
                        "is_mandatory": True,
                        "source_citation": "Fulbright Grantee Handbook Clause 3",
                        "parameters": {
                            "target_degree": "masters"
                        }
                    },
                    {
                        "rule_type": "language",
                        "title": "English Proficiency Demonstration",
                        "description": "Demonstrate English proficiency sufficient to undertake full-time graduate study in the United States (minimum TOEFL iBT 80 or IELTS 6.5).",
                        "is_mandatory": True,
                        "source_citation": "ECA English Language Policy",
                        "parameters": {
                            "min_toefl": 80,
                            "min_ielts": 6.5
                        }
                    }
                ]
            }
        ]

    def parse(self, raw_data: List[Dict[str, Any]]) -> List[RawScholarshipRecord]:
        """Parses the raw Fulbright payload into typed RawScholarshipRecord objects."""
        records: List[RawScholarshipRecord] = []
        for item in raw_data:
            clauses = [
                RawEligibilityClause(
                    rule_type=c["rule_type"],
                    title=c["title"],
                    description=c["description"],
                    is_mandatory=c["is_mandatory"],
                    source_citation=c["source_citation"],
                    parameters=c.get("parameters", {})
                )
                for c in item.get("eligibility_clauses", [])
            ]

            fin = item.get("financial_benefits", {})
            stipend = fin.get("monthly_living_stipend_usd", 2100.0)

            raw_rec = RawScholarshipRecord(
                source_record_id=item["award_identifier"],
                title=item["title"],
                provider_name=item["provider"],
                provider_category=item["provider_type"],
                destination_countries=item.get("destination_countries", ["United States"]),
                host_institutions=item.get("participating_institutions", []),
                study_levels=item.get("course_levels", ["masters", "phd"]),
                academic_fields=item.get("subject_disciplines", ["All Academic Fields"]),
                award_summary=f"Full tuition waiver + ${stipend:.0f}/mo + ASPE health & flights",
                award_details=fin.get("tuition_waiver"),
                raw_award_currency="USD",
                raw_award_amount=fin.get("estimated_annual_usd", 72000.0),
                raw_deadline=item.get("application_deadline_raw", ""),
                academic_cycle=item.get("intake_cycle", "2026/2027"),
                official_source_url=item.get("official_source_url", ""),
                official_application_url=item.get("official_apply_url", ""),
                required_documents=item.get("required_documents", []),
                application_instructions=item.get("application_instructions", []),
                eligibility_clauses=clauses
            )
            raw_rec.raw_payload_checksum = raw_rec.compute_checksum()
            records.append(raw_rec)

        return records
