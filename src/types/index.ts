export type DegreeLevel = 'secondary' | 'bachelors' | 'masters' | 'phd' | 'postdoc';

export type GradingScale = 
  | 'gpa_4_0' 
  | 'gpa_5_0' 
  | 'uk_honours' 
  | 'percentage' 
  | 'ects' 
  | 'german';

export interface StudentProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  // Step 1: Identity & Citizenship
  citizenship: string;
  residenceCountry: string;
  // Step 2: Academic Background & Ambition
  educationLevel: DegreeLevel;
  institution: string;
  gradingScale: GradingScale;
  gpa: number;
  maxGpa: number;
  graduationYear: string;
  primaryField: string;
  facultyTags: string[];
  researchKeywords: string[];
  targetDegrees: DegreeLevel[];
  targetRegions: string[];
  targetCountries: string[];
  deliveryModality: 'on_campus' | 'hybrid' | 'online';
  intendedStartTerm: string;
  // Step 3: Language & Tests
  workExperienceYears: number;
  englishTestType: 'ielts' | 'toefl' | 'duolingo' | 'none';
  englishScore: string;
  hasEnglishMediumInstruction: boolean;
  updatedAt: string;
  createdAt: string;
}

export type CriterionRuleType = 
  | 'citizenship'
  | 'degree_level'
  | 'field_of_study'
  | 'academic_score'
  | 'language'
  | 'work_experience'
  | 'deadline'
  | 'manual_review';

export interface EligibilityCriterion {
  id: string;
  ruleType: CriterionRuleType;
  title: string;
  description: string;
  isMandatory: boolean;
  sourceCitation: string;
  // Evaluation requirements
  allowedCitizenships?: string[]; // empty/undefined = global
  prohibitedCitizenships?: string[];
  requiredDegrees?: DegreeLevel[];
  applicableFields?: string[];
  minGpaNormalized?: number; // 0.0 - 100.0 scale
  minWorkYears?: number;
  requiresEnglishCert?: boolean;
  acceptsMediumOfInstructionWaiver?: boolean;
  minIelts?: number;
}

type EligibilityStatus = 
  | 'likely_eligible' 
  | 'more_info_needed' 
  | 'ineligible' 
  | 'needs_review';

export interface EvaluatedCriterion {
  criterion: EligibilityCriterion;
  status: 'passed' | 'missing' | 'failed' | 'needs_review';
  explanation: string;
}

export interface EligibilityEvaluationResult {
  scholarshipId: string;
  status: EligibilityStatus;
  statusLabel: string;
  matchScore: number; // 0 - 100 percentage
  evaluatedList: EvaluatedCriterion[];
  matchedCount: number;
  totalMandatoryCount: number;
  mandatoryFailedCount: number;
  missingCount: number;
  manualReviewCount: number;
  lastVerified: string;
}

export type CoverageType = 'full_ride' | 'full_tuition' | 'stipend' | 'travel' | 'health';
export type FundingBasis = 'merit' | 'need';

export interface Scholarship {
  id: string;
  slug: string;
  title: string;
  providerName: string;
  providerCategory: 'Official University Trust' | 'Government Endowment' | 'Private Foundation' | 'Multilateral Agency';
  heroImage: string;
  destinationCountries: string[];
  destinationFlag: string;
  hostInstitutions: string[];
  studyLevels: DegreeLevel[];
  fieldsOfStudy: string[];
  totalAwardValue: string;
  awardDetails: string;
  coverageTypes: CoverageType[];
  fundingNature?: FundingBasis[];
  estimatedUSDValue: number;
  applicationDeadline: string; // YYYY-MM-DD
  daysRemaining: number;
  academicYear: string;
  lastVerified: string;
  officialSourceUrl: string;
  officialApplicationUrl: string;
  sourceDomain: string;
  requiredDocuments: string[];
  applicationInstructions: string[];
  overview: string;
  criteria: EligibilityCriterion[];
  provenance: {
    sourceName: string;
    sourceRecordUrl: string;
    collectedAt: string;
    sourceId: string;
  };
}

export type TrackerStatus = 'interested' | 'preparing' | 'ready' | 'applied';

export interface SavedScholarship {
  id: string;
  userId: string;
  scholarshipId: string;
  scholarshipTitle: string;
  provider: string;
  destination: string;
  awardValue: string;
  deadline: string;
  status: TrackerStatus;
  completedDocs: string[];
  notes: string;
  reminderDate?: string;
  savedAt: string;
  updatedAt: string;
}

export interface IngestionSource {
  id: string;
  name: string;
  originAgency: string;
  country: string;
  flag: string;
  adapterModule: string;
  accessMethod: string;
  status: 'operational' | 'syncing' | 'verified';
  scholarshipCount: number;
  lastIngested: string;
  provenanceUrl: string;
  auditPrinciples: string;
}
