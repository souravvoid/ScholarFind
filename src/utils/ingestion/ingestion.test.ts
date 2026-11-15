import test from 'node:test';
import assert from 'node:assert/strict';

import {
  IngestionPipeline,
  runAllThreeSourceIngestions,
  CommonwealthSourceClient,
  DAADSourceClient,
  FulbrightSourceClient,
  IngestionStorage,
  normalizeDate,
  normalizeCurrency,
  normalizeCountries,
  normalizeStudyLevels,
  validateRawPayload,
  IngestionValidationError
} from './index';

test('Normalizers Unit Tests', async (t) => {
  await t.test('normalizeDate converts ISO strings and calculates positive days remaining', () => {
    const res = normalizeDate('2026-12-31T23:59:00Z');
    assert.equal(res.isoDate, '2026-12-31');
    assert.ok(typeof res.daysRemaining === 'number');
  });

  await t.test('normalizeCurrency handles GBP, EUR, and USD with correct parity estimates', () => {
    const gbp = normalizeCurrency('GBP', 54000);
    assert.equal(gbp.currencyCode, 'GBP');
    assert.ok(gbp.totalAwardValue.includes('£'));
    assert.equal(gbp.estimatedUSDValue, Math.round(54000 * 1.30));

    const eur = normalizeCurrency('EUR', 42000);
    assert.equal(eur.currencyCode, 'EUR');
    assert.ok(eur.totalAwardValue.includes('€'));
    assert.equal(eur.estimatedUSDValue, Math.round(42000 * 1.08));

    const usd = normalizeCurrency('USD', 72000);
    assert.equal(usd.currencyCode, 'USD');
    assert.ok(usd.totalAwardValue.includes('$'));
    assert.equal(usd.estimatedUSDValue, 72000);
  });

  await t.test('normalizeCountries canonicalizes regional country names and assigns appropriate flag', () => {
    const uk = normalizeCountries(['UK', 'England']);
    assert.deepEqual(uk.destinationCountries, ['United Kingdom']);
    assert.equal(uk.destinationFlag, '🇬🇧');

    const de = normalizeCountries(['Deutschland']);
    assert.deepEqual(de.destinationCountries, ['Germany']);
    assert.equal(de.destinationFlag, '🇩🇪');

    const us = normalizeCountries(['USA']);
    assert.deepEqual(us.destinationCountries, ['United States']);
    assert.equal(us.destinationFlag, '🇺🇸');
  });

  await t.test('normalizeStudyLevels maps degrees into standard taxonomy', () => {
    const levels = normalizeStudyLevels(["Master's Degree (MA/MS)", 'MSc in Governance', 'Doctoral Research / PhD']);
    assert.ok(levels.includes('masters'));
    assert.ok(levels.includes('phd'));
  });
});

test('Validators Unit Tests', async (t) => {
  await t.test('validateRawPayload enforces HTTPS URLs', () => {
    assert.throws(() => {
      validateRawPayload({
        source_record_id: 'TEST-1',
        title: 'Valid Scholarship Title Here',
        provider_name: 'Official Agency',
        provider_category: 'Government Endowment',
        destination_countries: ['United Kingdom'],
        study_levels: ['masters'],
        academic_fields: ['Science'],
        raw_award_currency: 'USD',
        raw_award_amount: 50000,
        award_summary: 'Full funding',
        raw_deadline: '2026-12-01',
        academic_cycle: '2026/2027',
        official_source_url: 'http://insecure.org', // Insecure HTTP
        official_application_url: 'https://secure.org/apply',
        required_documents: [],
        application_instructions: [],
        eligibility_clauses: [{
          rule_type: 'citizenship',
          title: 'Citizenship',
          description: 'Desc',
          is_mandatory: true,
          source_citation: 'Citation'
        }]
      });
    }, IngestionValidationError);
  });

  await t.test('validateRawPayload rejects empty eligibility criteria', () => {
    assert.throws(() => {
      validateRawPayload({
        source_record_id: 'TEST-1',
        title: 'Valid Scholarship Title Here',
        provider_name: 'Official Agency',
        provider_category: 'Government Endowment',
        destination_countries: ['United Kingdom'],
        study_levels: ['masters'],
        academic_fields: ['Science'],
        raw_award_currency: 'USD',
        raw_award_amount: 50000,
        award_summary: 'Full funding',
        raw_deadline: '2026-12-01',
        academic_cycle: '2026/2027',
        official_source_url: 'https://secure.org',
        official_application_url: 'https://secure.org/apply',
        required_documents: [],
        application_instructions: [],
        eligibility_clauses: [] // Empty rules
      });
    }, IngestionValidationError);
  });
});

test('Modular Ingestion Pipeline Across 3 Distinct Public APIs', async (t) => {
  const storage = new IngestionStorage();

  await t.test('Ingests UK Commonwealth Scholarship source with provenance & logging', async () => {
    const client = new CommonwealthSourceClient();
    const pipeline = new IngestionPipeline(client, storage);
    const result = await pipeline.run();

    assert.equal(result.status, 'SUCCESS');
    assert.equal(result.sourceId, 'src_csc_uk');
    assert.equal(result.recordsFetched, 1);
    assert.equal(result.recordsNormalized, 1);
    assert.equal(result.recordsStoredNew, 1);
    assert.equal(result.duplicatesPrevented, 0);
    assert.ok(result.logs.length > 0);

    const rec = result.normalizedRecords[0];
    assert.equal(rec.destinationCountries[0], 'United Kingdom');
    assert.equal(rec.destinationFlag, '🇬🇧');
    assert.ok(rec.provenance);
    assert.equal(rec.provenance.sourceId, 'src_csc_uk');
  });

  await t.test('Ingests DAAD German Academic Exchange Service source with EUR normalization', async () => {
    const client = new DAADSourceClient();
    const pipeline = new IngestionPipeline(client, storage);
    const result = await pipeline.run();

    assert.equal(result.status, 'SUCCESS');
    assert.equal(result.sourceId, 'src_daad_de');
    assert.equal(result.recordsFetched, 1);
    assert.equal(result.recordsStoredNew, 1);

    const rec = result.normalizedRecords[0];
    assert.equal(rec.destinationCountries[0], 'Germany');
    assert.equal(rec.destinationFlag, '🇩🇪');
    assert.ok(rec.totalAwardValue.includes('€'));
    assert.ok(rec.estimatedUSDValue > 0);
  });

  await t.test('Ingests Fulbright Foreign Student Program source with USD normalization', async () => {
    const client = new FulbrightSourceClient();
    const pipeline = new IngestionPipeline(client, storage);
    const result = await pipeline.run();

    assert.equal(result.status, 'SUCCESS');
    assert.equal(result.sourceId, 'src_fulbright_us');
    assert.equal(result.recordsFetched, 1);
    assert.equal(result.recordsStoredNew, 1);

    const rec = result.normalizedRecords[0];
    assert.equal(rec.destinationCountries[0], 'United States');
    assert.equal(rec.destinationFlag, '🇺🇸');
    assert.ok(rec.totalAwardValue.includes('$'));
    assert.equal(rec.estimatedUSDValue, 72000);
  });

  await t.test('Pipeline idempotency: re-running all 3 sources prevents duplicate insertions', async () => {
    const initialCount = storage.count();
    assert.equal(initialCount, 3);

    const multiRes = await runAllThreeSourceIngestions(storage);
    assert.equal(multiRes.overallStatus, 'SUCCESS');
    assert.equal(multiRes.totalRecordsFetched, 3);
    assert.equal(multiRes.totalNewStored, 0, 'Zero new records should be inserted on duplicate run');
    assert.equal(multiRes.totalDuplicatesPrevented, 3, 'All 3 records must be caught by deduplication index');
    assert.equal(storage.count(), initialCount, 'Total storage count must remain constant');
  });
});
