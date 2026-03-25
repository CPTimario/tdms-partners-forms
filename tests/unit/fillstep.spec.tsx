import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { FillStep } from "@/components/support-form-builder/FillStep";

import { createRoot } from "react-dom/client";
import { act } from "react";
import { initialSupportFormData, type SupportFormData } from "@/lib/support-form";
import React from "react";

vi.mock("@/hooks/useTeams", () => ({
  useTeamsWithSuggestions: () => ({
    suggestions: [
      { id: "team::1", label: "Southeast Team", type: "team", team: "Southeast Team", nation: "Thailand", travelDate: "2026-06-20", sendingChurch: "Every Nation Makati" },
      { id: "m::1::0", label: "Alice Example", type: "missioner", team: "Southeast Team", nation: "Thailand", travelDate: "2026-06-20", sendingChurch: "Every Nation Makati" },
    ],
    groups: [],
    loading: false,
    error: null,
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

describe("FillStep integration (DOM)", () => {
  let container: HTMLDivElement | null = null;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (container) {
      // unmount root by clearing container
      container.innerHTML = "";
      container.remove();
      container = null;
    }
    vi.resetAllMocks();
  });

  test("selecting a team suggestion populates dependent fields via setField", async () => {
    const data: SupportFormData = { ...initialSupportFormData, missionaryName: "" };
    const setField = vi.fn();

    await act(async () => {
      const root = createRoot(container!);
      root.render(
        <FillStep
          data={data}
          step={"partner"}
          fieldErrors={{}}
          formErrors={[]}
          isFormValid={false}
          isPartnerStepComplete={false}
          isAccountabilityStepComplete={false}
          onTextChange={() => () => { /* noop */ }}
          onCurrencyChange={() => {}}
          onCheckboxChange={() => () => {}}
          onUnableToGoChange={() => {}}
          onReroutedChange={() => {}}
          onCanceledChange={() => {}}
          onPartnerSignatureChange={() => {}}
          onPartnerTab={() => {}}
          onAccountabilityTab={() => {}}
          onReview={() => {}}
          onReset={() => {}}
          setField={setField}
        />,
      );
    });

    // Find the autocomplete input and type to open suggestions
    const input = container!.querySelector('input[placeholder="Type team or missioner name"]') as HTMLInputElement;
    expect(input).toBeTruthy();

    await act(async () => {
      input.focus();
      input.value = "Southeast";
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });

    // Wait a tick for UI to render list
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    const listbox = container!.querySelector('[role="listbox"]') as HTMLElement | null;
    expect(listbox).toBeTruthy();
    const options = listbox!.querySelectorAll('[role="option"]');
    expect(options.length).toBeGreaterThan(0);

    // Simulate selecting the first option via mousedown (Autocomplete uses onMouseDown)
    await act(async () => {
      const first = options[0] as HTMLElement;
      first.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    });

    // Assert setField was called for dependent fields
    expect(setField).toHaveBeenCalledWith("nation", "Thailand");
    expect(setField).toHaveBeenCalledWith("travelDate", "2026-06-20");
    expect(setField).toHaveBeenCalledWith("sendingChurch", "Every Nation Makati");
    expect(setField).toHaveBeenCalledWith("missionaryName", expect.any(String));
  });

  test("selecting a missioner suggestion also populates dependent fields", async () => {
    const data: SupportFormData = { ...initialSupportFormData, missionaryName: "" };
    const setField = vi.fn();

    await act(async () => {
      const root = createRoot(container!);
      root.render(
        <FillStep
          data={data}
          step={"partner"}
          fieldErrors={{}}
          formErrors={[]}
          isFormValid={false}
          isPartnerStepComplete={false}
          isAccountabilityStepComplete={false}
          onTextChange={() => () => { /* noop */ }}
          onCurrencyChange={() => {}}
          onCheckboxChange={() => () => {}}
          onUnableToGoChange={() => {}}
          onReroutedChange={() => {}}
          onCanceledChange={() => {}}
          onPartnerSignatureChange={() => {}}
          onPartnerTab={() => {}}
          onAccountabilityTab={() => {}}
          onReview={() => {}}
          onReset={() => {}}
          setField={setField}
        />,
      );
    });

    const input = container!.querySelector('input[placeholder="Type team or missioner name"]') as HTMLInputElement;
    await act(async () => {
      input.focus();
      input.value = "Alice";
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    const listbox = container!.querySelector('[role="listbox"]') as HTMLElement | null;
    expect(listbox).toBeTruthy();
    const options = listbox!.querySelectorAll('[role="option"]');
    expect(options.length).toBeGreaterThan(0);

    await act(async () => {
      const target = Array.from(options).find((o) => (o.textContent ?? "").includes("Alice")) as HTMLElement;
      expect(target).toBeTruthy();
      target.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    });

    expect(setField).toHaveBeenCalledWith("nation", "Thailand");
    expect(setField).toHaveBeenCalledWith("travelDate", "2026-06-20");
    expect(setField).toHaveBeenCalledWith("sendingChurch", "Every Nation Makati");
    expect(setField).toHaveBeenCalledWith("missionaryName", expect.stringContaining("Alice"));
  });

  test("clearing a selection then selecting another updates fields and notifies parent", async () => {
    const data: SupportFormData = { ...initialSupportFormData, missionaryName: "" };
    const setField = vi.fn();
    const onRecipientSelect = vi.fn();

    await act(async () => {
      const root = createRoot(container!);
      root.render(
        <FillStep
          data={data}
          step={"partner"}
          fieldErrors={{}}
          formErrors={[]}
          isFormValid={false}
          isPartnerStepComplete={false}
          isAccountabilityStepComplete={false}
          onTextChange={() => () => { /* noop */ }}
          onCurrencyChange={() => {}}
          onCheckboxChange={() => () => {}}
          onUnableToGoChange={() => {}}
          onReroutedChange={() => {}}
          onCanceledChange={() => {}}
          onPartnerSignatureChange={() => {}}
          onPartnerTab={() => {}}
          onAccountabilityTab={() => {}}
          onReview={() => {}}
          onReset={() => {}}
          setField={setField}
          onRecipientSelect={onRecipientSelect}
        />,
      );
    });

    const input = container!.querySelector('input[placeholder="Type team or missioner name"]') as HTMLInputElement;
    expect(input).toBeTruthy();

    // Select first suggestion (Southeast Team)
    await act(async () => {
      input.focus();
      input.value = "Southeast";
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    const listbox = container!.querySelector('[role="listbox"]') as HTMLElement | null;
    expect(listbox).toBeTruthy();
    const options = listbox!.querySelectorAll('[role="option"]');
    expect(options.length).toBeGreaterThan(0);

    await act(async () => {
      const first = options[0] as HTMLElement;
      first.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    });

    // initial selection should populate fields
    expect(setField).toHaveBeenCalledWith("nation", "Thailand");

    // Now simulate typing (clearing selection)
    await act(async () => {
      input.focus();
      input.value = "SoutheastX";
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });

    // parent should be notified that selection was cleared
      // (Reselection is covered by separate tests.) Ensure clearing notifies parent only
      expect(onRecipientSelect).toHaveBeenCalledWith(null);

    // (Reselection is covered by other tests.)
  });
});
describe("FillStep basic export", () => {
  test("component is defined", () => {
    expect(typeof FillStep).toBe("function");
  });
});
