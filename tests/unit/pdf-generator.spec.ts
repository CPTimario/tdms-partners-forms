import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PDFDocument, PDFPage, StandardFonts } from 'pdf-lib';
import { expect, test, describe } from 'vitest';

import {
  getTemplateCoordinates,
  victoryCourseCoordinates,
  nonVictoryCoordinates,
} from '@/lib/pdf-coordinates';
import { generateReviewPDF } from '@/lib/pdf-generator';
import { initialSupportFormData } from '@/lib/support-form';
import type { SupportFormData } from '@/lib/support-form';

const VALID_SIGNATURE_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wn7qE0AAAAASUVORK5CYII=';

function readTemplate(templateName: 'pic-saf-victory.pdf' | 'pic-saf-non-victory.pdf') {
  return readFileSync(join(process.cwd(), 'public', 'tdms-forms', templateName));
}

function mockTemplateFetch(
  templateBytesByPath?: Partial<
    Record<'/tdms-forms/pic-saf-victory.pdf' | '/tdms-forms/pic-saf-non-victory.pdf', Uint8Array>
  >,
  status = 200,
) {
  const originalFetch = globalThis.fetch;
  const requestedUrls: string[] = [];

  globalThis.fetch = async (input: RequestInfo | URL) => {
    const url =
      typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    requestedUrls.push(url);

    if (status !== 200) {
      return new Response('template error', { status });
    }

    const normalizedPath = new URL(url, 'http://localhost').pathname as
      | '/tdms-forms/pic-saf-victory.pdf'
      | '/tdms-forms/pic-saf-non-victory.pdf';
    const bytes = templateBytesByPath?.[normalizedPath];

    if (!bytes) {
      return new Response('missing template', { status: 404 });
    }

    const body = Uint8Array.from(bytes).buffer;

    return new Response(body, {
      status: 200,
      headers: { 'Content-Type': 'application/pdf' },
    });
  };

  return {
    requestedUrls,
    restore() {
      globalThis.fetch = originalFetch;
    },
  };
}

function buildValidFormData(overrides?: Partial<SupportFormData>): SupportFormData {
  return {
    ...initialSupportFormData,
    membershipType: 'victory',
    consentGiven: true,
    partnerName: 'Chris Timario',
    emailAddress: 'chris@example.com',
    mobileNumber: '09171234567',
    localChurch: 'Every Nation Makati',
    missionaryName: 'Southeast Team',
    currency: 'USD',
    amount: '5000',
    nation: 'Thailand',
    travelDate: '2026-06-20',
    sendingChurch: 'Every Nation Greenhills',
    partnerSignature: VALID_SIGNATURE_DATA_URL,
    partnerPrintedName: 'Chris Timario',
    unableToGoChoice: 'teamFund',
    reroutedChoice: 'retain',
    canceledChoice: 'generalFund',
    ...overrides,
  };
}

async function captureDrawnText<T>(action: () => Promise<T>) {
  const originalDrawText = PDFPage.prototype.drawText;
  const drawnText: string[] = [];
  const drawCalls: Array<{ text: string; options: Record<string, unknown> }> = [];

  (PDFPage.prototype as unknown as { drawText: unknown }).drawText = function patchedDrawText(
    this: PDFPage,
    text: string,
    options: unknown,
  ) {
    drawnText.push(text);
    drawCalls.push({ text, options: (options as Record<string, unknown>) ?? {} });
    return (originalDrawText as unknown as (...args: unknown[]) => unknown).call(
      this,
      text,
      options,
    );
  } as unknown as PDFPage['drawText'];

  try {
    const result = await action();
    return {
      result,
      drawnText,
      drawCalls,
    };
  } finally {
    (PDFPage.prototype as unknown as { drawText: unknown }).drawText = originalDrawText;
  }
}

async function captureDrawnImages<T>(action: () => Promise<T>) {
  const originalDrawImage = PDFPage.prototype.drawImage;
  const drawImageCalls: Array<Record<string, unknown>> = [];

  (PDFPage.prototype as unknown as { drawImage: unknown }).drawImage = function patchedDrawImage(
    this: PDFPage,
    image: unknown,
    options: unknown,
  ) {
    void image;
    drawImageCalls.push((options as Record<string, unknown>) ?? {});
    return (originalDrawImage as unknown as (...args: unknown[]) => unknown).call(
      this,
      image,
      options,
    );
  } as unknown as PDFPage['drawImage'];

  try {
    const result = await action();
    return {
      result,
      drawImageCalls,
    };
  } finally {
    (PDFPage.prototype as unknown as { drawImage: unknown }).drawImage = originalDrawImage;
  }
}

describe('PDF Generator - Data Validation', () => {
  test('validates form data structure', () => {
    const data = buildValidFormData();

    expect(data).toHaveProperty('membershipType');
    expect(data).toHaveProperty('partnerName');
    expect(data).toHaveProperty('emailAddress');
    expect(data).toHaveProperty('consentGiven');
    expect(data).toHaveProperty('unableToGoChoice');
    expect(data).toHaveProperty('reroutedChoice');
    expect(data).toHaveProperty('canceledChoice');
    expect(data).toHaveProperty('partnerSignature');
  });

  test('validates all required fields are present', () => {
    const data = buildValidFormData();

    expect(data.partnerName).toBeTruthy();
    expect(data.emailAddress).toBeTruthy();
    expect(data.mobileNumber).toBeTruthy();
    expect(data.localChurch).toBeTruthy();
    expect(data.missionaryName).toBeTruthy();
    expect(data.amount).toBeTruthy();
    expect(data.nation).toBeTruthy();
    expect(data.travelDate).toBeTruthy();
    expect(data.sendingChurch).toBeTruthy();
    expect(data.partnerSignature).toBeTruthy();
    expect(data.partnerPrintedName).toBeTruthy();
  });

  test('validates accountability choice values', () => {
    const data = buildValidFormData();

    expect(['teamFund', 'generalFund', null]).toContain(data.unableToGoChoice);
    expect(['retain', 'generalFund', null]).toContain(data.reroutedChoice);
    expect(['generalFund', null]).toContain(data.canceledChoice);
  });

  test('validates membership type is either victory or nonVictory', () => {
    const victorData = buildValidFormData({ membershipType: 'victory' });
    const nonVictoryData = buildValidFormData({ membershipType: 'nonVictory' });

    expect(victorData.membershipType).toBe('victory');
    expect(nonVictoryData.membershipType).toBe('nonVictory');
  });

  test('validates nullable fields can be empty', () => {
    const data = buildValidFormData({
      unableToGoChoice: null,
      reroutedChoice: null,
      canceledChoice: null,
      partnerSignature: '',
      partnerPrintedName: '',
    });

    expect(data.unableToGoChoice).toBeNull();
    expect(data.reroutedChoice).toBeNull();
    expect(data.canceledChoice).toBeNull();
    expect(data.partnerSignature).toBe('');
    expect(data.partnerPrintedName).toBe('');
  });

  test('handles all membership type variants', () => {
    const typesToTest: Array<'victory' | 'nonVictory'> = ['victory', 'nonVictory'];

    typesToTest.forEach((type) => {
      const data = buildValidFormData({ membershipType: type });
      expect(data.membershipType).toBe(type);
    });
  });

  test('supports complete form data for both PDFs', () => {
    const data = buildValidFormData();

    // Partner info fields
    const partnerFields = [
      'partnerName',
      'emailAddress',
      'mobileNumber',
      'localChurch',
      'missionaryName',
      'amount',
      'nation',
      'travelDate',
      'sendingChurch',
    ];

    partnerFields.forEach((field) => {
      expect(data).toHaveProperty(field);
      expect((data as Record<string, unknown>)[field]).toBeTruthy();
    });

    // Accountability fields
    expect(data).toHaveProperty('unableToGoChoice');
    expect(data).toHaveProperty('reroutedChoice');
    expect(data).toHaveProperty('partnerSignature');
    expect(data).toHaveProperty('partnerPrintedName');
  });
});

describe('PDF Generator - Runtime Behavior', () => {
  test('fails when membership type is missing', async () => {
    const data = buildValidFormData({ membershipType: null });
    await expect(generateReviewPDF(data)).rejects.toThrow('Membership type is required');
  });

  test('generates a valid 2-page PDF from the victory template', async () => {
    const fetchMock = mockTemplateFetch({
      '/tdms-forms/pic-saf-victory.pdf': readTemplate('pic-saf-victory.pdf'),
      '/tdms-forms/pic-saf-non-victory.pdf': readTemplate('pic-saf-non-victory.pdf'),
    });

    try {
      const data = buildValidFormData({ membershipType: 'victory' });
      const generated = await generateReviewPDF(data);

      const header = new TextDecoder().decode(generated.slice(0, 5));
      expect(header).toBe('%PDF-');

      const parsed = await PDFDocument.load(generated);
      expect(parsed.getPageCount()).toBe(2);
      expect(
        fetchMock.requestedUrls.some((url) => url.includes('/tdms-forms/pic-saf-victory.pdf')),
      ).toBeTruthy();
    } finally {
      fetchMock.restore();
    }
  });

  test('draws split travel date fields and includes printed name text', async () => {
    const fetchMock = mockTemplateFetch({
      '/tdms-forms/pic-saf-victory.pdf': readTemplate('pic-saf-victory.pdf'),
      '/tdms-forms/pic-saf-non-victory.pdf': readTemplate('pic-saf-non-victory.pdf'),
    });

    try {
      const data = buildValidFormData({
        membershipType: 'victory',
        travelDate: '2026-06-20',
        partnerPrintedName: 'Chris Timario',
      });

      const { drawnText } = await captureDrawnText(() => generateReviewPDF(data));

      expect(drawnText).toContain('06');
      expect(drawnText).toContain('20');
      expect(drawnText).toContain('26');
      expect(drawnText).toContain('Chris Timario');
      expect(drawnText).not.toContain('2026-06-20');
    } finally {
      fetchMock.restore();
    }
  });

  test('supports PHP currency formatting in generated PDFs', async () => {
    const fetchMock = mockTemplateFetch({
      '/tdms-forms/pic-saf-victory.pdf': readTemplate('pic-saf-victory.pdf'),
      '/tdms-forms/pic-saf-non-victory.pdf': readTemplate('pic-saf-non-victory.pdf'),
    });

    try {
      const data = buildValidFormData({
        membershipType: 'victory',
        currency: 'PHP',
      });

      const { drawnText } = await captureDrawnText(() => generateReviewPDF(data));

      // Verify PDF was created successfully
      expect(drawnText.length).toBeGreaterThan(0);

      // Verify PHP currency formatting appears in rendered output (no peso symbol, uses "PHP" text)
      const fullText = drawnText.join(' ');
      expect(fullText).toContain('PHP');
      expect(fullText).not.toContain('₱');
    } finally {
      fetchMock.restore();
    }
  });

  test('centers the signature image inside the mapped signature field', async () => {
    const fetchMock = mockTemplateFetch({
      '/tdms-forms/pic-saf-victory.pdf': readTemplate('pic-saf-victory.pdf'),
      '/tdms-forms/pic-saf-non-victory.pdf': readTemplate('pic-saf-non-victory.pdf'),
    });

    try {
      const data = buildValidFormData({
        membershipType: 'victory',
        partnerSignature: VALID_SIGNATURE_DATA_URL,
      });

      const { drawImageCalls } = await captureDrawnImages(() => generateReviewPDF(data));
      expect(drawImageCalls.length).toBeGreaterThan(0);

      const signatureDrawCall = drawImageCalls[0];
      const coordinates = getTemplateCoordinates('victory').partnerSignature;
      const mmToPt = 2.834645669;
      const fieldWidthPt = coordinates.width * mmToPt;
      const fieldHeightPt = coordinates.height * mmToPt;

      // VALID_SIGNATURE_DATA_URL is a 1x1 image, so scale-to-fit yields a square.
      const expectedSizePt = Math.min(fieldWidthPt, fieldHeightPt);
      const expectedX = coordinates.x * mmToPt + (fieldWidthPt - expectedSizePt) / 2;
      const expectedY = coordinates.y * mmToPt + (fieldHeightPt - expectedSizePt) / 2;

      expect(Number(signatureDrawCall.x)).toBeCloseTo(expectedX, 1);
      expect(Number(signatureDrawCall.y)).toBeCloseTo(expectedY, 1);
      expect(Number(signatureDrawCall.width)).toBeCloseTo(expectedSizePt, 1);
      expect(Number(signatureDrawCall.height)).toBeCloseTo(expectedSizePt, 1);
    } finally {
      fetchMock.restore();
    }
  });

  test('centers partner name text within mapped field dimensions', async () => {
    const fetchMock = mockTemplateFetch({
      '/tdms-forms/pic-saf-victory.pdf': readTemplate('pic-saf-victory.pdf'),
      '/tdms-forms/pic-saf-non-victory.pdf': readTemplate('pic-saf-non-victory.pdf'),
    });

    try {
      const data = buildValidFormData({
        membershipType: 'victory',
        partnerName: 'ABCD',
      });

      const { drawCalls } = await captureDrawnText(() => generateReviewPDF(data));
      const partnerNameCall = drawCalls.find((entry) => entry.text === 'ABCD');
      expect(partnerNameCall).toBeTruthy();

      const coordinates = getTemplateCoordinates('victory').partnerName;
      expect(coordinates.width).toBeTruthy();
      expect(coordinates.height).toBeTruthy();

      const testDoc = await PDFDocument.create();
      const testFont = await testDoc.embedFont(StandardFonts.Helvetica);
      const fontSize = coordinates.fontSize ?? 10;
      const mmToPt = 2.834645669;
      const boxX = coordinates.x * mmToPt;
      const boxY = coordinates.y * mmToPt;
      const boxWidth = (coordinates.width ?? 0) * mmToPt;
      const boxHeight = (coordinates.height ?? 0) * mmToPt;
      const textWidth = testFont.widthOfTextAtSize('ABCD', fontSize);
      const expectedX = boxX + Math.max((boxWidth - textWidth) / 2, 0);
      const expectedY = boxY + Math.max((boxHeight - fontSize) / 2 + fontSize * 0.2, 0);

      expect(partnerNameCall?.options?.x).toBeCloseTo(expectedX, 1);
      expect(partnerNameCall?.options?.y).toBeCloseTo(expectedY, 1);
    } finally {
      fetchMock.restore();
    }
  });

  test('uses non-victory template when membership type is nonVictory', async () => {
    const fetchMock = mockTemplateFetch({
      '/tdms-forms/pic-saf-victory.pdf': readTemplate('pic-saf-victory.pdf'),
      '/tdms-forms/pic-saf-non-victory.pdf': readTemplate('pic-saf-non-victory.pdf'),
    });

    try {
      const data = buildValidFormData({ membershipType: 'nonVictory' });
      const generated = await generateReviewPDF(data);
      const parsed = await PDFDocument.load(generated);

      expect(parsed.getPageCount()).toBe(2);
      expect(
        fetchMock.requestedUrls.some((url) => url.includes('/tdms-forms/pic-saf-non-victory.pdf')),
      ).toBeTruthy();
    } finally {
      fetchMock.restore();
    }
  });

  test('fails when template fetch is unsuccessful', async () => {
    const fetchMock = mockTemplateFetch(undefined, 500);

    try {
      const data = buildValidFormData();
      await expect(generateReviewPDF(data)).rejects.toThrow('Failed to load PDF template');
    } finally {
      fetchMock.restore();
    }
  });

  test('fails when non-victory template path resolves to 404', async () => {
    const fetchMock = mockTemplateFetch({
      '/tdms-forms/pic-saf-victory.pdf': readTemplate('pic-saf-victory.pdf'),
    });

    try {
      const data = buildValidFormData({ membershipType: 'nonVictory' });
      await expect(generateReviewPDF(data)).rejects.toThrow(
        'Failed to load PDF template: /tdms-forms/pic-saf-non-victory.pdf',
      );
    } finally {
      fetchMock.restore();
    }
  });

  test('fails when signature data is invalid', async () => {
    const fetchMock = mockTemplateFetch({
      '/tdms-forms/pic-saf-victory.pdf': readTemplate('pic-saf-victory.pdf'),
      '/tdms-forms/pic-saf-non-victory.pdf': readTemplate('pic-saf-non-victory.pdf'),
    });

    try {
      const data = buildValidFormData({ partnerSignature: 'not-a-data-uri' });
      await expect(generateReviewPDF(data)).rejects.toThrow('Invalid signature image data');
    } finally {
      fetchMock.restore();
    }
  });

  test('rejects an unsupported signature image format', async () => {
    const fetchMock = mockTemplateFetch({
      '/tdms-forms/pic-saf-victory.pdf': readTemplate('pic-saf-victory.pdf'),
      '/tdms-forms/pic-saf-non-victory.pdf': readTemplate('pic-saf-non-victory.pdf'),
    });

    try {
      // Valid data URI structure but a MIME type that is neither png nor jpeg
      const data = buildValidFormData({
        partnerSignature: 'data:image/webp;base64,AAAA',
      });
      await expect(generateReviewPDF(data)).rejects.toThrow(
        'Unsupported signature image format: image/webp',
      );
    } finally {
      fetchMock.restore();
    }
  });

  test('embeds a JPEG signature and produces a valid PDF', async () => {
    const fetchMock = mockTemplateFetch({
      '/tdms-forms/pic-saf-victory.pdf': readTemplate('pic-saf-victory.pdf'),
      '/tdms-forms/pic-saf-non-victory.pdf': readTemplate('pic-saf-non-victory.pdf'),
    });

    try {
      // Minimal 1×1 JFIF JPEG: SOI + APP0 + SOF0 + EOI (35 bytes)
      // pdf-lib only needs the SOF0 to extract dimensions; the absence of
      // actual scan data does not prevent embedding.
      const jpegBase64 = Buffer.from(
        'ffd8ffe000104a46494600010100000100010000' + 'ffc0000b080001000101011100ffd9',
        'hex',
      ).toString('base64');
      const jpegDataUrl = `data:image/jpeg;base64,${jpegBase64}`;

      const data = buildValidFormData({ partnerSignature: jpegDataUrl });
      const generated = await generateReviewPDF(data);

      const header = new TextDecoder().decode(generated.slice(0, 5));
      expect(header).toBe('%PDF-');
    } finally {
      fetchMock.restore();
    }
  });

  test('fails if template does not include required second page', async () => {
    const onePageDoc = await PDFDocument.create();
    onePageDoc.addPage([612, 252]);
    const onePageBytes = await onePageDoc.save();

    const fetchMock = mockTemplateFetch({
      '/tdms-forms/pic-saf-victory.pdf': onePageBytes,
      '/tdms-forms/pic-saf-non-victory.pdf': readTemplate('pic-saf-non-victory.pdf'),
    });

    try {
      const data = buildValidFormData({ membershipType: 'victory' });
      await expect(generateReviewPDF(data)).rejects.toThrow(/index|page/i);
    } finally {
      fetchMock.restore();
    }
  });
});

describe('PDF Coordinates - Placement Regression Guard', () => {
  // These tests pin down the exact field positions after the most recent coordinate
  // update (−0.5mm Y across text fields, +0.5mm nation.x, −0.75mm printed-name Y).
  // They will fail if coordinates are accidentally shifted in a future edit.

  test('victory template text field positions match expected coordinates', () => {
    const c = victoryCourseCoordinates;

    expect(c.partnerName.x).toBeCloseTo(10.03, 2);
    expect(c.partnerName.y).toBeCloseTo(58.67, 2);

    expect(c.emailAddress.x).toBeCloseTo(9.5, 2);
    expect(c.emailAddress.y).toBeCloseTo(44.25, 2);

    expect(c.mobileNumber.x).toBeCloseTo(9.5, 2);
    expect(c.mobileNumber.y).toBeCloseTo(29.81, 2);

    expect(c.localChurch.x).toBeCloseTo(9.5, 2);
    expect(c.localChurch.y).toBeCloseTo(15.56, 2);

    expect(c.missionaryName.x).toBeCloseTo(95, 2);
    expect(c.missionaryName.y).toBeCloseTo(58.59, 2);

    expect(c.amount.x).toBeCloseTo(95, 2);
    expect(c.amount.y).toBeCloseTo(44.19, 2);

    // nation.x shifted +0.5mm in the last coordinate update
    expect(c.nation.x).toBeCloseTo(111.81, 2);
    expect(c.nation.y).toBeCloseTo(29.81, 2);

    expect(c.travelDateMonth.x).toBeCloseTo(179.83, 2);
    expect(c.travelDateMonth.y).toBeCloseTo(29.66, 2);
    expect(c.travelDateDay.x).toBeCloseTo(189.95, 2);
    expect(c.travelDateDay.y).toBeCloseTo(29.66, 2);
    expect(c.travelDateYear.x).toBeCloseTo(200.1, 2);
    expect(c.travelDateYear.y).toBeCloseTo(29.66, 2);

    expect(c.sendingChurch.x).toBeCloseTo(95.18, 2);
    expect(c.sendingChurch.y).toBeCloseTo(15.45, 2);

    // Printed name Y shifted −0.75mm in the last coordinate update
    expect(c.partnerSignaturePrintedName.x).toBeCloseTo(145.46, 2);
    expect(c.partnerSignaturePrintedName.y).toBeCloseTo(8.59, 2);
  });

  test('non-victory template text field positions match expected coordinates', () => {
    const c = nonVictoryCoordinates;

    expect(c.partnerName.x).toBeCloseTo(10.03, 2);
    expect(c.partnerName.y).toBeCloseTo(58.67, 2);

    expect(c.emailAddress.y).toBeCloseTo(44.25, 2);
    expect(c.mobileNumber.y).toBeCloseTo(29.81, 2);
    expect(c.localChurch.y).toBeCloseTo(15.56, 2);
    expect(c.missionaryName.y).toBeCloseTo(58.59, 2);
    expect(c.amount.y).toBeCloseTo(44.19, 2);

    // nation.x must match the same +0.5mm shift as victory
    expect(c.nation.x).toBeCloseTo(111.81, 2);
    expect(c.nation.y).toBeCloseTo(29.81, 2);

    expect(c.sendingChurch.y).toBeCloseTo(15.45, 2);
    expect(c.partnerSignaturePrintedName.y).toBeCloseTo(8.59, 2);
  });

  test("getTemplateCoordinates returns the victory coordinate object for 'victory'", () => {
    expect(getTemplateCoordinates('victory')).toBe(victoryCourseCoordinates);
  });

  test("getTemplateCoordinates returns the non-victory coordinate object for 'nonVictory'", () => {
    expect(getTemplateCoordinates('nonVictory')).toBe(nonVictoryCoordinates);
  });

  test('victory PDF draws text fields within their registered coordinate bounds', async () => {
    const fetchMock = mockTemplateFetch({
      '/tdms-forms/pic-saf-victory.pdf': readTemplate('pic-saf-victory.pdf'),
      '/tdms-forms/pic-saf-non-victory.pdf': readTemplate('pic-saf-non-victory.pdf'),
    });
    try {
      const data = buildValidFormData({
        membershipType: 'victory',
        emailAddress: 'victory@example.com',
        nation: 'Myanmar',
        partnerPrintedName: 'Victory Partner',
      });

      const { drawCalls } = await captureDrawnText(() => generateReviewPDF(data));
      const mmToPt = 2.834645669;

      const fieldAssertions: Array<{
        text: string;
        coordKey: keyof typeof victoryCourseCoordinates;
      }> = [
        { text: 'Chris Timario', coordKey: 'partnerName' },
        { text: 'victory@example.com', coordKey: 'emailAddress' },
        { text: 'Southeast Team', coordKey: 'missionaryName' },
        { text: 'Myanmar', coordKey: 'nation' },
        { text: '06', coordKey: 'travelDateMonth' },
        { text: '20', coordKey: 'travelDateDay' },
        { text: '26', coordKey: 'travelDateYear' },
        { text: 'Victory Partner', coordKey: 'partnerSignaturePrintedName' },
      ];

      for (const { text, coordKey } of fieldAssertions) {
        const call = drawCalls.find((c) => c.text === text);
        expect(call, `Expected draw call for "${text}"`).toBeTruthy();

        const coord = victoryCourseCoordinates[coordKey] as {
          x: number;
          y: number;
          height?: number;
        };
        const fieldBottomPt = coord.y * mmToPt;
        const fieldTopPt = (coord.y + (coord.height ?? 6)) * mmToPt;

        expect(
          Number(call?.options?.y),
          `Y for "${text}" should be within field bounds [${fieldBottomPt.toFixed(
            1,
          )}, ${fieldTopPt.toFixed(1)}]`,
        ).toBeGreaterThanOrEqual(fieldBottomPt);
        expect(
          Number(call?.options?.y),
          `Y for "${text}" should not exceed field top`,
        ).toBeLessThanOrEqual(fieldTopPt);
        expect(
          Number(call?.options?.x),
          `X for "${text}" should be at or right of field left edge`,
        ).toBeGreaterThanOrEqual(coord.x * mmToPt);
      }
    } finally {
      fetchMock.restore();
    }
  });

  test('non-victory PDF draws text fields within their registered coordinate bounds', async () => {
    const fetchMock = mockTemplateFetch({
      '/tdms-forms/pic-saf-victory.pdf': readTemplate('pic-saf-victory.pdf'),
      '/tdms-forms/pic-saf-non-victory.pdf': readTemplate('pic-saf-non-victory.pdf'),
    });
    try {
      const data = buildValidFormData({
        membershipType: 'nonVictory',
        emailAddress: 'nonvictory@example.com',
        nation: 'Philippines',
        partnerPrintedName: 'NonVictory Partner',
      });

      const { drawCalls } = await captureDrawnText(() => generateReviewPDF(data));
      const mmToPt = 2.834645669;

      const fieldAssertions: Array<{ text: string; coordKey: keyof typeof nonVictoryCoordinates }> =
        [
          { text: 'Chris Timario', coordKey: 'partnerName' },
          { text: 'nonvictory@example.com', coordKey: 'emailAddress' },
          { text: 'Southeast Team', coordKey: 'missionaryName' },
          { text: 'Philippines', coordKey: 'nation' },
          { text: '06', coordKey: 'travelDateMonth' },
          { text: '20', coordKey: 'travelDateDay' },
          { text: '26', coordKey: 'travelDateYear' },
          { text: 'NonVictory Partner', coordKey: 'partnerSignaturePrintedName' },
        ];

      for (const { text, coordKey } of fieldAssertions) {
        const call = drawCalls.find((c) => c.text === text);
        expect(call, `Expected draw call for "${text}"`).toBeTruthy();

        const coord = nonVictoryCoordinates[coordKey] as { x: number; y: number; height?: number };
        const fieldBottomPt = coord.y * mmToPt;
        const fieldTopPt = (coord.y + (coord.height ?? 6)) * mmToPt;

        expect(
          Number(call?.options?.y),
          `Y for "${text}" should be within field bounds [${fieldBottomPt.toFixed(
            1,
          )}, ${fieldTopPt.toFixed(1)}]`,
        ).toBeGreaterThanOrEqual(fieldBottomPt);
        expect(
          Number(call?.options?.y),
          `Y for "${text}" should not exceed field top`,
        ).toBeLessThanOrEqual(fieldTopPt);
        expect(
          Number(call?.options?.x),
          `X for "${text}" should be at or right of field left edge`,
        ).toBeGreaterThanOrEqual(coord.x * mmToPt);
      }
    } finally {
      fetchMock.restore();
    }
  });

  test('victory PDF draws consent and accountability checkboxes at mapped coordinates', async () => {
    const fetchMock = mockTemplateFetch({
      '/tdms-forms/pic-saf-victory.pdf': readTemplate('pic-saf-victory.pdf'),
      '/tdms-forms/pic-saf-non-victory.pdf': readTemplate('pic-saf-non-victory.pdf'),
    });
    try {
      const data = buildValidFormData({
        membershipType: 'victory',
        consentGiven: true,
        unableToGoChoice: 'teamFund',
        reroutedChoice: 'retain',
        canceledChoice: 'generalFund',
      });

      const { drawCalls } = await captureDrawnText(() => generateReviewPDF(data));
      const mmToPt = 2.834645669;
      const xCalls = drawCalls.filter((call) => call.text === 'X');

      const checkboxAssertions = [
        victoryCourseCoordinates.consentCheckbox,
        victoryCourseCoordinates.unableToGoTeamFund,
        victoryCourseCoordinates.reroutedRetain,
        victoryCourseCoordinates.canceledGeneralFund,
      ];

      for (const checkbox of checkboxAssertions) {
        expect(checkbox).toBeTruthy();
        expect(
          xCalls.some(
            (call) =>
              Number(call.options.x).toFixed(1) === (checkbox!.x * mmToPt).toFixed(1) &&
              Number(call.options.y).toFixed(1) === (checkbox!.y * mmToPt).toFixed(1),
          ),
        ).toBe(true);
      }
    } finally {
      fetchMock.restore();
    }
  });

  test('non-victory PDF draws consent and accountability checkboxes at mapped coordinates', async () => {
    const fetchMock = mockTemplateFetch({
      '/tdms-forms/pic-saf-victory.pdf': readTemplate('pic-saf-victory.pdf'),
      '/tdms-forms/pic-saf-non-victory.pdf': readTemplate('pic-saf-non-victory.pdf'),
    });
    try {
      const data = buildValidFormData({
        membershipType: 'nonVictory',
        consentGiven: true,
        unableToGoChoice: 'teamFund',
        reroutedChoice: 'retain',
        canceledChoice: 'generalFund',
      });

      const { drawCalls } = await captureDrawnText(() => generateReviewPDF(data));
      const mmToPt = 2.834645669;
      const xCalls = drawCalls.filter((call) => call.text === 'X');

      const checkboxAssertions = [
        nonVictoryCoordinates.consentCheckbox,
        nonVictoryCoordinates.unableToGoTeamFund,
        nonVictoryCoordinates.reroutedRetain,
        nonVictoryCoordinates.canceledGeneralFund,
      ];

      for (const checkbox of checkboxAssertions) {
        expect(checkbox).toBeTruthy();
        expect(
          xCalls.some(
            (call) =>
              Number(call.options.x).toFixed(1) === (checkbox!.x * mmToPt).toFixed(1) &&
              Number(call.options.y).toFixed(1) === (checkbox!.y * mmToPt).toFixed(1),
          ),
        ).toBe(true);
      }
    } finally {
      fetchMock.restore();
    }
  });
});
