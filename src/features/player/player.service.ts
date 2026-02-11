import { myFetch } from "@/lib/backend";
import myEnv from "@/lib/env";
import {
  serverPlayerToPlayer,
  serverPlayerDetailToPlayerDetail,
  type Player,
  type PlayerDetail,
  type ServerPlayer,
  type ServerPlayerDetail,
} from "./player.type";

export type PlayerUpsert = {
  teamId: number;
  firstName: string;
  lastName: string;
  number?: number | null;

  nationality?: string | null;
  role?: string | null;
  heightCm?: number | null;
  weightKg?: number | null;
  birthDate?: string | null;
};

export type PlayerPatch = Partial<PlayerUpsert>;

export class PlayerService {
  static async listByTeam(teamId: number): Promise<Player[]> {
    const rows = await myFetch<ServerPlayer[]>(
      `${myEnv.backendApiUrl}/players?team_id=${teamId}`,
    );
    return rows.map(serverPlayerToPlayer);
  }

  /** Scheda player */
  static async get(id: number): Promise<PlayerDetail> {
    const res = await myFetch<ServerPlayerDetail>(
      `${myEnv.backendApiUrl}/players/${id}`,
    );
    return serverPlayerDetailToPlayerDetail(res);
  }

  static async create({ data }: { data: PlayerUpsert }): Promise<Player> {
    const row = await myFetch<ServerPlayer>(`${myEnv.backendApiUrl}/players`, {
      method: "POST",
      body: JSON.stringify({
        team_id: data.teamId,
        first_name: data.firstName,
        last_name: data.lastName,
        number: data.number ?? null,

        nationality: data.nationality ?? null,
        role: data.role ?? null,
        height_cm: data.heightCm ?? null,
        weight_kg: data.weightKg ?? null,
        birth_date: data.birthDate ?? null,
      }),
    });

    return serverPlayerToPlayer(row);
  }

  /** Update (PATCH) */
  static async update(playerId: number, patch: PlayerPatch): Promise<Player> {
    const row = await myFetch<ServerPlayer>(
      `${myEnv.backendApiUrl}/players/${playerId}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          ...(patch.teamId !== undefined ? { team_id: patch.teamId } : {}),
          ...(patch.firstName !== undefined
            ? { first_name: patch.firstName }
            : {}),
          ...(patch.lastName !== undefined
            ? { last_name: patch.lastName }
            : {}),
          ...(patch.number !== undefined ? { number: patch.number } : {}),

          ...(patch.nationality !== undefined
            ? { nationality: patch.nationality }
            : {}),
          ...(patch.role !== undefined ? { role: patch.role } : {}),
          ...(patch.heightCm !== undefined
            ? { height_cm: patch.heightCm }
            : {}),
          ...(patch.weightKg !== undefined
            ? { weight_kg: patch.weightKg }
            : {}),
          ...(patch.birthDate !== undefined
            ? { birth_date: patch.birthDate }
            : {}),
        }),
      },
    );

    return serverPlayerToPlayer(row);
  }

  static async delete(id: number): Promise<void> {
    await myFetch<null>(`${myEnv.backendApiUrl}/players/${id}`, {
      method: "DELETE",
    });
  }

  static async uploadAvatar(playerId: number, file: File): Promise<Player> {
    const form = new FormData();
    form.append("file", file);

    const res = await fetch(
      `${myEnv.backendApiUrl}/players/${playerId}/avatar`,
      {
        method: "POST",
        body: form,
      },
    );

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(txt || "Upload avatar fallito");
    }

    const json = await res.json();
    return serverPlayerToPlayer(json.data as ServerPlayer);
  }
}
