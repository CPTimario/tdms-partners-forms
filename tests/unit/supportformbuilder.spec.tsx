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

// no-op: FillStep is stubbed in this test and we don't rely on suggestions

// Ensure a stable DEEPLINK_KEY for encryption/decryption used in tests
process.env.DEEPLINK_KEY = process.env.DEEPLINK_KEY || "test-deeplink-key";

// Mock fetch to handle server-side deeplink encrypt/decrypt API
import * as deeplinkCryptoModule from "@/lib/deeplink-crypto";
const originalFetch = global.fetch;
beforeEach(() => {
  global.fetch = vi.fn(async (input: RequestInfo, init?: RequestInit) => {
    const urlStr = typeof input === "string" ? input : (input as Request).url;
    const u = new URL(urlStr, "http://localhost");
    if (init && init.method && init.method.toUpperCase() === "POST") {
      const body = init.body ? JSON.parse(init.body.toString()) : {};
      const token = deeplinkCryptoModule.encryptRecipient(body as Record<string, string>);
      return { ok: true, json: async () => ({ token }) } as unknown as Response;
    }
    // GET -> decrypt
    const token = u.searchParams.get("token");
    const fields = token ? deeplinkCryptoModule.decryptRecipient(token) : null;
    return { ok: true, json: async () => ({ fields }) } as unknown as Response;
  }) as unknown as typeof fetch;
});

afterEach(() => {
  global.fetch = originalFetch;
});

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

  // helper to wait for `replace` or other async mocks to be called
  async function waitForMockCall(mockFn: { mock: { calls: unknown[] } }, timeout = 2000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if ((mockFn as any).mock && (mockFn as any).mock.calls.length) return;
      await new Promise((r) => setTimeout(r, 10));
    }
    // final microtask flush
    await Promise.resolve();
  }

  async function waitForSelector(selector: string, root: HTMLElement | null, timeout = 2000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (root && root.querySelector(selector)) return root.querySelector(selector);
      await new Promise((r) => setTimeout(r, 10));
    }
    return null;
  }


  test("adds recipient param when child selects a suggestion", async () => {
    const { SupportFormBuilder } = await import("@/components/support-form-builder/SupportFormBuilder");
    let root = null as any;
    await act(async () => {
      root = createRoot(container!);
      root.render(<SupportFormBuilder />);
    });


    const select = (await waitForSelector("#select", container)) as HTMLButtonElement | null;
    expect(select).toBeTruthy();

    await act(async () => {
      select.click();
    });

    // allow pending promises/microtasks (fetch + router.replace)
    await Promise.resolve();
    await Promise.resolve();
    // wait for router.replace to be called (avoid timing races)
    await waitForMockCall(replace, 2000);

    // router.replace should be called with a query string containing the recipient id
    expect(replace).toHaveBeenCalled();
    const calledWith = replace.mock.calls[replace.mock.calls.length - 1][0] as string;
    // URL will contain an encrypted recipient token; decrypt and assert payload
    const qs = calledWith.split("?")[1] ?? calledWith;
    const params = new URLSearchParams(qs.replace(/^\?/, ""));
    const token = params.get("recipient");
    expect(token).toBeTruthy();
    const crypto = await import("@/lib/deeplink-crypto");
    const parsed = crypto.decryptRecipient(token as string);
    expect(parsed).toBeTruthy();
    expect(parsed?.missionaryName).toBe("Southeast Team");

    // unmount the root to avoid overlapping createRoot warnings in subsequent tests
    try {
      root.unmount();
    } catch {
      /* ignore */
    }
  });

  test("removes recipient param when child clears selection", async () => {
    const { SupportFormBuilder } = await import("@/components/support-form-builder/SupportFormBuilder");
    let root = null as any;
    await act(async () => {
      root = createRoot(container!);
      root.render(<SupportFormBuilder />);
    });

    const clear = container!.querySelector("#clear") as HTMLButtonElement;
    expect(clear).toBeTruthy();

    await act(async () => {
      clear.click();
    });

    // allow pending promises/microtasks
    await Promise.resolve();
    await Promise.resolve();

    expect(replace).toHaveBeenCalled();
    const last = replace.mock.calls[replace.mock.calls.length - 1][0] as string;
    expect(last).not.toContain("recipient=");

    try {
      root.unmount();
    } catch {
      /* ignore */
    }
  });

  test("initializes fields from deeplink recipient parameter", async () => {
    // Mock searchParams to return an encrypted token and ensure setField is called
    const crypto = await import("@/lib/deeplink-crypto");
    const token = crypto.encryptRecipient({ missionaryName: "Southeast Team", nation: "Thailand", travelDate: "2026-06-20", sendingChurch: "Every Nation Makati" });
    _searchGet = () => token;

    const { SupportFormBuilder } = await import("@/components/support-form-builder/SupportFormBuilder");

    let root = null as any;
    await act(async () => {
      root = createRoot(container!);
      root.render(<SupportFormBuilder />);
    });

    // allow pending promises/microtasks (fetch + setField)
    await Promise.resolve();
    await Promise.resolve();
    // wait for setField mock to be called
    await waitForMockCall(mockSetField, 2000);

    // setField should have been called to populate dependent fields for the deeplinked suggestion
    expect(mockSetField).toHaveBeenCalledWith("nation", "Thailand");

    try {
      root.unmount();
    } catch {
      /* ignore */
    }
  });

  test("auto-creates recipient token when required fields present (debounced)", async () => {
    // Reset module cache so we can provide a different useSupportForm mock
    vi.resetModules();

    // Ensure fetch mock will still respond (beforeEach sets global.fetch)

    // Use fake timers to control debounce
    vi.useFakeTimers();

    // Provide a mock useSupportForm that returns fully-populated data on mount
    const now = new Date();
    const pad = (v: number) => String(v).padStart(2, "0");
    const localToday = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const mockUseSupportForm = () => ({
      data: { membershipType: "non-victory", missionaryName: "Auto Test", nation: "Nowhere", travelDate: localToday, sendingChurch: "Test Church" },
      step: "partner",
      fieldErrors: {},
      formErrors: [],
      isFormValid: true,
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
      setValidation: () => {},
    });

    // Mock the hook module before importing the component
    vi.doMock("@/hooks/use-support-form", () => ({ useSupportForm: mockUseSupportForm }));

    // Re-mock next/navigation to ensure router.replace spy is available
    vi.doMock("next/navigation", () => ({
      useRouter: () => ({ replace: _replace, push: vi.fn() }),
      useSearchParams: () => ({ get: () => null }),
    }));
    const replaceSpy = _replace;

    const { SupportFormBuilder } = await import("@/components/support-form-builder/SupportFormBuilder");

    const container = document.createElement("div");
    document.body.appendChild(container);
    try {
      await act(async () => {
        const root = createRoot(container);
        root.render(<SupportFormBuilder />);
      });

      // advance timers past debounce (400ms -> advance 500ms)
      await vi.advanceTimersByTimeAsync(500);

      // allow pending promises/microtasks to resolve
      await Promise.resolve();
      await Promise.resolve();

      expect(replaceSpy).toHaveBeenCalled();
      const calledWith = replaceSpy.mock.calls[replaceSpy.mock.calls.length - 1][0] as string;
      const qs = calledWith.split("?")[1] ?? calledWith;
      const params = new URLSearchParams(qs.replace(/^\?/, ""));
      const token = params.get("recipient");
      expect(token).toBeTruthy();
      const crypto = await import("@/lib/deeplink-crypto");
      const parsed = crypto.decryptRecipient(token as string);
      expect(parsed).toBeTruthy();
      expect(parsed?.missionaryName).toBe("Auto Test");
    } finally {
      vi.useRealTimers();
      if (container) {
        container.remove();
      }
      // reset module mocks so other tests remain unaffected
      vi.resetModules();
    }
  });

  test("does not update URL when token creation is aborted", async () => {
    vi.resetModules();
    vi.useFakeTimers();

    const now = new Date();
    const pad = (v: number) => String(v).padStart(2, "0");
    const localToday = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

    const mockUseSupportForm = () => ({
      data: { membershipType: "non-victory", missionaryName: "Abort Test", nation: "Nowhere", travelDate: localToday, sendingChurch: "Test Church" },
      step: "partner",
      fieldErrors: {},
      formErrors: [],
      isFormValid: true,
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
      setValidation: () => {},
    });

    vi.doMock("@/hooks/use-support-form", () => ({ useSupportForm: mockUseSupportForm }));

    // Mock a fetch that listens to AbortSignal and rejects when aborted
    global.fetch = vi.fn((input: RequestInfo, init?: RequestInit) => {
      const urlStr = typeof input === "string" ? input : (input as Request).url;
      const u = new URL(urlStr, "http://localhost");
      if (init && init.method && init.method.toUpperCase() === "POST") {
        return new Promise((resolve, reject) => {
          const signal = init.signal as AbortSignal | undefined;
          const t = setTimeout(() => {
            // produce a valid token using the crypto helper
            import("@/lib/deeplink-crypto").then((crypto) => {
              const token = crypto.encryptRecipient({ missionaryName: "Abort Test", nation: "Nowhere", travelDate: localToday, sendingChurch: "Test Church" });
              resolve({ ok: true, json: async () => ({ token }) } as unknown as Response);
            });
          }, 1000);
          if (signal) {
            signal.addEventListener("abort", () => {
              clearTimeout(t);
              reject(new DOMException("Aborted", "AbortError"));
            });
          }
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({ fields: null }) } as unknown as Response);
    }) as unknown as typeof fetch;

    vi.doMock("next/navigation", () => ({
      useRouter: () => ({ replace: _replace, push: vi.fn() }),
      useSearchParams: () => ({ get: () => null }),
    }));

    const replaceSpy = _replace;

    const { SupportFormBuilder } = await import("@/components/support-form-builder/SupportFormBuilder");

    const container = document.createElement("div");
    document.body.appendChild(container);
    try {
      await act(async () => {
        const root = createRoot(container);
        root.render(<SupportFormBuilder />);
      });

      // advance timers to trigger debounce and start the inflight request
      await vi.advanceTimersByTimeAsync(500);

      // unmount component to trigger cleanup and abort inflight
      await act(async () => {
        // best-effort unmount: clear the container
        container.innerHTML = "";
      });

      // allow microtasks
      await Promise.resolve();
      await Promise.resolve();

      expect(replaceSpy).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
      if (container) container.remove();
      vi.resetModules();
    }
  });
});
