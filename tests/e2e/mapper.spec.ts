import { expect, test } from "@playwright/test";

test.describe("Development mapper", () => {
  test("renders mapper page with template background and repositions selected field on click", async ({ page }) => {
    await page.goto("/mapper");

    await expect(page.getByRole("heading", { name: "PDF Mapper (Development Only)" })).toBeVisible();
    await expect(page.getByTestId("mapper-pdf-canvas")).toBeVisible();
    await expect(page.getByTestId("mapper-last-click")).toContainText("Click the template");

    const initialX = await page.getByTestId("mapper-x-input").inputValue();

    await page.getByTestId("mapper-surface").click({ position: { x: 520, y: 210 } });
    await expect(page.getByTestId("mapper-last-click")).toContainText("x:");
    await expect(page.getByTestId("mapper-last-click")).toContainText("y:");
    await expect(page.getByTestId("mapper-x-input")).not.toHaveValue(initialX);
  });

  test("supports field selection, dragging, page switch, and keyboard nudging", async ({ page }) => {
    await page.goto("/mapper");

    await page.getByTestId("mapper-box-partnerName").click();
    await expect(page.getByTestId("mapper-selected-field")).toHaveText("partnerName");

    await page.getByLabel("Page").selectOption("2");
    await expect(page.getByTestId("mapper-box-partnerSignature")).toBeVisible();

    await page.getByTestId("mapper-box-partnerSignature").click();
    await expect(page.getByTestId("mapper-selected-field")).toHaveText("partnerSignature");

    const signatureBox = page.getByTestId("mapper-box-partnerSignature");
    const box = await signatureBox.boundingBox();
    if (!box) {
      throw new Error("Expected partnerSignature box bounding box.");
    }

    const xBeforeDrag = Number(await page.getByTestId("mapper-x-input").inputValue());

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 40, box.y + box.height / 2 + 12, { steps: 10 });
    await page.mouse.up();

    const xAfterDrag = Number(await page.getByTestId("mapper-x-input").inputValue());
    expect(xAfterDrag).toBeGreaterThan(xBeforeDrag);

    const surface = page.getByTestId("mapper-surface");
    await surface.click({ position: { x: 8, y: 8 } });
    await expect(surface).toBeFocused();

    const xBeforeNudge = Number(await page.getByTestId("mapper-x-input").inputValue());
    await page.keyboard.press("ArrowRight");
    const xAfterNudge = Number(await page.getByTestId("mapper-x-input").inputValue());
    expect(xAfterNudge).toBeGreaterThan(xBeforeNudge);
  });

  test("supports resizing and saving coordinates", async ({ page }) => {
    let saveRequestBody: unknown = null;
    await page.route("**/api/mapper/coordinates", async (route) => {
      saveRequestBody = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      });
    });

    await page.goto("/mapper");

    await page.getByTestId("mapper-box-partnerName").click();
    await expect(page.getByTestId("mapper-selected-field")).toHaveText("partnerName");

    const widthBeforeResize = Number(await page.getByTestId("mapper-width-input").inputValue());
    const resizeHandle = page.getByTestId("mapper-resize-partnerName");
    const handleBox = await resizeHandle.boundingBox();
    if (!handleBox) {
      throw new Error("Expected resize handle bounding box.");
    }

    await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(handleBox.x + handleBox.width / 2 + 30, handleBox.y + handleBox.height / 2 - 8, {
      steps: 8,
    });
    await page.mouse.up();

    const widthAfterResize = Number(await page.getByTestId("mapper-width-input").inputValue());
    expect(widthAfterResize).toBeGreaterThan(widthBeforeResize);

    await page.getByRole("button", { name: "Save Coordinates to Source" }).click();

    await expect
      .poll(async () => page.getByTestId("mapper-save-status").innerText(), { timeout: 15000 })
      .toContain("Saved to lib/pdf-coordinates.ts");

    expect(saveRequestBody).toBeTruthy();
    expect(saveRequestBody).toHaveProperty("coordinates.victory.partnerName.x");
    expect(saveRequestBody).toHaveProperty("coordinates.nonVictory.partnerName.x");
  });
});
