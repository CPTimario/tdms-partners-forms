/**
 * PDF generation engine using pdf-lib
 * Handles creating filled PDFs from templates with user data
 */

import {
  PDFDocument,
  PDFPage,
  StandardFonts,
  rgb,
} from "pdf-lib";
import type { SupportFormData } from "@/lib/support-form";
import { getTemplateCoordinates } from "@/lib/pdf-coordinates";
import type { TextFieldConfig } from "@/types/pdf-form";

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
  font: any,
  data: SupportFormData,
  coordinates: ReturnType<typeof getTemplateCoordinates>
) {
  drawTextField(page, font, coordinates.partnerName, data.partnerName);
  drawTextField(page, font, coordinates.emailAddress, data.emailAddress);
  drawTextField(page, font, coordinates.mobileNumber, data.mobileNumber);
  drawTextField(page, font, coordinates.localChurch, data.localChurch);
  drawTextField(page, font, coordinates.missionaryName, data.missionaryName);
  drawTextField(page, font, coordinates.amount, data.amount);
  drawTextField(page, font, coordinates.nation, data.nation);
  drawTextField(page, font, coordinates.travelDate, data.travelDate);
  drawTextField(page, font, coordinates.sendingChurch, data.sendingChurch);

  if (data.consentGiven && coordinates.consentCheckbox) {
    drawCheckbox(page, font, coordinates.consentCheckbox);
  }
}

async function drawAccountability(
  page: PDFPage,
  font: any,
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

}

/**
 * Draws text at a specific position on the PDF page
 */
function drawTextField(
  page: PDFPage,
  font: any,
  fieldConfig: TextFieldConfig,
  text: string
): void {
  if (!text || !text.trim()) {
    return;
  }

  const { x, y, fontSize = 10 } = fieldConfig;

  // Convert mm to points (1mm ≈ 2.834645669 points)
  const xPoints = x * 2.834645669;
  const yPoints = y * 2.834645669;

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
function drawCheckbox(page: PDFPage, font: any, checkboxConfig: any): void {
  const {
    x,
    y,
    checkSymbol = "X",
    fontSize = 12,
  } = checkboxConfig;

  // Convert mm to points
  const xPoints = x * 2.834645669;
  const yPoints = y * 2.834645669;

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
  signatureConfig: any,
  base64ImageData: string
): Promise<void> {
  if (!base64ImageData || !base64ImageData.startsWith("data:image")) {
    throw new Error("Invalid signature image data");
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

  // Embed the image (pdf-lib detects image format)
  const image = await pdfDoc.embedPng(imageBytes);

  const { x, y, width, height, maxWidth = width, maxHeight = height } =
    signatureConfig;

  // Calculate scaling to fit within max dimensions
  const scale = Math.min(maxWidth / width, maxHeight / height, 1);
  const scaledWidth = width * scale;
  const scaledHeight = height * scale;

  // Convert mm to points
  const xPoints = x * 2.834645669;
  const yPoints = y * 2.834645669;

  page.drawImage(image, {
    x: xPoints,
    y: yPoints,
    width: scaledWidth * 2.834645669,
    height: scaledHeight * 2.834645669,
  });
}

/**
 * Downloads a PDF file to the user's device
 */
export async function downloadPDF(
  pdfBytes: Uint8Array,
  filename: string
): Promise<void> {
  const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
