import { expect, test, type Page } from "@playwright/test";

async function chooseMembership(page: Page, type: "Victory Member" | "Non-Victory Member") {
  // Scope to the membership gate dialog to avoid ambiguous button match
  const gate = page.getByRole("dialog", { name: "Select Membership Type" });
  await expect(gate).toBeVisible();
  await gate.getByRole("button", { name: type, exact: true }).click();
  // Wait for the gate to disappear before proceeding
  await expect(gate).toBeHidden();
  await expect(page.getByRole("heading", { name: "Ten Days Missions Support Forms" })).toBeVisible();
}

async function fillPartnerStep(page: Page) {
  await page.getByRole('textbox', { name: 'Partner Name', exact: true }).fill("Chris Timario");
  await page.getByRole('textbox', { name: 'Email Address', exact: true }).fill("chris@example.com");
  await page.getByRole('textbox', { name: 'Mobile Number', exact: true }).fill("09171234567");
  await page.getByRole('textbox', { name: 'Local Church', exact: true }).fill("Every Nation Makati");
  await page.getByRole('textbox', { name: 'Missioner Name/Team', exact: true }).fill("Southeast Team");
  await page.getByRole('textbox', { name: 'Amount', exact: true }).fill("5000");
  await page.getByRole('textbox', { name: 'Nation', exact: true }).fill("Thailand");
  await page.getByRole('textbox', { name: 'Travel Date', exact: true }).fill("2026-06-20");
  await page.getByRole('textbox', { name: 'Sending Church', exact: true }).fill("Every Nation Greenhills");

  await page
    .locator("label")
    .filter({ hasText: "By providing my information" })
    .getByRole("checkbox")
    .check();
}

async function fillAccountabilityStepWithoutSignature(page: Page) {
  await page.getByRole("button", { name: "Continue to Accountability" }).click();
  await expect(page.getByRole("heading", { name: "Accountability", exact: true, level: 2 })).toBeVisible();

  await page.getByRole("radio", { name: "Redirect my support to the team fund" }).check();
  await page.getByRole("radio", { name: "Retain my support" }).check();
  await page
    .locator('input[name="canceled"][value="generalFund"]')
    .check();
}

async function fillAccountabilityStep(page: Page) {
  await fillAccountabilityStepWithoutSignature(page);
  await page.getByLabel("Printed Name").fill("Christopher Timario");
}

test.describe("Support forms end-to-end", () => {
  test("requires membership selection and shows correct variant messaging", async ({ page }: { page: Page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "Select Membership Type" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Review Forms" })).toHaveCount(0);

    await chooseMembership(page, "Victory Member");
    await page.getByRole("button", { name: "Continue to Accountability" }).click();

    await expect(
      page.getByRole("heading", {
        name: "TEN DAYS MISSIONS SUPPORT ACCOUNTABILITY FORM FOR VICTORY MEMBERS",
      }),
    ).toBeVisible();

    await page.reload();
    await expect(page.getByRole("heading", { name: "Select Membership Type" })).toBeVisible();

    await chooseMembership(page, "Non-Victory Member");
    await page.getByRole("button", { name: "Continue to Accountability" }).click();

    await expect(
      page.getByRole("heading", {
        name: "TEN DAYS MISSIONS SUPPORT ACCOUNTABILITY FORM",
      }),
    ).toBeVisible();
  });

  test("blocks review until required fields are complete and then allows review", async ({ page }: { page: Page }) => {
    await page.goto("/");
    await chooseMembership(page, "Victory Member");

    await page.getByRole("button", { name: "Review Forms" }).click();

    await expect(page.getByText("Consent is required.")).toBeVisible();
    await expect(page.getByText("Partner Name is required.")).toBeVisible();

    await fillPartnerStep(page);
    await fillAccountabilityStepWithoutSignature(page);

    await page.getByRole("button", { name: "Review Forms" }).click();
    await expect(page.getByText("Signature is required.")).toBeVisible();

    await page.getByLabel("Printed Name").fill("Christopher Timario");

    await page.getByRole("button", { name: "Review Forms" }).click();
    await expect(page.getByRole("heading", { name: "Review Your Forms" })).toBeVisible();

    await expect(page.getByText("Signature is required.")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Partner Information Form" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Accountability Form" })).toBeVisible();
  });

  test("triggers export downloads when form is complete", async ({ page }: { page: Page }) => {
    await page.goto("/");
    await chooseMembership(page, "Victory Member");

    await fillPartnerStep(page);
    await fillAccountabilityStep(page);

    await page.getByRole("button", { name: "Review Forms" }).click();
    await expect(page.getByRole("heading", { name: "Review Your Forms" })).toBeVisible();

    const pngDownload = page.waitForEvent("download");
    await page.getByRole("button", { name: "Partner Info PNG" }).click();
    await expect(await pngDownload).toBeTruthy();

    const pdfDownload = page.waitForEvent("download");
    await page.getByRole("button", { name: "Accountability PDF" }).click();
    await expect(await pdfDownload).toBeTruthy();
  });
});
