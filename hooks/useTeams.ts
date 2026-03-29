"use client";

import { useState } from "react";

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
  // Database + auto-complete removed. Keep hook shape but return empty values
  // so callers don't need to change.
  const [groups] = useState<TeamGroup[] | null>(null);
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);

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
