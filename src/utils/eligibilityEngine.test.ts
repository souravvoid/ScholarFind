import { describe, test } from 'node:test';
import assert from 'node:assert';
import { normalizeGpa, evaluateEligibility, getEquivalentDegreeLabel } from './eligibilityEngine';
import { SCHOLARSHIPS_DATA } from '../data/scholarshipsData';
import { StudentProfile } from '../types';

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

    // UK Honours First Class (1.0) => 95%
    assert.strictEqual(normalizeGpa(1.0, 'uk_honours'), 95);

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
