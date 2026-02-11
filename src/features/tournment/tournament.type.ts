import {
  serverTeamToTeam,
  type ServerTeam,
  type Team,
} from "../team/team.type";

export type TournamentStatus = "draft" | "ongoing" | "completed";

// PARTICIPANTI (separati)

/** Lato server: riga/oggetto partecipante (come ritorna /tournaments/:id) */
export type ServerTournamentParticipant = {
  team_id: number;
  name?: string; // nel mio get ritorna anche nome (name)
  seed?: number | null;
  created_at?: string | null;
  team?: ServerTeam;
};

/** Lato client */
export type TournamentParticipant = {
  teamId: number;
  name?: string;
  seed: number | null;
  team?: Team;
};

// TOURNAMENT

export type Tournament = {
  id: number;
  name: string;
  startDate: string;
  status: TournamentStatus;
  winnerTeamId?: number | null;
  winnerName?: number | string | null;
  winnerTeamLogoUrl?: string | null;

  hasResults?: boolean;
  hasMatches?: boolean;

  participants?: TournamentParticipant[];
};

export type ServerTournament = {
  id: number;
  name: string;
  start_date: string;
  status: TournamentStatus;
  winner_team_id?: number | null;
  winner_name?: string | null;
  winner_team_logo_url?: string | null;

  has_results?: boolean | 0 | 1;
  has_matches?: boolean | 0 | 1;

  participants?: ServerTournamentParticipant[];
};

// MAP

export function serverTournamentToTournament(
  input: ServerTournament,
): Tournament {
  return {
    id: input.id,
    name: input.name,
    startDate: input.start_date,
    status: input.status === ("created" as any) ? "draft" : input.status,
    winnerTeamId: input.winner_team_id ?? null,
    winnerName: input.winner_name ?? null,
    winnerTeamLogoUrl: input.winner_team_logo_url ?? null,

    hasResults: Boolean((input as any).has_results),
    hasMatches: Boolean((input as any).has_matches),

    participants: input.participants
      ? input.participants.map((p) => ({
          teamId: p.team_id,
          name: p.name,
          seed: p.seed ?? null,
        }))
      : undefined,
  };
}

export function tournamentToServerTournament(
  input: Omit<Partial<Tournament>, "id">,
): Omit<Partial<ServerTournament>, "id"> {
  return {
    name: input.name,
    start_date: input.startDate,
    status: input.status,
    winner_team_id: input.winnerTeamId,
    winner_name:
      typeof input.winnerName === "string" ? input.winnerName : undefined,
    // participants: input.participants?.map(p => ({ team_id: p.teamId, seed: p.seed })),
  };
}

// Helper

export function serverParticipantsToParticipants(
  input: ServerTournamentParticipant[],
): TournamentParticipant[] {
  return (input ?? []).map((p) => ({
    teamId: p.team_id,
    name: p.name,
    seed: p.seed ?? null,
    team: p.team ? serverTeamToTeam(p.team) : undefined,
  }));
}
