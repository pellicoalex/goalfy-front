export type ServerTeam = {
  id: number;
  name: string;

  logo?: string | null;
  logo_url?: string | null;
  image?: string | null;
  image_url?: string | null;
  created_at?: string | null;
};

export type Team = {
  id: number;
  name: string;
  logoUrl: string | null;
  createdAt?: string | null;
};

/**
 * Normalizzo qualsiasi campo logo in `logoUrl`
 */
export function serverTeamToTeam(input: ServerTeam): Team {
  return {
    id: input.id,
    name: input.name,
    logoUrl:
      input.logo_url ?? input.logo ?? input.image_url ?? input.image ?? null,
    createdAt: input.created_at ?? null,
  };
}
