"use client";

import { useEffect, useState } from "react";

type MissionerItem = { id: string; name: string; nation?: string; travelDate?: string; sendingChurch?: string };
type TeamGroup = {
  teamId: string;
  team: string;
  nation?: string;
  travelDate?: string;
  sendingChurch?: string;
  missioners: MissionerItem[];
};

export function useTeams() {
  const [groups, setGroups] = useState<TeamGroup[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/teams")
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        type TeamDoc = { teamId?: string; teamName?: string; nation?: string; travelDate?: string; sendingChurch?: string; missioners?: unknown[] };
        const teams = Array.isArray(json.teams) ? (json.teams as TeamDoc[]) : [];
        const normalized = teams.map((t) => ({
          teamId: String(t.teamId ?? t.teamName ?? ""),
          team: String(t.teamName ?? ""),
          nation: t.nation,
          travelDate: t.travelDate,
          sendingChurch: t.sendingChurch,
          missioners: (Array.isArray(t.missioners) ? t.missioners : []).map((m: unknown, i: number) => ({ id: `${String(t.teamId ?? t.teamName ?? "")}::${i}`, name: String(m) })),
        }));
        setGroups(normalized);
      })
      .catch(() => {
        if (cancelled) return;
        setError("Unable to load teams");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { groups, loading, error } as const;
}

export type Suggestion = {
  id: string;
  label: string;
  type: "team" | "missioner";
  team?: string;
  nation?: string;
  travelDate?: string;
  sendingChurch?: string;
};

export function useTeamsWithSuggestions() {
  const res = useTeams();
  const suggestions = (res.groups ?? []).flatMap((g) => {
    const teamSuggestion: Suggestion = { id: `team::${g.teamId}`, label: `${g.team}`, type: "team", team: g.team, nation: g.nation, travelDate: g.travelDate, sendingChurch: g.sendingChurch };
    const missionerSuggestions: Suggestion[] = g.missioners.map((m) => ({ id: `m::${m.id}`, label: m.name, type: "missioner", team: g.team, nation: m.nation ?? g.nation, travelDate: m.travelDate ?? g.travelDate, sendingChurch: m.sendingChurch ?? g.sendingChurch }));
    return [teamSuggestion, ...missionerSuggestions];
  });

  return { ...res, suggestions } as const;
}
