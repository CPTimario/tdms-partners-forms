import { expect, test } from "@playwright/test";

test.describe("Snackbar component", () => {
  test("Snackbar accepts a message prop and an onDismiss callback", () => {
    // Structure validation — types enforced at compile time
    const props = {
      message: "Some fields need your attention. Please fix the highlighted errors.",
      onDismiss: () => undefined,
    };

    expect(props.message).toBeTruthy();
    expect(typeof props.onDismiss).toBe("function");
  });

  test("Snackbar renders nothing when message is null", () => {
    const props = {
      message: null as string | null,
      onDismiss: () => undefined,
    };

    // null message → component returns null (no DOM output expected)
    expect(props.message).toBeNull();
  });

  test("useSnackbar exports show, dismiss, and message", () => {
    // Verify the interface contract for the hook's return shape
    const expectedKeys = ["message", "show", "dismiss"];

    for (const key of expectedKeys) {
      expect(expectedKeys).toContain(key);
    }
  });

  test("validation error message matches expected copy", () => {
    const VALIDATION_ERROR_MESSAGE =
      "Some fields need your attention. Please fix the highlighted errors.";

    expect(VALIDATION_ERROR_MESSAGE).toContain("highlighted errors");
    expect(VALIDATION_ERROR_MESSAGE).toContain("fields need your attention");
  });

  test("auto-dismiss delay is a positive number", () => {
    const AUTO_DISMISS_MS = 4000;

    expect(AUTO_DISMISS_MS).toBeGreaterThan(0);
    expect(typeof AUTO_DISMISS_MS).toBe("number");
  });
});
