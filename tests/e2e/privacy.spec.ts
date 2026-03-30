import { test, expect } from '@playwright/test';

test.describe('Privacy modal', () => {
  test('appears on first visit and persists dismissal across pages', async ({ page }) => {
    // Create a fresh context without storageState so the privacy modal will open
    const browser = page.context().browser();
    if (!browser) throw new Error("Unable to access browser instance for new context");
    const context = await browser.newContext();
    const newPage = await context.newPage();

    try {
      // Visit root (webServer in playwright.config.ts will start the dev server)
      await newPage.goto('/');

      // Modal should appear on first visit. If it doesn't, ensure dismissal flag is cleared and reload.
      let heading = newPage.getByRole('heading', { name: 'Privacy notice' });
      if ((await heading.count()) === 0 || !(await heading.isVisible())) {
        await newPage.evaluate(() => window.localStorage.removeItem('disclaimer_dismissed'));
        await newPage.reload();
        heading = newPage.getByRole('heading', { name: 'Privacy notice' });
      }
      await expect(heading).toBeVisible();

      // Dismiss the modal
      const understood = newPage.getByRole('button', { name: 'Understood' });
      await expect(understood).toBeVisible();
      await understood.click();

      // Modal should be hidden
      await expect(heading).toBeHidden();

      // localStorage should have dismissal key
      const dismissed = await newPage.evaluate(() => window.localStorage.getItem('disclaimer_dismissed'));
      expect(dismissed).toBe('1');

      // Navigate to another page and ensure modal does not reappear
      await newPage.goto('/victory');
      await expect(newPage.getByRole('heading', { name: 'Privacy notice' })).toHaveCount(0);
    } finally {
      await context.close();
    }
  });
});
