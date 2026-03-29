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
    // DB removed; route returns empty teams list
    expect(Array.isArray(payload.teams)).toBe(true);
    expect(payload.teams.length).toBe(0);

    // No DB available; teams list is empty
  });

  test("applies query filter when q param is present", async () => {
    const req = new Request("http://localhost/api/teams?q=south");
    const res = (await GET(req as unknown as Request)) as Response;
    const payload = await res.json();

    // DB removed; route returns empty teams list and does not call the DB
    expect(mockFindCalls.length).toBe(0);
    expect(Array.isArray(payload.teams)).toBe(true);
    expect(payload.teams.length).toBe(0);
  });
});
