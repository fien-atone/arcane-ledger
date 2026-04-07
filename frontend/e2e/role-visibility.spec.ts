import { test, expect } from '@playwright/test';
import { login, GM_EMAIL, GM_PASSWORD } from './helpers';

test.describe('GM role visibility', () => {
  test('campaigns page shows Create Campaign button for GM', async ({ page }) => {
    await login(page, GM_EMAIL, GM_PASSWORD);

    await expect(page.getByText('Create Campaign')).toBeVisible();
  });

  test('campaign inner pages have sidebar navigation sections', async ({ page }) => {
    await login(page, GM_EMAIL, GM_PASSWORD);

    // Navigate into the first campaign
    const campaignLink = page.locator('a[href*="/campaigns/"]').first();
    await expect(campaignLink).toBeVisible();
    await campaignLink.click();
    await page.waitForURL('**/campaigns/**');

    // Sidebar should contain key navigation sections (check for navigation links)
    // These are the main domain sections in the sidebar
    const sidebarSections = ['NPCs', 'Sessions', 'Locations', 'Quests', 'Party'];
    for (const section of sidebarSections) {
      await expect(
        page.locator('nav, aside, [class*="sidebar"], [class*="Sidebar"]')
          .getByText(section, { exact: false })
          .first()
      ).toBeVisible();
    }
  });

  test('GM can see campaign dashboard after entering a campaign', async ({ page }) => {
    await login(page, GM_EMAIL, GM_PASSWORD);

    const campaignLink = page.locator('a[href*="/campaigns/"]').first();
    await expect(campaignLink).toBeVisible();
    await campaignLink.click();
    await page.waitForURL('**/campaigns/**');

    // Dashboard should be visible (the campaign detail page is the index route)
    // Verify the page rendered some campaign content
    await expect(page.locator('main, [class*="content"], [class*="dashboard"]').first()).toBeVisible();
  });
});
