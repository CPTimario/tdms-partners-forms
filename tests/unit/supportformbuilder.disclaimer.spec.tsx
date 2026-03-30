import React from "react";
import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";

// Minimal mocks used by SupportFormBuilder tests
process.env.DEEPLINK_KEY = process.env.DEEPLINK_KEY || "test-deeplink-key";

import * as deeplinkCryptoModule from "@/lib/deeplink-crypto";

const originalFetch = global.fetch;
beforeEach(() => {
  // default fetch mock: POST returns token, GET returns fields
  global.fetch = vi.fn(async (input: RequestInfo, init?: RequestInit) => {
    const urlStr = typeof input === "string" ? input : (input as Request).url;
    const u = new URL(urlStr, "http://localhost");
    if (init && init.method && init.method.toUpperCase() === "POST") {
      const body = init.body ? JSON.parse(init.body.toString()) : {};
      const token = deeplinkCryptoModule.encryptRecipient(body as Record<string, string>);
      return { ok: true, json: async () => ({ token }) } as unknown as Response;
    }
    const token = u.searchParams.get("token");
    const fields = token ? deeplinkCryptoModule.decryptRecipient(token) : null;
    return { ok: true, json: async () => ({ fields }) } as unknown as Response;
  }) as unknown as typeof fetch;
});
afterEach(() => {
  global.fetch = originalFetch;
  vi.resetAllMocks();
  try {
    window.localStorage.clear();
  } catch {
    /* ignore */
  }
});

// Provide a lightweight hook mock
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

// next/navigation minimal mock
const _replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: _replace, push: vi.fn() }),
  useSearchParams: () => ({ get: () => null }),
}));

// Stub FillStep to avoid importing heavy child modules (datepicker, MUI internals)
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

describe("SupportFormBuilder disclaimer integration", () => {
  let container: HTMLDivElement | null = null;
  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });
  afterEach(() => {
    if (container) {
      container.innerHTML = "";
      container.remove();
      container = null;
    }
  });

  test("shows disclaimer on first visit and persists dismissal", async () => {
    const { default: PrivacyWidget } = await import("@/components/GlobalPrivacy/PrivacyWidget");
    const { ThemeProvider, createTheme } = await import("@mui/material/styles");

    await act(async () => {
      const root = createRoot(container!);
      root.render(
        <ThemeProvider theme={createTheme()}>
          <PrivacyWidget />
        </ThemeProvider>,
      );
      await Promise.resolve();
    });

    // modal should be present
    const title = container!.querySelector("#disclaimer-title");
    expect(title).toBeTruthy();

    // click the Understood button
    const button = Array.from(container!.querySelectorAll("button")).find((b) => b.textContent === "Understood");
    expect(button).toBeTruthy();
    if (!button) throw new Error("Understood button missing");

    await act(async () => {
      (button as HTMLButtonElement).click();
      await Promise.resolve();
    });

    // modal should be removed
    const after = container!.querySelector("#disclaimer-title");
    expect(after).toBeFalsy();

    // localStorage should have the dismissal key
    expect(window.localStorage.getItem("disclaimer_dismissed")).toBe("1");
  });
});
