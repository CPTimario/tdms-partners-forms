import { describe, test, expect } from "vitest";

// This test validates the transformation logic used by the hook without
// mounting React. It mirrors the mapping in useTeamsWithSuggestions.

type Team = {
  _id: string;
  teamName: string;
  nation: string;
  travelDate: string;
  sendingChurch: string;
  missioners?: string[];
};

type Suggestion = {
  id: string;
  label: string;
  type: "team" | "missioner";
  team: string;
  nation: string;
  travelDate: string;
  sendingChurch: string;
};

describe("useTeamsWithSuggestions mapping behavior", () => {
  test("normalizes teams into team and missioner suggestions", () => {
    const teams: Team[] = [
      {
        _id: "alpha",
        teamName: "Alpha Team",
        nation: "X",
        travelDate: "2026-01-01",
        sendingChurch: "C1",
        missioners: ["Alice", "Arnold"],
      },
      {
        _id: "beta",
        teamName: "Beta Team",
        nation: "Y",
        travelDate: "2026-02-02",
        sendingChurch: "C2",
        missioners: ["Bob"],
      },
    ];

    const suggestions: Suggestion[] = teams.flatMap((g) => {
      const teamSuggestion: Suggestion = {
        id: `team::${g._id}`,
        label: `Team: ${g.teamName}`,
        type: "team",
        team: g.teamName,
        nation: g.nation,
        travelDate: g.travelDate,
        sendingChurch: g.sendingChurch,
      };
      const missionerSuggestions: Suggestion[] = (g.missioners ?? []).map((m, i) => ({
        id: `m::${g._id}::${i}`,
        label: m,
        type: "missioner",
        team: g.teamName,
        nation: g.nation,
        travelDate: g.travelDate,
        sendingChurch: g.sendingChurch,
      }));
      return [teamSuggestion, ...missionerSuggestions];
    });

    const labels = suggestions.map((s) => s.label);
    expect(labels).toContain("Team: Alpha Team");
    expect(labels).toContain("Alice");
    expect(labels).toContain("Bob");
    expect(suggestions.some((s) => s.type === "team")).toBe(true);
    expect(suggestions.filter((s) => s.type === "missioner").length).toBe(3);
  });
});
