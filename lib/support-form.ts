export type MembershipType = "victory" | "nonVictory";
export type UnableToGoChoice = "teamFund" | "generalFund" | null;
export type ReroutedChoice = "retain" | "generalFund" | null;
export type CanceledChoice = "generalFund" | null;
export type EditableFormStep = "partner" | "accountability";
export type FormStep = EditableFormStep | "review";

export type SupportFormData = {
  membershipType: MembershipType | null;
  consentGiven: boolean;
  partnerName: string;
  emailAddress: string;
  mobileNumber: string;
  localChurch: string;
  missionaryName: string;
  amount: string;
  nation: string;
  travelDate: string;
  sendingChurch: string;
  unableToGoChoice: UnableToGoChoice;
  reroutedChoice: ReroutedChoice;
  canceledChoice: CanceledChoice;
  partnerSignature: string;
};

export const initialSupportFormData: SupportFormData = {
  membershipType: null,
  consentGiven: false,
  partnerName: "",
  emailAddress: "",
  mobileNumber: "",
  localChurch: "",
  missionaryName: "",
  amount: "",
  nation: "",
  travelDate: "",
  sendingChurch: "",
  unableToGoChoice: null,
  reroutedChoice: null,
  canceledChoice: null,
  partnerSignature: "",
};

export const consentCopy =
  "By providing my information, I am allowing Every Nation to process my information.";

export const partnerFormIntroCopy =
  "Complete the support partner information exactly as it should appear on the support form. The consent section is part of the signed-up form and will be included in the final output.";

export const privacyCopy =
  "The information you provide will be treated with utmost respect and confidentiality. Every Nation follows general principles and rules of data privacy protection in the Philippines. For more information, visit everynation.org.ph/privacy.";

export const updatedCopy = "Updated as of October 21, 2025.";

export const accountabilityIntroCopy =
  "Choose how your support should be handled for each accountability scenario, then provide your digital signature exactly as you want it printed on the form.";

export const victoryAccountabilityAffirmationCopy =
  "I confirm that I was not approached for partnership and understand that I am not compelled to give. I am grateful for the opportunity to advance the gospel to the nations.";

export const victoryAccountabilityInstructionCopy =
  "I have selected below my instructions to the Gift Processing Office on how to handle my support in each specified scenario.";

export const nonVictoryAccountabilityInstructionCopy =
  "I confirm the options I've selected below as my instructions to the Gift Processing Office on how to handle my support in each specified scenario.";

export const partnerRequiredFields = [
  "partnerName",
  "emailAddress",
  "mobileNumber",
  "localChurch",
  "missionaryName",
  "amount",
  "nation",
  "travelDate",
  "sendingChurch",
] as const;

export const accountabilityRequiredFields = ["partnerSignature"] as const;

export type RequiredStringField =
  | (typeof partnerRequiredFields)[number]
  | (typeof accountabilityRequiredFields)[number];

export const fieldLabels: Record<RequiredStringField, string> = {
  partnerName: "Partner Name",
  emailAddress: "Email Address",
  mobileNumber: "Mobile Number",
  localChurch: "Local Church",
  missionaryName: "Missioner Name/Team",
  amount: "Amount",
  nation: "Nation",
  travelDate: "Travel Date",
  sendingChurch: "Sending Church",
  partnerSignature: "Signature",
};

export const stepLabels: Record<EditableFormStep, string> = {
  partner: "Partner Information",
  accountability: "Accountability",
};

const maxLineChars = 55;

export function displayValue(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  if (trimmed.length <= maxLineChars) {
    return trimmed;
  }

  return `${trimmed.slice(0, maxLineChars - 1)}...`;
}

export function checkmark(checked: boolean) {
  return checked ? "X" : "";
}

export function formatDisplayDate(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    const [, year, month, day] = match;
    return `${month}/${day}/${year.slice(-2)}`;
  }

  return trimmed;
}

export function getAccountabilityAffirmationCopy(
  membershipType: SupportFormData["membershipType"],
) {
  if (membershipType === "victory") {
    return victoryAccountabilityAffirmationCopy;
  }

  return nonVictoryAccountabilityInstructionCopy;
}

export function getAccountabilityInstructionCopy(
  membershipType: SupportFormData["membershipType"],
) {
  if (membershipType === "victory") {
    return victoryAccountabilityInstructionCopy;
  }

  return "";
}

export function getAccountabilityTitle(membershipType: SupportFormData["membershipType"]) {
  if (membershipType === "victory") {
    return "TEN DAYS MISSIONS SUPPORT ACCOUNTABILITY FORM FOR VICTORY MEMBERS";
  }

  return "TEN DAYS MISSIONS SUPPORT ACCOUNTABILITY FORM";
}

export function validatePartnerStep(data: SupportFormData) {
  const errors: string[] = [];

  if (!data.consentGiven) {
    errors.push("Consent is required.");
  }

  partnerRequiredFields.forEach((field) => {
    if (!data[field].trim()) {
      errors.push(`${fieldLabels[field]} is required.`);
    }
  });

  return errors;
}

export function validateAccountabilityStep(data: SupportFormData) {
  const errors: string[] = [];

  if (!data.membershipType) {
    errors.push("Membership type is required.");
  }

  accountabilityRequiredFields.forEach((field) => {
    if (!data[field].trim()) {
      errors.push(`${fieldLabels[field]} is required.`);
    }
  });

  if (!data.unableToGoChoice) {
    errors.push("Please choose an accountability option for when the missioner is unable to go.");
  }

  if (!data.reroutedChoice) {
    errors.push("Please choose an accountability option for when the missioner or team is rerouted.");
  }

  if (!data.canceledChoice) {
    errors.push("Please confirm the accountability instruction for a canceled trip.");
  }

  return errors;
}

export function validateSupportForm(data: SupportFormData) {
  return [...validatePartnerStep(data), ...validateAccountabilityStep(data)];
}

export function getFirstInvalidStep(data: SupportFormData): EditableFormStep | null {
  if (validatePartnerStep(data).length > 0) {
    return "partner";
  }

  if (validateAccountabilityStep(data).length > 0) {
    return "accountability";
  }

  return null;
}

export function isSupportFormValid(data: SupportFormData) {
  return validateSupportForm(data).length === 0;
}
