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
    graduationYear: '2025',
    primaryField: 'Computer Science & Artificial Intelligence (STEM)',
    facultyTags: ['Computer Science', 'STEM'],
    researchKeywords: ['Machine Learning', 'Data Ethics'],
    targetDegrees: ['masters'],
    targetRegions: ['Western & Northern Europe'],
    targetCountries: ['United Kingdom'],
    deliveryModality: 'on_campus',
    intendedStartTerm: 'Fall 2025',
    workExperienceYears: 2,
    englishTestType: 'none',
    englishScore: '',
    hasEnglishMediumInstruction: true,
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString()
  };

  test('GPA standardization across global systems', () => {
    // 3.82 / 4.0 => 95.5%
    expect(normalizeGpa(3.82, 'gpa_4_0', 4.0)).toBeCloseTo(95.5, 1);

    // 4.82 / 5.0 => 96.4%
    expect(normalizeGpa(4.82, 'gpa_5_0', 5.0)).toBeCloseTo(96.4, 1);

    // UK Honours First Class (1.0) => 95%
    expect(normalizeGpa(1.0, 'uk_honours')).toBe(95);

    // Percentage 85% => 85%
    expect(normalizeGpa(85, 'percentage')).toBe(85);

    // German scale 1.0 (highest) => 100%
    expect(normalizeGpa(1.0, 'german')).toBe(100);
  });

  test('International equivalency labels', () => {
    expect(getEquivalentDegreeLabel(95)).toContain('UK First Class');
    expect(getEquivalentDegreeLabel(75)).toContain('UK Upper Second Class');
  });

  test('Commonwealth Master scholarship evaluation for eligible Nigerian candidate', () => {
    const commonwealth = SCHOLARSHIPS_DATA.find(s => s.id === 'commonwealth-masters')!;
    const result = evaluateEligibility(commonwealth, sampleProfile);

    // Citizenship is Nigeria (Commonwealth eligible), GPA meets 2:1 equivalent, English medium waiver applies
    expect(result.status).toBe('likely_eligible');
    expect(result.mandatoryFailedCount).toBe(0);
    expect(result.matchedCount).toBeGreaterThanOrEqual(3);
  });

  test('Ineligible citizenship triggers strictly deterministic failure', () => {
    const commonwealth = SCHOLARSHIPS_DATA.find(s => s.id === 'commonwealth-masters')!;
    const ineligibleProfile: StudentProfile = {
      ...sampleProfile,
      citizenship: 'United States' // US is not an eligible developing Commonwealth recipient country
    };
    const result = evaluateEligibility(commonwealth, ineligibleProfile);

    expect(result.status).toBe('ineligible');
    expect(result.mandatoryFailedCount).toBeGreaterThanOrEqual(1);
    const failedCit = result.evaluatedList.find(e => e.criterion.ruleType === 'citizenship');
    expect(failedCit?.status).toBe('failed');
  });

  test('Missing information produces more_info_needed state rather than guessing', () => {
    const rotary = SCHOLARSHIPS_DATA.find(s => s.id === 'rotary-peace-fellowship')!;
    const incompleteProfile: StudentProfile = {
      ...sampleProfile,
      workExperienceYears: 1 // Rotary requires 3+ years
    };
    const result = evaluateEligibility(rotary, incompleteProfile);

    expect(result.status).toBe('ineligible');
  });

  test('Empty profile returns profile_needed with 0 match score', () => {
    const gates = SCHOLARSHIPS_DATA.find(s => s.id === 'gates-cambridge')!;
    const result = evaluateEligibility(gates, null);

    expect(result.status).toBe('more_info_needed');
    expect(result.matchScore).toBe(0);
  });
});
