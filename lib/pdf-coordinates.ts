/**
 * PDF coordinate mappings for Victory and Non-Victory templates.
 *
 * Coordinates are in mm, origin is bottom-left.
 * Template size is 612 x 252 pt (~215.9 x 88.9 mm), landscape.
 */

import type { TemplateCoordinates } from "@/types/pdf-form";

/**
 * Victory Member template coordinates
 * Adjust these based on your actual PDF layout
 */
export const victoryCourseCoordinates: TemplateCoordinates = {
  // Partner Information Section (page 1)
  partnerName: {
    x: 40,
    y: 58,
    fontSize: 10,
    fontName: "Helvetica",
  },
  emailAddress: {
    x: 40,
    y: 44,
    fontSize: 10,
    fontName: "Helvetica",
  },
  mobileNumber: {
    x: 40,
    y: 29,
    fontSize: 10,
    fontName: "Helvetica",
  },
  localChurch: {
    x: 40,
    y: 15,
    fontSize: 10,
    fontName: "Helvetica",
  },
  missionaryName: {
    x: 139,
    y: 58,
    fontSize: 10,
    fontName: "Helvetica",
  },
  amount: {
    x: 147,
    y: 44,
    fontSize: 10,
    fontName: "Helvetica",
  },
  nation: {
    x: 139,
    y: 29,
    fontSize: 10,
    fontName: "Helvetica",
  },
  travelDate: {
    x: 188,
    y: 29,
    fontSize: 10,
    fontName: "Helvetica",
  },
  sendingChurch: {
    x: 142,
    y: 15,
    fontSize: 10,
    fontName: "Helvetica",
  },
  consentCheckbox: {
    x: 7,
    y: 79,
    checkSymbol: "X",
    fontSize: 10,
    fontName: "Helvetica",
  },

  // Accountability Section (page 2 - victory variant)
  unableToGoTeamFund: {
    x: 7,
    y: 30,
    checkSymbol: "X",
    fontSize: 10,
    fontName: "Helvetica",
  },
  unableToGoGeneralFund: {
    x: 7,
    y: 21,
    checkSymbol: "X",
    fontSize: 10,
    fontName: "Helvetica",
  },
  reroutedRetain: {
    x: 74,
    y: 34,
    checkSymbol: "X",
    fontSize: 10,
    fontName: "Helvetica",
  },
  reroutedGeneralFund: {
    x: 74,
    y: 24,
    checkSymbol: "X",
    fontSize: 10,
    fontName: "Helvetica",
  },
  canceledGeneralFund: {
    x: 143,
    y: 30,
    checkSymbol: "X",
    fontSize: 10,
    fontName: "Helvetica",
  },

  // Signature (page 2, right panel)
  partnerSignature: {
    x: 155,
    y: 12,
    width: 40,
    height: 10,
    maxWidth: 40,
    maxHeight: 10,
  },
};

/**
 * Non-Victory Member template coordinates
 * Adjust these based on your actual PDF layout
 */
export const nonVictoryCoordinates: TemplateCoordinates = {
  // Partner Information Section (page 1)
  partnerName: {
    x: 40,
    y: 58,
    fontSize: 10,
    fontName: "Helvetica",
  },
  emailAddress: {
    x: 40,
    y: 44,
    fontSize: 10,
    fontName: "Helvetica",
  },
  mobileNumber: {
    x: 40,
    y: 29,
    fontSize: 10,
    fontName: "Helvetica",
  },
  localChurch: {
    x: 40,
    y: 15,
    fontSize: 10,
    fontName: "Helvetica",
  },
  missionaryName: {
    x: 139,
    y: 58,
    fontSize: 10,
    fontName: "Helvetica",
  },
  amount: {
    x: 147,
    y: 44,
    fontSize: 10,
    fontName: "Helvetica",
  },
  nation: {
    x: 139,
    y: 29,
    fontSize: 10,
    fontName: "Helvetica",
  },
  travelDate: {
    x: 188,
    y: 29,
    fontSize: 10,
    fontName: "Helvetica",
  },
  sendingChurch: {
    x: 142,
    y: 15,
    fontSize: 10,
    fontName: "Helvetica",
  },
  consentCheckbox: {
    x: 7,
    y: 79,
    checkSymbol: "X",
    fontSize: 10,
    fontName: "Helvetica",
  },

  // Accountability Section (page 2 - non-victory variant)
  unableToGoTeamFund: {
    x: 7,
    y: 39,
    checkSymbol: "X",
    fontSize: 10,
    fontName: "Helvetica",
  },
  unableToGoGeneralFund: {
    x: 7,
    y: 29,
    checkSymbol: "X",
    fontSize: 10,
    fontName: "Helvetica",
  },
  reroutedRetain: {
    x: 74,
    y: 42,
    checkSymbol: "X",
    fontSize: 10,
    fontName: "Helvetica",
  },
  reroutedGeneralFund: {
    x: 74,
    y: 33,
    checkSymbol: "X",
    fontSize: 10,
    fontName: "Helvetica",
  },
  canceledGeneralFund: {
    x: 143,
    y: 39,
    checkSymbol: "X",
    fontSize: 10,
    fontName: "Helvetica",
  },

  // Signature (page 2, right panel)
  partnerSignature: {
    x: 155,
    y: 12,
    width: 40,
    height: 10,
    maxWidth: 40,
    maxHeight: 10,
  },
};

/**
 * Get coordinates for the appropriate template
 */
export function getTemplateCoordinates(
  membershipType: "victory" | "nonVictory"
): TemplateCoordinates {
  return membershipType === "victory"
    ? victoryCourseCoordinates
    : nonVictoryCoordinates;
}
