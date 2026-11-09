import { 
  StudentProfile, 
  Scholarship, 
  EligibilityCriterion, 
  EligibilityEvaluationResult, 
  EvaluatedCriterion,
  GradingScale
} from '../types';

const clampScore = (value: number): number => Math.min(100, Math.max(0, value));

/**
 * Round half-up to a fixed number of decimal places.
 * Mirrors the Python canonical engine so both languages agree on .5 boundaries.
 */
function roundHalfUp(value: number, digits: number = 0): number {
  const factor = 10 ** digits;
  return Math.floor(value * factor + 0.5) / factor;
}

/**
 * Standardize any institutional grading scale to a 0 - 100 unified index.
 *
 * Canonical mapping shared with `backend/eligibility_service.py` and the golden
 * fixture in `tests/fixtures/eligibility-parity.json`. Do not change one without
 * the other.
 */
export function normalizeGpa(gpa: number, scale: GradingScale, maxGpa: number = 4.0): number {
  if (gpa === null || gpa === undefined || gpa <= 0) return 0;

  switch (scale) {
    case 'gpa_4_0':
      return clampScore((gpa / 4.0) * 100);
    case 'gpa_5_0':
      return clampScore((gpa / 5.0) * 100);
    case 'percentage':
    case 'ects':
      // Percentage and ECTS grades are already expressed on a 0-100 scale.
      return clampScore(gpa);
    case 'german': {
      // Modified Bavarian formula: 1.0 => 100, 4.0 => 25, 5.0 => 0.
      const clamped = Math.min(5.0, Math.max(1.0, gpa));
      return roundHalfUp(((5.0 - clamped) / 4.0) * 100, 1);
    }
    case 'uk_honours':
      // 1st => 85, 2:1 => 75, 2:2 => 60, raw percentage >= 40 => raw.
      if (gpa <= 1.0) return 85;
      if (gpa >= 2.0 && gpa <= 2.15) return 75;
      if (gpa > 2.15 && gpa <= 2.25) return 60;
      if (gpa >= 40.0) return clampScore(gpa);
      return 75;
    default:
      return clampScore((gpa / (maxGpa || 4.0)) * 100);
  }
}

/**
 * Get equivalent international conversion label
 */
export function getEquivalentDegreeLabel(normalizedScore: number): string {
  if (normalizedScore >= 85) return 'UK First Class Honours equivalent (German 1.0–1.3 Sehr Gut)';
  if (normalizedScore >= 70) return 'UK Upper Second Class (2:1) equivalent (German 1.7–2.3 Gut)';
  if (normalizedScore >= 55) return 'UK Lower Second Class (2:2) equivalent';
  return 'Passing academic standing';
}

/**
 * Deterministic, explainable matching engine that evaluates a student profile against scholarship criteria
 */
export function evaluateEligibility(
  scholarship: Scholarship,
  profile?: StudentProfile | null
): EligibilityEvaluationResult {
  // If no student profile provided, evaluate against sample general criteria
  if (!profile) {
    const defaultEvaluated: EvaluatedCriterion[] = scholarship.criteria.map((c) => ({
      criterion: c,
      status: 'missing',
      explanation: 'Complete your student profile to evaluate this criterion automatically.'
    }));
    return {
      scholarshipId: scholarship.id,
      status: 'more_info_needed',
      statusLabel: 'Profile needed to evaluate',
      matchScore: 0,
      evaluatedList: defaultEvaluated,
      matchedCount: 0,
      totalMandatoryCount: scholarship.criteria.filter(c => c.isMandatory).length,
      mandatoryFailedCount: 0,
      missingCount: scholarship.criteria.length,
      manualReviewCount: 0,
      lastVerified: scholarship.lastVerified,
    };
  }

  const evaluatedList: EvaluatedCriterion[] = [];
  let totalMandatory = 0;
  let mandatoryFailed = 0;
  let missingMandatory = 0;
  let missingOptional = 0;
  let manualReviewCount = 0;
  let matchedCount = 0;

  const totalCriteria = scholarship.criteria.length;
  const normalizedStudentGpa = normalizeGpa(profile.gpa, profile.gradingScale, profile.maxGpa);

  const record = (
    criterion: EligibilityCriterion,
    status: EvaluatedCriterion['status'],
    explanation: string,
  ) => {
    evaluatedList.push({ criterion, status, explanation });
    if (status === 'passed') matchedCount++;
    else if (status === 'needs_review') manualReviewCount++;
    else if (status === 'missing') {
      if (criterion.isMandatory) missingMandatory++;
      else missingOptional++;
    } else if (status === 'failed' && criterion.isMandatory) mandatoryFailed++;
  };

  for (const criterion of scholarship.criteria) {
    if (criterion.isMandatory) totalMandatory++;

    switch (criterion.ruleType) {
      case 'citizenship': {
        if (!profile.citizenship) {
          record(criterion, 'missing', 'Citizenship not specified in your profile.');
          break;
        }

        const citizenship = profile.citizenship.trim().toLowerCase();
        const isDisallowed = criterion.prohibitedCitizenships?.some(
          c => c.trim().toLowerCase() === citizenship
        );
        if (isDisallowed) {
          record(
            criterion,
            'failed',
            `Passport origin (${profile.citizenship}) is ineligible under host bilateral quota.`
          );
          break;
        }

        const allowed = criterion.allowedCitizenships ?? [];
        const openedGlobally =
          allowed.length === 0 || allowed.some(c => ['*', 'all'].includes(c.trim().toLowerCase()));

        if (openedGlobally || allowed.some(c => c.trim().toLowerCase() === citizenship)) {
          record(criterion, 'passed', `Citizenship verified eligible (${profile.citizenship}).`);
        } else {
          record(
            criterion,
            'failed',
            `Restricted to citizens of: ${allowed.slice(0, 3).join(', ')}${allowed.length > 3 ? '...' : ''}.`
          );
        }
        break;
      }

      case 'degree_level': {
        const targets = (profile.targetDegrees ?? []).map(t => String(t).toLowerCase());
        const required = (criterion.requiredDegrees ?? []).map(d => String(d).toLowerCase());

        if (targets.length === 0) {
          record(
            criterion,
            'missing',
            'Target study level not selected. Specify whether you are pursuing a master’s, PhD, or bachelor’s.'
          );
          break;
        }

        if (required.length === 0) {
          record(criterion, 'missing', 'Study level requirement is not specified in the programme rules.');
          break;
        }

        // Case-insensitive substring match, mirroring the Python engine.
        const matched = targets.some(target =>
          required.some(req => req.includes(target) || target.includes(req))
        );
        if (matched) {
          record(criterion, 'passed', `Target degree matches your objective (${targets.join(', ')}).`);
        } else {
          record(criterion, 'failed', `Requires study at: ${required.join(', ')}.`);
        }
        break;
      }

      case 'academic_score': {
        // Zero/absent GPA means "not provided", never an automatic failure.
        if (!profile.gpa || profile.gpa <= 0) {
          record(criterion, 'missing', 'Cumulative GPA not recorded in profile.');
          break;
        }

        const requiredCutoff = criterion.minGpaNormalized ?? 70;
        if (normalizedStudentGpa >= requiredCutoff) {
          record(
            criterion,
            'passed',
            `Your standardized academic score (${normalizedStudentGpa.toFixed(1)}%) meets the threshold (${requiredCutoff}%).`
          );
        } else {
          record(
            criterion,
            'failed',
            `Your standardized academic score (${normalizedStudentGpa.toFixed(1)}%) is below the minimum required (${requiredCutoff}%).`
          );
        }
        break;
      }

      case 'field_of_study': {
        const fields = criterion.applicableFields ?? [];
        const lowered = fields.map(f => f.trim().toLowerCase());

        if (lowered.length === 0 || lowered.some(f => ['all', 'all fields', '*'].includes(f))) {
          record(criterion, 'passed', 'All academic disciplines and research areas are eligible.');
          break;
        }

        const studentField = (profile.primaryField ?? '').trim().toLowerCase();
        if (!studentField) {
          record(criterion, 'missing', 'Field of study not specified in profile.');
          break;
        }

        const fieldMatches = lowered.some(
          f => f.includes(studentField) || studentField.includes(f)
        );
        if (fieldMatches) {
          record(criterion, 'passed', `Discipline aligns with scholarship scope (${profile.primaryField}).`);
        } else {
          // A stated field that does not match is a deterministic failure, not missing info.
          record(
            criterion,
            'failed',
            `Discipline does not match priority areas: ${fields.join(', ')}.`
          );
        }
        break;
      }

      case 'language': {
        const acceptsWaiver = criterion.acceptsMediumOfInstructionWaiver ?? true;
        if (profile.hasEnglishMediumInstruction && acceptsWaiver) {
          record(
            criterion,
            'passed',
            'English language proficiency satisfied via Medium of Instruction verification.'
          );
          break;
        }

        const testType = (profile.englishTestType || 'none').toLowerCase();
        const rawScore = (profile.englishScore ?? '').trim();
        if (testType === 'none' || rawScore === '') {
          record(
            criterion,
            'missing',
            'Official English proficiency test score or institutional waiver documentation pending upload.'
          );
          break;
        }

        // Strict numeric parse: reject trailing garbage instead of silently truncating.
        const score = Number(rawScore);
        if (Number.isNaN(score)) {
          record(criterion, 'missing', `Could not parse language score value: '${rawScore}'.`);
          break;
        }

        const minIelts = criterion.minIelts ?? 6.5;
        if (testType === 'ielts' && score >= minIelts) {
          record(criterion, 'passed', `IELTS score of ${score} meets the required ${minIelts}.`);
        } else if (testType === 'toefl' && score >= 90) {
          record(criterion, 'passed', `TOEFL score of ${score} satisfies the admission threshold.`);
        } else if (testType === 'duolingo' && score >= 115) {
          record(criterion, 'passed', `Duolingo score of ${score} satisfies the admission threshold.`);
        } else {
          record(
            criterion,
            'failed',
            `Language score of ${score} is below the minimum prerequisite ${minIelts}.`
          );
        }
        break;
      }

      case 'work_experience': {
        const requiredYears = criterion.minWorkYears ?? 2;
        if (profile.workExperienceYears === undefined || profile.workExperienceYears === null) {
          record(
            criterion,
            'missing',
            `Requires verification of ${requiredYears}+ years relevant work or community leadership experience.`
          );
          break;
        }

        if (profile.workExperienceYears >= requiredYears) {
          record(
            criterion,
            'passed',
            `${profile.workExperienceYears} years documented experience satisfies the ${requiredYears}+ years requirement.`
          );
        } else {
          record(
            criterion,
            'failed',
            `Requires ${requiredYears}+ years of full-time professional or leadership experience (profile indicates ${profile.workExperienceYears} years).`
          );
        }
        break;
      }

      case 'manual_review':
      case 'deadline':
      default: {
        // Unknown, deadline, and discretionary rules are never auto-passed.
        record(
          criterion,
          'needs_review',
          `Criterion '${criterion.title}' requires manual verification against the provider's terms.`
        );
        break;
      }
    }
  }

  const missingCount = missingMandatory + missingOptional;

  // Transparent weighted score: meets 1.0, manual review 0.5, info needed 0.25, fails 0.0.
  const weightedScore = evaluatedList.reduce((sum, item) => {
    if (item.status === 'passed') return sum + 1.0;
    if (item.status === 'needs_review') return sum + 0.5;
    if (item.status === 'missing') return sum + 0.25;
    return sum;
  }, 0);
  const matchScore = totalCriteria > 0 ? roundHalfUp((weightedScore / totalCriteria) * 100) : 0;

  // Outcome precedence: mandatory fail -> missing mandatory -> manual review -> likely.
  let status: EligibilityEvaluationResult['status'];
  let statusLabel: string;

  if (mandatoryFailed > 0) {
    status = 'ineligible';
    statusLabel = 'Does not meet a known mandatory criterion';
  } else if (missingMandatory > 0) {
    status = 'more_info_needed';
    statusLabel = `Potential match — ${missingCount} info needed`;
  } else if (manualReviewCount > 0) {
    status = 'needs_review';
    statusLabel = 'Needs manual review';
  } else {
    status = 'likely_eligible';
    statusLabel = `Likely eligible (${matchScore}% match)`;
  }

  return {
    scholarshipId: scholarship.id,
    status,
    statusLabel,
    matchScore,
    evaluatedList,
    matchedCount,
    totalMandatoryCount: totalMandatory,
    mandatoryFailedCount: mandatoryFailed,
    missingCount,
    manualReviewCount,
    lastVerified: scholarship.lastVerified,
  };
}
