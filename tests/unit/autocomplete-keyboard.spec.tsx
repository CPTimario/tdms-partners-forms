import React from "react";
import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";
import Autocomplete from "@/components/support-form-builder/Autocomplete";
import type { Suggestion } from "@/hooks/useTeams";

describe("Autocomplete keyboard interactions", () => {
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
    vi.resetAllMocks();
  });

  test("ArrowDown highlights first option and Enter selects it", async () => {
    const suggestions: Suggestion[] = [
      { id: "team::1", label: "Team: Alpha", type: "team", team: "Alpha" },
      { id: "m::1::0", label: "Alice", type: "missioner", team: "Alpha" },
    ];

    const onChange = vi.fn();
    const onSelect = vi.fn();

    await act(async () => {
      const root = createRoot(container!);
      root.render(<Autocomplete value={""} onChange={onChange} onSelect={onSelect} suggestions={suggestions} placeholder={"Type"} />);
    });

    const input = container!.querySelector('input[placeholder="Type"]') as HTMLInputElement;
    expect(input).toBeTruthy();

    // focus and open
    await act(async () => {
      input.focus();
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });

    // Wait briefly for list to render
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    const listbox = container!.querySelector('[role="listbox"]') as HTMLElement | null;
    expect(listbox).toBeTruthy();

    // Press ArrowDown to highlight first option
    await act(async () => {
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
      await new Promise((r) => setTimeout(r, 0));
    });

    const options = Array.from(listbox!.querySelectorAll('[role="option"]')) as HTMLElement[];
    expect(options.length).toBeGreaterThanOrEqual(1);

    // first option should be selected via aria-selected
    expect(options[0].getAttribute("aria-selected")).toBe("true");

    // input should have aria-activedescendant pointing to first option id
    const activedesc = input.getAttribute("aria-activedescendant");
    expect(activedesc).toBeTruthy();
    const activeEl = document.getElementById(activedesc!);
    expect(activeEl).toBe(options[0]);

    // Press Enter to select
    await act(async () => {
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(onSelect).toHaveBeenCalled();
    expect(onChange).toHaveBeenCalled();
  });
});
