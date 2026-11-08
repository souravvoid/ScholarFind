import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('hero renders display quote', async ({ page }) => {
  await expect(page.getByText('Your future deserves to be funded.')).toBeVisible();
});

test('Get Started opens profile builder', async ({ page }) => {
  await page.getByRole('button', { name: 'Get Started' }).first().click();
  await expect(page.getByText('Step 2 of 4')).toBeVisible();
});

test('Explore button navigates to explorer', async ({ page }) => {
  await page.getByRole('button', { name: 'Explore Scholarships' }).first().click();
  await expect(
    page.getByRole('heading', { level: 1 }).first()
  ).toBeVisible();
});

test('featured scholarship card opens details modal', async ({ page }) => {
  const featured = page
    .locator('section')
    .filter({ hasText: /Scholarships worth your time/i })
    .locator('h3')
    .first();
  await featured.click();
  await expect(page.getByRole('dialog')).toBeVisible();
});
