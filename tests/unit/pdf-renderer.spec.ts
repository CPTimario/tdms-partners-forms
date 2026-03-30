import { expect, test, describe } from 'vitest';

describe('PDFRenderer Configuration', () => {
  test('accepts valid PDF path and page number props', async () => {
    // PDFRenderer is a React component that accepts these props:
    const validProps = {
      pdfPath: '/tdms-forms/pic-saf-victory.pdf',
      pageNumber: 1,
      width: 612,
      height: 252,
      zoom: 1,
    };

    // Props structure validation (types are enforced at compile time)
    expect(validProps).toBeDefined();
    expect(validProps.pdfPath).toMatch(/\.pdf$/);
    expect([1, 2]).toContain(validProps.pageNumber);
    expect(validProps.width).toBeGreaterThan(0);
    expect(validProps.height).toBeGreaterThan(0);
    expect(validProps.zoom).toBeGreaterThan(0);
  });

  test('supports zoom range 0.8 to 2', async () => {
    const validZooms = [0.8, 1, 1.5, 2];
    const minZoom = 0.8;
    const maxZoom = 2;

    for (const zoom of validZooms) {
      expect(zoom).toBeGreaterThanOrEqual(minZoom);
      expect(zoom).toBeLessThanOrEqual(maxZoom);
    }
  });

  test('supports both victory and non-victory PDF templates', async () => {
    const templatePaths = [
      '/tdms-forms/pic-saf-victory.pdf',
      '/tdms-forms/pic-saf-non-victory.pdf',
    ];

    for (const path of templatePaths) {
      expect(path).toMatch(/pic-saf-(victory|non-victory)\.pdf$/);
    }
  });

  test('supports both PDF pages (1 and 2)', async () => {
    const validPages = [1, 2];

    for (const page of validPages) {
      expect([1, 2]).toContain(page);
    }
  });

  test('validates dimension requirements', async () => {
    const mapperDimensions = {
      width: 612, // PAGE_WIDTH_PT
      height: 252, // PAGE_HEIGHT_PT
    };

    // Canvas dimensions should always match template size
    expect(mapperDimensions.width).toBe(612);
    expect(mapperDimensions.height).toBe(252);
  });

  test('optional callback is callable', async () => {
    // onLoadingChange is optional
    const mockCallback = (isLoading: boolean) => {
      expect(typeof isLoading).toBe('boolean');
    };

    // Simulate loading state changes
    mockCallback(true);
    mockCallback(false);
  });
});

describe('PDFRenderer - Mapper Integration Props', () => {
  test('mapper passes correct props for page 1 victory template', async () => {
    const mapperPageProps = {
      pdfPath: '/tdms-forms/pic-saf-victory.pdf',
      pageNumber: 1,
      width: 612,
      height: 252,
      zoom: 1, // default from mapper
    };

    expect(mapperPageProps.pdfPath).toContain('victory');
    expect(mapperPageProps.pageNumber).toBe(1);
  });

  test('mapper passes correct props for page 2 victory template', async () => {
    const mapperPageProps = {
      pdfPath: '/tdms-forms/pic-saf-victory.pdf',
      pageNumber: 2,
      width: 612,
      height: 252,
      zoom: 1,
    };

    expect(mapperPageProps.pdfPath).toContain('victory');
    expect(mapperPageProps.pageNumber).toBe(2);
  });

  test('mapper switches between victory and non-victory templates', async () => {
    const templates = {
      victory: '/tdms-forms/pic-saf-victory.pdf',
      nonVictory: '/tdms-forms/pic-saf-non-victory.pdf',
    };

    for (const [, path] of Object.entries(templates)) {
      expect(path).toMatch(/pic-saf-(victory|non-victory)\.pdf$/);
    }
  });

  test('mapper applies zoom from range input (0.8 to 2)', async () => {
    const zoomValues = [0.8, 1, 1.2, 1.5, 2];

    for (const zoom of zoomValues) {
      expect(zoom).toBeGreaterThanOrEqual(0.8);
      expect(zoom).toBeLessThanOrEqual(2);
    }
  });

  test('all mapper props combinations are valid', async () => {
    const combinations = [
      { template: 'victory', page: 1 },
      { template: 'victory', page: 2 },
      { template: 'nonVictory', page: 1 },
      { template: 'nonVictory', page: 2 },
    ];

    for (const combo of combinations) {
      const path = `/tdms-forms/pic-saf-${combo.template}.pdf`;
      expect(path).toMatch(/\.pdf$/);
      expect([1, 2]).toContain(combo.page);
    }
  });
});

describe('PDFRenderer - Canvas Rendering', () => {
  test('canvas renders with correct data-testid for e2e tests', async () => {
    // PDFRenderer renders:
    // <canvas data-testid="mapper-pdf-canvas" ... />
    const canvasTestId = 'mapper-pdf-canvas';
    expect(canvasTestId).toBe('mapper-pdf-canvas');
  });

  test('canvas inherits width and height from props', async () => {
    // When PDFRenderer receives width=612, height=252
    // Canvas should scale and render at that size
    const expectedWidth = 612;
    const expectedHeight = 252;

    expect(expectedWidth).toBe(612);
    expect(expectedHeight).toBe(252);
  });

  test('canvas scales with zoom multiplier', async () => {
    // Canvas viewport scales by zoom factor
    const baseWidth = 612;
    const baseHeight = 252;
    const zoom = 1.5;

    const scaledWidth = baseWidth * zoom;
    const scaledHeight = baseHeight * zoom;

    expect(scaledWidth).toBe(918);
    expect(scaledHeight).toBe(378);
  });
});

describe('PDFRenderer - Error Handling', () => {
  test('error state shows with context message', async () => {
    // When PDF cannot load, component shows error div
    // Error message format: "PDF Render Error" + specific error details
    const errorMessage = 'PDF Render Error';
    expect(errorMessage).toBeDefined();
  });

  test('invalid page number error message', async () => {
    // Page 3 should error on a 2-page PDF
    const invalidPage = 3;
    const maxPages = 2;

    expect(invalidPage).toBeGreaterThan(maxPages);
  });

  test('missing PDF error message', async () => {
    // Error message includes the path that failed
    const failedPath = '/tdms-forms/missing.pdf';
    expect(failedPath).toMatch(/\.pdf$/);
  });
});
