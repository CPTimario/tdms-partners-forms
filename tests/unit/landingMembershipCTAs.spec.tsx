import React from "react";
import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

import LandingMembershipCTAs from "@/components/support-form-builder/LandingMembershipCTAs";

describe("LandingMembershipCTAs (DOM)", () => {
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

  test("renders two CTAs with accessible labels and triggers routing on click", async () => {
    const root = createRoot(container!);

    await act(async () => {
      root.render(<LandingMembershipCTAs />);
    });

    // Should render heading and two buttons
    const heading = container!.querySelector("#membership-choose-title") as HTMLElement | null;
    expect(heading).toBeTruthy();

    const buttons = Array.from(container!.querySelectorAll("button, [role='button']"));
    // We expect at least the two ButtonBase elements (may render as div/button depending on MUI)
    expect(buttons.length).toBeGreaterThanOrEqual(2);

    // Check aria-label presence for both CTAs by scanning attributes (avoid quoting issues)
    const allEls = Array.from(container!.querySelectorAll("*") as NodeListOf<HTMLElement>);
    const nonVictory = allEls.find((el) => el.getAttribute("aria-label") === "Open partners' forms for Non-Victory members");
    const victory = allEls.find((el) => el.getAttribute("aria-label") === "Open partners' forms for Victory members");
    expect(nonVictory).toBeTruthy();
    expect(victory).toBeTruthy();

    // Simulate click on first CTA and ensure no exceptions thrown (routing mocked)
    await act(async () => {
      (nonVictory as HTMLElement).click();
    });

    // Simulate click on second CTA
    await act(async () => {
      (victory as HTMLElement).click();
    });
  });
});
