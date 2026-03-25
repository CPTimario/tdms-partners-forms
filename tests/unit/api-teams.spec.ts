import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";

// mock getDb from lib/mongodb
const mockFindCalls: Array<{ filter: unknown; opts: unknown }> = [];

vi.mock("@/lib/mongodb", () => ({
  getDb: vi.fn(async () => ({
    collection: () => ({
      find: (filter: unknown, opts: unknown) => {
        mockFindCalls.push({ filter, opts });
        return {
          toArray: async () => [
            {
              _id: "1",
              teamName: "Southeast Team",
              nation: "Thailand",
              travelDate: "2026-06-20",
              sendingChurch: "Every Nation Makati",
              missioners: ["Alice", "Bob"],
            },
            {
              _id: "2",
              teamName: "Southwest Team",
              nation: "Philippines",
              travelDate: "2026-07-15",
              sendingChurch: "Every Nation Greenhills",
              missioners: [],
            },
          ],
        };
      },
    }),
  })),
}));

import { GET } from "@/app/api/teams/route";

beforeEach(() => {
  mockFindCalls.length = 0;
});

afterEach(() => {
  vi.resetAllMocks();
});

describe("GET /api/teams route", () => {
  test("returns normalized teams array without query", async () => {
    const req = new Request("http://localhost/api/teams");
    const res = (await GET(req as unknown as Request)) as Response;

    // The route returns a Response-like NextResponse; parse JSON
    const payload = await res.json();
    expect(payload).toHaveProperty("teams");
    expect(Array.isArray(payload.teams)).toBe(true);
    expect(payload.teams.length).toBe(2);

    const first = payload.teams[0];
    expect(first).toMatchObject({
      teamName: "Southeast Team",
      nation: "Thailand",
      travelDate: "2026-06-20",
      sendingChurch: "Every Nation Makati",
    });
    expect(Array.isArray(first.missioners)).toBe(true);
    expect(first.missioners).toEqual(["Alice", "Bob"]);
  });

  test("applies query filter when q param is present", async () => {
    const req = new Request("http://localhost/api/teams?q=south");
    const res = (await GET(req as unknown as Request)) as Response;
    const payload = await res.json();

    // ensure the mocked collection find was called with a case-insensitive regex filter
    expect(mockFindCalls.length).toBeGreaterThan(0);
    const recordedFilter = mockFindCalls[0].filter as Record<string, unknown>;
    expect(recordedFilter).toHaveProperty("teamName");
    const teamNameFilter = recordedFilter.teamName as Record<string, unknown> | undefined;
    expect(teamNameFilter).toBeDefined();
    expect(teamNameFilter?.["$options"]).toBe("i");

    expect(payload.teams.length).toBe(2);
  });
});
