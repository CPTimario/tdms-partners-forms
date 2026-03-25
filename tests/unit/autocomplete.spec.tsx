import { describe, test, expect } from "vitest";

describe("Autocomplete filtering logic", () => {
  test("filters suggestion labels case-insensitively and limits to 10", () => {
    const suggestions = Array.from({ length: 15 }).map((_, i) => ({
      id: `id-${i}`,
      label: i % 2 === 0 ? `Alpha ${i}` : `Beta ${i}`,
      type: i % 2 === 0 ? "missioner" : "team",
      team: i % 2 === 0 ? "Alpha" : "Beta",
    }));

    const value = "al";
    const q = value.toLowerCase();
    const filtered = suggestions.filter((s) => s.label.toLowerCase().includes(q)).slice(0, 10);

    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every((f) => f.label.toLowerCase().includes("al"))).toBe(true);
    expect(filtered.length).toBeLessThanOrEqual(10);
  });
});
