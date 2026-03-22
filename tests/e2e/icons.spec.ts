import { expect, test } from "@playwright/test";

test.describe("Icon assets and metadata", () => {
  test("serves icon URLs exposed in metadata", async ({ page, request }) => {
    await page.goto("/");

    const iconHrefs = await page
      .locator('link[rel="icon"], link[rel="shortcut icon"]')
      .evaluateAll((elements) =>
        elements
          .map((element) => element.getAttribute("href") ?? "")
          .filter(Boolean),
      );

    const appleHref = await page
      .locator('link[rel="apple-touch-icon"]')
      .first()
      .getAttribute("href");

    const hrefsToCheck = Array.from(new Set([...iconHrefs, appleHref ?? "", "/favicon.ico"])).filter(Boolean);
    expect(hrefsToCheck.length).toBeGreaterThan(0);

    for (const href of hrefsToCheck) {
      const response = await request.get(href);
      expect(response.ok(), `Expected icon URL to resolve: ${href}`).toBeTruthy();

      const contentType = response.headers()["content-type"] ?? "";
      expect(contentType.startsWith("image/")).toBeTruthy();
    }
  });

  test("publishes icon links in page metadata", async ({ page }) => {
    await page.goto("/");

    const iconLinks = page.locator('link[rel="icon"], link[rel="shortcut icon"]');

    const iconHrefs = await iconLinks.evaluateAll((elements) =>
      elements
        .map((element) => element.getAttribute("href") ?? "")
        .filter(Boolean),
    );
    expect(iconHrefs.length).toBeGreaterThanOrEqual(1);
    expect(iconHrefs).toContain("/icon.svg");
    expect(iconHrefs.some((href) => href.includes("/favicon.ico"))).toBeTruthy();

    const appleIconLink = page.locator('link[rel="apple-touch-icon"]');
    await expect(appleIconLink).toHaveCount(1);
    await expect(appleIconLink).toHaveAttribute("href", /\/apple-icon/);
  });
});
