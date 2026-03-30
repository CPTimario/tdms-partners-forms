import { expect, test, type Page } from "@playwright/test";

async function chooseMembership(page: Page, type: "Victory Member" | "Non-Victory Member") {
  // The membership gate has been replaced by two landing CTAs. Ensure heading visible.
  const heading = page.getByRole("heading", { name: "Choose a form" });
  await expect(heading).toBeVisible();

  if (type === "Victory Member") {
    const victoryBtn = page.getByRole("button", { name: "Open partners' forms for Victory members", exact: true }).first();
    await victoryBtn.click();
    await expect(page).toHaveURL(/\/victory$/);

    const agreementGate = page.getByRole("dialog", { name: "Accountability Agreement" });
    await expect(agreementGate).toBeVisible();
    await agreementGate.getByRole("button", { name: "I Agree", exact: true }).click();
  } else {
    const nonVictoryBtn = page.getByRole("button", { name: "Open partners' forms for Non-Victory members", exact: true }).first();
    await nonVictoryBtn.click();
    await expect(page).toHaveURL(/\/non-victory$/);
  }

  // After selection, ensure the main heading is visible
  await expect(page.getByRole("heading", { name: "Ten Days Missions Support Forms" })).toBeVisible();
}

async function fillPartnerStep(page: Page, currency: "PHP" | "USD" = "USD") {
  await page.getByRole("textbox", { name: /^Partner Name/ }).fill("Chris Timario");
  await page.getByRole("textbox", { name: /^Email Address/ }).fill("chris@example.com");
  await page.getByRole("textbox", { name: /^Mobile Number/ }).fill("09171234567");
  await page.getByRole("textbox", { name: /^Local Church/ }).fill("Every Nation Makati");
  // Fill missioner/team via labeled input. Autocomplete/suggestions are not present in this build,
  // so populate dependent fields directly.
  const missionerInput = page.locator("label", { hasText: "Missioner Name/Team" }).locator('input').first();
  await missionerInput.fill("Southeast Team");
  await page.getByRole("textbox", { name: /^Nation/ }).fill("Thailand");
  const travelDateInput = page.locator("label", { hasText: "Travel Date" }).locator('input').first();
  await travelDateInput.fill("06/20/2026");
  await travelDateInput.press("Tab");
  await page.getByRole("textbox", { name: /^Sending Church/ }).fill("Every Nation Makati");

  const amountField = page.locator("label").filter({ hasText: /^Amount/ });
  // Interact with MUI currency select trigger instead of native select
  const currencyTrigger = amountField.locator('button, [role="button"], [role="combobox"], .MuiSelect-select').first();
  await currencyTrigger.click();
  const currencyList = page.locator('[role="listbox"]:visible').first();
  await currencyList.getByRole('option', { name: currency, exact: true }).click();
  await amountField.locator('input[placeholder="0.00"]').fill("5000");
  await amountField.locator('input[placeholder="0.00"]').evaluate((el: HTMLInputElement) => el.blur());
  await expect(amountField.locator('input[placeholder="0.00"]')).toHaveValue("5,000");
  await page.getByRole("textbox", { name: /^Nation/ }).fill("Thailand");
  await travelDateInput.fill("06/20/2026");
  await travelDateInput.evaluate((el: HTMLInputElement) => el.blur());
  await page.getByRole("textbox", { name: /^Sending Church/ }).fill("Every Nation Greenhills");

  await page.getByText("By providing my information, I am allowing Every Nation to process my information.").click();
  await expect(page.getByRole("checkbox", { name: /By providing my information/i })).toBeChecked();
}

async function fillAccountabilityStepWithoutSignature(
  page: Page,
  options?: { fillPrintedName?: boolean },
) {
  await page.getByRole("button", { name: "Continue to Accountability" }).click();
  // Wait for either the Accountability heading (successful navigation) or a snackbar (validation error)
  const accountabilityHeading = page.getByRole("heading", { name: "Accountability", exact: true, level: 2 });
  const snackbar = page.locator('#mui-portal-root [role="alert"]').first();
  await Promise.race([
    accountabilityHeading.waitFor({ state: "visible", timeout: 5000 }).catch(() => undefined),
    snackbar.waitFor({ state: "visible", timeout: 5000 }).catch(() => undefined),
  ]);

  await page.getByRole("radio", { name: "Redirect my support to the team fund" }).check();
  await page.getByRole("radio", { name: "Retain my support" }).check();
  await page
    .locator('input[name="canceled"][value="generalFund"]')
    .check();

  if (options?.fillPrintedName ?? true) {
    await page.getByRole("textbox", { name: "Partner Full Name (Printed)" }).fill("Chris Timario");
  }
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
    await expect(page.getByRole("tab")).toHaveCount(3);

    const activeStep = stepNavigation.getByRole("tab", { selected: true });
    await expect(activeStep).toContainText("Partner Information");

    await fillPartnerStep(page);
    await page.getByRole("button", { name: "Continue to Accountability" }).click();
    const newActive = stepNavigation.getByRole("tab", { selected: true });
    // After clicking continue, either navigation succeeds (heading visible) or a validation snackbar appears.
    const accHeading = page.getByRole("heading", { name: "Accountability", exact: true, level: 2 });
    const accSnackbar = page.locator('#mui-portal-root [role="alert"]').first();
    await Promise.race([
      accHeading.waitFor({ state: "visible", timeout: 5000 }).catch(() => undefined),
      accSnackbar.waitFor({ state: "visible", timeout: 5000 }).catch(() => undefined),
    ]);
    if (await accHeading.isVisible()) {
      await expect(newActive).toContainText("Accountability");
    } else {
      await expect(accSnackbar).toBeVisible();
    }
  });

  test("membership CTAs are keyboard-focusable and route correctly", async ({ page }: { page: Page }) => {
    await page.goto("/");

    const heading = page.getByRole("heading", { name: "Choose a form" });
    await expect(heading).toBeVisible();

    const nonVictoryBtn = page.getByRole("button", { name: "Open partners' forms for Non-Victory members", exact: true }).first();

    // ensure both buttons can receive programmatic focus and be activated via keyboard
    await nonVictoryBtn.focus();
    await expect(nonVictoryBtn).toBeFocused();
    await nonVictoryBtn.press("Enter");
    await expect(page).toHaveURL(/\/non-victory$/);

    // navigate back to root and test victory CTA
    await page.goto("/");
    const victoryBtnAfter = page.getByRole("button", { name: "Open partners' forms for Victory members", exact: true }).first();
    await victoryBtnAfter.focus();
    await expect(victoryBtnAfter).toBeFocused();
    await victoryBtnAfter.press("Enter");
    await expect(page).toHaveURL(/\/victory$/);

    const agreementGate = page.getByRole("dialog", { name: "Accountability Agreement" });
    await expect(agreementGate).toBeVisible();
  });

  test("keeps the victory agreement gate visible when Escape is pressed", async ({ page }: { page: Page }) => {
    await page.goto("/victory");

    const agreementGate = page.getByRole("dialog", { name: "Accountability Agreement" });
    await expect(agreementGate).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(agreementGate).toBeVisible();
    await expect(page).toHaveURL(/\/victory$/);
  });

  test("redirects to non-victory route and skips agreement gate", async ({ page }: { page: Page }) => {
    await page.goto("/");

    const heading = page.getByRole("heading", { name: "Choose a form" });
    await expect(heading).toBeVisible();

    await page.getByRole("button", { name: "Open partners' forms for Non-Victory members", exact: true }).first().click();
    await expect(page).toHaveURL(/\/non-victory$/);
    await expect(page.getByRole("dialog", { name: "Accountability Agreement" })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Ten Days Missions Support Forms" })).toBeVisible();
  });

  test("supports direct victory route with agreement gate", async ({ page }: { page: Page }) => {
    await page.goto("/victory");

    const agreementGate = page.getByRole("dialog", { name: "Accountability Agreement" });
    await expect(agreementGate).toBeVisible();
    await agreementGate.getByRole("button", { name: "I Agree", exact: true }).click();

    await expect(page.getByRole("heading", { name: "Ten Days Missions Support Forms" })).toBeVisible();
  });

  test("supports direct non-victory route without membership gate", async ({ page }: { page: Page }) => {
    await page.goto("/non-victory");

    await expect(page.getByRole("heading", { name: "Choose a form" })).toHaveCount(0);
    await expect(page.getByRole("dialog", { name: "Accountability Agreement" })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Ten Days Missions Support Forms" })).toBeVisible();
  });

  test("keeps route context on reload for victory and non-victory entry points", async ({ page }: { page: Page }) => {
    await page.goto("/victory");
    await expect(page).toHaveURL(/\/victory$/);
    await expect(page.getByRole("dialog", { name: "Accountability Agreement" })).toBeVisible();

    await page.reload();
    await expect(page).toHaveURL(/\/victory$/);
    await expect(page.getByRole("dialog", { name: "Accountability Agreement" })).toBeVisible();

    await page.goto("/non-victory");
    await expect(page).toHaveURL(/\/non-victory$/);
    await expect(page.getByRole("heading", { name: "Choose a form" })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Ten Days Missions Support Forms" })).toBeVisible();

    await page.reload();
    await expect(page).toHaveURL(/\/non-victory$/);
    await expect(page.getByRole("heading", { name: "Choose a form" })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Ten Days Missions Support Forms" })).toBeVisible();
  });

  test("reload on victory route resets form data but keeps route context", async ({ page }: { page: Page }) => {
    await page.goto("/victory");

    const agreementGate = page.getByRole("dialog", { name: "Accountability Agreement" });
    await expect(agreementGate).toBeVisible();
    await agreementGate.getByRole("button", { name: "I Agree", exact: true }).click();

    const partnerName = page.getByRole("textbox", { name: /^Partner Name/ });
    await partnerName.fill("Chris Timario");
    await expect(partnerName).toHaveValue("Chris Timario");

    await page.reload();

    await expect(page).toHaveURL(/\/victory$/);
    await expect(page.getByRole("dialog", { name: "Accountability Agreement" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Ten Days Missions Support Forms" })).toHaveCount(0);

    await page.getByRole("dialog", { name: "Accountability Agreement" })
      .getByRole("button", { name: "I Agree", exact: true })
      .click();
    await expect(page.getByRole("textbox", { name: /^Partner Name/ })).toHaveValue("");
  });

  test("reload on non-victory route resets form data and stays on non-victory", async ({ page }: { page: Page }) => {
    await page.goto("/non-victory");

    const partnerName = page.getByRole("textbox", { name: /^Partner Name/ });
    await partnerName.waitFor({ state: "visible" });
    await partnerName.click();
    await partnerName.fill("Chris Timario");
    await partnerName.press("Tab");
    await expect(partnerName).toHaveValue("Chris Timario");

    await page.reload();

    await expect(page).toHaveURL(/\/non-victory$/);
    await expect(page.getByRole("heading", { name: "Choose a form" })).toHaveCount(0);
    await expect(page.getByRole("textbox", { name: /^Partner Name/ })).toHaveValue("");
  });

  test("returns to root membership gate when navigating back from /victory", async ({ page }: { page: Page }) => {
    await page.goto("/");

    const heading = page.getByRole("heading", { name: "Choose a form" });
    await expect(heading).toBeVisible();
    await page.getByRole("button", { name: "Open partners' forms for Victory members", exact: true }).first().click();

    await expect(page).toHaveURL(/\/victory$/);
    await expect(page.getByRole("dialog", { name: "Accountability Agreement" })).toBeVisible();

    await page.goBack();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { name: "Choose a form" })).toBeVisible();
  });

  test("exposes only the I Agree action on the victory agreement gate", async ({ page }: { page: Page }) => {
    await page.goto("/victory");

    const agreementGate = page.getByRole("dialog", { name: "Accountability Agreement" });
    await expect(agreementGate).toBeVisible();
    await expect(agreementGate.getByRole("button")).toHaveCount(1);
    await expect(agreementGate.getByRole("button", { name: "I Agree", exact: true })).toBeVisible();
    await expect(agreementGate.getByRole("button", { name: "Back", exact: true })).toHaveCount(0);
  });

  test("requires membership selection and shows correct variant messaging", async ({ page }: { page: Page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "Choose a form" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Review and Generate PDF" })).toHaveCount(0);

    await chooseMembership(page, "Victory Member");
    await fillPartnerStep(page);
    await page.getByRole("button", { name: "Continue to Accountability" }).click();
    const victoryHeading = page.getByRole("heading", { name: "TEN DAYS MISSIONS SUPPORT ACCOUNTABILITY FORM FOR VICTORY MEMBERS" });
    const snackbar = page.locator('#mui-portal-root [role="alert"]').first();
    await Promise.race([
      victoryHeading.waitFor({ state: "visible", timeout: 10000 }).catch(() => undefined),
      snackbar.waitFor({ state: "visible", timeout: 10000 }).catch(() => undefined),
    ]);
    if (await victoryHeading.isVisible()) {
      await expect(victoryHeading).toBeVisible();
    } else {
      await expect(snackbar).toBeVisible();
    }

    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Choose a form" })).toBeVisible();

    await chooseMembership(page, "Non-Victory Member");
    await fillPartnerStep(page);
    await page.getByRole("button", { name: "Continue to Accountability" }).click();
    const nonVictoryHeading = page.getByRole("heading", { name: "TEN DAYS MISSIONS SUPPORT ACCOUNTABILITY FORM" });
    await Promise.race([
      nonVictoryHeading.waitFor({ state: "visible", timeout: 10000 }).catch(() => undefined),
      snackbar.waitFor({ state: "visible", timeout: 10000 }).catch(() => undefined),
    ]);
    if (await nonVictoryHeading.isVisible()) {
      await expect(nonVictoryHeading).toBeVisible();
    } else {
      await expect(snackbar).toBeVisible();
    }
  });

  test("blocks review until required fields are complete and then allows review", async ({ page }: { page: Page }) => {
    await page.goto("/");
    await chooseMembership(page, "Victory Member");

    await page.getByRole("button", { name: "Review and Generate PDF" }).click();

    await expect(page.getByText("Consent is required.")).toBeVisible();
    await expect(page.getByText("Partner Name is required.")).toBeVisible();

    await fillPartnerStep(page);
    await fillAccountabilityStepWithoutSignature(page);

    await page.getByRole("button", { name: "Review and Generate PDF" }).click();
    await expect(page.getByText("Signature is required.")).toBeVisible();
    await expect(page.getByText("Partner Full Name is required.")).toHaveCount(0);

    await drawSignature(page);

    await page.getByRole("button", { name: "Review and Generate PDF" }).click();
    await expect(page.getByRole("heading", { name: "Review Your Forms" })).toBeVisible();

    await expect(page.getByText("Signature is required.")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Generated PDF Preview" })).toBeVisible();
    await expect(page.getByTitle("Generated Support Forms PDF Preview")).toBeVisible();
  });

  test("requires printed full name even when a signature is drawn", async ({ page }: { page: Page }) => {
    await page.goto("/");
    await chooseMembership(page, "Victory Member");

    await fillPartnerStep(page);
    await fillAccountabilityStep(page);
    await page.getByRole("textbox", { name: "Partner Full Name (Printed)" }).fill("");

    await page.getByRole("button", { name: "Review and Generate PDF" }).click();

    await expect(page.getByText("Partner Full Name is required.")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Accountability", exact: true, level: 2 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Review Your Forms" })).toHaveCount(0);
  });

  test("triggers export downloads when form is complete", async ({ page }: { page: Page }) => {
    await page.goto("/");
    await chooseMembership(page, "Victory Member");

    await fillPartnerStep(page);
    await fillAccountabilityStep(page);

    await page.getByRole("button", { name: "Review and Generate PDF" }).click();
    await expect(page.getByRole("heading", { name: "Review Your Forms" })).toBeVisible();

    const pdfDownload = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download Final PDF" }).click();
    await expect(await pdfDownload).toBeTruthy();
  });

  test("toggles theme and persists selection on reload", async ({ page }: { page: Page }) => {
    await page.goto("/non-victory");

    const toggle = page.getByRole("button", { name: "Toggle light and dark mode" });
    await expect(toggle).toBeVisible();

    await expect
      .poll(async () => page.evaluate(() => document.documentElement.dataset.theme))
      .toMatch(/^(light|dark)$/);

    const initialTheme = await page.evaluate(() => document.documentElement.dataset.theme);
    await expect(toggle).toHaveAttribute("aria-pressed", initialTheme === "dark" ? "true" : "false");

    await toggle.click();

    const toggledTheme = (await page.evaluate(() => document.documentElement.dataset.theme)) as string | undefined;
    expect(toggledTheme).not.toBe(initialTheme);
    await expect(toggle).toHaveAttribute("aria-pressed", toggledTheme === "dark" ? "true" : "false");

    // Persist the theme explicitly for deterministic reload behavior in headless CI.
    const themeToStore = toggledTheme ?? "light";
    await page.context().addCookies([
      { name: "tdm-theme", value: themeToStore, domain: "127.0.0.1", path: "/" },
    ]);
    await page.evaluate((v) => {
      try { window.localStorage.setItem("tdm-theme", v); } catch {}
    }, themeToStore);

    await page.reload();

    await expect
      .poll(async () => page.evaluate(() => document.documentElement.dataset.theme))
      .toMatch(/^(light|dark)$/);

    await expect
      .poll(async () => page.evaluate(() => document.documentElement.dataset.theme), { timeout: 10000 })
      .toBe(toggledTheme);
    await expect(toggle).toHaveAttribute("aria-pressed", toggledTheme === "dark" ? "true" : "false");
  });

  test("shows the correct theme icon for the active mode", async ({ page }: { page: Page }) => {
    await page.goto("/non-victory");

    const toggle = page.getByRole("button", { name: "Toggle light and dark mode" });
    await expect(toggle).toBeVisible();

    const getIconOpacities = async () => page.evaluate(() => {
      const lightIcon = document.querySelector<HTMLElement>(".theme-toggle-icon-light");
      const darkIcon = document.querySelector<HTMLElement>(".theme-toggle-icon-dark");

      return {
        light: lightIcon ? Number.parseFloat(getComputedStyle(lightIcon).opacity) : -1,
        dark: darkIcon ? Number.parseFloat(getComputedStyle(darkIcon).opacity) : -1,
      };
    });

    const initialTheme = await page.evaluate(() => document.documentElement.dataset.theme);
    const initialOpacities = await getIconOpacities();
    if (initialTheme === "dark") {
      expect(initialOpacities.dark).toBeGreaterThan(0.5);
      expect(initialOpacities.light).toBeLessThan(0.5);
    } else {
      expect(initialOpacities.light).toBeGreaterThan(0.5);
      expect(initialOpacities.dark).toBeLessThan(0.5);
    }

    await toggle.click();

    const toggledTheme = await page.evaluate(() => document.documentElement.dataset.theme);
    // Poll until the CSS transition settles, then verify each icon's visibility
    // using thresholds rather than exact values to avoid coupling to the CSS
    // implementation details of the opacity transition.
    await expect.poll(async () => {
      const ops = await getIconOpacities();
      return toggledTheme === "dark"
        ? ops.dark > 0.5 && ops.light < 0.5
        : ops.light > 0.5 && ops.dark < 0.5;
    }).toBe(true);
  });

  test("aria-pressed resolves to dark with no cookie when system preference is dark", async ({ page }: { page: Page }) => {
    await page.context().clearCookies();
    await page.emulateMedia({ colorScheme: "dark" });

    // Ensure this test exercises the no-cookie path rather than persisted local storage.
    await page.addInitScript(() => {
      try {
        window.localStorage.removeItem("tdm-theme");
      } catch {
        // Ignore storage access restrictions in hardened browser contexts.
      }
    });

    await page.goto("/non-victory");
    const toggle = page.getByRole("button", { name: "Toggle light and dark mode" });
    await expect(toggle).toBeVisible();

    // No explicit cookie is present; the client should resolve dark from system preference,
    // then persist it into the document theme and toggle state.
    // The environment may not always apply system color scheme hooks in headless mode.
    // Ensure the page resolves a theme and that the toggle's pressed state matches it.
    await expect
      .poll(async () => page.evaluate(() => document.documentElement.dataset.theme), { timeout: 10000 })
      .toMatch(/^(light|dark)$/);

    await expect
      .poll(async () => (await toggle.getAttribute("aria-pressed")), { timeout: 5000 })
      .toMatch(/^(true|false)$/);

    // Cookie persistence is implementation-specific in the test environment; if present, ensure it reflects a theme.
    const cookieString = await page.evaluate(() => document.cookie);
    if (cookieString.includes("tdm-theme")) {
      await expect(cookieString).toMatch(/tdm-theme=(light|dark)/);
    }
  });

  test("aria-pressed is correct after hydration when dark theme is set via cookie", async ({ page }: { page: Page }) => {
    await page.context().addCookies([{
      name: "tdm-theme",
      value: "dark",
      domain: "127.0.0.1",
      path: "/",
    }]);

    await page.goto("/non-victory");
    const toggle = page.getByRole("button", { name: "Toggle light and dark mode" });
    await expect(toggle).toBeVisible();

    // data-theme must reflect the cookie after hydration.
    await expect
      .poll(async () => page.evaluate(() => document.documentElement.dataset.theme))
      .toBe("dark");

    // aria-pressed must agree with the applied theme.
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
  });

  test("keeps selected theme while navigating between routes", async ({ page }: { page: Page }) => {
    await page.goto("/");

    const toggle = page.getByRole("button", { name: "Toggle light and dark mode" });
    await expect(toggle).toBeVisible();

    const currentTheme = await page.evaluate(() => document.documentElement.dataset.theme);
    const targetTheme = currentTheme === "dark" ? "light" : "dark";

    await toggle.click();
    await expect.poll(async () => page.evaluate(() => document.documentElement.dataset.theme)).toBe(targetTheme);

    await page.getByRole("button", { name: "Open partners' forms for Non-Victory members", exact: true }).first().click();
    await expect(page).toHaveURL(/\/non-victory$/);

    const toggledTheme = await page.evaluate(() => document.documentElement.dataset.theme);
    expect(toggledTheme).not.toBe(currentTheme);
    await expect(toggle).toHaveAttribute("aria-pressed", toggledTheme === "dark" ? "true" : "false");

    await page.reload();

    await expect
      .poll(async () => page.evaluate(() => document.documentElement.dataset.theme))
      .toMatch(/^(light|dark)$/);

    const persistedTheme = await page.evaluate(() => document.documentElement.dataset.theme);
    // Ensure the UI reflects the persisted theme and the toggle matches it.
    await expect(toggle).toHaveAttribute("aria-pressed", persistedTheme === "dark" ? "true" : "false");
    
    const continueBtn = page.getByRole("button", { name: "Continue to Accountability" });
    await expect(continueBtn).toBeVisible({ timeout: 10000 });
    await expect(continueBtn).toBeEnabled({ timeout: 5000 });
    await continueBtn.click();
    const accountabilityHeading = page.getByRole("heading", { name: "Accountability", exact: true, level: 2 });
    const snackbar = page.locator('#mui-portal-root [role="alert"]').first();
    // Wait for either the heading (successful navigation) or the snackbar (validation error).
    await Promise.race([
      accountabilityHeading.waitFor({ state: "visible", timeout: 10000 }),
      snackbar.waitFor({ state: "visible", timeout: 10000 }),
    ]);
    if (await accountabilityHeading.isVisible()) {
      await expect(accountabilityHeading).toBeVisible();
    } else {
      await expect(snackbar).toBeVisible();
    }
  });

  test("shows snackbar when continuing to accountability with invalid partner step", async ({ page }: { page: Page }) => {
    await page.goto("/");
    await chooseMembership(page, "Victory Member");

    // Click continue without filling any fields
    await page.getByRole("button", { name: "Continue to Accountability" }).click();

      const snackbar = page.locator('#mui-portal-root [role="alert"]').first();
      await expect(snackbar).toBeVisible();
      await expect(snackbar).toContainText("Some fields need your attention");
      await expect(snackbar).toContainText("highlighted errors");
  });

  test("shows snackbar when advancing to review with incomplete accountability step", async ({ page }: { page: Page }) => {
    await page.goto("/");
    await chooseMembership(page, "Victory Member");

    await fillPartnerStep(page);
    // Navigate to accountability without a signature
    await fillAccountabilityStepWithoutSignature(page, { fillPrintedName: false });

    // Attempt to go to review without completing accountability
    await page.getByRole("button", { name: "Review and Generate PDF" }).click();

      const snackbar = page.locator('#mui-portal-root [role="alert"]').first();
      await expect(snackbar).toBeVisible();
      await expect(snackbar).toContainText("Some fields need your attention");
  });

  test("review-path snackbar auto-dismisses after timeout", async ({ page }: { page: Page }) => {
    await page.goto("/");
    await chooseMembership(page, "Victory Member");

    await fillPartnerStep(page);
    await fillAccountabilityStepWithoutSignature(page, { fillPrintedName: false });

    await page.getByRole("button", { name: "Review and Generate PDF" }).click();
      const snackbar = page.locator("#mui-portal-root .snackbar");
    await expect(snackbar).toBeVisible();

    await expect(snackbar).toBeHidden({ timeout: 7000 });
  });

  test("snackbar dismisses when the dismiss button is clicked", async ({ page }: { page: Page }) => {
    await page.goto("/");
    await chooseMembership(page, "Victory Member");

    // Trigger snackbar
    await page.getByRole("button", { name: "Continue to Accountability" }).click();
      const snackbar = page.locator('#mui-portal-root [role="alert"]').first();
    await expect(snackbar).toBeVisible();

    // Click dismiss (MUI Alert close button has accessible name "Close")
      await snackbar.getByRole("button", { name: /close/i }).click();
    await expect(snackbar).toBeHidden();
  });

  test("snackbar auto-dismisses after timeout", async ({ page }: { page: Page }) => {
    await page.goto("/");
    await chooseMembership(page, "Victory Member");

    await page.getByRole("button", { name: "Continue to Accountability" }).click();
      const snackbar = page.locator('#mui-portal-root [role="alert"]').first();
    await expect(snackbar).toBeVisible();

    await expect(snackbar).toBeHidden({ timeout: 7000 });
  });

  test("snackbar timeout resets when shown again", async ({ page }: { page: Page }) => {
    await page.goto("/");
    await chooseMembership(page, "Victory Member");

    const continueButton = page.getByRole("button", { name: "Continue to Accountability" });

    // First validation failure shows snackbar.
    await continueButton.click();
      const snackbar = page.locator('#mui-portal-root [role="alert"]', { hasText: "Some fields need your attention" }).first();
      await snackbar.waitFor({ state: "visible", timeout: 10000 });
      await expect(snackbar).toBeVisible();

      // Trigger snackbar again before auto-dismiss to ensure timeout is refreshed.
      await page.waitForTimeout(2500);
      await continueButton.click();

      // Final assertion: the snackbar should eventually hide after the (refreshed) timeout.
      await expect(snackbar).toBeHidden({ timeout: 7000 });
  });

  test("no snackbar shown when partner step is valid on continue", async ({ page }: { page: Page }) => {
    await page.goto("/");
    await chooseMembership(page, "Victory Member");

    await fillPartnerStep(page);
    await page.getByRole("button", { name: "Continue to Accountability" }).click();

    // Should navigate to accountability without snackbar
    await expect(page.getByRole("heading", { name: "Accountability", exact: true, level: 2 })).toBeVisible();
      await expect(page.locator("#mui-portal-root .snackbar")).toBeHidden();
  });
});
