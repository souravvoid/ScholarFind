"""Unit tests for the migrated Django eligibility engine.

Covers the deterministic outcomes, every supported grading scale, and parity
with the original FastAPI engine (``backend.eligibility``).
"""

import json
import math
import unittest
from pathlib import Path

from backend.eligibility import (
    DeterministicEligibilityEngine as LegacyEngine,
    EligibilityRuleRecord as LegacyRule,
    StudentProfileRecord as LegacyProfile,
)
from backend.eligibility_service import (
    CriterionStatus,
    DeterministicEligibilityEngine,
    EligibilityRuleRecord,
    OverallOutcome,
    StudentProfileRecord,
    standardize_gpa,
)


def _ruleset():
    return [
        EligibilityRuleRecord(
            rule_id="cws-rule-1",
            rule_type="citizenship",
            title="Eligible Commonwealth Country",
            description="Must hold citizenship of an eligible Commonwealth developing country.",
            is_mandatory=True,
            source_citation="CSC Charter 2026/27, Sec 1.1",
            parameters={
                "allowed_countries": [
                    "Nigeria",
                    "Ghana",
                    "Kenya",
                    "India",
                    "Pakistan",
                    "Uganda",
                ],
                "prohibited_countries": ["United Kingdom", "United States", "Australia"],
            },
        ),
        EligibilityRuleRecord(
            rule_id="cws-rule-2",
            rule_type="degree_level",
            title="Master's Degree Objective",
            description="Applying for a full-time taught master's degree program.",
            is_mandatory=True,
            source_citation="CSC Funding Guide",
            parameters={"allowed_degrees": ["masters"]},
        ),
        EligibilityRuleRecord(
            rule_id="cws-rule-3",
            rule_type="academic_score",
            title="Minimum 2:1 Upper Second Class Honours",
            description="First degree of at least 2:1 honours or 75% equivalent.",
            is_mandatory=True,
            source_citation="UK ENIC Framework",
            parameters={"min_gpa_normalized": 75.0, "uk_equivalent": "2:1"},
        ),
        EligibilityRuleRecord(
            rule_id="cws-rule-4",
            rule_type="language",
            title="English Language Proficiency",
            description="Demonstrated proficiency via test score or approved waiver.",
            is_mandatory=False,
            source_citation="UK Home Office Guidelines",
            parameters={
                "min_ielts": 6.5,
                "accepts_medium_of_instruction_waiver": True,
            },
        ),
    ]


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
        self.assertAlmostEqual(standardize_gpa(1.0, "uk_honours"), 85.0)
        self.assertAlmostEqual(standardize_gpa(2.1, "uk_honours"), 75.0)
        self.assertAlmostEqual(standardize_gpa(2.2, "uk_honours"), 60.0)

    def test_german_scale(self):
        self.assertAlmostEqual(standardize_gpa(1.0, "german"), 100.0)
        self.assertAlmostEqual(standardize_gpa(2.5, "german"), 62.5)
        self.assertAlmostEqual(standardize_gpa(4.0, "german"), 25.0)

    def test_ects_scale(self):
        # ECTS grades are already expressed on a 0-100 percentage scale.
        self.assertAlmostEqual(standardize_gpa(85.0, "ects"), 85.0)

    def test_none_returns_none(self):
        self.assertIsNone(standardize_gpa(None, "gpa_4_0"))


class TestDeterministicEligibilityScenarios(unittest.TestCase):
    def setUp(self):
        self.engine = DeterministicEligibilityEngine()
        self.rules = _ruleset()

    def test_scenario_likely_eligible(self):
        profile = StudentProfileRecord(
            uid="std_01",
            citizenship="Nigeria",
            target_degree="masters",
            grading_scale="gpa_4_0",
            gpa=3.82,
            max_gpa=4.0,
            has_english_medium_instruction=True,
        )
        evaluation = self.engine.evaluate("cws-masters", self.rules, profile)

        self.assertEqual(evaluation.outcome, OverallOutcome.LIKELY_ELIGIBLE)
        self.assertEqual(evaluation.mandatory_failed_count, 0)
        self.assertEqual(evaluation.missing_info_count, 0)
        self.assertGreaterEqual(evaluation.match_percentage, 90)
        self.assertIn("satisfied by your academic profile", evaluation.summary)
        for criterion in evaluation.criteria_results:
            self.assertEqual(criterion.status, CriterionStatus.MEETS)
            self.assertTrue(criterion.explanation)
            self.assertTrue(criterion.source_citation)

    def test_scenario_does_not_meet_citizenship(self):
        profile = StudentProfileRecord(
            uid="std_02",
            citizenship="United States",
            target_degree="masters",
            grading_scale="gpa_4_0",
            gpa=3.9,
            max_gpa=4.0,
        )
        evaluation = self.engine.evaluate("cws-masters", self.rules, profile)

        self.assertEqual(evaluation.outcome, OverallOutcome.DOES_NOT_MEET)
        self.assertGreaterEqual(evaluation.mandatory_failed_count, 1)
        citizenship = next(
            result for result in evaluation.criteria_results if result.rule_id == "cws-rule-1"
        )
        self.assertEqual(citizenship.status, CriterionStatus.FAILS)
        self.assertIn("explicitly ineligible", citizenship.explanation)

    def test_scenario_does_not_meet_gpa(self):
        profile = StudentProfileRecord(
            uid="std_03",
            citizenship="Ghana",
            target_degree="masters",
            grading_scale="gpa_4_0",
            gpa=2.4,
            max_gpa=4.0,
        )
        evaluation = self.engine.evaluate("cws-masters", self.rules, profile)

        self.assertEqual(evaluation.outcome, OverallOutcome.DOES_NOT_MEET)
        gpa_result = next(
            result for result in evaluation.criteria_results if result.rule_id == "cws-rule-3"
        )
        self.assertEqual(gpa_result.status, CriterionStatus.FAILS)
        self.assertIn("falls below", gpa_result.explanation)

    def test_scenario_more_info_needed_missing_gpa(self):
        profile = StudentProfileRecord(
            uid="std_04", citizenship="Kenya", target_degree="masters", gpa=None
        )
        evaluation = self.engine.evaluate("cws-masters", self.rules, profile)

        self.assertEqual(evaluation.outcome, OverallOutcome.MORE_INFO_NEEDED)
        gpa_result = next(
            result for result in evaluation.criteria_results if result.rule_id == "cws-rule-3"
        )
        self.assertEqual(gpa_result.status, CriterionStatus.MORE_INFO_NEEDED)
        self.assertIn("No GPA or degree classification on file", gpa_result.explanation)

    def test_scenario_needs_manual_review(self):
        rules = list(self.rules) + [
            EligibilityRuleRecord(
                rule_id="cws-rule-5",
                rule_type="manual_review",
                title="National Nominating Agency Endorsement",
                description="Must be officially nominated by the home country agency.",
                is_mandatory=True,
                source_citation="CSC Nominating Protocol",
                requires_human_appraisal=True,
            )
        ]
        profile = StudentProfileRecord(
            uid="std_05",
            citizenship="Uganda",
            target_degree="masters",
            gpa=3.85,
            has_english_medium_instruction=True,
        )
        evaluation = self.engine.evaluate("cws-masters", rules, profile)

        self.assertEqual(evaluation.outcome, OverallOutcome.NEEDS_MANUAL_REVIEW)
        self.assertEqual(evaluation.manual_review_count, 1)
        review = next(
            result for result in evaluation.criteria_results if result.rule_id == "cws-rule-5"
        )
        self.assertEqual(review.status, CriterionStatus.NEEDS_MANUAL_REVIEW)
        self.assertIn("Subjective / Discretionary criterion", review.explanation)

    def test_work_experience(self):
        rule = EligibilityRuleRecord(
            rule_id="work-rule-1",
            rule_type="work_experience",
            title="Two Years Professional Experience",
            description="Minimum 2 years professional experience required.",
            is_mandatory=True,
            parameters={"min_work_years": 2.0},
        )
        junior = StudentProfileRecord(uid="p1", work_experience_years=1.0)
        senior = StudentProfileRecord(uid="p2", work_experience_years=3.5)

        self.assertEqual(
            self.engine.evaluate_criterion(rule, junior).status, CriterionStatus.FAILS
        )
        self.assertEqual(
            self.engine.evaluate_criterion(rule, senior).status, CriterionStatus.MEETS
        )

    def test_language_test_scores_and_waiver(self):
        rule = EligibilityRuleRecord(
            rule_id="lang-1",
            rule_type="language",
            title="IELTS 6.5",
            description="Minimum IELTS overall band 6.5.",
            is_mandatory=True,
            parameters={
                "min_ielts": 6.5,
                "accepts_medium_of_instruction_waiver": True,
            },
        )
        ielts_pass = StudentProfileRecord(
            uid="lang-1", english_test_type="ielts", english_score=7.0
        )
        ielts_fail = StudentProfileRecord(
            uid="lang-2", english_test_type="ielts", english_score=5.5
        )
        waiver = StudentProfileRecord(
            uid="lang-3", has_english_medium_instruction=True
        )
        missing = StudentProfileRecord(uid="lang-4")

        self.assertEqual(
            self.engine.evaluate_criterion(rule, ielts_pass).status,
            CriterionStatus.MEETS,
        )
        self.assertEqual(
            self.engine.evaluate_criterion(rule, ielts_fail).status,
            CriterionStatus.FAILS,
        )
        self.assertEqual(
            self.engine.evaluate_criterion(rule, waiver).status, CriterionStatus.MEETS
        )
        self.assertEqual(
            self.engine.evaluate_criterion(rule, missing).status,
            CriterionStatus.MORE_INFO_NEEDED,
        )

    def test_degree_level_mismatch(self):
        rule = EligibilityRuleRecord(
            rule_id="degree-1",
            rule_type="degree_level",
            title="PhD only",
            description="Doctoral study only.",
            is_mandatory=True,
            parameters={"allowed_degrees": ["phd"]},
        )
        profile = StudentProfileRecord(uid="deg-1", target_degree="masters")
        self.assertEqual(
            self.engine.evaluate_criterion(rule, profile).status, CriterionStatus.FAILS
        )

    def test_field_of_study_mismatch(self):
        rule = EligibilityRuleRecord(
            rule_id="field-1",
            rule_type="field_of_study",
            title="STEM only",
            description="STEM fields only.",
            is_mandatory=True,
            parameters={"allowed_fields": ["Computer Science", "Engineering"]},
        )
        profile = StudentProfileRecord(uid="field-1", primary_field="History")
        self.assertEqual(
            self.engine.evaluate_criterion(rule, profile).status, CriterionStatus.FAILS
        )


class TestEngineParity(unittest.TestCase):
    """The Django engine must return the same outcomes as the original."""

    def test_outcomes_match_legacy_engine(self):
        scenario_profiles = [
            {
                "uid": "parity-1",
                "citizenship": "Nigeria",
                "target_degree": "masters",
                "grading_scale": "gpa_4_0",
                "gpa": 3.82,
                "max_gpa": 4.0,
                "has_english_medium_instruction": True,
            },
            {
                "uid": "parity-2",
                "citizenship": "United States",
                "target_degree": "masters",
                "grading_scale": "gpa_4_0",
                "gpa": 3.9,
                "max_gpa": 4.0,
            },
            {
                "uid": "parity-3",
                "citizenship": "Ghana",
                "target_degree": "masters",
                "grading_scale": "gpa_4_0",
                "gpa": 2.4,
                "max_gpa": 4.0,
            },
            {
                "uid": "parity-4",
                "citizenship": "Kenya",
                "target_degree": "masters",
                "gpa": None,
            },
        ]

        new_rules = _ruleset()
        legacy_rules = [
            LegacyRule(
                rule_id=rule.rule_id,
                rule_type=rule.rule_type,
                title=rule.title,
                description=rule.description,
                is_mandatory=rule.is_mandatory,
                source_citation=rule.source_citation,
                parameters=rule.parameters,
                requires_human_appraisal=rule.requires_human_appraisal,
            )
            for rule in new_rules
        ]

        new_engine = DeterministicEligibilityEngine()
        legacy_engine = LegacyEngine()

        for data in scenario_profiles:
            new_profile = StudentProfileRecord(**data)
            legacy_profile = LegacyProfile(**data)
            new_result = new_engine.evaluate("parity", new_rules, new_profile)
            legacy_result = legacy_engine.evaluate("parity", legacy_rules, legacy_profile)

            self.assertEqual(new_result.outcome.value, legacy_result.outcome.value)
            self.assertEqual(
                new_result.mandatory_failed_count, legacy_result.mandatory_failed_count
            )
            self.assertEqual(
                new_result.missing_info_count, legacy_result.missing_info_count
            )
            # Canonical rounding is half-up; the legacy engine used banker's
            # rounding, so scores can differ by one point at exact .5 boundaries.
            weighted_score = sum(
                1.0
                if result.status.value == "meets"
                else 0.5
                if result.status.value == "needs_manual_review"
                else 0.25
                if result.status.value == "more_info_needed"
                else 0.0
                for result in legacy_result.criteria_results
            )
            total_rules = len(legacy_result.criteria_results) or 1
            expected_match = int(
                math.floor((weighted_score / total_rules) * 100 + 0.5)
            )
            self.assertEqual(new_result.match_percentage, expected_match)


class TestSharedParityFixture(unittest.TestCase):
    """Cross-language parity driven by tests/fixtures/eligibility-parity.json."""

    @classmethod
    def setUpClass(cls):
        fixture_path = (
            Path(__file__).resolve().parents[2]
            / "tests"
            / "fixtures"
            / "eligibility-parity.json"
        )
        with fixture_path.open(encoding="utf-8") as handle:
            cls.fixture = json.load(handle)
        cls.engine = DeterministicEligibilityEngine()
        cls.outcome_map = {
            OverallOutcome.LIKELY_ELIGIBLE: "likely_eligible",
            OverallOutcome.MORE_INFO_NEEDED: "more_info_needed",
            OverallOutcome.DOES_NOT_MEET: "does_not_meet",
            OverallOutcome.NEEDS_MANUAL_REVIEW: "needs_review",
        }

    @staticmethod
    def _build_rule(raw):
        return EligibilityRuleRecord(
            rule_id=raw["rule_id"],
            rule_type=raw["rule_type"],
            title=raw["title"],
            description=raw["description"],
            is_mandatory=raw["is_mandatory"],
            source_citation=raw.get("source_citation", ""),
            parameters=raw.get("parameters", {}),
        )

    def test_gpa_cases_match_fixture(self):
        for case in self.fixture["gpa_cases"]:
            with self.subTest(case=case["name"]):
                actual = standardize_gpa(case["gpa"], case["scale"], case["max_gpa"])
                self.assertIsNotNone(actual)
                self.assertAlmostEqual(actual, case["expected"], places=6)

    def test_scenarios_match_fixture(self):
        for scenario in self.fixture["scenarios"]:
            with self.subTest(scenario=scenario["name"]):
                profile_data = dict(self.fixture["base_profile"])
                profile_data.update(scenario["profile"])
                profile = StudentProfileRecord(uid=scenario["name"], **profile_data)

                rules = [self._build_rule(raw) for raw in self.fixture["base_rules"]]
                rules.extend(self._build_rule(raw) for raw in scenario["add_rules"])

                evaluation = self.engine.evaluate(scenario["name"], rules, profile)
                expected = scenario["expected"]

                self.assertEqual(
                    self.outcome_map[evaluation.outcome], expected["outcome"]
                )
                self.assertEqual(
                    evaluation.match_percentage, expected["match_percentage"]
                )
                self.assertEqual(
                    evaluation.met_criteria_count, expected["met_criteria_count"]
                )
                self.assertEqual(
                    evaluation.mandatory_failed_count,
                    expected["mandatory_failed_count"],
                )
                self.assertEqual(
                    evaluation.missing_info_count, expected["missing_info_count"]
                )
                self.assertEqual(
                    evaluation.manual_review_count, expected["manual_review_count"]
                )
                self.assertEqual(
                    [result.status.value for result in evaluation.criteria_results],
                    scenario["criteria_statuses"],
                )


if __name__ == "__main__":
    unittest.main()
