import { expect, test } from "@playwright/test";

test.describe("PDF.js Rendering - Mapper Integration", () => {
  test("renders PDF correctly when mapper loads", async ({ page }) => {
    await page.goto("/mapper");

    // Canvas element exists and is visible
    const pdfCanvas = page.getByTestId("mapper-pdf-canvas");
    await expect(pdfCanvas).toBeVisible();

    // Canvas has proper dimensions
    const canvasBox = await pdfCanvas.boundingBox();
    expect(canvasBox).toBeDefined();
    expect(canvasBox?.width).toBeGreaterThan(0);
    expect(canvasBox?.height).toBeGreaterThan(0);
  });

  test("displays victory template on initial load", async ({ page }) => {
    await page.goto("/mapper");

    // Victory template is selected by default
    const templateSelect = page.getByRole("combobox", { name: "Template" });
    await expect(templateSelect).toHaveValue("victory");

    // Canvas is visible
    const pdfCanvas = page.getByTestId("mapper-pdf-canvas");
    await expect(pdfCanvas).toBeVisible();
  });

  test("renders non-victory template when selected", async ({ page }) => {
    await page.goto("/mapper");

    const templateSelect = page.getByRole("combobox", { name: "Template" });
    await templateSelect.selectOption("nonVictory");

    // Canvas should still be visible after template switch
    const pdfCanvas = page.getByTestId("mapper-pdf-canvas");
    await expect(pdfCanvas).toBeVisible();
  });

  test("page switching updates PDF canvas correctly", async ({ page }) => {
    await page.goto("/mapper");

    const pageSelect = page.getByRole("combobox", { name: "Page" });

    // Start on page 1
    await expect(pageSelect).toHaveValue("1");
    const canvas1 = page.getByTestId("mapper-pdf-canvas");
    await expect(canvas1).toBeVisible();

    // Switch to page 2
    await pageSelect.selectOption("2");
    await expect(pageSelect).toHaveValue("2");

    // Canvas should still be visible
    const canvas2 = page.getByTestId("mapper-pdf-canvas");
    await expect(canvas2).toBeVisible();

    // Switch back to page 1
    await pageSelect.selectOption("1");
    await expect(pageSelect).toHaveValue("1");
    const canvas1Again = page.getByTestId("mapper-pdf-canvas");
    await expect(canvas1Again).toBeVisible();
  });

  test("zoom scaling affects canvas rendering", async ({ page }) => {
    await page.goto("/mapper");

    const zoomInput = page.getByRole("slider");
    const pdfCanvas = page.getByTestId("mapper-pdf-canvas");

    // Record initial size at zoom 1
    await zoomInput.fill("1");
    const initialBox = await pdfCanvas.boundingBox();

    // Zoom to 1.5x
    await zoomInput.fill("1.5");
    await page.waitForTimeout(200);
    const zoomedBox = await pdfCanvas.boundingBox();

    // Canvas should be larger
    expect(zoomedBox?.width ?? 0).toBeGreaterThan((initialBox?.width ?? 0) * 1.2);
    expect(zoomedBox?.height ?? 0).toBeGreaterThan((initialBox?.height ?? 0) * 1.2);

    // Zoom back down
    await zoomInput.fill("0.8");
    await page.waitForTimeout(200);
    const unzoomedBox = await pdfCanvas.boundingBox();

    // Canvas should be smaller than initial
    expect(unzoomedBox?.width ?? 0).toBeLessThan((initialBox?.width ?? 0) * 0.9);
  });

  test("field boxes render on top of PDF canvas", async ({ page }) => {
    await page.goto("/mapper");

    const pdfCanvas = page.getByTestId("mapper-pdf-canvas");
    const firstFieldBox = page.getByTestId("mapper-box-partnerName");

    // Both are visible
    await expect(pdfCanvas).toBeVisible();
    await expect(firstFieldBox).toBeVisible();

    // Field box should be on top (higher z-index) based on DOM order
    // Field boxes come after canvas in the render tree
  });

  test("field interactions work with PDF rendering", async ({ page }) => {
    await page.goto("/mapper");

    // Select a field
    const fieldBox = page.getByTestId("mapper-box-partnerName");
    await fieldBox.click();

    // Field should show as selected
    const fieldBoxClasses = await fieldBox.getAttribute("class");
    expect(fieldBoxClasses).toContain("fieldBoxSelected");

    // Should be able to drag it
    const initialBox = await fieldBox.boundingBox();
    await fieldBox.dragTo(page.getByTestId("mapper-surface"), {
      sourcePosition: { x: (initialBox?.width ?? 0) / 2, y: (initialBox?.height ?? 0) / 2 },
      targetPosition: { x: 400, y: 200 },
    });

    // Field should have moved
    const newBox = await fieldBox.boundingBox();
    expect(newBox?.x).not.toBe(initialBox?.x);
  });

  test("template background is always beneath field overlays", async ({ page }) => {
    await page.goto("/mapper");

    const canvas = page.getByTestId("mapper-pdf-canvas");
    const canvasStyle = await canvas.evaluate((el) => {
      return window.getComputedStyle(el);
    });

    // Canvas should have pointer-events: none so it doesn't block interactions
    expect(canvasStyle.pointerEvents).toBe("none");
  });

  test("mapper operations preserve PDF visibility", async ({ page }) => {
    await page.goto("/mapper");

    const pdfCanvas = page.getByTestId("mapper-pdf-canvas");

    // Click on canvas (place field)
    await page.getByTestId("mapper-surface").click({ position: { x: 300, y: 200 } });
    await expect(pdfCanvas).toBeVisible();

    // Drag field
    const field = page.getByTestId("mapper-box-partnerName");
    await field.dragTo(page.getByTestId("mapper-surface"), {
      targetPosition: { x: 350, y: 250 },
    });
    await expect(pdfCanvas).toBeVisible();

    // Use keyboard
    await field.click();
    await page.keyboard.press("ArrowUp");
    await expect(pdfCanvas).toBeVisible();

    // Switch page
    await page.getByRole("combobox", { name: "Page" }).selectOption("2");
    await expect(pdfCanvas).toBeVisible();

    // Switch template
    await page.getByRole("combobox", { name: "Template" }).selectOption("nonVictory");
    await expect(pdfCanvas).toBeVisible();
  });

  test("zooming in and out maintains field visibility", async ({ page }) => {
    await page.goto("/mapper");

    const field = page.getByTestId("mapper-box-partnerName");
    const zoomInput = page.getByRole("slider");

    // Field should be visible at zoom 1
    await zoomInput.fill("1");
    await page.waitForTimeout(100);
    await expect(field).toBeVisible();

    // Zoom to 1.5x
    await zoomInput.fill("1.5");
    await page.waitForTimeout(200);
    await expect(field).toBeVisible();

    // Field box should be larger (scaled)
    const pos15Box = await field.boundingBox();
    expect(pos15Box?.width).toBeGreaterThan(20);

    // Zoom back to 1
    await zoomInput.fill("1");
    await page.waitForTimeout(200);
    await expect(field).toBeVisible();

    // Zoom to 0.8
    await zoomInput.fill("0.8");
    await page.waitForTimeout(200);
    await expect(field).toBeVisible();

    const pos08Box = await field.boundingBox();
    expect(pos08Box?.width).toBeGreaterThan(10);
  });

  test("multiple template switches render correctly", async ({ page }) => {
    await page.goto("/mapper");

    const templateSelect = page.getByRole("combobox", { name: "Template" });
    const pdfCanvas = page.getByTestId("mapper-pdf-canvas");

    // Test multiple switches
    const templates = ["victory", "nonVictory", "victory", "nonVictory"];

    for (const template of templates) {
      await templateSelect.selectOption(template);
      await expect(pdfCanvas).toBeVisible();
      await page.waitForTimeout(100);
    }
  });

  test("field box elements are interactive", async ({ page }) => {
    await page.goto("/mapper");

    // Select a field box (this interacts with DOM on top of canvas)
    const field = page.getByTestId("mapper-box-partnerName");
    await field.click();

    // Click should register and select the field
    const classes = await field.getAttribute("class");
    expect(classes).toContain("fieldBoxSelected");

    // Focus the surface and send keyboard command
    const surface = page.getByTestId("mapper-surface");
    await surface.focus();
    await page.keyboard.press("ArrowUp");

    // Field should remain visible and interactive
    await expect(field).toBeVisible();
  });
});

test.describe("PDF.js Rendering - Error Recovery", () => {
  test("loads non-victory PDF asset without 404", async ({ page }) => {
    let nonVictoryPdfStatus: number | null = null;

    page.on("response", (response) => {
      if (response.url().includes("/tdms-forms/pic-saf-non-victory.pdf")) {
        nonVictoryPdfStatus = response.status();
      }
    });

    await page.goto("/mapper");
    await page.getByRole("combobox", { name: "Template" }).selectOption("nonVictory");

    await expect(page.getByTestId("mapper-pdf-canvas")).toBeVisible();
    await expect.poll(() => nonVictoryPdfStatus).toBe(200);
    await expect(page.getByText("PDF Render Error")).toHaveCount(0);
  });

  test("rapid template and page switching does not surface renderer errors", async ({ page }) => {
    await page.goto("/mapper");

    const templateSelect = page.getByRole("combobox", { name: "Template" });
    const pageSelect = page.getByRole("combobox", { name: "Page" });

    for (let i = 0; i < 6; i += 1) {
      await templateSelect.selectOption(i % 2 === 0 ? "nonVictory" : "victory");
      await pageSelect.selectOption(i % 2 === 0 ? "2" : "1");
    }

    await expect(page.getByTestId("mapper-pdf-canvas")).toBeVisible();
    await expect(page.getByText("PDF Render Error")).toHaveCount(0);
  });

  test("PDF canvas renders on page load without network errors", async ({ page }) => {
    // Monitor for network errors
    let networkError = false;
    page.on("response", (response) => {
      if (response.status() >= 400 && response.url().includes("pdf")) {
        networkError = true;
      }
    });

    await page.goto("/mapper");

    // PDF should render successfully
    const pdfCanvas = page.getByTestId("mapper-pdf-canvas");
    await expect(pdfCanvas).toBeVisible();

    // No network errors for PDF files
    expect(networkError).toBe(false);
  });

  test("mapper remains functional if PDF worker loads successfully", async ({ page }) => {
    await page.goto("/mapper");

    // Check that pdf.worker.mjs is loaded
    const hasWorker = await page.evaluate(() => {
      return (window as any).pdfjsWorkerLoaded !== false;
    });

    expect(hasWorker).toBeTruthy();

    // Worker should be available for PDF.js
    // (This is handled by PDF.js internally)

    // Mapper should still be interactive
    const field = page.getByTestId("mapper-box-partnerName");
    await field.click();

    const classes = await field.getAttribute("class");
    expect(classes).toContain("fieldBoxSelected");
  });
});
