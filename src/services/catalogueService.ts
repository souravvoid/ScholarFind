import { INGESTION_SOURCES } from '../data/sourcesData';
import { SCHOLARSHIPS_DATA } from '../data/scholarshipsData';
import type {
  CriterionRuleType,
  EligibilityCriterion,
  IngestionSource,
  Scholarship,
} from '../types';
import { calculateDaysRemaining, normalizeScholarshipWithCurrentDates } from './databaseService';

const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env ?? {};
const API_BASE = (env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '');
const PAGE_SIZE = 50;

type CatalogueErrorKind = 'network' | 'http' | 'invalid';

export class CatalogueApiError extends Error {
  readonly kind: CatalogueErrorKind;
  readonly status?: number;

  constructor(message: string, kind: CatalogueErrorKind, status?: number) {
    super(message);
    this.name = 'CatalogueApiError';
    this.kind = kind;
    this.status = status;
  }
}

interface ApiRule {
  id: string;
  rule_type: string;
  title: string;
  description: string;
  is_mandatory: boolean;
  source_citation: string;
  rule_payload: Record<string, unknown>;
  original_rule_type: string | null;
}

interface ApiScholarship {
  id: string;
  slug: string;
  title: string;
  provider_name: string;
  provider_category: string;
  hero_image: string | null;
  destination_countries: string[];
  host_institutions: string | null;
  study_levels: string[];
  fields_of_study: string[];
  total_award_value: string;
  award_details: string | null;
  estimated_usd_value: number;
  application_deadline: string | null;
  academic_year: string;
  last_verified_at: string;
  official_source_url: string;
  official_application_url: string;
  source_domain: string;
  overview: string;
  criteria: ApiRule[];
  application_instructions?: string[];
  required_documents?: Array<{
    id: number;
    document_name: string;
    description: string | null;
    is_mandatory: boolean;
  }>;
  provenance?: {
    source_name: string;
    source_record_url: string;
    collected_at: string | null;
    source_id: string;
  };
}

interface ApiPage<T> {
  page: number;
  page_size: number;
  total_count: number;
  results: T[];
}

interface ApiSource {
  id: number;
  name: string;
  origin_agency: string;
  country: string;
  adapter_module: string;
  access_method: string;
  provenance_url: string;
  is_active: boolean;
  last_ingested_at: string | null;
  scholarship_count?: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function parseRule(rule: ApiRule): EligibilityCriterion {
  const knownTypes: CriterionRuleType[] = [
    'citizenship',
    'degree_level',
    'field_of_study',
    'academic_score',
    'language',
    'work_experience',
    'deadline',
    'manual_review',
  ];
  const ruleType = knownTypes.includes(rule.rule_type as CriterionRuleType)
    ? (rule.rule_type as CriterionRuleType)
    : 'manual_review';
  const parameters = isRecord(rule.rule_payload) ? rule.rule_payload : {};
  const criterion: EligibilityCriterion = {
    id: rule.id,
    ruleType: rule.original_rule_type ? 'manual_review' : ruleType,
    title: rule.title,
    description: rule.description,
    isMandatory: rule.is_mandatory,
    sourceCitation: rule.source_citation,
  };

  if (criterion.ruleType === 'citizenship') {
    if (Array.isArray(parameters.allowed_citizenships)) {
      criterion.allowedCitizenships = parameters.allowed_citizenships.filter(isString);
    }
    if (Array.isArray(parameters.prohibited_citizenships)) {
      criterion.prohibitedCitizenships = parameters.prohibited_citizenships.filter(isString);
    }
  } else if (criterion.ruleType === 'degree_level') {
    if (Array.isArray(parameters.required_degrees)) {
      criterion.requiredDegrees = parameters.required_degrees.filter(isString) as EligibilityCriterion['requiredDegrees'];
    }
  } else if (criterion.ruleType === 'field_of_study') {
    if (Array.isArray(parameters.applicable_fields)) {
      criterion.applicableFields = parameters.applicable_fields.filter(isString);
    }
  } else if (criterion.ruleType === 'academic_score') {
    if (typeof parameters.min_gpa_normalized === 'number') {
      criterion.minGpaNormalized = parameters.min_gpa_normalized;
    }
  } else if (criterion.ruleType === 'language') {
    if (typeof parameters.requires_english_cert === 'boolean') {
      criterion.requiresEnglishCert = parameters.requires_english_cert;
    }
    if (typeof parameters.accepts_medium_of_instruction_waiver === 'boolean') {
      criterion.acceptsMediumOfInstructionWaiver =
        parameters.accepts_medium_of_instruction_waiver;
    }
    if (typeof parameters.min_ielts === 'number') {
      criterion.minIelts = parameters.min_ielts;
    }
  } else if (
    criterion.ruleType === 'work_experience' &&
    typeof parameters.min_work_years === 'number'
  ) {
    criterion.minWorkYears = parameters.min_work_years;
  }

  return criterion;
}

function parseScholarship(item: unknown, detail = false): Scholarship {
  if (!isRecord(item)) {
    throw new CatalogueApiError('Catalogue returned an invalid scholarship record.', 'invalid');
  }
  if (
    !isString(item.slug) ||
    !isString(item.title) ||
    !isString(item.provider_name) ||
    !isString(item.provider_category) ||
    !isString(item.total_award_value) ||
    !isString(item.academic_year) ||
    !isString(item.official_source_url) ||
    !isString(item.official_application_url) ||
    !isString(item.source_domain) ||
    !isString(item.overview) ||
    !Array.isArray(item.destination_countries) ||
    !Array.isArray(item.study_levels) ||
    !Array.isArray(item.fields_of_study) ||
    !Array.isArray(item.criteria) ||
    typeof item.estimated_usd_value !== 'number'
  ) {
    throw new CatalogueApiError('Catalogue returned a malformed scholarship record.', 'invalid');
  }
  if (detail && (!Array.isArray(item.required_documents) || !isRecord(item.provenance))) {
    throw new CatalogueApiError('Scholarship details are incomplete.', 'invalid');
  }

  const provenance = isRecord(item.provenance) ? item.provenance : undefined;
  const hostInstitutions = isString(item.host_institutions)
    ? item.host_institutions.split(',').map((value) => value.trim()).filter(Boolean)
    : [];
  const scholarship: Scholarship = {
    id: item.slug,
    slug: item.slug,
    title: item.title,
    providerName: item.provider_name,
    providerCategory: item.provider_category,
    ...(isString(item.hero_image) && item.hero_image ? { heroImage: item.hero_image } : {}),
    destinationCountries: item.destination_countries.filter(isString),
    hostInstitutions,
    studyLevels: item.study_levels.filter(isString) as Scholarship['studyLevels'],
    fieldsOfStudy: item.fields_of_study.filter(isString),
    totalAwardValue: item.total_award_value,
    ...(isString(item.award_details) ? { awardDetails: item.award_details } : {}),
    estimatedUSDValue: item.estimated_usd_value,
    applicationDeadline: isString(item.application_deadline) ? item.application_deadline : null,
    daysRemaining: calculateDaysRemaining(isString(item.application_deadline) ? item.application_deadline : null),
    academicYear: item.academic_year,
    ...(isString(item.last_verified_at) ? { lastVerified: item.last_verified_at } : {}),
    officialSourceUrl: item.official_source_url,
    officialApplicationUrl: item.official_application_url,
    sourceDomain: item.source_domain,
    requiredDocuments: Array.isArray(item.required_documents)
      ? item.required_documents
          .filter((document): document is Record<string, unknown> =>
            isRecord(document) && isString(document.document_name)
          )
          .map((document) => document.document_name as string)
      : [],
    ...(Array.isArray(item.application_instructions)
      ? { applicationInstructions: item.application_instructions.filter(isString) }
      : {}),
    overview: item.overview,
    criteria: item.criteria.filter(isRecord).map((rule) => parseRule(rule as unknown as ApiRule)),
    ...(provenance &&
    isString(provenance.source_name) &&
    isString(provenance.source_record_url) &&
    isString(provenance.source_id)
      ? {
          provenance: {
            sourceName: provenance.source_name,
            sourceRecordUrl: provenance.source_record_url,
            ...(isString(provenance.collected_at)
              ? { collectedAt: provenance.collected_at }
              : {}),
            sourceId: provenance.source_id,
          },
        }
      : {}),
  };
  return normalizeScholarshipWithCurrentDates(scholarship);
}

async function requestJson(path: string): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, { headers: { Accept: 'application/json' } });
  } catch {
    throw new CatalogueApiError(
      'Could not reach the ScholarFind catalogue API.',
      'network',
    );
  }
  if (!response.ok) {
    throw new CatalogueApiError(
      `Catalogue request failed with status ${response.status}.`,
      'http',
      response.status,
    );
  }
  try {
    return await response.json();
  } catch {
    throw new CatalogueApiError('Catalogue API returned invalid JSON.', 'invalid');
  }
}

function isPage(value: unknown): value is ApiPage<unknown> {
  return isRecord(value) &&
    typeof value.page === 'number' &&
    typeof value.page_size === 'number' &&
    typeof value.total_count === 'number' &&
    Array.isArray(value.results);
}

function staticScholarships(): Scholarship[] {
  return SCHOLARSHIPS_DATA.map((scholarship) => ({
    ...normalizeScholarshipWithCurrentDates(scholarship),
    id: scholarship.slug,
  }));
}

export async function getScholarshipsFromDatabase(): Promise<{
  data: Scholarship[];
  fromDatabase: boolean;
  error?: string;
}> {
  try {
    const records: unknown[] = [];
    let page = 1;
    let totalCount = 0;
    do {
      const payload = await requestJson(
        `/api/v1/scholarships/?page=${page}&page_size=${PAGE_SIZE}`,
      );
      if (!isPage(payload)) {
        throw new CatalogueApiError('Catalogue API returned an invalid page.', 'invalid');
      }
      records.push(...payload.results);
      totalCount = payload.total_count;
      page += 1;
      if (page > 1000) {
        throw new CatalogueApiError('Catalogue pagination exceeded its safety limit.', 'invalid');
      }
    } while (records.length < totalCount);

    return { data: records.map((item) => parseScholarship(item)), fromDatabase: true };
  } catch (error) {
    if (error instanceof CatalogueApiError && (error.kind === 'network' || error.kind === 'http' || error.kind === 'invalid')) {
      return {
        data: staticScholarships(),
        fromDatabase: false,
        error: 'Catalogue API is unavailable. Showing the bundled offline catalogue, which may be stale.',
      };
    }
    return {
      data: [],
      fromDatabase: false,
      error: error instanceof Error ? error.message : 'Could not load the catalogue.',
    };
  }
}

export async function getScholarshipBySlug(slug: string): Promise<{
  data: Scholarship | null;
  fromDatabase: boolean;
  notFound: boolean;
  error?: string;
}> {
  try {
    const payload = await requestJson(`/api/v1/scholarships/${encodeURIComponent(slug)}/`);
    return { data: parseScholarship(payload, true), fromDatabase: true, notFound: false };
  } catch (error) {
    if (error instanceof CatalogueApiError && error.status === 404) {
      return { data: null, fromDatabase: true, notFound: true };
    }
    if (error instanceof CatalogueApiError && error.kind === 'network') {
      const cached = staticScholarships().find((scholarship) => scholarship.slug === slug) ?? null;
      return {
        data: cached,
        fromDatabase: false,
        notFound: cached === null,
        error: 'Catalogue API is unavailable. Showing the bundled offline record, which may be stale.',
      };
    }
    return {
      data: null,
      fromDatabase: false,
      notFound: false,
      error: error instanceof Error ? error.message : 'Could not load scholarship details.',
    };
  }
}

function parseSource(item: unknown): IngestionSource {
  if (
    !isRecord(item) ||
    !isString(item.name) ||
    !isString(item.origin_agency) ||
    !isString(item.country) ||
    !isString(item.adapter_module) ||
    !isString(item.access_method) ||
    !isString(item.provenance_url) ||
    typeof item.is_active !== 'boolean'
  ) {
    throw new CatalogueApiError('Catalogue API returned an invalid source record.', 'invalid');
  }
  return {
    id: item.adapter_module,
    name: item.name,
    originAgency: item.origin_agency,
    country: item.country,
    adapterModule: item.adapter_module,
    accessMethod: item.access_method,
    status: item.is_active ? 'active' : 'inactive',
    scholarshipCount:
      typeof item.scholarship_count === 'number' ? item.scholarship_count : 0,
    lastIngested: isString(item.last_ingested_at) ? item.last_ingested_at : null,
    provenanceUrl: item.provenance_url,
  };
}

export async function getSourcesFromDatabase(): Promise<{
  data: IngestionSource[];
  fromDatabase: boolean;
  error?: string;
}> {
  try {
    const payload = await requestJson('/api/v1/scholarship-sources/?page_size=50');
    let records: unknown[];
    if (isPage(payload)) {
      records = [...payload.results];
      let page = payload.page + 1;
      while (records.length < payload.total_count && page <= 1000) {
        const nextPage = await requestJson(
          `/api/v1/scholarship-sources/?page=${page}&page_size=50`,
        );
        if (!isPage(nextPage)) {
          throw new CatalogueApiError('Catalogue API returned an invalid source page.', 'invalid');
        }
        records.push(...nextPage.results);
        page += 1;
      }
      if (records.length < payload.total_count) {
        throw new CatalogueApiError('Source pagination exceeded its safety limit.', 'invalid');
      }
    } else if (Array.isArray(payload)) {
      records = payload;
    } else {
      throw new CatalogueApiError('Catalogue API returned an invalid source list.', 'invalid');
    }
    return { data: records.map(parseSource), fromDatabase: true };
  } catch (error) {
    if (error instanceof CatalogueApiError && (error.kind === 'network' || error.kind === 'http' || error.kind === 'invalid')) {
      return {
        data: INGESTION_SOURCES,
        fromDatabase: false,
        error: 'Catalogue API is unavailable. Showing bundled source metadata, which may be stale.',
      };
    }
    return {
      data: [],
      fromDatabase: false,
      error: error instanceof Error ? error.message : 'Could not load source metadata.',
    };
  }
}
