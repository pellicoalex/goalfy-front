export type MatchStatus = "waiting" | "scheduled" | "played";

export type Match = {
  id: number;
  tournamentId: number;
  round: 1 | 2 | 3;
  matchNumber: number;
  status: MatchStatus;

  teamAId?: number | null;
  teamBId?: number | null;
  teamAName?: string | null;
  teamBName?: string | null;

  teamALogoUrl?: string | null;
  teamBLogoUrl?: string | null;

  scoreA?: number | null;
  scoreB?: number | null;

  winnerTeamId?: number | null;
  winnerName?: string | null;

  nextMatchId?: number | null;
  nextSlot?: "A" | "B" | null;
};

export type ServerMatch = {
  id: number;
  tournament_id: number;
  round: 1 | 2 | 3;
  match_number: number;
  status: MatchStatus;

  team_a_id?: number | null;
  team_b_id?: number | null;
  team_a_name?: string | null;
  team_b_name?: string | null;

  team_a_logo_url?: string | null;
  team_b_logo_url?: string | null;

  score_a?: number | null;
  score_b?: number | null;

  winner_team_id?: number | null;
  winner_name?: string | null;

  next_match_id?: number | null;
  next_slot?: "A" | "B" | null;
};

export function serverMatchToMatch(input: ServerMatch): Match {
  return {
    id: input.id,
    tournamentId: input.tournament_id,
    round: input.round,
    matchNumber: input.match_number,
    status: input.status,

    teamAId: input.team_a_id ?? null,
    teamBId: input.team_b_id ?? null,
    teamAName: input.team_a_name ?? null,
    teamBName: input.team_b_name ?? null,

    teamALogoUrl: input.team_a_logo_url ?? null,
    teamBLogoUrl: input.team_b_logo_url ?? null,

    scoreA: input.score_a ?? null,
    scoreB: input.score_b ?? null,

    winnerTeamId: input.winner_team_id ?? null,
    winnerName: input.winner_name ?? null,

    nextMatchId: input.next_match_id ?? null,
    nextSlot: input.next_slot ?? null,
  };
}
