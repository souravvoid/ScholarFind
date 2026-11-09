import { test, expect } from '@playwright/test';

test('login page renders and links to sign up', async ({ page }) => {
  await page.goto('/login');

  await expect(
    page.getByRole('heading', { level: 1, name: /welcome back/i }),
  ).toBeVisible();

  await page.getByRole('link', { name: /create an account/i }).click();
  await expect(page).toHaveURL(/\/signup$/);
  await expect(
    page.getByRole('heading', { level: 1, name: /create your scholarfind account/i }),
  ).toBeVisible();
});

test('sign up reports a password confirmation mismatch before calling the API', async ({ page }) => {
  await page.goto('/signup');

  await page.getByLabel('Email').fill('ada@example.com');
  await page.getByLabel('Password', { exact: true }).fill('ScholarFind-2026!x');
  await page.getByLabel('Confirm password', { exact: true }).fill('Different-Password-2026!x');
  await page.getByRole('button', { name: 'Create account' }).click();

  await expect(page.getByText('Passwords do not match.')).toBeVisible();
});
