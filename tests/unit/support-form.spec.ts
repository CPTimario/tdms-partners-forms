import { expect, test } from "@playwright/test";
import {
  displayValue,
  formatDisplayDate,
  getFirstInvalidStep,
  initialSupportFormData,
  isSupportFormValid,
  type SupportFormData,
  validateAccountabilityStep,
  validatePartnerStep,
  validateSupportForm,
} from "@/lib/support-form";

function buildValidData(): SupportFormData {
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
    partnerSignature: "Christopher Timario",
    unableToGoChoice: "teamFund",
    reroutedChoice: "retain",
    canceledChoice: "generalFund",
  };
}

test.describe("support-form domain validation", () => {
  test("valid partner step has no errors", () => {
    const data = buildValidData();
    expect(validatePartnerStep(data)).toEqual([]);
  });

  test("partner step returns required field errors", () => {
    const data = { ...initialSupportFormData };
    const errors = validatePartnerStep(data);

    expect(errors).toContain("Consent is required.");
    expect(errors).toContain("Partner Name is required.");
    expect(errors).toContain("Email Address is required.");
    expect(errors).toContain("Mobile Number is required.");
    expect(errors).toContain("Local Church is required.");
    expect(errors).toContain("Missioner Name/Team is required.");
    expect(errors).toContain("Amount is required.");
    expect(errors).toContain("Nation is required.");
    expect(errors).toContain("Travel Date is required.");
    expect(errors).toContain("Sending Church is required.");
  });

  test("accountability step requires choices and printed signature", () => {
    const data = buildValidData();
    data.partnerSignature = "";
    data.unableToGoChoice = null;
    data.reroutedChoice = null;
    data.canceledChoice = null;

    const errors = validateAccountabilityStep(data);
    expect(errors).toContain("Signature is required.");
    expect(errors).toContain(
      "Please choose an accountability option for when the missioner is unable to go.",
    );
    expect(errors).toContain(
      "Please choose an accountability option for when the missioner or team is rerouted.",
    );
    expect(errors).toContain(
      "Please confirm the accountability instruction for a canceled trip.",
    );
  });

  test("full form validity and first-invalid-step behavior", () => {
    const validData = buildValidData();
    expect(validateSupportForm(validData)).toEqual([]);
    expect(isSupportFormValid(validData)).toBeTruthy();
    expect(getFirstInvalidStep(validData)).toBeNull();

    const invalidPartner = { ...validData, partnerName: "" };
    expect(getFirstInvalidStep(invalidPartner)).toBe("partner");

    const invalidAccountability = {
      ...validData,
      partnerSignature: "",
    };
    expect(getFirstInvalidStep(invalidAccountability)).toBe("accountability");
  });
});

test.describe("support-form formatting helpers", () => {
  test("formatDisplayDate formats yyyy-mm-dd to mm/dd/yy", () => {
    expect(formatDisplayDate("2026-06-20")).toBe("06/20/26");
    expect(formatDisplayDate("06/20/26")).toBe("06/20/26");
    expect(formatDisplayDate("")).toBe("");
  });

  test("displayValue truncates long values", () => {
    const long = "x".repeat(60);
    expect(displayValue(long)).toBe(`${"x".repeat(54)}...`);
    expect(displayValue("short")).toBe("short");
    expect(displayValue("   ")).toBe("");
  });
});
