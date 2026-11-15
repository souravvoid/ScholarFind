/**
 * ScholarFind Modular Ingestion Pipeline Engine (Frontend TypeScript Implementation)
 * Orchestrates multi-stage ingestion with:
 * 1. Fetching from distinct public sources with retry
 * 2. Normalization (dates, currencies, countries, education levels)
 * 3. Validation against production schemas
 * 4. Deduplication and idempotent storage
 * 5. Robust logging of successes and failure states
 */

import { Scholarship } from '../../types';
import { RawApiScholarshipPayload, IngestionJobResult, IngestionLogEntry } from './types';
import { SourceApiClient, CommonwealthSourceClient, DAADSourceClient, FulbrightSourceClient } from './sources';
import { 
  normalizeDate, 
  normalizeCurrency, 
  normalizeCountries, 
  normalizeStudyLevels, 
  normalizeCriteria 
} from './normalizers';
import { validateRawPayload, validateNormalizedRecord } from './validators';
import { IngestionStorage, SHARED_INGESTION_STORAGE } from './storage';

export class IngestionPipeline {
  private logs: IngestionLogEntry[] = [];

  constructor(
    private sourceClient: SourceApiClient,
    private storage: IngestionStorage = SHARED_INGESTION_STORAGE
  ) {}

  private log(
    level: IngestionLogEntry['level'],
    stage: IngestionLogEntry['stage'],
    message: string,
    details?: Record<string, any>
  ): void {
    const entry: IngestionLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      sourceId: this.sourceClient.metadata.sourceId,
      sourceName: this.sourceClient.metadata.sourceName,
      level,
      stage,
      message,
      details
    };
    this.logs.push(entry);

    // Also output to console with structured tag
    const prefix = `[ScholarFind Ingestion][${entry.level}][${entry.stage}][${entry.sourceId}]`;
    if (level === 'ERROR') {
      console.error(`${prefix} ${message}`, details || '');
    } else if (level === 'WARN') {
      console.warn(`${prefix} ${message}`, details || '');
    } else {
      console.info(`${prefix} ${message}`);
    }
  }

  /**
   * Executes the full ingestion lifecycle.
   */
  async run(): Promise<IngestionJobResult> {
    const startTime = Date.now();
    const startIso = new Date().toISOString();
    const sourceMeta = this.sourceClient.metadata;
    const errors: string[] = [];
    const normalizedRecords: Scholarship[] = [];

    this.log('INFO', 'FETCH', `Initiating ingestion job for ${sourceMeta.sourceName} (${sourceMeta.sourceId}).`);
    this.log('INFO', 'FETCH', `Access legal license: ${sourceMeta.license}`);

    let rawPayloads: RawApiScholarshipPayload[] = [];
    try {
      rawPayloads = await this.sourceClient.fetchRecords();
      this.log('INFO', 'FETCH', `Successfully fetched ${rawPayloads.length} raw payloads from API endpoint.`);
    } catch (err: any) {
      const errMsg = `Fetch failure from ${sourceMeta.sourceName}: ${err?.message || err}`;
      this.log('ERROR', 'FETCH', errMsg);
      errors.push(errMsg);

      return {
        jobId: `job-${sourceMeta.sourceId}-${Date.now()}`,
        sourceId: sourceMeta.sourceId,
        sourceName: sourceMeta.sourceName,
        status: 'FAILED',
        startedAt: startIso,
        completedAt: new Date().toISOString(),
        elapsedMs: Date.now() - startTime,
        recordsFetched: 0,
        recordsNormalized: 0,
        recordsValidated: 0,
        recordsStoredNew: 0,
        duplicatesPrevented: 0,
        normalizedRecords: [],
        errors,
        logs: [...this.logs]
      };
    }

    // Process each raw payload
    let storedNewCount = 0;
    let dupesPreventedCount = 0;

    for (const raw of rawPayloads) {
      try {
        // Step 1: Pre-validation of raw payload
        validateRawPayload(raw);

        // Step 2: Normalization
        this.log('INFO', 'NORMALIZE', `Normalizing scholarship "${raw.title}" (${raw.source_record_id}).`);

        const slug = raw.source_record_id.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const { isoDate, daysRemaining } = normalizeDate(raw.raw_deadline);
        const { totalAwardValue, estimatedUSDValue } = normalizeCurrency(raw.raw_award_currency, raw.raw_award_amount);
        const { destinationCountries, destinationFlag } = normalizeCountries(raw.destination_countries);
        const studyLevels = normalizeStudyLevels(raw.study_levels);
        const criteria = normalizeCriteria(slug, raw.eligibility_clauses);

        // Domain extraction
        let sourceDomain = 'official.registry';
        try {
          const urlObj = new URL(raw.official_source_url);
          sourceDomain = urlObj.hostname;
        } catch {
          sourceDomain = 'official.registry';
        }

        const normalized: Scholarship = {
          id: slug,
          slug,
          title: raw.title,
          providerName: raw.provider_name,
          providerCategory: raw.provider_category as any || 'Government Endowment',
          heroImage: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1200&q=80',
          destinationCountries,
          destinationFlag,
          hostInstitutions: raw.host_institutions || [],
          studyLevels,
          fieldsOfStudy: raw.academic_fields || ['All Disciplines'],
          totalAwardValue,
          awardDetails: raw.award_details || raw.award_summary,
          coverageTypes: (raw.coverage_types as any) || ['full_tuition', 'stipend', 'travel', 'health'],
          estimatedUSDValue,
          applicationDeadline: isoDate,
          daysRemaining,
          academicYear: raw.academic_cycle || '2026/2027',
          lastVerified: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          officialSourceUrl: raw.official_source_url,
          officialApplicationUrl: raw.official_application_url,
          sourceDomain,
          requiredDocuments: raw.required_documents || [],
          applicationInstructions: raw.application_instructions || [],
          overview: raw.award_details || raw.award_summary,
          criteria,
          provenance: {
            sourceName: sourceMeta.sourceName,
            sourceRecordUrl: raw.official_source_url,
            collectedAt: new Date().toISOString(),
            sourceId: sourceMeta.sourceId
          }
        };

        // Step 3: Schema Validation
        validateNormalizedRecord(normalized);
        this.log('INFO', 'VALIDATE', `Validation passed for "${normalized.title}". Rules count: ${criteria.length}.`);

        // Step 4: Idempotent Storage & Deduplication
        const isNew = this.storage.upsert(normalized, raw.checksum);
        if (isNew) {
          storedNewCount++;
          this.log('INFO', 'PERSIST', `Stored new record [${normalized.id}].`);
        } else {
          dupesPreventedCount++;
          this.log('INFO', 'PERSIST', `Duplicate record detected for [${normalized.id}]. Idempotent upsert updated existing entry.`);
        }

        normalizedRecords.push(normalized);
      } catch (err: any) {
        const errMsg = `Processing error for ${raw.source_record_id || 'record'}: ${err?.message || err}`;
        this.log('ERROR', 'VALIDATE', errMsg, { error: String(err) });
        errors.push(errMsg);
      }
    }

    const elapsed = Date.now() - startTime;
    const finalStatus: IngestionJobResult['status'] = 
      errors.length === 0 ? 'SUCCESS' : normalizedRecords.length > 0 ? 'COMPLETED_WITH_WARNINGS' : 'FAILED';

    this.log(
      finalStatus === 'SUCCESS' ? 'INFO' : 'WARN',
      'COMPLETE',
      `Ingestion completed for ${sourceMeta.sourceName} in ${elapsed}ms. Status: ${finalStatus}. New: ${storedNewCount}, Dupes handled: ${dupesPreventedCount}.`
    );

    return {
      jobId: `job-${sourceMeta.sourceId}-${Date.now()}`,
      sourceId: sourceMeta.sourceId,
      sourceName: sourceMeta.sourceName,
      status: finalStatus,
      startedAt: startIso,
      completedAt: new Date().toISOString(),
      elapsedMs: elapsed,
      recordsFetched: rawPayloads.length,
      recordsNormalized: normalizedRecords.length,
      recordsValidated: normalizedRecords.length,
      recordsStoredNew: storedNewCount,
      duplicatesPrevented: dupesPreventedCount,
      normalizedRecords,
      errors,
      logs: [...this.logs]
    };
  }
}

/**
 * High-level runner orchestrating ingestion across all 3 distinct public API sources.
 */
export async function runAllThreeSourceIngestions(
  storage: IngestionStorage = SHARED_INGESTION_STORAGE
): Promise<{
  results: IngestionJobResult[];
  totalRecordsFetched: number;
  totalNewStored: number;
  totalDuplicatesPrevented: number;
  overallStatus: 'SUCCESS' | 'COMPLETED_WITH_WARNINGS' | 'FAILED';
}> {
  const sources: SourceApiClient[] = [
    new CommonwealthSourceClient(),
    new DAADSourceClient(),
    new FulbrightSourceClient()
  ];

  const results: IngestionJobResult[] = [];
  let totalFetched = 0;
  let totalNew = 0;
  let totalDupes = 0;

  for (const client of sources) {
    const pipeline = new IngestionPipeline(client, storage);
    const res = await pipeline.run();
    results.push(res);

    totalFetched += res.recordsFetched;
    totalNew += res.recordsStoredNew;
    totalDupes += res.duplicatesPrevented;
  }

  const anyFailures = results.some(r => r.status === 'FAILED');
  const anyWarnings = results.some(r => r.status === 'COMPLETED_WITH_WARNINGS');

  return {
    results,
    totalRecordsFetched: totalFetched,
    totalNewStored: totalNew,
    totalDuplicatesPrevented: totalDupes,
    overallStatus: anyFailures ? 'FAILED' : anyWarnings ? 'COMPLETED_WITH_WARNINGS' : 'SUCCESS'
  };
}
