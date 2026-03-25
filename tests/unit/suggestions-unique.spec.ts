import { describe, test, expect } from "vitest";

type TeamDoc = {
  teamId?: string;
  teamName?: string;
  nation?: string;
  travelDate?: string;
  sendingChurch?: string;
  missioners?: string[];
};

type Suggestion = { id: string; label: string; type: "team" | "missioner" };

describe("Suggestion id uniqueness", () => {
  test("produced suggestion ids are unique across teams and missioners", () => {
    const teams: TeamDoc[] = [
      {
        teamId: "t1",
        teamName: "Alpha Team",
        nation: "X",
        travelDate: "2026-01-01",
        sendingChurch: "C1",
        missioners: ["Sam", "Alex"],
      },
      {
        teamId: "t2",
        teamName: "Beta Team",
        nation: "Y",
        travelDate: "2026-02-02",
        sendingChurch: "C2",
        missioners: ["Sam"],
      },
    ];

    const suggestions: Suggestion[] = teams.flatMap((g) => {
      const teamSuggestion: Suggestion = { id: `team::${String(g.teamId ?? g.teamName ?? "")}`, label: `${g.teamName}`, type: "team" };
      const missionerSuggestions: Suggestion[] = (g.missioners ?? []).map((m, i) => ({ id: `m::${String(g.teamId ?? g.teamName ?? "")}::${i}`, label: m, type: "missioner" }));
      return [teamSuggestion, ...missionerSuggestions];
    });

    const ids = suggestions.map((s) => s.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);

    // Explicit check: duplicate missioner name across teams should still yield different ids
    const samIds = suggestions.filter((s) => s.label === "Sam").map((s) => s.id);
    expect(samIds.length).toBeGreaterThan(0);
    expect(new Set(samIds).size).toBe(samIds.length);
  });
});
