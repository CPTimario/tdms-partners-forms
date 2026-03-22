/**
 * PDF generation engine using pdf-lib
 * Handles creating filled PDFs from templates with user data
 */

import {
  PDFDocument,
  PDFFont,
  PDFPage,
  StandardFonts,
  rgb,
} from "pdf-lib";
import { formatCurrencyAmount, type SupportFormData } from "@/lib/support-form";
import { getTemplateCoordinates } from "@/lib/pdf-coordinates";
import type {
  CheckboxConfig,
  SignatureConfig,
  TextFieldConfig,
} from "@/types/pdf-form";

const MM_TO_POINTS = 2.834645669;
const TEXT_BASELINE_NUDGE_MM = 1.2;

function splitTravelDateParts(value: string) {
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return {
      month: "",
      day: "",
      year: "",
    };
  }

  const [, year, month, day] = match;
  return {
    month,
    day,
    year: year.slice(-2),
  };
}

/**
 * Generates a full review PDF containing partner info (page 1)
 * and accountability (page 2) using the same template.
 */
export async function generateReviewPDF(
  data: SupportFormData
): Promise<Uint8Array> {
  if (!data.membershipType) {
    throw new Error("Membership type is required");
  }

  const templatePath =
    data.membershipType === "victory"
      ? "/tdms-forms/pic-saf-victory.pdf"
      : "/tdms-forms/pic-saf-non-victory.pdf";

  const templateResponse = await fetch(templatePath);
  if (!templateResponse.ok) {
    throw new Error(`Failed to load PDF template: ${templatePath}`);
  }

  const existingPdfBytes = await templateResponse.arrayBuffer();

  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const partnerPage = pdfDoc.getPage(0);
  const accountabilityPage = pdfDoc.getPage(1);
  const coordinates = getTemplateCoordinates(data.membershipType);

  drawPartnerInfo(partnerPage, font, data, coordinates);
  await drawAccountability(accountabilityPage, font, pdfDoc, data, coordinates);

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

function drawPartnerInfo(
  page: PDFPage,
  font: PDFFont,
  data: SupportFormData,
  coordinates: ReturnType<typeof getTemplateCoordinates>
) {
  const travelDateParts = splitTravelDateParts(data.travelDate);

  drawTextField(page, font, coordinates.partnerName, data.partnerName);
  drawTextField(page, font, coordinates.emailAddress, data.emailAddress);
  drawTextField(page, font, coordinates.mobileNumber, data.mobileNumber);
  drawTextField(page, font, coordinates.localChurch, data.localChurch);
  drawTextField(page, font, coordinates.missionaryName, data.missionaryName);
  drawTextField(page, font, coordinates.amount, formatCurrencyAmount(data.amount, data.currency));
  drawTextField(page, font, coordinates.nation, data.nation);
  drawTextField(page, font, coordinates.travelDateMonth, travelDateParts.month);
  drawTextField(page, font, coordinates.travelDateDay, travelDateParts.day);
  drawTextField(page, font, coordinates.travelDateYear, travelDateParts.year);
  drawTextField(page, font, coordinates.sendingChurch, data.sendingChurch);

  if (data.consentGiven && coordinates.consentCheckbox) {
    drawCheckbox(page, font, coordinates.consentCheckbox);
  }
}

async function drawAccountability(
  page: PDFPage,
  font: PDFFont,
  pdfDoc: PDFDocument,
  data: SupportFormData,
  coordinates: ReturnType<typeof getTemplateCoordinates>
) {

  if (data.unableToGoChoice === "teamFund" && coordinates.unableToGoTeamFund) {
    drawCheckbox(page, font, coordinates.unableToGoTeamFund);
  }
  if (
    data.unableToGoChoice === "generalFund" &&
    coordinates.unableToGoGeneralFund
  ) {
    drawCheckbox(page, font, coordinates.unableToGoGeneralFund);
  }

  if (data.reroutedChoice === "retain" && coordinates.reroutedRetain) {
    drawCheckbox(page, font, coordinates.reroutedRetain);
  }
  if (data.reroutedChoice === "generalFund" && coordinates.reroutedGeneralFund) {
    drawCheckbox(page, font, coordinates.reroutedGeneralFund);
  }

  if (
    data.canceledChoice === "generalFund" &&
    coordinates.canceledGeneralFund
  ) {
    drawCheckbox(page, font, coordinates.canceledGeneralFund);
  }

  if (data.partnerSignature && coordinates.partnerSignature) {
    await drawSignature(
      pdfDoc,
      page,
      coordinates.partnerSignature,
      data.partnerSignature
    );
  }

  drawTextField(
    page,
    font,
    coordinates.partnerSignaturePrintedName,
    data.partnerPrintedName
  );

}

/**
 * Draws text in a mapped field.
 *
 * If both width and height are configured, text is centered within that box.
 * Otherwise, text is drawn at x/y with a baseline nudge for legacy mappings.
 */
function drawTextField(
  page: PDFPage,
  font: PDFFont,
  fieldConfig: TextFieldConfig,
  text: string
): void {
  if (!text || !text.trim()) {
    return;
  }

  const { x, y, width, height, fontSize = 10 } = fieldConfig;

  // Convert mm to points (1mm ≈ 2.834645669 points)
  const boxXPoints = x * MM_TO_POINTS;
  const boxYPoints = y * MM_TO_POINTS;

  let xPoints = boxXPoints;
  let yPoints = (y + TEXT_BASELINE_NUDGE_MM) * MM_TO_POINTS;

  if (typeof width === "number" && typeof height === "number") {
    const boxWidthPoints = width * MM_TO_POINTS;
    const boxHeightPoints = height * MM_TO_POINTS;
    const textWidthPoints = font.widthOfTextAtSize(text, fontSize);

    // Approximate cap-height to place text visually centered in the mapped box.
    const textHeightPoints = fontSize;
    const verticalOffset = (boxHeightPoints - textHeightPoints) / 2 + fontSize * 0.2;

    xPoints = boxXPoints + Math.max((boxWidthPoints - textWidthPoints) / 2, 0);
    yPoints = boxYPoints + Math.max(verticalOffset, 0);
  }

  page.drawText(text, {
    x: xPoints,
    y: yPoints,
    size: fontSize,
    font,
    color: rgb(0, 0, 0),
  });
}

/**
 * Draws a checkbox (simple "X" character) at a specific position
 */
function drawCheckbox(page: PDFPage, font: PDFFont, checkboxConfig: CheckboxConfig): void {
  const {
    x,
    y,
    checkSymbol = "X",
    fontSize = 12,
  } = checkboxConfig;

  // Convert mm to points
  const xPoints = x * MM_TO_POINTS;
  const yPoints = y * MM_TO_POINTS;

  page.drawText(checkSymbol, {
    x: xPoints,
    y: yPoints,
    size: fontSize,
    font,
    color: rgb(0, 0, 0),
  });
}

/**
 * Draws signature from canvas image data
 */
async function drawSignature(
  pdfDoc: PDFDocument,
  page: PDFPage,
  signatureConfig: SignatureConfig,
  base64ImageData: string
): Promise<void> {
  const mimeMatch = base64ImageData.match(/^data:(image\/[a-z]+);base64,/);
  if (!mimeMatch) {
    throw new Error("Invalid signature image data");
  }

  const mimeType = mimeMatch[1];
  if (mimeType !== "image/png" && mimeType !== "image/jpeg") {
    throw new Error(`Unsupported signature image format: ${mimeType}`);
  }

  // Remove data URI prefix
  const base64Data = base64ImageData.split(",")[1];
  if (!base64Data) {
    throw new Error("Signature data URI is missing image payload");
  }

  // Convert base64 to bytes
  const imageBytes = Uint8Array.from(atob(base64Data), (c) =>
    c.charCodeAt(0)
  );

  // Embed the image using the format declared in the data URI
  const image = mimeType === "image/jpeg"
    ? await pdfDoc.embedJpg(imageBytes)
    : await pdfDoc.embedPng(imageBytes);

  const { x, y, width, height } = signatureConfig;

  const fieldWidthPt = width * MM_TO_POINTS;
  const fieldHeightPt = height * MM_TO_POINTS;

  // Scale image to fit within field while preserving aspect ratio
  const scale = Math.min(fieldWidthPt / image.width, fieldHeightPt / image.height);
  const scaledWidthPt = image.width * scale;
  const scaledHeightPt = image.height * scale;

  // Center within the field box
  const xPoints = x * MM_TO_POINTS + (fieldWidthPt - scaledWidthPt) / 2;
  const yPoints = y * MM_TO_POINTS + (fieldHeightPt - scaledHeightPt) / 2;

  page.drawImage(image, {
    x: xPoints,
    y: yPoints,
    width: scaledWidthPt,
    height: scaledHeightPt,
  });
}

/**
 * Downloads a PDF file to the user's device
 */
export async function downloadPDF(
  pdfBytes: Uint8Array,
  filename: string
): Promise<void> {
  const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
