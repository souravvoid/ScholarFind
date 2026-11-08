/**
 * Schema Validation Engine for Ingestion Pipeline
 * Enforces production security, HTTPS endpoints, required fields, and non-empty criteria rulesets.
 */

import { Scholarship } from '../../types';
import { RawApiScholarshipPayload } from './types';

export class IngestionValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'IngestionValidationError';
  }
}

export function validateRawPayload(raw: RawApiScholarshipPayload): void {
  if (!raw.source_record_id || raw.source_record_id.trim().length === 0) {
    throw new IngestionValidationError('Missing required field: source_record_id', 'source_record_id');
  }

  if (!raw.title || raw.title.trim().length < 5) {
    throw new IngestionValidationError(`Scholarship title too short or empty: "${raw.title}"`, 'title');
  }

  if (!raw.provider_name || raw.provider_name.trim().length === 0) {
    throw new IngestionValidationError('Missing required field: provider_name', 'provider_name');
  }

  if (!raw.official_source_url || !raw.official_source_url.startsWith('https://')) {
    throw new IngestionValidationError(
      `Official source URL must enforce secure HTTPS: "${raw.official_source_url}"`,
      'official_source_url'
    );
  }

  if (!raw.official_application_url || !raw.official_application_url.startsWith('https://')) {
    throw new IngestionValidationError(
      `Official application URL must enforce secure HTTPS: "${raw.official_application_url}"`,
      'official_application_url'
    );
  }

  if (!raw.destination_countries || raw.destination_countries.length === 0) {
    throw new IngestionValidationError('Scholarship must declare at least one destination country', 'destination_countries');
  }

  if (!raw.eligibility_clauses || raw.eligibility_clauses.length === 0) {
    throw new IngestionValidationError('Scholarship record must contain at least one eligibility criterion clause', 'eligibility_clauses');
  }
}

export function validateNormalizedRecord(record: Scholarship): void {
  if (!record.id || record.id.trim().length === 0) {
    throw new IngestionValidationError('Normalized record must have a valid non-empty natural ID', 'id');
  }

  if (!record.title) {
    throw new IngestionValidationError('Normalized record missing title', 'title');
  }

  if (!record.criteria || record.criteria.length === 0) {
    throw new IngestionValidationError('Normalized record missing criteria ruleset', 'criteria');
  }

  if (!record.provenance || !record.provenance.sourceName) {
    throw new IngestionValidationError('Normalized record must include authoritative provenance metadata', 'provenance');
  }

  if (!record.officialApplicationUrl.startsWith('https://')) {
    throw new IngestionValidationError('Normalized application URL must be HTTPS', 'officialApplicationUrl');
  }
}
