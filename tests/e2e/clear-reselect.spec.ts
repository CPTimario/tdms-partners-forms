import { test, expect } from "@playwright/test";

test.describe("Clear then reselect flow", () => {
  test("deeplink initializes, typing clears then reselect updates URL", async ({ page }) => {
    // Intercept the teams API and return a deterministic payload so suggestions appear
    await page.route("**/api/teams**", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          teams: [
            {
              id: 1,
              teamName: "Southeast Team",
              nation: "Thailand",
              travelDate: "2026-06-20",
              sendingChurch: "Every Nation Makati",
              missioners: ["Alice Example"],
            },
          ],
        }),
      });
    });

    // Navigate to a deeplink with a recipient on the non-victory route
    // so the support form is rendered immediately (avoids membership gate)
    await page.goto("/non-victory?recipient=team::1");

    // Broad selector: match inputs with explicit text type or no type attribute
    const input = page.locator('input[type="text"], input:not([type])').first();
    // wait for an input to be visible so we can interact with it
    await input.waitFor({ state: "visible", timeout: 8000 });
    // capture initial state for debugging (removed screenshots after stabilization)

    // Type to clear the selection (this should remove the recipient param)
    // use the accessible combobox role so we target the same element as other E2E tests
    const missionerInput = page.getByRole("combobox", { name: /^Missioner Name\/Team/ });
    await missionerInput.waitFor({ state: "visible", timeout: 3000 });
    await missionerInput.click();
    await missionerInput.fill("");
    await missionerInput.type("SoutheastX", { delay: 60 });

    // wait for URL to update (recipient param removed) with polling up to 2s
    const clearStart = Date.now();
    let urlAfterClear = page.url();
    while (Date.now() - clearStart < 2000) {
      urlAfterClear = page.url();
      if (!urlAfterClear.includes("recipient=")) break;
      await page.waitForTimeout(100);
    }
    expect(urlAfterClear).not.toContain("recipient=");

    // Now type to find the missioner and select it from suggestions
    await missionerInput.fill("");
    await missionerInput.type("Alice", { delay: 60 });

    // wait for the specific option text to appear and click it (deterministic)
    const optionSelector = (name = "Alice Example") => page.getByRole("option", { name }).first();
    let clicked = false;
    // retry a few times with short backoff to reduce flakes caused by transient detaches
    for (let attempt = 0; attempt < 3; attempt++) {
      const option = optionSelector();
      try {
        await option.waitFor({ state: "visible", timeout: 4000 });
        await option.click();
        clicked = true;
        break;
      } catch {
        await page.waitForTimeout(250);
      }
    }
    if (!clicked) {
      // final attempt with longer timeout to provide clearer failure diagnostics
      const option = optionSelector();
      await option.waitFor({ state: "visible", timeout: 10000 });
      await option.click();
    }

    // URL should now again include recipient param
    await page.waitForTimeout(2000);
    expect(decodeURIComponent(page.url())).toContain("recipient=");
  });
});
