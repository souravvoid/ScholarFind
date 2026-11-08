import { 
  StudentProfile, 
  Scholarship, 
  EligibilityCriterion, 
  EligibilityEvaluationResult, 
  EvaluatedCriterion,
  GradingScale
} from '../types';

/**
 * Standardize any institutional grading scale to a 0 - 100 unified index
 */
export function normalizeGpa(gpa: number, scale: GradingScale, maxGpa: number = 4.0): number {
  if (gpa <= 0) return 0;
  
  switch (scale) {
    case 'gpa_4_0':
      return Math.min(100, Math.max(0, (gpa / 4.0) * 100));
    case 'gpa_5_0':
      return Math.min(100, Math.max(0, (gpa / 5.0) * 100));
    case 'percentage':
      return Math.min(100, Math.max(0, gpa));
    case 'german':
      // German scale: 1.0 is highest (100%), 4.0 is pass (50%), >4.0 fail
      // Formula: ((4.0 - gpa) / (4.0 - 1.0)) * 50 + 50
      if (gpa > 4.0) return 30;
      return Math.min(100, Math.max(0, ((4.0 - gpa) / 3.0) * 50 + 50));
    case 'uk_honours':
      // gpa 1 = First Class (95), 2 = 2:1 (80), 3 = 2:2 (65), 4 = 3rd (50)
      if (gpa <= 1.0) return 95;
      if (gpa <= 2.1) return 80;
      if (gpa <= 2.2) return 65;
      return 50;
    case 'ects':
      // ECTS scale encoded 1 (A) to 5 (E)
      if (gpa <= 1) return 95;
      if (gpa <= 2) return 85;
      if (gpa <= 3) return 75;
      if (gpa <= 4) return 65;
      return 50;
    default:
      return Math.min(100, (gpa / (maxGpa || 4.0)) * 100);
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
      lastVerified: scholarship.lastVerified,
    };
  }

  const evaluatedList: EvaluatedCriterion[] = [];
  let mandatoryPassed = 0;
  let mandatoryFailed = 0;
  let missingInfo = 0;
  let totalMandatory = 0;
  let totalCriteria = scholarship.criteria.length;

  const normalizedStudentGpa = normalizeGpa(profile.gpa, profile.gradingScale, profile.maxGpa);

  for (const criterion of scholarship.criteria) {
    if (criterion.isMandatory) totalMandatory++;

    switch (criterion.ruleType) {
      case 'citizenship': {
        if (!profile.citizenship) {
          evaluatedList.push({
            criterion,
            status: 'missing',
            explanation: 'Citizenship not specified in your profile.'
          });
          missingInfo++;
          break;
        }

        const isDisallowed = criterion.prohibitedCitizenships?.some(
          c => c.toLowerCase() === profile.citizenship.toLowerCase()
        );
        if (isDisallowed) {
          evaluatedList.push({
            criterion,
            status: 'failed',
            explanation: `Passport origin (${profile.citizenship}) is ineligible under host bilateral quota.`
          });
          if (criterion.isMandatory) mandatoryFailed++;
          break;
        }

        if (criterion.allowedCitizenships && criterion.allowedCitizenships.length > 0) {
          const isAllowed = criterion.allowedCitizenships.some(
            c => c.toLowerCase() === profile.citizenship.toLowerCase() || c === '*' || c.toLowerCase() === 'all'
          );
          if (isAllowed) {
            evaluatedList.push({
              criterion,
              status: 'passed',
              explanation: `Citizenship verified eligible (${profile.citizenship}).`
            });
            if (criterion.isMandatory) mandatoryPassed++;
          } else {
            evaluatedList.push({
              criterion,
              status: 'failed',
              explanation: `Restricted to citizens of: ${criterion.allowedCitizenships.slice(0, 3).join(', ')}${criterion.allowedCitizenships.length > 3 ? '...' : ''}.`
            });
            if (criterion.isMandatory) mandatoryFailed++;
          }
        } else {
          // Global / all countries
          evaluatedList.push({
            criterion,
            status: 'passed',
            explanation: `Open globally to international applicants including ${profile.citizenship}.`
          });
          if (criterion.isMandatory) mandatoryPassed++;
        }
        break;
      }

      case 'degree_level': {
        const matchesTarget = profile.targetDegrees?.some(d => scholarship.studyLevels.includes(d));
        const hasPrereq = 
          (scholarship.studyLevels.includes('masters') && ['bachelors', 'masters'].includes(profile.educationLevel)) ||
          (scholarship.studyLevels.includes('phd') && ['masters', 'bachelors'].includes(profile.educationLevel)) ||
          scholarship.studyLevels.includes(profile.educationLevel);

        if (matchesTarget || hasPrereq) {
          evaluatedList.push({
            criterion,
            status: 'passed',
            explanation: `Target degree matches your objective (${profile.targetDegrees.join(', ') || profile.educationLevel}).`
          });
          if (criterion.isMandatory) mandatoryPassed++;
        } else {
          evaluatedList.push({
            criterion,
            status: 'failed',
            explanation: `Requires study at: ${scholarship.studyLevels.join(', ')}.`
          });
          if (criterion.isMandatory) mandatoryFailed++;
        }
        break;
      }

      case 'academic_score': {
        if (!profile.gpa) {
          evaluatedList.push({
            criterion,
            status: 'missing',
            explanation: 'Cumulative GPA not recorded in profile.'
          });
          missingInfo++;
          break;
        }

        const requiredCutoff = criterion.minGpaNormalized || 75; // default ~3.0 / 4.0
        if (normalizedStudentGpa >= requiredCutoff) {
          evaluatedList.push({
            criterion,
            status: 'passed',
            explanation: `Your standardized academic score (${normalizedStudentGpa.toFixed(1)}%) meets the threshold (${requiredCutoff}%).`
          });
          if (criterion.isMandatory) mandatoryPassed++;
        } else {
          evaluatedList.push({
            criterion,
            status: 'failed',
            explanation: `Your standardized academic score (${normalizedStudentGpa.toFixed(1)}%) is below the minimum required (${requiredCutoff}%).`
          });
          if (criterion.isMandatory) mandatoryFailed++;
        }
        break;
      }

      case 'field_of_study': {
        if (!profile.primaryField && (!profile.facultyTags || profile.facultyTags.length === 0)) {
          evaluatedList.push({
            criterion,
            status: 'missing',
            explanation: 'Field of study not specified in profile.'
          });
          missingInfo++;
          break;
        }

        const fieldMatches = scholarship.fieldsOfStudy.some(f => {
          if (f.toLowerCase() === 'all' || f.toLowerCase() === 'all fields') return true;
          const searchLower = profile.primaryField.toLowerCase();
          const tagMatches = profile.facultyTags?.some(t => f.toLowerCase().includes(t.toLowerCase()) || t.toLowerCase().includes(f.toLowerCase()));
          return searchLower.includes(f.toLowerCase()) || f.toLowerCase().includes(searchLower) || tagMatches;
        });

        if (fieldMatches) {
          evaluatedList.push({
            criterion,
            status: 'passed',
            explanation: `Discipline aligns with scholarship scope (${profile.primaryField || 'STEM'}).`
          });
          if (criterion.isMandatory) mandatoryPassed++;
        } else {
          evaluatedList.push({
            criterion,
            status: 'missing',
            explanation: `Confirm your undergraduate degree specialization aligns with: ${scholarship.fieldsOfStudy.join(', ')}.`
          });
          missingInfo++;
        }
        break;
      }

      case 'language': {
        if (profile.hasEnglishMediumInstruction) {
          evaluatedList.push({
            criterion,
            status: 'passed',
            explanation: 'English language proficiency satisfied via Medium of Instruction verification.'
          });
          if (criterion.isMandatory) mandatoryPassed++;
        } else if (profile.englishTestType && profile.englishTestType !== 'none' && profile.englishScore) {
          evaluatedList.push({
            criterion,
            status: 'passed',
            explanation: `Valid test score submitted (${profile.englishTestType.toUpperCase()}: ${profile.englishScore}).`
          });
          if (criterion.isMandatory) mandatoryPassed++;
        } else {
          evaluatedList.push({
            criterion,
            status: 'missing',
            explanation: 'Official English proficiency test score or institutional waiver documentation pending upload.'
          });
          missingInfo++;
        }
        break;
      }

      case 'work_experience': {
        const requiredYears = criterion.minWorkYears || 2;
        if (profile.workExperienceYears !== undefined && profile.workExperienceYears !== null) {
          if (profile.workExperienceYears >= requiredYears) {
            evaluatedList.push({
              criterion,
              status: 'passed',
              explanation: `${profile.workExperienceYears} years documented experience satisfies the ${requiredYears}+ years requirement.`
            });
            if (criterion.isMandatory) mandatoryPassed++;
          } else {
            evaluatedList.push({
              criterion,
              status: 'failed',
              explanation: `Requires ${requiredYears}+ years of full-time professional or leadership experience (profile indicates ${profile.workExperienceYears} years).`
            });
            if (criterion.isMandatory) mandatoryFailed++;
          }
        } else {
          evaluatedList.push({
            criterion,
            status: 'missing',
            explanation: `Requires verification of ${requiredYears}+ years relevant work or community leadership experience.`
          });
          missingInfo++;
        }
        break;
      }

      default: {
        evaluatedList.push({
          criterion,
          status: 'passed',
          explanation: 'Standard admissions criteria satisfied.'
        });
        if (criterion.isMandatory) mandatoryPassed++;
        break;
      }
    }
  }

  // Determine overall status
  let status: 'likely_eligible' | 'more_info_needed' | 'ineligible' | 'needs_review' = 'likely_eligible';
  let statusLabel = 'Likely eligible';

  if (mandatoryFailed > 0) {
    status = 'ineligible';
    statusLabel = 'Does not meet a known mandatory criterion';
  } else if (missingInfo > 0) {
    status = 'more_info_needed';
    statusLabel = `Potential match — ${missingInfo} info needed`;
  } else {
    status = 'likely_eligible';
    const percent = Math.round((mandatoryPassed / Math.max(1, totalMandatory)) * 100);
    statusLabel = `Likely eligible (${percent}% match)`;
  }

  const passedCount = evaluatedList.filter(e => e.status === 'passed').length;
  const matchScore = totalCriteria > 0 ? Math.round((passedCount / totalCriteria) * 100) : 0;

  return {
    scholarshipId: scholarship.id,
    status,
    statusLabel,
    matchScore,
    evaluatedList,
    matchedCount: passedCount,
    totalMandatoryCount: totalMandatory,
    mandatoryFailedCount: mandatoryFailed,
    missingCount: missingInfo,
    lastVerified: scholarship.lastVerified,
  };
}
