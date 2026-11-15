import { test, expect } from '@playwright/test';

const scholarship = {
  id: 'example-award',
  slug: 'example-award',
  title: 'Example Award',
  provider_name: 'Example Provider',
  provider_category: 'Government',
  hero_image: null,
  destination_countries: ['India'],
  host_institutions: 'Example University',
  study_levels: ['masters'],
  fields_of_study: ['Science'],
  total_award_value: 'Tuition support',
  award_details: null,
  estimated_usd_value: 1000,
  application_deadline: null,
  academic_year: '2026/2027',
  last_verified_at: null,
  official_source_url: 'https://source.example/award',
  official_application_url: 'https://provider.example/apply',
  source_domain: 'provider.example',
  overview: 'An example opportunity.',
  criteria: [],
};

test.beforeEach(async ({ page }) => {
  await page.route('**/api/v1/scholarships/**', async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith('/example-award/')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ...scholarship,
          application_instructions: [],
          required_documents: [],
          provenance: {
            source_name: 'Example Source',
            source_record_url: 'https://source.example/award',
            collected_at: null,
            source_id: 'example',
          },
        }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        page: Number(url.searchParams.get('page') ?? '1'),
        page_size: 50,
        total_count: 1,
        results: [scholarship],
      }),
    });
  });
  await page.goto('/');
});

test('hero renders display quote', async ({ page }) => {
  await expect(page.getByText('Your future deserves to be funded.')).toBeVisible();
});

test('Get Started opens profile builder', async ({ page }) => {
  await page.getByRole('button', { name: 'Get Started' }).first().click();
  await expect(page.getByText('Step 1 of 4')).toBeVisible();
});

test('Explore button navigates to explorer', async ({ page }) => {
  await page.getByRole('button', { name: 'Explore Scholarships' }).first().click();
  await expect(
    page.getByRole('heading', { level: 1 }).first()
  ).toBeVisible();
});

test('featured scholarship card opens details page', async ({ page }) => {
  const featured = page
    .locator('section')
    .filter({ hasText: /Scholarships worth your time/i })
    .locator('h3')
    .first();
  await featured.click();
  await expect(page).toHaveURL(/\/scholarship\//);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});
