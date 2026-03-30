import { test, expect, type Page } from "@playwright/test";

/**
 * E2E tests validating the new pdf-lib based PDF generation
 * These tests verify that the review step properly exports PDFs
 */

async function chooseMembership(page: Page, type: "Victory Member" | "Non-Victory Member") {
  const heading = page.getByRole("heading", { name: "Choose a form" });
  await expect(heading).toBeVisible();

  if (type === "Victory Member") {
    await page.getByRole("button", { name: "Open partners' forms for Victory members", exact: true }).first().click();

    const agreementGate = page.getByRole("dialog", { name: "Accountability Agreement" });
    await expect(agreementGate).toBeVisible();
    await agreementGate.getByRole("button", { name: "I Agree", exact: true }).click();
    await page.waitForURL(/\/victory$/);
  } else {
    await page.getByRole("button", { name: "Open partners' forms for Non-Victory members", exact: true }).first().click();
    await page.waitForURL(/\/non-victory$/);
  }

  await expect(page.getByRole("heading", { name: "Ten Days Missions Support Forms" })).toBeVisible();
}

async function fillCompleteForm(page: Page, currency: "PHP" | "USD" = "USD") {
  // Fill partner info
  await page.getByRole('textbox', { name: 'Partner Name', exact: true }).fill("Chris Timario");
  await page.getByRole('textbox', { name: 'Email Address', exact: true }).fill("chris@example.com");
  await page.getByRole('textbox', { name: 'Mobile Number', exact: true }).fill("09171234567");
  await page.getByRole('textbox', { name: 'Local Church', exact: true }).fill("Every Nation Makati");
  // Fill missioner/team input and populate dependent fields directly (no autocomplete)
  const missionerInput = page.locator("label", { hasText: "Missioner Name/Team" }).locator('input').first();
  await missionerInput.fill("Southeast Team");
  await page.getByRole('textbox', { name: 'Nation', exact: true }).fill("Thailand");
  const travelDateInput = page.locator("label", { hasText: "Travel Date" }).locator('input').first();
  await travelDateInput.fill("06/20/2026");
  await travelDateInput.evaluate((el: HTMLInputElement) => el.blur());
  await page.getByRole('textbox', { name: 'Sending Church', exact: true }).fill("Every Nation Greenhills");

  const amountField = page.locator("label").filter({ hasText: /^Amount/ });
  // Interact with MUI select trigger for currency
  const currencyTrigger = amountField.locator('button, [role="button"], [role="combobox"], .MuiSelect-select').first();
  await currencyTrigger.click();
  const currencyList = page.locator('[role="listbox"]:visible').first();
  await currencyList.getByRole('option', { name: currency, exact: true }).click();
  await amountField.locator('input[placeholder="0.00"]').fill("5000");
  await expect(amountField.locator('input[placeholder="0.00"]')).toHaveValue("5,000");
  await page.getByRole('textbox', { name: 'Nation', exact: true }).fill("Thailand");
  await travelDateInput.fill("06/20/2026");
  await travelDateInput.evaluate((el: HTMLInputElement) => el.blur());
  await page.getByRole('textbox', { name: 'Sending Church', exact: true }).fill("Every Nation Greenhills");

  await page.getByRole("checkbox", { name: /By providing my information/i }).check();

  // Go to accountability
  await page.getByRole("button", { name: "Continue to Accountability" }).click();
  await expect(page.getByRole("heading", { name: "Accountability", exact: true, level: 2 })).toBeVisible();

  // Fill accountability
  await page.getByText("Redirect my support to the team fund").click();
  await expect(page.getByRole("radio", { name: "Redirect my support to the team fund" })).toBeChecked();
  await page.getByText("Retain my support").click();
  await expect(page.getByRole("radio", { name: "Retain my support" })).toBeChecked();
  await page
    .locator('input[name="canceled"][value="generalFund"]')
    .check();
  await page.getByRole("textbox", { name: "Partner Full Name (Printed)" }).fill("Chris Timario");

  // Draw signature
  const signatureCanvas = page.locator('canvas[aria-label="Partner Signature"]');
  await expect(signatureCanvas).toBeVisible();
  await signatureCanvas.scrollIntoViewIfNeeded();

  const box = await signatureCanvas.boundingBox();
  if (!box) {
    throw new Error("Signature canvas bounding box was not found.");
  }

  const startX = box.x + 24;
  const startY = box.y + box.height / 2;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + 120, startY - 16, { steps: 10 });
  await page.mouse.move(startX + 220, startY + 8, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(150);
}

test.describe("PDF Generation E2E - New pdf-lib Integration", () => {
  test("victory member can generate review PDF", async ({ page }) => {
    await page.goto("/");
    await chooseMembership(page, "Victory Member");
    await fillCompleteForm(page);

    await page.getByRole("button", { name: "Review and Generate PDF" }).click();
    await expect(page.getByRole("heading", { name: "Review Your Forms" })).toBeVisible();
    await expect(page.getByTitle("Generated Support Forms PDF Preview")).toBeVisible();

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download Final PDF" }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toContain(".pdf");
  });

  test("non-victory member can generate review PDF", async ({ page }) => {
    await page.goto("/");
    await chooseMembership(page, "Non-Victory Member");
    await fillCompleteForm(page);

    await page.getByRole("button", { name: "Review and Generate PDF" }).click();
    await expect(page.getByRole("heading", { name: "Review Your Forms" })).toBeVisible();
    await expect(page.getByTitle("Generated Support Forms PDF Preview")).toBeVisible();

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download Final PDF" }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toContain(".pdf");
  });

  test("review shows only one export button", async ({ page }) => {
    await page.goto("/");
    await chooseMembership(page, "Victory Member");
    await fillCompleteForm(page);

    await page.getByRole("button", { name: "Review and Generate PDF" }).click();
    await expect(page.getByRole("heading", { name: "Review Your Forms" })).toBeVisible();

    await expect(page.getByRole("button", { name: "Download Final PDF" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Partner Info PDF" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Accountability PDF" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Partner Info PNG" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Accountability PNG" })).toHaveCount(0);
  });

  test("download button remains enabled after preview generation", async ({ page }) => {
    await page.goto("/");
    await chooseMembership(page, "Victory Member");
    await fillCompleteForm(page);

    await page.getByRole("button", { name: "Review and Generate PDF" }).click();
    await expect(page.getByRole("heading", { name: "Review Your Forms" })).toBeVisible();
    await expect(page.getByTitle("Generated Support Forms PDF Preview")).toBeVisible();

    await expect(page.getByRole("button", { name: "Download Final PDF" })).toBeEnabled();
  });

  test("shows preview and download errors when template loading fails", async ({ page }) => {
    await page.route("**/tdms-forms/*.pdf", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "text/plain",
        body: "template unavailable",
      });
    });

    await page.goto("/");
    await chooseMembership(page, "Victory Member");
    await fillCompleteForm(page);

    await page.getByRole("button", { name: "Review and Generate PDF" }).click();
    await expect(page.getByRole("heading", { name: "Review Your Forms" })).toBeVisible();
    await expect(page.getByText("Unable to prepare preview. Please retry or reload the page. If the issue persists, contact support.")).toBeVisible();

    await page.getByRole("button", { name: "Download Final PDF" }).click();
    await expect(page.getByText("Unable to generate PDF. Please try again.")).toBeVisible();
  });

  test("recovers preview after a transient template failure", async ({ page }) => {
    let shouldFail = true;

    await page.route("**/tdms-forms/*.pdf", async (route) => {
      if (shouldFail) {
        shouldFail = false;
        await route.fulfill({
          status: 500,
          contentType: "text/plain",
          body: "temporary template outage",
        });
        return;
      }

      await route.continue();
    });

    await page.goto("/");
    await chooseMembership(page, "Victory Member");
    await fillCompleteForm(page);

    await page.getByRole("button", { name: "Review and Generate PDF" }).click();
    await expect(page.getByText("Unable to prepare preview. Please retry or reload the page. If the issue persists, contact support.")).toBeVisible();

    await page.getByRole("button", { name: "Edit Accountability Choices" }).click();
    await expect(
      page.getByRole("heading", { name: "Accountability", exact: true, level: 2 })
    ).toBeVisible();

    await page.getByRole("button", { name: "Review and Generate PDF" }).click();
    await expect(page.getByTitle("Generated Support Forms PDF Preview")).toBeVisible();
    await expect(page.getByText("Unable to prepare preview. Please retry or reload the page. If the issue persists, contact support.")).toHaveCount(0);
  });

  test("victory member can generate PDF with default PHP currency", async ({ page }) => {
    await page.goto("/");
    await chooseMembership(page, "Victory Member");
    // Note: fillCompleteForm defaults to USD, so we use PHP explicitly here to test default currency path
    await fillCompleteForm(page, "PHP");

    await page.getByRole("button", { name: "Review and Generate PDF" }).click();
    await expect(page.getByRole("heading", { name: "Review Your Forms" })).toBeVisible();
    await expect(page.getByTitle("Generated Support Forms PDF Preview")).toBeVisible();

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download Final PDF" }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toContain(".pdf");
  });
});
