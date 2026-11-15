import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  getScholarshipBySlug,
  getScholarshipsFromDatabase,
} from './catalogueService';

function summary(slug: string) {
  return {
    id: slug,
    slug,
    title: `Title ${slug}`,
    provider_name: 'Example Provider',
    provider_category: 'Government',
    hero_image: null,
    destination_countries: ['India'],
    host_institutions: null,
    study_levels: ['masters'],
    fields_of_study: ['Science'],
    total_award_value: 'Tuition',
    award_details: null,
    estimated_usd_value: 1000,
    application_deadline: null,
    academic_year: '2026/2027',
    last_verified_at: null,
    official_source_url: 'https://source.example/award',
    official_application_url: 'https://provider.example/apply',
    source_domain: 'provider.example',
    overview: 'An example award.',
    criteria: [],
  };
}

function response(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function withFetch(
  implementation: typeof fetch,
  run: () => Promise<void>,
): Promise<void> {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = implementation;
  try {
    await run();
  } finally {
    globalThis.fetch = originalFetch;
  }
}

describe('catalogue service', () => {
  test('loads all API pages and maps slug IDs and unknown deadlines', async () => {
    const calls: string[] = [];
    await withFetch(async (input) => {
      const url = new URL(String(input), 'http://localhost');
      calls.push(url.searchParams.get('page') ?? '');
      const page = Number(url.searchParams.get('page'));
      return response({
        page,
        page_size: 50,
        total_count: 51,
        results: page === 1
          ? Array.from({ length: 50 }, (_, index) => summary(`award-${index}`))
          : [summary('award-last')],
      });
    }, async () => {
      const result = await getScholarshipsFromDatabase();
      assert.equal(result.fromDatabase, true);
      assert.equal(result.data.length, 51);
      assert.equal(result.data[0].id, 'award-0');
      assert.equal(result.data[0].slug, 'award-0');
      assert.equal(result.data[0].applicationDeadline, null);
      assert.equal(result.data[0].daysRemaining, null);
      assert.deepEqual(calls, ['1', '2']);
    });
  });

  test('maps hero images, coverage types, and funding nature from the API', async () => {
    await withFetch(async () =>
      response({
        page: 1,
        page_size: 50,
        total_count: 1,
        results: [
          {
            ...summary('image-award'),
            hero_image: 'https://img.example/award.jpg',
            coverage_types: ['full_ride', 'stipend'],
            funding_nature: ['need'],
          },
        ],
      }),
    async () => {
      const result = await getScholarshipsFromDatabase();
      assert.equal(result.fromDatabase, true);
      assert.equal(result.data[0].heroImage, 'https://img.example/award.jpg');
      assert.deepEqual(result.data[0].coverageTypes, ['full_ride', 'stipend']);
      assert.deepEqual(result.data[0].fundingNature, ['need']);
    });
  });

  test('keeps API empty results empty rather than using bundled records', async () => {
    await withFetch(async () => response({
      page: 1,
      page_size: 50,
      total_count: 0,
      results: [],
    }), async () => {
      const result = await getScholarshipsFromDatabase();
      assert.equal(result.fromDatabase, true);
      assert.deepEqual(result.data, []);
      assert.equal(result.error, undefined);
    });
  });

  test('uses bundled records when the catalogue API is unreachable or returns a server error', async () => {
    await withFetch(async () => {
      throw new TypeError('network unavailable');
    }, async () => {
      const result = await getScholarshipsFromDatabase();
      assert.equal(result.fromDatabase, false);
      assert.ok(result.data.length > 0);
      assert.equal(result.data[0].id, result.data[0].slug);
      assert.match(result.error ?? '', /offline catalogue/i);
    });
    await withFetch(async () => response({ detail: 'not found' }, 404), async () => {
      const result = await getScholarshipsFromDatabase();
      assert.equal(result.fromDatabase, false);
      assert.ok(result.data.length > 0);
      assert.match(result.error ?? '', /offline catalogue/i);
    });

    await withFetch(async () => response({}, 503), async () => {
      const result = await getScholarshipsFromDatabase();
      assert.equal(result.fromDatabase, false);
      assert.ok(result.data.length > 0);
      assert.match(result.error ?? '', /offline catalogue/i);
    });
  });

  test('loads detail by slug and maps documents and provenance', async () => {
    await withFetch(async () => response({
      ...summary('award-detail'),
      application_instructions: ['Submit an application.'],
      required_documents: [{
        id: 1,
        document_name: 'Transcript',
        description: null,
        is_mandatory: true,
      }],
      provenance: {
        source_name: 'Example Source',
        source_record_url: 'https://source.example/award',
        collected_at: null,
        source_id: 'example',
      },
    }), async () => {
      const result = await getScholarshipBySlug('award-detail');
      assert.equal(result.fromDatabase, true);
      assert.equal(result.notFound, false);
      assert.equal(result.data?.requiredDocuments[0], 'Transcript');
      assert.equal(result.data?.applicationInstructions?.[0], 'Submit an application.');
      assert.equal(result.data?.provenance?.collectedAt, undefined);
    });
  });

  test('does not hide detail 404s or server failures with static records', async () => {
    await withFetch(async () => response({ detail: 'not found' }, 404), async () => {
      const result = await getScholarshipBySlug('not-listed');
      assert.equal(result.data, null);
      assert.equal(result.notFound, true);
      assert.equal(result.fromDatabase, true);
    });

    await withFetch(async () => response({}, 503), async () => {
      const result = await getScholarshipBySlug('award-detail');
      assert.equal(result.data, null);
      assert.equal(result.notFound, false);
      assert.match(result.error ?? '', /503/);
    });
  });
});
