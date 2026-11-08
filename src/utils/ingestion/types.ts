/**
 * ScholarFind Frontend Ingestion Pipeline — Type Definitions & Schemas
 * Python-inspired modular data modeling for client-side statutory scholarship ingestion.
 */

import { Scholarship, EligibilityCriterion, DegreeLevel } from '../../types';

export interface RawApiScholarshipPayload {
  source_record_id: string;
  title: string;
  provider_name: string;
  provider_category: string;
  destination_countries: string[];
  host_institutions?: string[];
  study_levels: string[];
  academic_fields: string[];
  raw_award_currency: string;
  raw_award_amount: number;
  award_summary: string;
  award_details?: string;
  coverage_types?: string[];
  raw_deadline: string;
  academic_cycle: string;
  official_source_url: string;
  official_application_url: string;
  required_documents: string[];
  application_instructions: string[];
  eligibility_clauses: {
    rule_type: string;
    title: string;
    description: string;
    is_mandatory: boolean;
    source_citation: string;
    parameters?: Record<string, any>;
  }[];
  checksum?: string;
}

export interface IngestionSourceMetadata {
  sourceId: string;
  sourceName: string;
  originAgency: string;
  country: string;
  flag: string;
  license: string;
  provenanceUrl: string;
  accessMethod: string;
  rateLimitPerSecond: number;
  limitations: string[];
}

export interface IngestionLogEntry {
  id: string;
  timestamp: string;
  sourceId: string;
  sourceName: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  stage: 'FETCH' | 'PARSE' | 'NORMALIZE' | 'VALIDATE' | 'PERSIST' | 'COMPLETE';
  message: string;
  details?: Record<string, any>;
}

export interface IngestionJobResult {
  jobId: string;
  sourceId: string;
  sourceName: string;
  status: 'SUCCESS' | 'COMPLETED_WITH_WARNINGS' | 'FAILED';
  startedAt: string;
  completedAt: string;
  elapsedMs: number;
  recordsFetched: number;
  recordsNormalized: number;
  recordsValidated: number;
  recordsStoredNew: number;
  duplicatesPrevented: number;
  normalizedRecords: Scholarship[];
  errors: string[];
  logs: IngestionLogEntry[];
}
