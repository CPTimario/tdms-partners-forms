import { test, expect } from "@playwright/test";

test("Accountability modal shows on victory flow and cancel returns to landing", async ({ page }) => {
  // Navigate directly to /victory so the form is present as the background
  await page.goto("/victory");
  await expect(page).toHaveURL(/\/victory$/);

  const agreement = page.getByRole("dialog", { name: "Accountability Agreement" });
  await expect(agreement).toBeVisible();

  // Check emphasized phrases are visible
  await expect(agreement.getByText(/not approached for partnership/i)).toBeVisible();
  await expect(agreement.getByText(/not compelled to give/i)).toBeVisible();
  await expect(agreement.getByText(/grateful for the opportunity to advance the gospel to the nations/i)).toBeVisible();

  // Ensure at least one decorative icon is present (info or alert)
  const svgCount = await agreement.locator('svg').count();
  expect(svgCount).toBeGreaterThan(0);

  // Cancel should return to landing
  await agreement.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
});
