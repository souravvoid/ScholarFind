"""
Unit Tests for ScholarFind Deterministic Eligibility Engine
===========================================================
Tests all 4 clear deterministic outcomes:
1. Likely eligible
2. More information needed
3. Does not meet criterion
4. Needs manual review

Also verifies:
- Grading scale conversions (4.0, 5.0, UK Honours, German scale)
- Whitelist/prohibited citizenship rules
- Medium of Instruction waivers
- Explainable criterion breakdowns
"""

import unittest
from backend.eligibility import (
    DeterministicEligibilityEngine,
    EligibilityRuleRecord,
    StudentProfileRecord,
    CriterionStatus,
    OverallOutcome,
    standardize_gpa
)


class TestGpaStandardization(unittest.TestCase):
    def test_4_0_scale(self):
        self.assertAlmostEqual(standardize_gpa(4.0, "gpa_4_0", 4.0), 100.0)
        self.assertAlmostEqual(standardize_gpa(3.82, "gpa_4_0", 4.0), 95.5)
        self.assertAlmostEqual(standardize_gpa(3.0, "gpa_4_0", 4.0), 75.0)

    def test_5_0_scale(self):
        self.assertAlmostEqual(standardize_gpa(5.0, "gpa_5_0", 5.0), 100.0)
        self.assertAlmostEqual(standardize_gpa(4.5, "gpa_5_0", 5.0), 90.0)
        self.assertAlmostEqual(standardize_gpa(3.75, "gpa_5_0", 5.0), 75.0)

    def test_percentage_scale(self):
        self.assertAlmostEqual(standardize_gpa(88.5, "percentage"), 88.5)

    def test_uk_honours(self):
        # 1st class (gpa <= 1) -> 85%
        self.assertAlmostEqual(standardize_gpa(1.0, "uk_honours"), 85.0)
        # Upper second (2:1) -> 75%
        self.assertAlmostEqual(standardize_gpa(2.1, "uk_honours"), 75.0)
        # Lower second (2:2) -> 60%
        self.assertAlmostEqual(standardize_gpa(2.2, "uk_honours"), 60.0)

    def test_german_scale(self):
        # 1.0 is best (100%), 2.5 is 62.5%, 4.0 is 25.0%
        self.assertAlmostEqual(standardize_gpa(1.0, "german"), 100.0)
        self.assertAlmostEqual(standardize_gpa(2.5, "german"), 62.5)
        self.assertAlmostEqual(standardize_gpa(4.0, "german"), 25.0)


class TestDeterministicEligibilityScenarios(unittest.TestCase):
    def setUp(self):
        self.engine = DeterministicEligibilityEngine()

        # Standard Commonwealth Master's Scholarship Ruleset
        self.commonwealth_rules = [
            EligibilityRuleRecord(
                rule_id="cws-rule-1",
                rule_type="citizenship",
                title="Eligible Commonwealth Country",
                description="Must hold citizenship of an eligible Commonwealth developing country.",
                is_mandatory=True,
                source_citation="CSC Charter 2026/27, Sec 1.1",
                parameters={
                    "allowed_countries": ["Nigeria", "Ghana", "Kenya", "India", "Pakistan", "Uganda"],
                    "prohibited_countries": ["United Kingdom", "United States", "Australia"]
                }
            ),
            EligibilityRuleRecord(
                rule_id="cws-rule-2",
                rule_type="degree_level",
                title="Master's Degree Objective",
                description="Applying for a full-time taught master's degree program.",
                is_mandatory=True,
                source_citation="CSC Funding Guide",
                parameters={"allowed_degrees": ["masters"]}
            ),
            EligibilityRuleRecord(
                rule_id="cws-rule-3",
                rule_type="academic_score",
                title="Minimum 2:1 Upper Second Class Honours",
                description="First degree of at least 2:1 honours or 75% equivalent.",
                is_mandatory=True,
                source_citation="UK ENIC Framework",
                parameters={"min_gpa_normalized": 75.0, "uk_equivalent": "2:1"}
            ),
            EligibilityRuleRecord(
                rule_id="cws-rule-4",
                rule_type="language",
                title="English Language Proficiency",
                description="Demonstrated proficiency via test score or approved institutional waiver.",
                is_mandatory=False,
                source_citation="UK Home Office Guidelines",
                parameters={"min_ielts": 6.5, "accepts_medium_of_instruction_waiver": True}
            )
        ]

    def test_scenario_likely_eligible(self):
        """Student fulfills all mandatory rules: Nigerian citizen, 3.82/4.0 GPA, targeting Master's."""
        profile = StudentProfileRecord(
            uid="std_01",
            citizenship="Nigeria",
            target_degree="masters",
            grading_scale="gpa_4_0",
            gpa=3.82,
            max_gpa=4.0,
            has_english_medium_instruction=True
        )

        evaluation = self.engine.evaluate("cws-masters", self.commonwealth_rules, profile)

        self.assertEqual(evaluation.outcome, OverallOutcome.LIKELY_ELIGIBLE)
        self.assertEqual(evaluation.mandatory_failed_count, 0)
        self.assertEqual(evaluation.missing_info_count, 0)
        self.assertGreaterEqual(evaluation.match_percentage, 90)
        self.assertTrue("satisfied by your academic profile" in evaluation.summary)

        # Detailed criterion verification
        for crit in evaluation.criteria_results:
            self.assertEqual(crit.status, CriterionStatus.MEETS)
            self.assertTrue(len(crit.explanation) > 0)
            self.assertTrue(len(crit.source_citation) > 0)

    def test_scenario_does_not_meet_criterion_citizenship(self):
        """Student holds ineligible citizenship (e.g. United States or United Kingdom)."""
        profile = StudentProfileRecord(
            uid="std_02",
            citizenship="United States",
            target_degree="masters",
            grading_scale="gpa_4_0",
            gpa=3.9,
            max_gpa=4.0
        )

        evaluation = self.engine.evaluate("cws-masters", self.commonwealth_rules, profile)

        self.assertEqual(evaluation.outcome, OverallOutcome.DOES_NOT_MEET)
        self.assertGreaterEqual(evaluation.mandatory_failed_count, 1)

        citizenship_res = next(r for r in evaluation.criteria_results if r.rule_id == "cws-rule-1")
        self.assertEqual(citizenship_res.status, CriterionStatus.FAILS)
        self.assertIn("explicitly ineligible", citizenship_res.explanation)

    def test_scenario_does_not_meet_criterion_gpa(self):
        """Student GPA falls below required 2:1 (75%) threshold (e.g. 2.4/4.0 -> 60%)."""
        profile = StudentProfileRecord(
            uid="std_03",
            citizenship="Ghana",
            target_degree="masters",
            grading_scale="gpa_4_0",
            gpa=2.4,
            max_gpa=4.0
        )

        evaluation = self.engine.evaluate("cws-masters", self.commonwealth_rules, profile)

        self.assertEqual(evaluation.outcome, OverallOutcome.DOES_NOT_MEET)
        gpa_res = next(r for r in evaluation.criteria_results if r.rule_id == "cws-rule-3")
        self.assertEqual(gpa_res.status, CriterionStatus.FAILS)
        self.assertIn("falls below", gpa_res.explanation)

    def test_scenario_more_info_needed_missing_gpa(self):
        """Profile has no GPA recorded, so academic threshold cannot be verified."""
        profile = StudentProfileRecord(
            uid="std_04",
            citizenship="Kenya",
            target_degree="masters",
            gpa=None  # Not entered yet
        )

        evaluation = self.engine.evaluate("cws-masters", self.commonwealth_rules, profile)

        self.assertEqual(evaluation.outcome, OverallOutcome.MORE_INFO_NEEDED)
        gpa_res = next(r for r in evaluation.criteria_results if r.rule_id == "cws-rule-3")
        self.assertEqual(gpa_res.status, CriterionStatus.MORE_INFO_NEEDED)
        self.assertIn("No GPA or degree classification on file", gpa_res.explanation)

    def test_scenario_needs_manual_review(self):
        """Ruleset includes subjective or qualitative institutional review criteria."""
        rules_with_discretionary = list(self.commonwealth_rules) + [
            EligibilityRuleRecord(
                rule_id="cws-rule-5",
                rule_type="manual_review",
                title="National Nominating Agency Quota Endorsement",
                description="Must be officially nominated by home country national nominating agency.",
                is_mandatory=True,
                source_citation="CSC Nominating Protocol",
                requires_human_appraisal=True
            )
        ]

        profile = StudentProfileRecord(
            uid="std_05",
            citizenship="Uganda",
            target_degree="masters",
            gpa=3.85,
            has_english_medium_instruction=True
        )

        evaluation = self.engine.evaluate("cws-masters", rules_with_discretionary, profile)

        self.assertEqual(evaluation.outcome, OverallOutcome.NEEDS_MANUAL_REVIEW)
        self.assertEqual(evaluation.manual_review_count, 1)
        review_res = next(r for r in evaluation.criteria_results if r.rule_id == "cws-rule-5")
        self.assertEqual(review_res.status, CriterionStatus.NEEDS_MANUAL_REVIEW)
        self.assertIn("Subjective / Discretionary criterion", review_res.explanation)

    def test_work_experience_evaluation(self):
        """Verify work experience rule (e.g. for Chevening or Swedish Institute)."""
        work_rule = EligibilityRuleRecord(
            rule_id="work-rule-1",
            rule_type="work_experience",
            title="Two Years Professional Experience",
            description="Minimum 2 years (2,800 hours) professional experience required.",
            is_mandatory=True,
            parameters={"min_work_years": 2.0}
        )

        # Profile with insufficient experience
        profile_junior = StudentProfileRecord(uid="p1", work_experience_years=1.0)
        res_fail = self.engine.evaluate_criterion(work_rule, profile_junior)
        self.assertEqual(res_fail.status, CriterionStatus.FAILS)

        # Profile with qualifying experience
        profile_senior = StudentProfileRecord(uid="p2", work_experience_years=3.5)
        res_pass = self.engine.evaluate_criterion(work_rule, profile_senior)
        self.assertEqual(res_pass.status, CriterionStatus.MEETS)


if __name__ == "__main__":
    unittest.main()
