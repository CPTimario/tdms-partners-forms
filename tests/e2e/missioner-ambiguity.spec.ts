import { test, expect } from "@playwright/test";

test("missioner present in multiple teams selects correct team data", async ({ page }) => {
  // Return two teams that both include 'Alex' as a missioner
  await page.route("**/api/teams**", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        teams: [
          {
            teamName: "Alpha Team",
            nation: "Country A",
            travelDate: "2026-08-01",
            sendingChurch: "Church A",
            missioners: ["Alex"],
          },
          {
            teamName: "Beta Team",
            nation: "Country B",
            travelDate: "2026-09-15",
            sendingChurch: "Church B",
            missioners: ["Alex"],
          },
        ],
      }),
    });
  });

  await page.goto("/non-victory");
  const input = page.getByRole("combobox", { name: /^Missioner Name\/Team/ });
  await input.click();
  await input.fill("Alex");

  const listbox = page.getByRole("listbox");
  await expect(listbox).toBeVisible();

  // Find the options that include 'Alex' — there may be other options in the list.
  const alexOptions = listbox.getByRole("option", { name: /Alex/ });
  const alexCount = await alexOptions.count();
  expect(alexCount).toBeGreaterThanOrEqual(2);

  // Click the Alex option that belongs to Alpha Team
  const alphaOption = listbox.getByRole("option", { name: /Alpha Team/ });
  await alphaOption.first().click();
  await expect(page.getByRole("textbox", { name: /^Nation/ })).toHaveValue("Country A");

  // Now re-open and choose the second option — ensure input is focused so list reappears
  await input.click();
  await input.fill("");
  await input.fill("Alex");
  await page.waitForTimeout(100);
  await expect(listbox).toBeVisible();
  const betaOption = listbox.getByRole("option", { name: /Beta Team/ });
  await betaOption.first().click();
  await expect(page.getByRole("textbox", { name: /^Nation/ })).toHaveValue("Country B");
});
