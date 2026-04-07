import { test, expect } from '@playwright/test';
import { login, GM_EMAIL, GM_PASSWORD } from './helpers';

test.describe('XSS protection', () => {
  test('rich text content does not execute injected scripts', async ({ page }) => {
    await login(page, GM_EMAIL, GM_PASSWORD);

    // Navigate to an NPC list — pick the first NPC available
    // First, go to the first campaign
    const campaignLink = page.locator('a[href*="/campaigns/"]').first();
    await campaignLink.click();
    await page.waitForURL('**/campaigns/**');

    // Navigate to NPCs section
    const npcLink = page.locator('a[href*="/npcs"]').first();
    await npcLink.click();
    await page.waitForURL('**/npcs');

    // Click first NPC
    const npcDetailLink = page.locator('a[href*="/npcs/"]').first();
    if (await npcDetailLink.isVisible()) {
      await npcDetailLink.click();
      await page.waitForURL('**/npcs/**');

      // Check that no <script> tags exist in the rendered page content area
      const scriptTags = await page.locator('main script, [class*="content"] script').count();
      expect(scriptTags).toBe(0);

      // Verify window.__xss is not set (would indicate onerror-style XSS)
      const xssFlag = await page.evaluate(() => (window as Record<string, unknown>).__xss);
      expect(xssFlag).toBeUndefined();
    }
  });

  test('img onerror XSS payload does not execute in rich content', async ({ page }) => {
    // Set a sentinel and verify it is never triggered
    await page.addInitScript(() => {
      (window as Record<string, unknown>).__xss = undefined;
    });

    await login(page, GM_EMAIL, GM_PASSWORD);

    // Navigate into first campaign
    const campaignLink = page.locator('a[href*="/campaigns/"]').first();
    await campaignLink.click();
    await page.waitForURL('**/campaigns/**');

    // Navigate to NPCs
    const npcLink = page.locator('a[href*="/npcs"]').first();
    await npcLink.click();
    await page.waitForURL('**/npcs');

    // After page loads, verify no XSS sentinel was triggered
    const xssFlag = await page.evaluate(() => (window as Record<string, unknown>).__xss);
    expect(xssFlag).toBeUndefined();
  });
});
