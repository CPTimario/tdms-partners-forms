/**
 * Type definitions for PDF form field positioning and rendering.
 * Coordinates are in mm relative to each template's page dimensions.
 * Origin is bottom-left (standard PDF coordinate system).
 */

export interface FieldPosition {
  x: number;
  y: number;
  width?: number;
  height?: number;
}

export interface TextFieldConfig extends FieldPosition {
  fontSize?: number;
  fontName?: string;
}

export interface CheckboxConfig extends FieldPosition {
  checkSymbol?: string; // Character to draw when checked
  fontSize?: number;
  fontName?: string;
}

export interface SignatureConfig extends FieldPosition {
  width: number;
  height: number;
  maxWidth?: number;
  maxHeight?: number;
}

export interface TemplateCoordinates {
  // Partner information fields
  partnerName: TextFieldConfig;
  emailAddress: TextFieldConfig;
  mobileNumber: TextFieldConfig;
  localChurch: TextFieldConfig;
  missionaryName: TextFieldConfig;
  amount: TextFieldConfig;
  nation: TextFieldConfig;
  travelDate: TextFieldConfig;
  sendingChurch: TextFieldConfig;
  consentCheckbox?: CheckboxConfig;

  // Accountability fields (both templates)
  unableToGoTeamFund?: CheckboxConfig;
  unableToGoGeneralFund?: CheckboxConfig;
  reroutedRetain?: CheckboxConfig;
  reroutedGeneralFund?: CheckboxConfig;
  canceledGeneralFund?: CheckboxConfig;

  // Signature
  partnerSignature: SignatureConfig;
}
