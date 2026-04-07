import type { Page } from '@playwright/test';

// ── Seed credentials ────────────────────────────────────────────────────────────

export const GM_EMAIL = 'gm@arcaneledger.app';
export const GM_PASSWORD = 'user';

// ── Helpers ─────────────────────────────────────────────────────────────────────

/**
 * Log in via the UI login form and wait for redirect to /campaigns.
 */
export async function login(page: Page, email: string, password: string) {
  await page.goto('/en/login');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL('**/campaigns', { timeout: 10000 });
}
