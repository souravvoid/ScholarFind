"""
ScholarFind Django Eligibility Evaluation Engine
=================================================
Migrated from backend/eligibility.py - preserves deterministic, transparent,
and explainable rule matching comparing a student's profile against scholarship
eligibility rubrics.

Guarantees 4 clear deterministic outcomes:
1. "Likely eligible"
2. "More information needed"
3. "Does not meet criterion"
4. "Needs manual review"

Supports:
- Institutional grading scale normalization (4.0, 5.0, UK Honours, Percentage, German, ECTS)
- Citizenship whitelisting, prohibited regions, and developing country / DAC lists
- Target degree level alignment
- Academic field matching
- English language proficiency (IELTS, TOEFL, Duolingo, Medium of Instruction waivers)
- Work experience thresholds
- Discretionary / qualitative criteria flagging for human reviewer appraisal
"""

import enum
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional, Set
import re


class GradingScale(str, enum.Enum):
    GPA_4_0 = "gpa_4_0"
    GPA_5_0 = "gpa_5_0"
    UK_HONOURS = "uk_honours"
    PERCENTAGE = "percentage"
    ECTS = "ects"
    GERMAN = "german"


class RuleType(str, enum.Enum):
    CITIZENSHIP = "citizenship"
    DEGREE_LEVEL = "degree_level"
    ACADEMIC_SCORE = "academic_score"
    FIELD_OF_STUDY = "field_of_study"
    LANGUAGE = "language"
    WORK_EXPERIENCE = "work_experience"
    MANUAL_REVIEW = "manual_review"
    DEADLINE = "deadline"


class CriterionStatus(str, enum.Enum):
    MEETS = "meets"
    FAILS = "fails"
    MORE_INFO_NEEDED = "more_info_needed"
    NEEDS_MANUAL_REVIEW = "needs_manual_review"


class OverallOutcome(str, enum.Enum):
    LIKELY_ELIGIBLE = "Likely eligible"
    MORE_INFO_NEEDED = "More information needed"
    DOES_NOT_MEET = "Does not meet criterion"
    NEEDS_MANUAL_REVIEW = "Needs manual review"


@dataclass
class EligibilityRuleRecord:
    rule_id: str
    rule_type: str  # RuleType value
    title: str
    description: str
    is_mandatory: bool = True
    source_citation: str = ""
    parameters: Dict[str, Any] = field(default_factory=dict)
    requires_human_appraisal: bool = False


@dataclass
class StudentProfileRecord:
    uid: str
    email: str = ""
    citizenship: str = ""
    residence_country: str = ""
    education_level: str = "bachelors"  # e.g., 'bachelors', 'masters', 'phd'
    target_degree: str = "masters"
    institution_name: str = ""
    grading_scale: str = "gpa_4_0"
    gpa: Optional[float] = None
    max_gpa: float = 4.0
    graduation_year: str = ""
    primary_field: str = ""
    work_experience_years: float = 0.0
    english_test_type: str = "none"  # 'ielts', 'toefl', 'duolingo', 'none'
    english_score: Optional[float] = None
    has_english_medium_instruction: bool = False
    has_supervisor_contact: Optional[bool] = None
    custom_attributes: Dict[str, Any] = field(default_factory=dict)


@dataclass
class EvaluatedCriterionResult:
    rule_id: str
    rule_type: str
    title: str
    status: CriterionStatus
    is_mandatory: bool
    explanation: str
    source_citation: str
    student_value: Any = None
    required_value: Any = None


@dataclass
class EligibilityEvaluation:
    scholarship_id: str
    outcome: OverallOutcome
    match_percentage: int
    criteria_results: List[EvaluatedCriterionResult]
    summary: str
    mandatory_failed_count: int
    missing_info_count: int
    manual_review_count: int
    met_criteria_count: int
    total_criteria_count: int


# --- Deterministic Normalization Helpers ---


def standardize_gpa(
    gpa: Optional[float],
    scale: str = "gpa_4_0",
    max_gpa: float = 4.0
) -> Optional[float]:
    """
    Normalizes any institutional grading scale to a unified 0.0 - 100.0 index.
    Returns None if gpa is None.
    """
    if gpa is None:
        return None

    scale_str = str(scale).lower()

    if "5" in scale_str:
        return min(100.0, max(0.0, (gpa / (max_gpa or 5.0)) * 100.0))
    elif "uk" in scale_str:
        # UK Honours classification representation
        # gpa could be 1 (1st), 2.1, 2.2, 3 or raw percentage
        if gpa <= 1.0 or gpa == 1:
            return 85.0
        elif 2.0 <= gpa <= 2.15:
            return 75.0
        elif 2.15 < gpa <= 2.25:
            return 60.0
        elif gpa >= 40.0:
            return min(100.0, gpa)
        return 75.0
    elif "german" in scale_str:
        # German scale: 1.0 (Very Good / 100%), 4.0 (Pass / 50%), 5.0 (Fail / 0%)
        # Modified Bavarian Formula: ((Nmax - Nd) / (Nmax - Nmin)) * 100
        clamped = min(5.0, max(1.0, gpa))
        return round(((5.0 - clamped) / (5.0 - 1.0)) * 100.0, 1)
    elif "ects" in scale_str:
        # ECTS mapping
        return min(100.0, max(0.0, gpa))
    elif "percent" in scale_str:
        return min(100.0, max(0.0, gpa))
    else:
        # Standard 4.0 scale default
        effective_max = max_gpa if (max_gpa and max_gpa > 0) else 4.0
        return min(100.0, max(0.0, (gpa / effective_max) * 100.0))


# --- Criterion Evaluator Functions ---


def evaluate_citizenship(
    rule: EligibilityRuleRecord,
    profile: StudentProfileRecord
) -> EvaluatedCriterionResult:
    """Evaluates student nationality / passport against permitted or prohibited regions."""
    params = rule.parameters
    allowed: List[str] = params.get("allowed_countries", [])
    prohibited: List[str] = params.get("prohibited_countries", [])
    student_c = (profile.citizenship or "").strip().lower()

    if not student_c:
        return EvaluatedCriterionResult(
            rule_id=rule.rule_id,
            rule_type=rule.rule_type,
            title=rule.title,
            status=CriterionStatus.MORE_INFO_NEEDED,
            is_mandatory=rule.is_mandatory,
            explanation="Citizenship not provided in student profile. Please specify your passport country.",
            source_citation=rule.source_citation,
            student_value=None,
            required_value=allowed or "Eligible Country List"
        )

    # Check prohibited list
    if any(p.strip().lower() == student_c for p in prohibited):
        return EvaluatedCriterionResult(
            rule_id=rule.rule_id,
            rule_type=rule.rule_type,
            title=rule.title,
            status=CriterionStatus.FAILS,
            is_mandatory=rule.is_mandatory,
            explanation=f"Citizens of {profile.citizenship} are explicitly ineligible under {rule.source_citation}.",
            source_citation=rule.source_citation,
            student_value=profile.citizenship,
            required_value=f"Non-{', '.join(prohibited)}"
        )

    # Check whitelist if specified
    if allowed:
        matches = any(a.strip().lower() == student_c for a in allowed)
        if matches:
            return EvaluatedCriterionResult(
                rule_id=rule.rule_id,
                rule_type=rule.rule_type,
                title=rule.title,
                status=CriterionStatus.MEETS,
                is_mandatory=rule.is_mandatory,
                explanation=f"{profile.citizenship} is an approved qualifying partner country.",
                source_citation=rule.source_citation,
                student_value=profile.citizenship,
                required_value="Eligible Commonwealth/Partner country"
            )
        else:
            return EvaluatedCriterionResult(
                rule_id=rule.rule_id,
                rule_type=rule.rule_type,
                title=rule.title,
                status=CriterionStatus.FAILS,
                is_mandatory=rule.is_mandatory,
                explanation=f"{profile.citizenship} is not included in the bilateral agreement country list for this scheme.",
                source_citation=rule.source_citation,
                student_value=profile.citizenship,
                required_value=f"One of: {', '.join(allowed[:5])}..."
            )

    return EvaluatedCriterionResult(
        rule_id=rule.rule_id,
        rule_type=rule.rule_type,
        title=rule.title,
        status=CriterionStatus.MEETS,
        is_mandatory=rule.is_mandatory,
        explanation="Universal international eligibility confirmed.",
        source_citation=rule.source_citation,
        student_value=profile.citizenship,
        required_value="Any nationality"
    )


def evaluate_degree_level(
    rule: EligibilityRuleRecord,
    profile: StudentProfileRecord
) -> EvaluatedCriterionResult:
    """Verifies that the target degree program aligns with the scholarship's funding scope."""
    params = rule.parameters
    target_rule = str(params.get("target_degree", "")).lower()
    allowed_degrees = [d.lower() for d in params.get("allowed_degrees", [])]
    if target_rule and target_rule not in allowed_degrees:
        allowed_degrees.append(target_rule)

    student_target = (profile.target_degree or "").lower()

    if not student_target:
        return EvaluatedCriterionResult(
            rule_id=rule.rule_id,
            rule_type=rule.rule_type,
            title=rule.title,
            status=CriterionStatus.MORE_INFO_NEEDED,
            is_mandatory=rule.is_mandatory,
            explanation="Target study level not selected. Please specify whether you are pursuing Master's, PhD, or Bachelor's.",
            source_citation=rule.source_citation,
            student_value=None,
            required_value=allowed_degrees or "Target Degree Level"
        )

    matched = False
    for req in allowed_degrees:
        if req in student_target or student_target in req:
            matched = True
            break

    if matched:
        return EvaluatedCriterionResult(
            rule_id=rule.rule_id,
            rule_type=rule.rule_type,
            title=rule.title,
            status=CriterionStatus.MEETS,
            is_mandatory=rule.is_mandatory,
            explanation=f"Target study level '{profile.target_degree}' is directly covered by this funding scheme.",
            source_citation=rule.source_citation,
            student_value=profile.target_degree,
            required_value=", ".join(allowed_degrees)
        )
    else:
        return EvaluatedCriterionResult(
            rule_id=rule.rule_id,
            rule_type=rule.rule_type,
            title=rule.title,
            status=CriterionStatus.FAILS,
            is_mandatory=rule.is_mandatory,
            explanation=f"Scholarship is restricted to {', '.join(allowed_degrees)}, but your profile indicates {profile.target_degree}.",
            source_citation=rule.source_citation,
            student_value=profile.target_degree,
            required_value=", ".join(allowed_degrees)
        )


def evaluate_academic_score(
    rule: EligibilityRuleRecord,
    profile: StudentProfileRecord
) -> EvaluatedCriterionResult:
    """Standardizes academic records and deterministically compares with required minimum."""
    params = rule.parameters
    min_normalized = params.get("min_gpa_normalized", 70.0)
    uk_equiv = params.get("uk_equivalent", "2:1")

    if profile.gpa is None:
        return EvaluatedCriterionResult(
            rule_id=rule.rule_id,
            rule_type=rule.rule_type,
            title=rule.title,
            status=CriterionStatus.MORE_INFO_NEEDED,
            is_mandatory=rule.is_mandatory,
            explanation=f"No GPA or degree classification on file. Requires minimum {min_normalized:.0f}% ({uk_equiv}).",
            source_citation=rule.source_citation,
            student_value=None,
            required_value=f"{min_normalized:.0f}% equivalent"
        )

    student_normalized = standardize_gpa(profile.gpa, profile.grading_scale, profile.max_gpa)
    if student_normalized is None:
        return EvaluatedCriterionResult(
            rule_id=rule.rule_id,
            rule_type=rule.rule_type,
            title=rule.title,
            status=CriterionStatus.MORE_INFO_NEEDED,
            is_mandatory=rule.is_mandatory,
            explanation="Could not standardize your GPA. Please check your grading scale selection.",
            source_citation=rule.source_citation,
            student_value=profile.gpa,
            required_value=f"{min_normalized:.0f}% equivalent"
        )

    if student_normalized >= min_normalized:
        return EvaluatedCriterionResult(
            rule_id=rule.rule_id,
            rule_type=rule.rule_type,
            title=rule.title,
            status=CriterionStatus.MEETS,
            is_mandatory=rule.is_mandatory,
            explanation=f"Your standardized score of {student_normalized:.1f}% meets the required threshold of {min_normalized:.1f}% ({uk_equiv}).",
            source_citation=rule.source_citation,
            student_value=f"{profile.gpa} ({student_normalized:.1f}%)",
            required_value=f"{min_normalized:.1f}%"
        )
    else:
        return EvaluatedCriterionResult(
            rule_id=rule.rule_id,
            rule_type=rule.rule_type,
            title=rule.title,
            status=CriterionStatus.FAILS,
            is_mandatory=rule.is_mandatory,
            explanation=f"Your standardized score of {student_normalized:.1f}% falls below the minimum required {min_normalized:.1f}% ({uk_equiv}).",
            source_citation=rule.source_citation,
            student_value=f"{profile.gpa} ({student_normalized:.1f}%)",
            required_value=f"{min_normalized:.1f}%"
        )


def evaluate_field_of_study(
    rule: EligibilityRuleRecord,
    profile: StudentProfileRecord
) -> EvaluatedCriterionResult:
    """Checks whether the applicant's discipline falls within approved development or research themes."""
    params = rule.parameters
    allowed_fields: List[str] = params.get("allowed_fields", [])
    student_field = (profile.primary_field or "").strip().lower()

    if not allowed_fields or "all fields" in [f.lower() for f in allowed_fields]:
        return EvaluatedCriterionResult(
            rule_id=rule.rule_id,
            rule_type=rule.rule_type,
            title=rule.title,
            status=CriterionStatus.MEETS,
            is_mandatory=rule.is_mandatory,
            explanation="All academic disciplines and research areas are eligible.",
            source_citation=rule.source_citation,
            student_value=profile.primary_field or "Any field",
            required_value="Open to all fields"
        )

    if not student_field:
        return EvaluatedCriterionResult(
            rule_id=rule.rule_id,
            rule_type=rule.rule_type,
            title=rule.title,
            status=CriterionStatus.MORE_INFO_NEEDED,
            is_mandatory=rule.is_mandatory,
            explanation="Primary field of study not specified. Please enter your discipline.",
            source_citation=rule.source_citation,
            student_value=None,
            required_value=", ".join(allowed_fields)
        )

    matched = any(
        (f.lower() in student_field or student_field in f.lower())
        for f in allowed_fields
    )

    if matched:
        return EvaluatedCriterionResult(
            rule_id=rule.rule_id,
            rule_type=rule.rule_type,
            title=rule.title,
            status=CriterionStatus.MEETS,
            is_mandatory=rule.is_mandatory,
            explanation=f"Discipline '{profile.primary_field}' aligns with the funding priority areas.",
            source_citation=rule.source_citation,
            student_value=profile.primary_field,
            required_value=", ".join(allowed_fields)
        )
    else:
        return EvaluatedCriterionResult(
            rule_id=rule.rule_id,
            rule_type=rule.rule_type,
            title=rule.title,
            status=CriterionStatus.FAILS,
            is_mandatory=rule.is_mandatory,
            explanation=f"Discipline '{profile.primary_field}' does not match priority areas: {', '.join(allowed_fields)}.",
            source_citation=rule.source_citation,
            student_value=profile.primary_field,
            required_value=", ".join(allowed_fields)
        )


def evaluate_language(
    rule: EligibilityRuleRecord,
    profile: StudentProfileRecord
) -> EvaluatedCriterionResult:
    """Evaluates English proficiency and Medium of Instruction exemptions."""
    params = rule.parameters
    accepts_waiver = params.get("accepts_medium_of_instruction_waiver", True)
    min_ielts = params.get("min_ielts", 6.5)

    if profile.has_english_medium_instruction and accepts_waiver:
        return EvaluatedCriterionResult(
            rule_id=rule.rule_id,
            rule_type=rule.rule_type,
            title=rule.title,
            status=CriterionStatus.MEETS,
            is_mandatory=rule.is_mandatory,
            explanation="Qualifies for English proficiency waiver based on institutional Medium of Instruction documentation.",
            source_citation=rule.source_citation,
            student_value="English Medium of Instruction Verified",
            required_value="IELTS 6.5+ or MOI confirmation"
        )

    test_type = (profile.english_test_type or "none").lower()
    score = profile.english_score

    if test_type == "none" or score is None:
        if rule.is_mandatory:
            return EvaluatedCriterionResult(
                rule_id=rule.rule_id,
                rule_type=rule.rule_type,
                title=rule.title,
                status=CriterionStatus.MORE_INFO_NEEDED,
                is_mandatory=True,
                explanation="English language test score or institutional waiver documentation is required.",
                source_citation=rule.source_citation,
                student_value=None,
                required_value="IELTS 6.5+ / TOEFL 90+ / MOI"
            )
        else:
            return EvaluatedCriterionResult(
                rule_id=rule.rule_id,
                rule_type=rule.rule_type,
                title=rule.title,
                status=CriterionStatus.MORE_INFO_NEEDED,
                is_mandatory=False,
                explanation="Optional test scores not on file; may be submitted prior to enrollment.",
                source_citation=rule.source_citation,
                student_value=None,
                required_value="Institutional proficiency proof"
            )

    # If score is present
    try:
        score_val = float(score)
        if test_type == "ielts" and score_val >= min_ielts:
            return EvaluatedCriterionResult(
                rule_id=rule.rule_id,
                rule_type=rule.rule_type,
                title=rule.title,
                status=CriterionStatus.MEETS,
                is_mandatory=rule.is_mandatory,
                explanation=f"IELTS score of {score_val} meets the required {min_ielts}.",
                source_citation=rule.source_citation,
                student_value=f"IELTS {score_val}",
                required_value=f"IELTS {min_ielts}"
            )
        elif test_type == "toefl" and score_val >= 90.0:
            return EvaluatedCriterionResult(
                rule_id=rule.rule_id,
                rule_type=rule.rule_type,
                title=rule.title,
                status=CriterionStatus.MEETS,
                is_mandatory=rule.is_mandatory,
                explanation=f"TOEFL score of {score_val} satisfies university admission threshold.",
                source_citation=rule.source_citation,
                student_value=f"TOEFL {score_val}",
                required_value="TOEFL 90+"
            )
        elif test_type == "duolingo" and score_val >= 115.0:
            return EvaluatedCriterionResult(
                rule_id=rule.rule_id,
                rule_type=rule.rule_type,
                title=rule.title,
                status=CriterionStatus.MEETS,
                is_mandatory=rule.is_mandatory,
                explanation=f"Duolingo score of {score_val} satisfies university threshold.",
                source_citation=rule.source_citation,
                student_value=f"DET {score_val}",
                required_value="DET 115+"
            )
        else:
            return EvaluatedCriterionResult(
                rule_id=rule.rule_id,
                rule_type=rule.rule_type,
                title=rule.title,
                status=CriterionStatus.FAILS,
                is_mandatory=rule.is_mandatory,
                explanation=f"Language score of {score_val} is below the minimum prerequisite {min_ielts}.",
                source_citation=rule.source_citation,
                student_value=f"{test_type.upper()} {score_val}",
                required_value=f"IELTS {min_ielts}+ or equivalent"
            )
    except ValueError:
        return EvaluatedCriterionResult(
            rule_id=rule.rule_id,
            rule_type=rule.rule_type,
            title=rule.title,
            status=CriterionStatus.MORE_INFO_NEEDED,
            is_mandatory=rule.is_mandatory,
            explanation=f"Could not parse language score value: '{score}'.",
            source_citation=rule.source_citation,
            student_value=score,
            required_value="Numeric score"
        )


def evaluate_work_experience(
    rule: EligibilityRuleRecord,
    profile: StudentProfileRecord
) -> EvaluatedCriterionResult:
    """Evaluates professional and leadership work experience."""
    params = rule.parameters
    min_years = params.get("min_work_years", 2.0)
    student_years = profile.work_experience_years or 0.0

    if student_years >= min_years:
        return EvaluatedCriterionResult(
            rule_id=rule.rule_id,
            rule_type=rule.rule_type,
            title=rule.title,
            status=CriterionStatus.MEETS,
            is_mandatory=rule.is_mandatory,
            explanation=f"Your {student_years:.1f} years of professional experience satisfy the {min_years:.1f} years requirement.",
            source_citation=rule.source_citation,
            student_value=f"{student_years:.1f} years",
            required_value=f"{min_years:.1f} years"
        )
    else:
        return EvaluatedCriterionResult(
            rule_id=rule.rule_id,
            rule_type=rule.rule_type,
            title=rule.title,
            status=CriterionStatus.FAILS,
            is_mandatory=rule.is_mandatory,
            explanation=f"Requires at least {min_years:.1f} years of professional work experience; profile indicates {student_years:.1f} years.",
            source_citation=rule.source_citation,
            student_value=f"{student_years:.1f} years",
            required_value=f"{min_years:.1f} years"
        )


def evaluate_manual_review(
    rule: EligibilityRuleRecord,
    profile: StudentProfileRecord
) -> EvaluatedCriterionResult:
    """Flags qualitative, portfolio, research proposal, or nominating agency criteria for human review."""
    return EvaluatedCriterionResult(
        rule_id=rule.rule_id,
        rule_type=rule.rule_type,
        title=rule.title,
        status=CriterionStatus.NEEDS_MANUAL_REVIEW,
        is_mandatory=rule.is_mandatory,
        explanation=f"Subjective / Discretionary criterion: '{rule.description}'. Requires institutional portfolio or committee assessment.",
        source_citation=rule.source_citation,
        student_value="Pending Portfolio / Interview Review",
        required_value="Institutional Assessment"
    )


# --- Master Deterministic Engine ---


class DeterministicEligibilityEngine:
    """
    Core deterministic evaluation engine comparing student profiles with
    structured scholarship eligibility rules.
    """

    def evaluate_criterion(
        self,
        rule: EligibilityRuleRecord,
        profile: StudentProfileRecord
    ) -> EvaluatedCriterionResult:
        if rule.requires_human_appraisal or rule.rule_type == RuleType.MANUAL_REVIEW.value:
            return evaluate_manual_review(rule, profile)

        rtype = rule.rule_type.lower()
        if rtype == RuleType.CITIZENSHIP.value:
            return evaluate_citizenship(rule, profile)
        elif rtype == RuleType.DEGREE_LEVEL.value:
            return evaluate_degree_level(rule, profile)
        elif rtype == RuleType.ACADEMIC_SCORE.value:
            return evaluate_academic_score(rule, profile)
        elif rtype == RuleType.FIELD_OF_STUDY.value:
            return evaluate_field_of_study(rule, profile)
        elif rtype == RuleType.LANGUAGE.value:
            return evaluate_language(rule, profile)
        elif rtype == RuleType.WORK_EXPERIENCE.value:
            return evaluate_work_experience(rule, profile)
        else:
            # Default fallback for unhandled or general rule types
            return EvaluatedCriterionResult(
                rule_id=rule.rule_id,
                rule_type=rule.rule_type,
                title=rule.title,
                status=CriterionStatus.NEEDS_MANUAL_REVIEW,
                is_mandatory=rule.is_mandatory,
                explanation=f"General criterion '{rule.title}' requires applicant verification against provider terms.",
                source_citation=rule.source_citation,
                student_value=None,
                required_value="Provider Terms"
            )

    def evaluate(
        self,
        scholarship_id: str,
        rules: List[EligibilityRuleRecord],
        profile: StudentProfileRecord
    ) -> EligibilityEvaluation:
        results: List[EvaluatedCriterionResult] = []

        mandatory_failed = 0
        missing_mandatory_info = 0
        missing_optional_info = 0
        manual_review_needed = 0
        met_count = 0

        for rule in rules:
            res = self.evaluate_criterion(rule, profile)
            results.append(res)

            if res.status == CriterionStatus.MEETS:
                met_count += 1
            elif res.status == CriterionStatus.FAILS:
                if res.is_mandatory:
                    mandatory_failed += 1
            elif res.status == CriterionStatus.MORE_INFO_NEEDED:
                if res.is_mandatory:
                    missing_mandatory_info += 1
                else:
                    missing_optional_info += 1
            elif res.status == CriterionStatus.NEEDS_MANUAL_REVIEW:
                manual_review_needed += 1

        total_rules = len(rules) if rules else 1

        # Calculate transparent match score
        # Met = 1.0, Manual review = 0.5, Missing info = 0.25, Fails = 0.0
        weighted_score = sum(
            1.0 if r.status == CriterionStatus.MEETS else
            0.5 if r.status == CriterionStatus.NEEDS_MANUAL_REVIEW else
            0.25 if r.status == CriterionStatus.MORE_INFO_NEEDED else 0.0
            for r in results
        )
        match_percentage = int(round((weighted_score / total_rules) * 100))

        # Deterministic 4-Outcome Resolution:
        # 1. Does not meet criterion: Any mandatory rule failed
        # 2. More information needed: Missing required profile fields for mandatory criteria
        # 3. Needs manual review: No mandatory fails/missing, but subjective/committee review required
        # 4. Likely eligible: All mandatory criteria met, no blocking missing data
        if mandatory_failed > 0:
            outcome = OverallOutcome.DOES_NOT_MEET
            summary = f"Does not meet {mandatory_failed} mandatory eligibility criteria."
        elif missing_mandatory_info > 0:
            outcome = OverallOutcome.MORE_INFO_NEEDED
            summary = f"Missing {missing_mandatory_info} required student profile fields needed to confirm eligibility."
        elif manual_review_needed > 0:
            outcome = OverallOutcome.NEEDS_MANUAL_REVIEW
            summary = f"Core prerequisites satisfied; {manual_review_needed} discretionary/nominating criteria require manual institutional review."
        else:
            outcome = OverallOutcome.LIKELY_ELIGIBLE
            summary = f"All {met_count} verified eligibility criteria are satisfied by your academic profile."

        return EligibilityEvaluation(
            scholarship_id=scholarship_id,
            outcome=outcome,
            match_percentage=match_percentage,
            criteria_results=results,
            summary=summary,
            mandatory_failed_count=mandatory_failed,
            missing_info_count=missing_mandatory_info + missing_optional_info,
            manual_review_count=manual_review_needed,
            met_criteria_count=met_count,
            total_criteria_count=len(rules)
        )