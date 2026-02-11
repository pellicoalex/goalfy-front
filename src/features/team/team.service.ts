import { myFetch } from "@/lib/backend";
import myEnv from "@/lib/env";
import { serverTeamToTeam, type ServerTeam, type Team } from "./team.type";
import {
  serverPlayerToPlayer,
  type Player,
  type ServerPlayer,
} from "@/features/player/player.type";

export class TeamService {
  static async list(): Promise<Team[]> {
    const teams = await myFetch<ServerTeam[]>(`${myEnv.backendApiUrl}/teams`);
    return teams.map(serverTeamToTeam);
  }

  static async get(id: number): Promise<{ team: Team; players: Player[] }> {
    const serverTeam = await myFetch<ServerTeam>(
      `${myEnv.backendApiUrl}/teams/${id}`,
    );

    // 2) prendo i players dal loro endpoint
    const serverPlayers = await myFetch<ServerPlayer[]>(
      `${myEnv.backendApiUrl}/players?team_id=${id}`,
    );

    return {
      team: serverTeamToTeam(serverTeam),
      players: serverPlayers.map(serverPlayerToPlayer),
    };
  }

  static async ready(): Promise<Team[]> {
    const teams = await myFetch<ServerTeam[]>(
      `${myEnv.backendApiUrl}/teams/ready`,
    );
    return teams.map(serverTeamToTeam);
  }
  static async uploadLogo(teamId: number, file: File): Promise<Team> {
    const form = new FormData();
    form.append("file", file);

    const res = await fetch(`${myEnv.backendApiUrl}/teams/${teamId}/logo`, {
      method: "POST",
      body: form,
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(txt || "Upload logo fallito");
    }

    const json = await res.json();

    return serverTeamToTeam(json.data as ServerTeam);
  }

  static async create({ data }: { data: { name: string } }): Promise<Team> {
    const team = await myFetch<ServerTeam>(`${myEnv.backendApiUrl}/teams`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    return serverTeamToTeam(team);
  }

  static async update(
    teamId: number,
    data: { name?: string; logo_url?: string | null },
  ) {
    const row = await myFetch<ServerTeam>(
      `${myEnv.backendApiUrl}/teams/${teamId}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          ...(data.name !== undefined ? { name: data.name } : {}),
          ...(data.logo_url !== undefined ? { logo_url: data.logo_url } : {}),
        }),
      },
    );

    return serverTeamToTeam(row);
  }

  static async delete(id: number): Promise<void> {
    await myFetch<null>(`${myEnv.backendApiUrl}/teams/${id}`, {
      method: "DELETE",
    });
  }
}
