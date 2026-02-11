import type { Team, ServerTeam } from "@/features/team/team.type";
import { serverTeamToTeam } from "@/features/team/team.type";

/** Stats reali */
export type PlayerStats = {
  matches: number;
  goals: number;
  assists: number;
};

export type Player = {
  id: number;
  teamId: number;
  firstName: string;
  lastName: string;
  fullName?: string | null;

  number?: number | null;
  avatarUrl?: string | null;

  nationality?: string | null;
  role?: string | null;
  heightCm?: number | null;
  weightKg?: number | null;
  birthDate?: string | null;

  /** stats dinamiche */
  stats?: PlayerStats | null;
};

export type ServerPlayer = {
  id: number;
  team_id: number;
  first_name: string;
  last_name: string;
  full_name?: string | null;

  number?: number | null;
  avatar_url?: string | null;

  nationality?: string | null;
  role?: string | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  birth_date?: string | null;

  /** opzionale: se il backend le mette direttamente dentro player */
  stats?: Partial<PlayerStats> | null;
};

export function serverPlayerToPlayer(p: ServerPlayer): Player {
  return {
    id: p.id,
    teamId: p.team_id,
    firstName: p.first_name,
    lastName: p.last_name,
    fullName: p.full_name ?? null,

    number: p.number ?? null,
    avatarUrl: p.avatar_url ?? null,

    nationality: p.nationality ?? null,
    role: p.role ?? null,
    heightCm: p.height_cm ?? null,
    weightKg: p.weight_kg ?? null,
    birthDate: p.birth_date ?? null,

    // se arrivano già nel player
    stats: p.stats
      ? {
          matches: Number(p.stats.matches ?? 0),
          goals: Number(p.stats.goals ?? 0),
          assists: Number(p.stats.assists ?? 0),
        }
      : null,
  };
}

export type ServerPlayerDetail = {
  player: ServerPlayer;
  team: ServerTeam;

  stats?: Partial<PlayerStats> | null;
};

export type PlayerDetail = {
  player: Player;
  team: Team;
};

export function serverPlayerDetailToPlayerDetail(
  input: ServerPlayerDetail,
): PlayerDetail {
  const basePlayer = serverPlayerToPlayer(input.player);

  // se player.stats non c’è, usa input.stats
  const fallbackStats =
    (!basePlayer.stats || basePlayer.stats == null) && input.stats
      ? {
          matches: Number(input.stats.matches ?? 0),
          goals: Number(input.stats.goals ?? 0),
          assists: Number(input.stats.assists ?? 0),
        }
      : (basePlayer.stats ?? null);

  return {
    player: {
      ...basePlayer,
      stats: fallbackStats,
    },
    team: serverTeamToTeam(input.team),
  };
}
