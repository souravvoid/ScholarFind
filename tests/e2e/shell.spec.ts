import { test, expect } from '@playwright/test';

const ROUTES = [
  { path: '/explore', heading: /explore|scholarship/i },
  { path: '/tracker', heading: /track|saved/i },
  { path: '/sources', heading: /source|verif|provenance/i },
];

test('every route renders its main landmark without horizontal overflow', async ({ page }) => {
  for (const route of ROUTES) {
    await page.goto(route.path);
    await expect(page.locator('#main')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow, `horizontal overflow on ${route.path}`).toBeLessThanOrEqual(1);
  }
});

test('desktop navigation updates the URL', async ({ page }) => {
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'Primary' });

  await nav.getByRole('link', { name: 'Explore' }).click();
  await expect(page).toHaveURL(/\/explore$/);

  await nav.getByRole('link', { name: /Tracked/ }).click();
  await expect(page).toHaveURL(/\/tracker$/);

  await nav.getByRole('link', { name: 'Sources' }).click();
  await expect(page).toHaveURL(/\/sources$/);
});

test('unknown route shows a recovery page', async ({ page }) => {
  await page.goto('/definitely-not-a-page');
  await expect(page.getByRole('heading', { name: /doesn't exist/i })).toBeVisible();
  await page.getByRole('link', { name: /catalogue/i }).click();
  await expect(page).toHaveURL(/\/explore$/);
});

test('mobile drawer opens, is keyboard dismissible, and navigates', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto('/');

  await page.getByRole('button', { name: 'Open navigation menu' }).click();
  const drawer = page.getByRole('dialog', { name: 'Navigation menu' });
  await expect(drawer).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(drawer).toBeHidden();

  await page.getByRole('button', { name: 'Open navigation menu' }).click();
  await drawer.getByRole('link', { name: /explore scholarships/i }).click();
  await expect(page).toHaveURL(/\/explore$/);
  await expect(page.getByRole('dialog', { name: 'Navigation menu' })).toBeHidden();
});
