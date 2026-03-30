import { test, expect } from '@playwright/test';

test.describe('Privacy modal', () => {
  test('appears on first visit and persists dismissal across pages', async ({ page }) => {
    // Visit root (webServer in playwright.config.ts will start the dev server)
    await page.goto('/');

    // Modal should appear on first visit
    const heading = page.getByRole('heading', { name: 'Privacy notice' });
    await expect(heading).toBeVisible();

    // Dismiss the modal
    const understood = page.getByRole('button', { name: 'Understood' });
    await expect(understood).toBeVisible();
    await understood.click();

    // Modal should be hidden
    await expect(heading).toBeHidden();

    // localStorage should have dismissal key
    const dismissed = await page.evaluate(() => window.localStorage.getItem('disclaimer_dismissed'));
    expect(dismissed).toBe('1');

    // Navigate to another page and ensure modal does not reappear
    await page.goto('/victory');
    await expect(page.getByRole('heading', { name: 'Privacy notice' })).toHaveCount(0);
  });
});
