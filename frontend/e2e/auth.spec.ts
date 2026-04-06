import { test, expect } from '@playwright/test';
import { login, GM_EMAIL, GM_PASSWORD } from './helpers';

test.describe('Authentication', () => {
  test('login with valid credentials redirects to campaigns', async ({ page }) => {
    await login(page, GM_EMAIL, GM_PASSWORD);

    await expect(page).toHaveURL(/\/campaigns$/);
    // Campaigns page should render its heading
    await expect(page.getByText('My Campaigns')).toBeVisible();
  });

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/en/login');
    await page.locator('#email').fill('wrong@example.com');
    await page.locator('#password').fill('badpassword');
    await page.locator('button[type="submit"]').click();

    // Error message should appear — page should NOT navigate away
    await expect(page.getByText('Invalid credentials')).toBeVisible();
    await expect(page).toHaveURL(/\/en\/login/);
  });

  test('protected page redirects to login when not authenticated', async ({ page }) => {
    // Clear any stored session
    await page.context().clearCookies();
    await page.goto('/campaigns');

    // Should redirect to /login (possibly with lang prefix)
    await expect(page).toHaveURL(/\/login/);
  });
});
