import { expect, test, type Page } from "@playwright/test";

async function chooseMembership(page: Page, type: "Victory Member" | "Non-Victory Member") {
  // Scope to the membership gate dialog to avoid ambiguous button match
  const gate = page.getByRole("dialog", { name: "Are you a Victory church member?" });
  await expect(gate).toBeVisible();

  if (type === "Victory Member") {
    await gate.getByRole("button", { name: "Yes", exact: true }).click();

    const agreementGate = page.getByRole("dialog", { name: "Accountability Agreement" });
    await expect(agreementGate).toBeVisible();
    await agreementGate.getByRole("button", { name: "I Agree", exact: true }).click();
  } else {
    await gate.getByRole("button", { name: "No", exact: true }).click();
  }

  // Wait for the gate to disappear before proceeding
  await expect(gate).toBeHidden();
  await expect(page.getByRole("heading", { name: "Ten Days Missions Support Forms" })).toBeVisible();
}

async function fillPartnerStep(page: Page) {
  await page.getByRole("textbox", { name: /^Partner Name/ }).fill("Chris Timario");
  await page.getByRole("textbox", { name: /^Email Address/ }).fill("chris@example.com");
  await page.getByRole("textbox", { name: /^Mobile Number/ }).fill("09171234567");
  await page.getByRole("textbox", { name: /^Local Church/ }).fill("Every Nation Makati");
  await page.getByRole("textbox", { name: /^Missioner Name\/Team/ }).fill("Southeast Team");
  await page.getByRole("textbox", { name: /^Amount/ }).fill("5000");
  await page.getByRole("textbox", { name: /^Nation/ }).fill("Thailand");
  await page.getByRole("textbox", { name: /^Travel Date/ }).fill("2026-06-20");
  await page.getByRole("textbox", { name: /^Sending Church/ }).fill("Every Nation Greenhills");

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

async function drawSignature(page: Page) {
  const signatureCanvas = page.locator('canvas[aria-label="Partner Signature"]');
  await expect(signatureCanvas).toBeVisible();
  // Ensure the canvas is scrolled into the visible viewport before firing
  // pointer events — coordinates from boundingBox() are viewport-relative and
  // signature_pad will miss strokes if the element is below the fold.
  await signatureCanvas.scrollIntoViewIfNeeded();

  const box = await signatureCanvas.boundingBox();
  if (!box) {
    throw new Error("Signature canvas bounding box was not found.");
  }

  const startX = box.x + 24;
  const startY = box.y + box.height / 2;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  // Use steps so signature_pad receives intermediate pointermove events and
  // populates its internal stroke data (isEmpty() relies on this).
  await page.mouse.move(startX + 120, startY - 16, { steps: 10 });
  await page.mouse.move(startX + 220, startY + 8, { steps: 10 });
  await page.mouse.up();
  // Brief settle so React flushes the onEnd state update before the caller
  // checks derived state (e.g. isAccountabilityStepComplete).
  await page.waitForTimeout(150);
}

async function fillAccountabilityStep(page: Page) {
  await fillAccountabilityStepWithoutSignature(page);
  await drawSignature(page);
}

test.describe("Support forms end-to-end", () => {
  test("uses navigation semantics for step controls and updates active step", async ({ page }: { page: Page }) => {
    await page.goto("/");
    await chooseMembership(page, "Victory Member");

    const stepNavigation = page.getByRole("navigation", { name: "Support form steps" });
    await expect(stepNavigation).toBeVisible();
    await expect(page.getByRole("tab")).toHaveCount(0);

    const activeStep = stepNavigation.locator('button[aria-current="step"]');
    await expect(activeStep).toHaveCount(1);
    await expect(activeStep).toContainText("Partner Information");

    await fillPartnerStep(page);
    await page.getByRole("button", { name: "Continue to Accountability" }).click();
    await expect(activeStep).toHaveCount(1);
    await expect(activeStep).toContainText("Accountability");
  });

  test("traps keyboard focus within membership dialogs", async ({ page }: { page: Page }) => {
    await page.goto("/");

    const gate = page.getByRole("dialog", { name: "Are you a Victory church member?" });
    await expect(gate).toBeVisible();

    const yesButton = gate.getByRole("button", { name: "Yes", exact: true });
    const noButton = gate.getByRole("button", { name: "No", exact: true });

    // Initial focus is set by dialog logic.
    await expect(yesButton).toBeFocused();

    await page.keyboard.press("Shift+Tab");
    await expect(noButton).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(yesButton).toBeFocused();

    await yesButton.click();

    const agreementGate = page.getByRole("dialog", { name: "Accountability Agreement" });
    await expect(agreementGate).toBeVisible();

    const backButton = agreementGate.getByRole("button", { name: "Back", exact: true });
    const agreeButton = agreementGate.getByRole("button", { name: "I Agree", exact: true });

    await expect(backButton).toBeFocused();

    await page.keyboard.press("Shift+Tab");
    await expect(agreeButton).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(backButton).toBeFocused();
  });

  test("closes agreement dialog on Escape and restores focus to Yes button", async ({ page }: { page: Page }) => {
    await page.goto("/");

    const gate = page.getByRole("dialog", { name: "Are you a Victory church member?" });
    const yesButton = gate.getByRole("button", { name: "Yes", exact: true });
    await expect(yesButton).toBeVisible();

    await yesButton.click();
    const agreementGate = page.getByRole("dialog", { name: "Accountability Agreement" });
    await expect(agreementGate).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(agreementGate).toBeHidden();
    await expect(gate).toBeVisible();
    await expect(yesButton).toBeFocused();
  });

  test("allows backing out of agreement modal and choosing non-victory flow", async ({ page }: { page: Page }) => {
    await page.goto("/");

    const gate = page.getByRole("dialog", { name: "Are you a Victory church member?" });
    await expect(gate).toBeVisible();

    await gate.getByRole("button", { name: "Yes", exact: true }).click();
    const agreementGate = page.getByRole("dialog", { name: "Accountability Agreement" });
    await expect(agreementGate).toBeVisible();

    await agreementGate.getByRole("button", { name: "Back", exact: true }).click();
    await expect(agreementGate).toBeHidden();
    await expect(gate).toBeVisible();

    await gate.getByRole("button", { name: "No", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Ten Days Missions Support Forms" })).toBeVisible();
  });

  test("requires membership selection and shows correct variant messaging", async ({ page }: { page: Page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "Are you a Victory church member?" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Review Forms" })).toHaveCount(0);

    await chooseMembership(page, "Victory Member");
    await fillPartnerStep(page);
    await page.getByRole("button", { name: "Continue to Accountability" }).click();

    await expect(
      page.getByRole("heading", {
        name: "TEN DAYS MISSIONS SUPPORT ACCOUNTABILITY FORM FOR VICTORY MEMBERS",
      }),
    ).toBeVisible();

    await page.reload();
    await expect(page.getByRole("heading", { name: "Are you a Victory church member?" })).toBeVisible();

    await chooseMembership(page, "Non-Victory Member");
    await fillPartnerStep(page);
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

    await drawSignature(page);

    await page.getByRole("button", { name: "Review Forms" }).click();
    await expect(page.getByRole("heading", { name: "Review Your Forms" })).toBeVisible();

    await expect(page.getByText("Signature is required.")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Generated PDF Preview" })).toBeVisible();
    await expect(page.getByTitle("Generated Support Forms PDF Preview")).toBeVisible();
  });

  test("triggers export downloads when form is complete", async ({ page }: { page: Page }) => {
    await page.goto("/");
    await chooseMembership(page, "Victory Member");

    await fillPartnerStep(page);
    await fillAccountabilityStep(page);

    await page.getByRole("button", { name: "Review Forms" }).click();
    await expect(page.getByRole("heading", { name: "Review Your Forms" })).toBeVisible();

    const pdfDownload = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download PDF" }).click();
    await expect(await pdfDownload).toBeTruthy();
  });
});
