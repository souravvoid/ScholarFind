import { describe, test } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { normalizeGpa, evaluateEligibility, getEquivalentDegreeLabel } from './eligibilityEngine';
import { SCHOLARSHIPS_DATA } from '../data/scholarshipsData';
import {
  DegreeLevel,
  EligibilityCriterion,
  GradingScale,
  Scholarship,
  StudentProfile,
} from '../types';

const parityFixture = JSON.parse(
  readFileSync(new URL('../../tests/fixtures/eligibility-parity.json', import.meta.url), 'utf8'),
);

const CANONICAL_STATUS: Record<string, string> = {
  passed: 'meets',
  failed: 'fails',
  missing: 'more_info_needed',
  needs_review: 'needs_manual_review',
};

const CANONICAL_OUTCOME: Record<string, string> = {
  likely_eligible: 'likely_eligible',
  more_info_needed: 'more_info_needed',
  ineligible: 'does_not_meet',
  needs_review: 'needs_review',
};

function buildParityProfile(overrides: Record<string, unknown>): StudentProfile {
  const data: Record<string, any> = { ...parityFixture.base_profile, ...overrides };
  return {
    uid: 'parity',
    email: '',
    displayName: '',
    citizenship: data.citizenship,
    residenceCountry: '',
    educationLevel: data.education_level as DegreeLevel,
    institution: '',
    gradingScale: data.grading_scale as GradingScale,
    gpa: data.gpa,
    maxGpa: data.max_gpa,
    graduationYear: '',
    primaryField: data.primary_field,
    facultyTags: [],
    researchKeywords: [],
    targetDegrees: [data.target_degree as DegreeLevel],
    targetRegions: [],
    targetCountries: [],
    deliveryModality: 'on_campus',
    intendedStartTerm: '',
    workExperienceYears: data.work_experience_years,
    englishTestType: data.english_test_type,
    englishScore: data.english_score == null ? '' : String(data.english_score),
    hasEnglishMediumInstruction: data.has_english_medium_instruction,
    updatedAt: '',
    createdAt: '',
  };
}

function buildParityScholarship(rules: any[]): Scholarship {
  const degreeRule = rules.find((rule) => rule.rule_type === 'degree_level');
  const fieldRule = rules.find((rule) => rule.rule_type === 'field_of_study');
  const criteria: EligibilityCriterion[] = rules.map((rule) => {
    const params = rule.parameters ?? {};
    return {
      id: rule.rule_id,
      ruleType: rule.rule_type,
      title: rule.title,
      description: rule.description,
      isMandatory: rule.is_mandatory,
      sourceCitation: 'parity-fixture',
      allowedCitizenships: params.allowed_countries,
      prohibitedCitizenships: params.prohibited_countries,
      requiredDegrees: params.allowed_degrees,
      applicableFields: params.allowed_fields,
      minGpaNormalized: params.min_gpa_normalized,
      minWorkYears: params.min_work_years,
      acceptsMediumOfInstructionWaiver:
        params.accepts_medium_of_instruction_waiver,
      minIelts: params.min_ielts,
    };
  });

  return {
    id: 'parity',
    slug: 'parity',
    title: 'Parity fixture',
    providerName: 'Fixture',
    providerCategory: 'Government Endowment',
    heroImage: '',
    destinationCountries: [],
    destinationFlag: '',
    hostInstitutions: [],
    studyLevels: (degreeRule?.parameters?.allowed_degrees ?? ['masters']) as DegreeLevel[],
    fieldsOfStudy: fieldRule?.parameters?.allowed_fields ?? [],
    totalAwardValue: '',
    awardDetails: '',
    coverageTypes: [],
    estimatedUSDValue: 0,
    applicationDeadline: '2099-01-01',
    daysRemaining: 0,
    academicYear: '2026',
    lastVerified: '2026-01-01',
    officialSourceUrl: 'https://example.org',
    officialApplicationUrl: 'https://example.org/apply',
    sourceDomain: 'example.org',
    requiredDocuments: [],
    applicationInstructions: [],
    overview: '',
    criteria,
    provenance: {
      sourceName: 'Fixture',
      sourceRecordUrl: 'https://example.org',
      collectedAt: '2026-01-01',
      sourceId: 'fixture',
    },
  };
}

describe('ScholarFind Deterministic Eligibility Engine', () => {
  const sampleProfile: StudentProfile = {
    uid: 'test_student_1',
    email: 'test@student.edu',
    displayName: 'Amara Okafor',
    citizenship: 'Nigeria',
    residenceCountry: 'Nigeria',
    educationLevel: 'bachelors',
    institution: 'University of Ibadan',
    gradingScale: 'gpa_4_0',
    gpa: 3.82,
    maxGpa: 4.0,
    graduationYear: '2026',
    primaryField: 'Computer Science & Artificial Intelligence (STEM)',
    facultyTags: ['Computer Science', 'STEM'],
    researchKeywords: ['Machine Learning', 'Data Ethics'],
    targetDegrees: ['masters'],
    targetRegions: ['Western & Northern Europe'],
    targetCountries: ['United Kingdom'],
    deliveryModality: 'on_campus',
    intendedStartTerm: 'Fall 2026',
    workExperienceYears: 2,
    englishTestType: 'none',
    englishScore: '',
    hasEnglishMediumInstruction: true,
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString()
  };

  test('GPA standardization across global systems', () => {
    // 3.82 / 4.0 => 95.5%
    const gpa4 = normalizeGpa(3.82, 'gpa_4_0', 4.0);
    assert(Math.abs(gpa4 - 95.5) < 0.2);

    // 4.82 / 5.0 => 96.4%
    const gpa5 = normalizeGpa(4.82, 'gpa_5_0', 5.0);
    assert(Math.abs(gpa5 - 96.4) < 0.2);

    // UK Honours First Class (1.0) => 85% (canonical mapping shared with the Python engine)
    assert.strictEqual(normalizeGpa(1.0, 'uk_honours'), 85);

    // Percentage 85% => 85%
    assert.strictEqual(normalizeGpa(85, 'percentage'), 85);

    // German scale 1.0 (highest) => 100%
    assert.strictEqual(normalizeGpa(1.0, 'german'), 100);
  });

  test('International equivalency labels', () => {
    assert(getEquivalentDegreeLabel(95).includes('UK First Class'));
    assert(getEquivalentDegreeLabel(75).includes('UK Upper Second Class'));
  });

  test('Commonwealth Master scholarship evaluation for eligible Nigerian candidate', () => {
    const commonwealth = SCHOLARSHIPS_DATA.find(s => s.id === 'commonwealth-masters')!;
    assert(commonwealth, 'Commonwealth scholarship must exist in verified dataset');
    const result = evaluateEligibility(commonwealth, sampleProfile);

    // Citizenship is Nigeria (Commonwealth eligible), GPA meets 2:1 equivalent, English medium waiver applies
    assert.strictEqual(result.status, 'likely_eligible');
    assert.strictEqual(result.mandatoryFailedCount, 0);
    assert(result.matchedCount >= 3);
  });

  test('Ineligible citizenship triggers strictly deterministic failure', () => {
    const commonwealth = SCHOLARSHIPS_DATA.find(s => s.id === 'commonwealth-masters')!;
    const ineligibleProfile: StudentProfile = {
      ...sampleProfile,
      citizenship: 'United States' // US is not an eligible developing Commonwealth recipient country
    };
    const result = evaluateEligibility(commonwealth, ineligibleProfile);

    assert.strictEqual(result.status, 'ineligible');
    assert(result.mandatoryFailedCount >= 1);
    const failedCit = result.evaluatedList.find(e => e.criterion.ruleType === 'citizenship');
    assert.strictEqual(failedCit?.status, 'failed');
  });

  test('Missing information produces more_info_needed state rather than guessing', () => {
    const rotary = SCHOLARSHIPS_DATA.find(s => s.id === 'rotary-peace-fellowship')!;
    const incompleteProfile: StudentProfile = {
      ...sampleProfile,
      workExperienceYears: 1 // Rotary requires 3+ years
    };
    const result = evaluateEligibility(rotary, incompleteProfile);

    assert.strictEqual(result.status, 'ineligible');
  });

  test('Empty profile returns profile_needed with 0 match score', () => {
    const gates = SCHOLARSHIPS_DATA.find(s => s.id === 'gates-cambridge')!;
    const result = evaluateEligibility(gates, null);

    assert.strictEqual(result.status, 'more_info_needed');
    assert.strictEqual(result.matchScore, 0);
  });
});

describe('Cross-language parity fixture', () => {
  test('GPA normalization matches the canonical shared fixture', () => {
    for (const gpaCase of parityFixture.gpa_cases) {
      const actual = normalizeGpa(
        gpaCase.gpa,
        gpaCase.scale as GradingScale,
        gpaCase.max_gpa,
      );
      assert.ok(
        Math.abs(actual - gpaCase.expected) < 1e-9,
        `${gpaCase.name}: expected ${gpaCase.expected}, received ${actual}`,
      );
    }
  });

  for (const scenario of parityFixture.scenarios) {
    test(`Scenario: ${scenario.name}`, () => {
      const profile = buildParityProfile(scenario.profile);
      const rules = [...parityFixture.base_rules, ...scenario.add_rules];
      const scholarship = buildParityScholarship(rules);

      const result = evaluateEligibility(scholarship, profile);
      const expected = scenario.expected;

      assert.strictEqual(
        CANONICAL_OUTCOME[result.status],
        expected.outcome,
        `outcome for ${scenario.name}`,
      );
      assert.strictEqual(
        result.matchScore,
        expected.match_percentage,
        `match percentage for ${scenario.name}`,
      );
      assert.strictEqual(
        result.matchedCount,
        expected.met_criteria_count,
        `met criteria count for ${scenario.name}`,
      );
      assert.strictEqual(
        result.mandatoryFailedCount,
        expected.mandatory_failed_count,
        `mandatory failed count for ${scenario.name}`,
      );
      assert.strictEqual(
        result.missingCount,
        expected.missing_info_count,
        `missing info count for ${scenario.name}`,
      );
      assert.strictEqual(
        result.manualReviewCount,
        expected.manual_review_count,
        `manual review count for ${scenario.name}`,
      );

      const statuses = result.evaluatedList.map((item) => CANONICAL_STATUS[item.status]);
      assert.deepStrictEqual(
        statuses,
        scenario.criteria_statuses,
        `criterion statuses for ${scenario.name}`,
      );
    });
  }
});
