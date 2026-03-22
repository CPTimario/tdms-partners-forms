import { z } from "zod";

export type MembershipType = "victory" | "nonVictory";
export type CurrencyCode = "PHP" | "USD";
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
  currency: CurrencyCode;
  amount: string;
  nation: string;
  travelDate: string;
  sendingChurch: string;
  unableToGoChoice: UnableToGoChoice;
  reroutedChoice: ReroutedChoice;
  canceledChoice: CanceledChoice;
  partnerSignature: string;
  partnerPrintedName: string;
};

export const initialSupportFormData: SupportFormData = {
  membershipType: null,
  consentGiven: false,
  partnerName: "",
  emailAddress: "",
  mobileNumber: "",
  localChurch: "",
  missionaryName: "",
  currency: "PHP",
  amount: "",
  nation: "",
  travelDate: "",
  sendingChurch: "",
  unableToGoChoice: null,
  reroutedChoice: null,
  canceledChoice: null,
  partnerSignature: "",
  partnerPrintedName: "",
};

export const consentCopy =
  "By providing my information, I am allowing Every Nation to process my information.";

export const partnerFormIntroCopy =
  "Complete the support partner information exactly as it should appear on the support form. The consent section is part of the signed-up form and will be included in the final output.";

export const privacyCopy =
  "The information you provide will be treated with utmost respect and confidentiality. Every Nation follows general principles and rules of data privacy protection in the Philippines. For more information, visit everynation.org.ph/privacy.";

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
  "currency",
  "amount",
  "nation",
  "travelDate",
  "sendingChurch",
] as const;

export const accountabilityRequiredFields = [
  "partnerSignature",
  "partnerPrintedName",
] as const;

export type RequiredStringField =
  | (typeof partnerRequiredFields)[number]
  | (typeof accountabilityRequiredFields)[number];

export type SupportFormFieldErrorKey =
  | RequiredStringField
  | "membershipType"
  | "consentGiven"
  | "unableToGoChoice"
  | "reroutedChoice"
  | "canceledChoice";

export type SupportFormFieldErrors = Partial<
  Record<SupportFormFieldErrorKey, string>
>;

export type StepValidationResult = {
  fieldErrors: SupportFormFieldErrors;
  formErrors: string[];
};

export const fieldLabels: Record<RequiredStringField, string> = {
  partnerName: "Partner Name",
  emailAddress: "Email Address",
  mobileNumber: "Mobile Number",
  localChurch: "Local Church",
  missionaryName: "Missioner Name/Team",
  currency: "Currency",
  amount: "Amount",
  nation: "Nation",
  travelDate: "Travel Date",
  sendingChurch: "Sending Church",
  partnerSignature: "Signature",
  partnerPrintedName: "Partner Full Name",
};

export const stepLabels: Record<EditableFormStep, string> = {
  partner: "Partner Information",
  accountability: "Accountability",
};

const requiredString = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required.`);

const currencySchema = z.enum(["PHP", "USD"]);

export function normalizeAmountInput(value: string) {
  return value.replace(/,/g, "").trim();
}

export function formatAmountInputForField(value: string) {
  const cleaned = value.replace(/[^\d.]/g, "");
  if (!cleaned) {
    return "";
  }

  const firstDotIndex = cleaned.indexOf(".");
  const hasDot = firstDotIndex !== -1;
  const integerRaw = hasDot ? cleaned.slice(0, firstDotIndex) : cleaned;
  const decimalRaw = hasDot ? cleaned.slice(firstDotIndex + 1).replace(/\./g, "") : "";

  const integerNoLeadingZeros = integerRaw.replace(/^0+(\d)/, "$1");
  const integerPortion = integerNoLeadingZeros || "0";
  const groupedInteger = integerPortion.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const decimalPortion = decimalRaw.slice(0, 2);

  if (hasDot) {
    return `${groupedInteger}.${decimalPortion}`;
  }

  return groupedInteger;
}

const partnerStepSchema = z.object({
  consentGiven: z.boolean().refine((value) => value, {
    message: "Consent is required.",
  }),
  partnerName: requiredString("Partner Name"),
  emailAddress: requiredString("Email Address").email("Email Address must be a valid email."),
  mobileNumber: requiredString("Mobile Number").regex(
    /^[0-9+\-()\s]{7,20}$/,
    "Mobile Number format is invalid.",
  ),
  localChurch: requiredString("Local Church"),
  missionaryName: requiredString("Missioner Name/Team"),
  currency: currencySchema,
  amount: requiredString("Amount")
    .refine((value) => /^\d+(\.\d{1,2})?$/.test(normalizeAmountInput(value)), {
      message: "Amount must be a valid number.",
    })
    .refine((value) => Number(normalizeAmountInput(value)) > 0, {
      message: "Amount must be greater than zero.",
    }),
  nation: requiredString("Nation"),
  travelDate: requiredString("Travel Date").regex(
    /^\d{4}-\d{2}-\d{2}$/,
    "Travel Date is invalid.",
  ),
  sendingChurch: requiredString("Sending Church"),
});

const accountabilityStepSchema = z.object({
  membershipType: z
    .enum(["victory", "nonVictory"])
    .nullable()
    .refine((value) => value !== null, {
      message: "Membership type is required.",
    }),
  partnerSignature: requiredString("Signature"),
  partnerPrintedName: requiredString("Partner Full Name"),
  unableToGoChoice: z
    .enum(["teamFund", "generalFund"])
    .nullable()
    .refine((value) => value !== null, {
      message:
        "Please choose an accountability option for when the missioner is unable to go.",
    }),
  reroutedChoice: z
    .enum(["retain", "generalFund"])
    .nullable()
    .refine((value) => value !== null, {
      message:
        "Please choose an accountability option for when the missioner or team is rerouted.",
    }),
  canceledChoice: z
    .enum(["generalFund"])
    .nullable()
    .refine((value) => value !== null, {
      message: "Please confirm the accountability instruction for a canceled trip.",
    }),
});

const fullFormSchema = partnerStepSchema.merge(accountabilityStepSchema);

function toStepValidationResult(
  result:
    | { success: true }
    | {
        success: false;
        error: z.ZodError;
      },
): StepValidationResult {
  if (result.success) {
    return {
      fieldErrors: {},
      formErrors: [],
    };
  }
  const fieldErrors: SupportFormFieldErrors = {};
  const formErrors: string[] = [];

  result.error.issues.forEach((issue) => {
    const firstPath = issue.path[0];
    if (typeof firstPath === "string") {
      const key = firstPath as SupportFormFieldErrorKey;
      if (!fieldErrors[key]) {
        fieldErrors[key] = issue.message;
      }
      return;
    }

    formErrors.push(issue.message);
  });

  return {
    fieldErrors,
    formErrors,
  };
}

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

export function formatCurrencyAmount(amount: string, currency: CurrencyCode) {
  const normalizedAmount = normalizeAmountInput(amount);
  if (!normalizedAmount) {
    return "";
  }

  const numericAmount = Number(normalizedAmount);
  if (Number.isNaN(numericAmount)) {
    return `${currency} ${normalizedAmount}`;
  }

  // pdf-lib's standard WinAnsi fonts cannot encode the peso symbol (₱),
  // so PHP values are rendered with currency code to remain PDF-safe.
  if (currency === "PHP") {
    const amountWithSeparators = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numericAmount);
    return `PHP ${amountWithSeparators}`;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericAmount);
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
  const result = validatePartnerStepDetailed(data);
  return [...Object.values(result.fieldErrors), ...result.formErrors];
}

export function validateAccountabilityStep(data: SupportFormData) {
  const result = validateAccountabilityStepDetailed(data);
  return [...Object.values(result.fieldErrors), ...result.formErrors];
}

export function validatePartnerStepDetailed(data: SupportFormData): StepValidationResult {
  const result = partnerStepSchema.safeParse({
    consentGiven: data.consentGiven,
    partnerName: data.partnerName,
    emailAddress: data.emailAddress,
    mobileNumber: data.mobileNumber,
    localChurch: data.localChurch,
    missionaryName: data.missionaryName,
    currency: data.currency,
    amount: data.amount,
    nation: data.nation,
    travelDate: data.travelDate,
    sendingChurch: data.sendingChurch,
  });

  return toStepValidationResult(result);
}

export function validateAccountabilityStepDetailed(
  data: SupportFormData,
): StepValidationResult {
  const result = accountabilityStepSchema.safeParse({
    membershipType: data.membershipType,
    partnerSignature: data.partnerSignature,
    partnerPrintedName: data.partnerPrintedName,
    unableToGoChoice: data.unableToGoChoice,
    reroutedChoice: data.reroutedChoice,
    canceledChoice: data.canceledChoice,
  });

  return toStepValidationResult(result);
}

export function validateSupportFormDetailed(data: SupportFormData): StepValidationResult {
  const result = fullFormSchema.safeParse({
    membershipType: data.membershipType,
    consentGiven: data.consentGiven,
    partnerName: data.partnerName,
    emailAddress: data.emailAddress,
    mobileNumber: data.mobileNumber,
    localChurch: data.localChurch,
    missionaryName: data.missionaryName,
    currency: data.currency,
    amount: data.amount,
    nation: data.nation,
    travelDate: data.travelDate,
    sendingChurch: data.sendingChurch,
    unableToGoChoice: data.unableToGoChoice,
    reroutedChoice: data.reroutedChoice,
    canceledChoice: data.canceledChoice,
    partnerSignature: data.partnerSignature,
    partnerPrintedName: data.partnerPrintedName,
  });

  return toStepValidationResult(result);
}

export function validateSupportForm(data: SupportFormData) {
  const result = validateSupportFormDetailed(data);
  return [...Object.values(result.fieldErrors), ...result.formErrors];
}

export function getFirstInvalidStep(data: SupportFormData): EditableFormStep | null {
  const partnerResult = validatePartnerStepDetailed(data);
  if (Object.keys(partnerResult.fieldErrors).length > 0 || partnerResult.formErrors.length > 0) {
    return "partner";
  }

  const accountabilityResult = validateAccountabilityStepDetailed(data);
  if (
    Object.keys(accountabilityResult.fieldErrors).length > 0 ||
    accountabilityResult.formErrors.length > 0
  ) {
    return "accountability";
  }

  return null;
}

export function isSupportFormValid(data: SupportFormData) {
  const result = validateSupportFormDetailed(data);
  return Object.keys(result.fieldErrors).length === 0 && result.formErrors.length === 0;
}
