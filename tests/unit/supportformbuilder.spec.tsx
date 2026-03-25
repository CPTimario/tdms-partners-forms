import React from "react";
import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";

// Provide a lightweight stub for FillStep so tests can exercise the
// `onRecipientSelect` callback passed by SupportFormBuilder without
// dealing with Autocomplete DOM timing.
vi.mock("@/components/support-form-builder/FillStep", () => ({
  FillStep: ({ onRecipientSelect }: { onRecipientSelect?: (item?: { id: string; label: string } | null) => void }) => {
    return (
      <div>
        <button id="select" onClick={() => onRecipientSelect && onRecipientSelect({ id: "team::1", label: "Southeast Team" })}>Select</button>
        <button id="clear" onClick={() => onRecipientSelect && onRecipientSelect(null)}>Clear</button>
      </div>
    );
  },
}));

vi.mock("@/hooks/useTeams", () => ({
  useTeamsWithSuggestions: () => ({
    suggestions: [
      { id: "team::1", label: "Southeast Team", type: "team", team: "Southeast Team", nation: "Thailand", travelDate: "2026-06-20", sendingChurch: "Every Nation Makati" },
    ],
    groups: [],
    loading: false,
    error: null,
  }),
}));

// Mock useSupportForm to provide required shape
const mockSetField = vi.fn();
vi.mock("@/hooks/use-support-form", () => ({
  useSupportForm: () => ({
    data: { membershipType: "non-victory" },
    step: "partner",
    fieldErrors: {},
    formErrors: [],
    isFormValid: false,
    isPartnerStepComplete: false,
    isAccountabilityStepComplete: false,
    onTextChange: () => () => {},
    onCurrencyChange: () => {},
    onCheckboxChange: () => () => {},
    setMembership: () => {},
    onUnableToGoChange: () => {},
    onReroutedChange: () => {},
    onCanceledChange: () => {},
    setPartnerSignature: () => {},
    resetForm: () => {},
    goToPartner: () => {},
    goToAccountability: () => {},
    goToReview: () => {},
    setField: mockSetField,
  }),
}));

// Mock next/navigation hooks used by SupportFormBuilder. We reference
// a mutable `searchGet` variable inside the tests to control the return
// value of `useSearchParams().get()`.
let _searchGet: () => string | null = () => null;
const _replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: _replace, push: vi.fn() }),
  useSearchParams: () => ({ get: () => _searchGet() }),
}));

describe("SupportFormBuilder URL sync", () => {
  let container: HTMLDivElement | null = null;
  const replace = _replace;
  // allow tests to control searchParams.get() return value via `_searchGet`

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    replace.mockClear();
    _searchGet = () => null;
  });

  afterEach(() => {
    if (container) {
      container.innerHTML = "";
      container.remove();
      container = null;
    }
    vi.resetAllMocks();
  });


  test("adds recipient param when child selects a suggestion", async () => {
    const { SupportFormBuilder } = await import("@/components/support-form-builder/SupportFormBuilder");

    await act(async () => {
      const root = createRoot(container!);
      root.render(<SupportFormBuilder />);
    });

    const select = container!.querySelector("#select") as HTMLButtonElement;
    expect(select).toBeTruthy();

    await act(async () => {
      select.click();
    });

    // router.replace should be called with a query string containing the recipient id
    expect(replace).toHaveBeenCalled();
    const calledWith = replace.mock.calls[replace.mock.calls.length - 1][0] as string;
    // URL will be encoded; decode and assert presence of canonical fragment
    expect(decodeURIComponent(calledWith)).toContain("recipient=team::1");
  });

  test("removes recipient param when child clears selection", async () => {
    const { SupportFormBuilder } = await import("@/components/support-form-builder/SupportFormBuilder");

    await act(async () => {
      const root = createRoot(container!);
      root.render(<SupportFormBuilder />);
    });

    const clear = container!.querySelector("#clear") as HTMLButtonElement;
    expect(clear).toBeTruthy();

    await act(async () => {
      clear.click();
    });

    expect(replace).toHaveBeenCalled();
    const last = replace.mock.calls[replace.mock.calls.length - 1][0] as string;
    expect(last).not.toContain("recipient=");
  });

  test("initializes fields from deeplink recipient parameter", async () => {
    // Mock searchParams to return the canonical id and ensure setField is called
    _searchGet = () => "team::1";

    const { SupportFormBuilder } = await import("@/components/support-form-builder/SupportFormBuilder");

    await act(async () => {
      const root = createRoot(container!);
      root.render(<SupportFormBuilder />);
    });

    // setField should have been called to populate dependent fields for the deeplinked suggestion
    expect(mockSetField).toHaveBeenCalledWith("nation", "Thailand");
  });
});
