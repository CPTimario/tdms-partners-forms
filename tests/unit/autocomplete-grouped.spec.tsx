import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import Autocomplete from "@/components/support-form-builder/Autocomplete";
import type { Suggestion } from "@/hooks/useTeams";

const suggestions = [
  { id: "team::1", label: "Alpha", type: "team", team: "Alpha" },
  { id: "m::1::0", label: "Alice", type: "missioner", team: "Alpha" },
  { id: "team::2", label: "Beta", type: "team", team: "Beta" },
  { id: "m::2::0", label: "Sam", type: "missioner", team: "Beta" },
];

describe("Autocomplete grouped rendering", () => {
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

  test("renders Teams and Missioners groups", async () => {
    const onChange = vi.fn();
    const onSelect = vi.fn();

    await act(async () => {
      const root = createRoot(container!);
      root.render(
        <Autocomplete value={""} onChange={onChange} onSelect={onSelect} suggestions={suggestions as Suggestion[]} placeholder={"Type"} />,
      );
    });

    const input = container!.querySelector('input[placeholder="Type"]') as HTMLInputElement;
    expect(input).toBeTruthy();

    await act(async () => {
      input.focus();
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });

    // small tick
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    const listbox = container!.querySelector('[role="listbox"]') as HTMLElement | null;
    expect(listbox).toBeTruthy();

    const groups = listbox!.querySelectorAll('[role="group"]');
    expect(groups.length).toBeGreaterThanOrEqual(2);

    const groupsNodes = Array.from(listbox!.querySelectorAll('[role="group"]'));
    const groupLabels = groupsNodes.map((g) => g.textContent?.trim() ?? "");
    expect(groupLabels.some((t) => t.includes("Teams"))).toBe(true);
    expect(groupLabels.some((t) => t.includes("Missioners"))).toBe(true);

    const options = listbox!.querySelectorAll('[role="option"]');
    expect(options.length).toBeGreaterThanOrEqual(4);
  });
});
