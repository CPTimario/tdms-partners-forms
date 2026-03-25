import { test, expect } from "@playwright/test";

test("selecting a team/missioner autofills dependent fields", async ({ page }) => {
  // Intercept the teams API and return a deterministic payload
  await page.route("**/api/teams**", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        teams: [
          {
            teamName: "Southeast Team",
            nation: "Thailand",
            travelDate: "2026-06-20",
            sendingChurch: "Every Nation Makati",
            missioners: ["Alice Example", "Bob Example"],
          },
        ],
      }),
    });
  });

  // Open the non-victory entry to skip the membership gate
  await page.goto("/non-victory");
  await expect(page.getByRole("heading", { name: "Ten Days Missions Support Forms" })).toBeVisible();

  // Focus the Missioner Name/Team input and type to trigger suggestions
  const missionerInput = page.getByRole("combobox", { name: /^Missioner Name\/Team/ });
  await missionerInput.click();
  await missionerInput.fill("Alice");

  // Wait for the listbox to appear and click the matching option
  const listbox = page.getByRole("listbox");
  await expect(listbox).toBeVisible();

  const option = listbox.getByRole("option").first();
  await option.click();

  // After selection, the dependent fields should be populated
  await expect(page.getByRole("textbox", { name: /^Nation/ })).toHaveValue("Thailand");
  await expect(page.getByRole("textbox", { name: /^Travel Date/ })).toHaveValue("2026-06-20");
  await expect(page.getByRole("textbox", { name: /^Sending Church/ })).toHaveValue("Every Nation Makati");
});

  test("select both team and missioner options and verify fields remain correct", async ({ page }) => {
    await page.route("**/api/teams**", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          teams: [
            {
              teamName: "Southeast Team",
              nation: "Thailand",
              travelDate: "2026-06-20",
              sendingChurch: "Every Nation Makati",
              missioners: ["Alice Example", "Bob Example"],
            },
          ],
        }),
      });
    });

    await page.goto("/non-victory");

    const input = page.getByRole("combobox", { name: /^Missioner Name\/Team/ });
    await input.click();
    await input.fill("Team");
    const listbox = page.getByRole("listbox");
    await expect(listbox).toBeVisible();
    // click team option
    await listbox.getByRole("option", { name: /Team: Southeast Team/ }).click();

    await expect(page.getByRole("textbox", { name: /^Nation/ })).toHaveValue("Thailand");

    // Now pick a missioner option and assert fields remain populated
    await input.fill("Alice");
    await expect(listbox).toBeVisible();
    await listbox.getByRole("option", { name: /Alice Example/ }).click();

    await expect(page.getByRole("textbox", { name: /^Nation/ })).toHaveValue("Thailand");
    await expect(page.getByRole("textbox", { name: /^Travel Date/ })).toHaveValue("2026-06-20");
    await expect(page.getByRole("textbox", { name: /^Sending Church/ })).toHaveValue("Every Nation Makati");
  });
