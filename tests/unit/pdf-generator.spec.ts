import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PDFDocument } from "pdf-lib";
import { initialSupportFormData } from "@/lib/support-form";
import type { SupportFormData } from "@/lib/support-form";
import { generateReviewPDF } from "@/lib/pdf-generator";

const VALID_SIGNATURE_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wn7qE0AAAAASUVORK5CYII=";

function readTemplate(templateName: "pic-saf-victory.pdf" | "pic-saf-non-victory.pdf") {
  return readFileSync(join(process.cwd(), "public", "tdms-forms", templateName));
}

function mockTemplateFetch(
  templateBytesByPath?: Partial<Record<"/tdms-forms/pic-saf-victory.pdf" | "/tdms-forms/pic-saf-non-victory.pdf", Uint8Array>>,
  status = 200,
) {
  const originalFetch = globalThis.fetch;
  const requestedUrls: string[] = [];

  globalThis.fetch = async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    requestedUrls.push(url);

    if (status !== 200) {
      return new Response("template error", { status });
    }

    const normalizedPath = new URL(url, "http://localhost").pathname as
      | "/tdms-forms/pic-saf-victory.pdf"
      | "/tdms-forms/pic-saf-non-victory.pdf";
    const bytes = templateBytesByPath?.[normalizedPath];

    if (!bytes) {
      return new Response("missing template", { status: 404 });
    }

    const body = Uint8Array.from(bytes).buffer;

    return new Response(body, {
      status: 200,
      headers: { "Content-Type": "application/pdf" },
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
    membershipType: "victory",
    consentGiven: true,
    partnerName: "Chris Timario",
    emailAddress: "chris@example.com",
    mobileNumber: "09171234567",
    localChurch: "Every Nation Makati",
    missionaryName: "Southeast Team",
    amount: "5000",
    nation: "Thailand",
    travelDate: "2026-06-20",
    sendingChurch: "Every Nation Greenhills",
    partnerSignature: VALID_SIGNATURE_DATA_URL,
    unableToGoChoice: "teamFund",
    reroutedChoice: "retain",
    canceledChoice: "generalFund",
    ...overrides,
  };
}

test.describe("PDF Generator - Data Validation", () => {
  test("validates form data structure", () => {
    const data = buildValidFormData();

    expect(data).toHaveProperty("membershipType");
    expect(data).toHaveProperty("partnerName");
    expect(data).toHaveProperty("emailAddress");
    expect(data).toHaveProperty("consentGiven");
    expect(data).toHaveProperty("unableToGoChoice");
    expect(data).toHaveProperty("reroutedChoice");
    expect(data).toHaveProperty("canceledChoice");
    expect(data).toHaveProperty("partnerSignature");
  });

  test("validates all required fields are present", () => {
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
  });

  test("validates accountability choice values", () => {
    const data = buildValidFormData();

    expect(["teamFund", "generalFund", null]).toContain(data.unableToGoChoice);
    expect(["retain", "generalFund", null]).toContain(data.reroutedChoice);
    expect(["generalFund", null]).toContain(data.canceledChoice);
  });

  test("validates membership type is either victory or nonVictory", () => {
    const victorData = buildValidFormData({ membershipType: "victory" });
    const nonVictoryData = buildValidFormData({ membershipType: "nonVictory" });

    expect(victorData.membershipType).toBe("victory");
    expect(nonVictoryData.membershipType).toBe("nonVictory");
  });

  test("validates nullable fields can be empty", () => {
    const data = buildValidFormData({
      unableToGoChoice: null,
      reroutedChoice: null,
      canceledChoice: null,
      partnerSignature: "",
    });

    expect(data.unableToGoChoice).toBeNull();
    expect(data.reroutedChoice).toBeNull();
    expect(data.canceledChoice).toBeNull();
    expect(data.partnerSignature).toBe("");
  });

  test("handles all membership type variants", () => {
    const typesToTest: Array<"victory" | "nonVictory"> = ["victory", "nonVictory"];

    typesToTest.forEach((type) => {
      const data = buildValidFormData({ membershipType: type });
      expect(data.membershipType).toBe(type);
    });
  });

  test("supports complete form data for both PDFs", () => {
    const data = buildValidFormData();

    // Partner info fields
    const partnerFields = [
      "partnerName",
      "emailAddress",
      "mobileNumber",
      "localChurch",
      "missionaryName",
      "amount",
      "nation",
      "travelDate",
      "sendingChurch",
    ];

    partnerFields.forEach((field) => {
      expect(data).toHaveProperty(field);
      expect((data as any)[field]).toBeTruthy();
    });

    // Accountability fields
    expect(data).toHaveProperty("unableToGoChoice");
    expect(data).toHaveProperty("reroutedChoice");
    expect(data).toHaveProperty("partnerSignature");
  });
});

test.describe("PDF Generator - Runtime Behavior", () => {
  test("fails when membership type is missing", async () => {
    const data = buildValidFormData({ membershipType: null });
    await expect(generateReviewPDF(data)).rejects.toThrow("Membership type is required");
  });

  test("generates a valid 2-page PDF from the victory template", async () => {
    const fetchMock = mockTemplateFetch({
      "/tdms-forms/pic-saf-victory.pdf": readTemplate("pic-saf-victory.pdf"),
      "/tdms-forms/pic-saf-non-victory.pdf": readTemplate("pic-saf-non-victory.pdf"),
    });

    try {
      const data = buildValidFormData({ membershipType: "victory" });
      const generated = await generateReviewPDF(data);

      const header = new TextDecoder().decode(generated.slice(0, 5));
      expect(header).toBe("%PDF-");

      const parsed = await PDFDocument.load(generated);
      expect(parsed.getPageCount()).toBe(2);
      expect(fetchMock.requestedUrls.some((url) => url.includes("/tdms-forms/pic-saf-victory.pdf"))).toBeTruthy();
    } finally {
      fetchMock.restore();
    }
  });

  test("uses non-victory template when membership type is nonVictory", async () => {
    const fetchMock = mockTemplateFetch({
      "/tdms-forms/pic-saf-victory.pdf": readTemplate("pic-saf-victory.pdf"),
      "/tdms-forms/pic-saf-non-victory.pdf": readTemplate("pic-saf-non-victory.pdf"),
    });

    try {
      const data = buildValidFormData({ membershipType: "nonVictory" });
      const generated = await generateReviewPDF(data);
      const parsed = await PDFDocument.load(generated);

      expect(parsed.getPageCount()).toBe(2);
      expect(
        fetchMock.requestedUrls.some((url) =>
          url.includes("/tdms-forms/pic-saf-non-victory.pdf")
        )
      ).toBeTruthy();
    } finally {
      fetchMock.restore();
    }
  });

  test("fails when template fetch is unsuccessful", async () => {
    const fetchMock = mockTemplateFetch(undefined, 500);

    try {
      const data = buildValidFormData();
      await expect(generateReviewPDF(data)).rejects.toThrow("Failed to load PDF template");
    } finally {
      fetchMock.restore();
    }
  });

  test("fails when non-victory template path resolves to 404", async () => {
    const fetchMock = mockTemplateFetch({
      "/tdms-forms/pic-saf-victory.pdf": readTemplate("pic-saf-victory.pdf"),
    });

    try {
      const data = buildValidFormData({ membershipType: "nonVictory" });
      await expect(generateReviewPDF(data)).rejects.toThrow(
        "Failed to load PDF template: /tdms-forms/pic-saf-non-victory.pdf"
      );
    } finally {
      fetchMock.restore();
    }
  });

  test("fails when signature data is invalid", async () => {
    const fetchMock = mockTemplateFetch({
      "/tdms-forms/pic-saf-victory.pdf": readTemplate("pic-saf-victory.pdf"),
      "/tdms-forms/pic-saf-non-victory.pdf": readTemplate("pic-saf-non-victory.pdf"),
    });

    try {
      const data = buildValidFormData({ partnerSignature: "not-a-data-uri" });
      await expect(generateReviewPDF(data)).rejects.toThrow("Invalid signature image data");
    } finally {
      fetchMock.restore();
    }
  });

  test("fails if template does not include required second page", async () => {
    const onePageDoc = await PDFDocument.create();
    onePageDoc.addPage([612, 252]);
    const onePageBytes = await onePageDoc.save();

    const fetchMock = mockTemplateFetch({
      "/tdms-forms/pic-saf-victory.pdf": onePageBytes,
      "/tdms-forms/pic-saf-non-victory.pdf": readTemplate("pic-saf-non-victory.pdf"),
    });

    try {
      const data = buildValidFormData({ membershipType: "victory" });
      await expect(generateReviewPDF(data)).rejects.toThrow(/index|page/i);
    } finally {
      fetchMock.restore();
    }
  });
});
