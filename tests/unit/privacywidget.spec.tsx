import React from "react";
import { test, expect, vi, beforeEach, afterEach } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";

beforeEach(() => {
  try {
    window.localStorage.clear();
  } catch {
    /* ignore */
  }
});
afterEach(() => {
  vi.resetAllMocks();
});

test("PrivacyWidget opens modal and persists dismissal", async () => {
  const { default: PrivacyWidget } = await import("@/components/GlobalPrivacy/PrivacyWidget");
  const { ThemeProvider, createTheme } = await import("@mui/material/styles");

  const container = document.createElement("div");
  document.body.appendChild(container);

  try {
    await act(async () => {
      const root = createRoot(container);
      root.render(
        <ThemeProvider theme={createTheme()}>
          <PrivacyWidget />
        </ThemeProvider>,
      );
      await Promise.resolve();
    });

    // button should be present
    const btn = container.querySelector("button[aria-label=\"Privacy notice\"]");
    expect(btn).toBeTruthy();

    // modal should be visible (PrivacyWidget auto-opens when localStorage missing)
    const title = container.querySelector("#disclaimer-title");
    expect(title).toBeTruthy();

    const understood = Array.from(container.querySelectorAll("button")).find((b) => b.textContent === "Understood");
    expect(understood).toBeTruthy();
    if (!understood) throw new Error("Understood button missing");

    await act(async () => {
      (understood as HTMLButtonElement).click();
      await Promise.resolve();
    });

    // modal should be removed and localStorage set
    expect(container.querySelector("#disclaimer-title")).toBeFalsy();
    expect(window.localStorage.getItem("disclaimer_dismissed")).toBe("1");
  } finally {
    container.remove();
  }
});
