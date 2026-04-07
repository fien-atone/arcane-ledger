import { test, expect } from '@playwright/test';

test.describe('Internationalization (i18n)', () => {
  test('landing page at /en shows English content', async ({ page }) => {
    await page.goto('/en');

    // English hero text
    await expect(page.getByText('Your campaign.')).toBeVisible();
    await expect(page.getByText('Remembered.')).toBeVisible();

    // English nav items
    await expect(page.getByText('Features', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Roadmap', { exact: true }).first()).toBeVisible();
  });

  test('clicking language toggle switches to Russian', async ({ page }) => {
    await page.goto('/en');

    // The toggle button shows "RU" when current lang is English
    const langToggle = page.locator('button').filter({ hasText: 'RU' });
    await expect(langToggle).toBeVisible();
    await langToggle.click();

    // URL should change to /ru
    await expect(page).toHaveURL(/\/ru$/);

    // Russian content should appear
    await expect(page.getByText('Твоя кампания.')).toBeVisible();
    await expect(page.getByText('Сохранена.')).toBeVisible();
  });

  test('navigating directly to /ru shows Russian content', async ({ page }) => {
    await page.goto('/ru');

    // Russian hero text
    await expect(page.getByText('Твоя кампания.')).toBeVisible();
    await expect(page.getByText('Сохранена.')).toBeVisible();

    // Russian nav items
    await expect(page.getByText('Возможности', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Планы', { exact: true }).first()).toBeVisible();
  });
});
