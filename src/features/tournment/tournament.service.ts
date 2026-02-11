import { myFetch } from "@/lib/backend";
import myEnv from "@/lib/env";
import {
  serverParticipantsToParticipants,
  serverTournamentToTournament,
  type ServerTournament,
  type ServerTournamentParticipant,
  type Tournament,
  type TournamentParticipant,
} from "./tournament.type";
import {
  serverMatchToMatch,
  type Match,
  type ServerMatch,
} from "../match/match.type";

export class TournamentService {
  static async list(): Promise<Tournament[]> {
    const t = await myFetch<ServerTournament[]>(
      `${myEnv.backendApiUrl}/tournaments`,
    );
    return t.map(serverTournamentToTournament);
  }

  static async create({
    data,
  }: {
    data: { name: string; startDate: string };
  }): Promise<Tournament> {
    const t = await myFetch<ServerTournament>(
      `${myEnv.backendApiUrl}/tournaments`,
      {
        method: "POST",
        body: JSON.stringify({ name: data.name, start_date: data.startDate }),
      },
    );
    return serverTournamentToTournament(t);
  }

  static async get(id: number): Promise<{
    tournament: Tournament;
    participants: { team_id: number; name: string }[];
  }> {
    const res = await myFetch<any>(`${myEnv.backendApiUrl}/tournaments/${id}`);
    return {
      tournament: serverTournamentToTournament(res.tournament),
      participants: res.participants,
    };
  }

  static async setParticipants({
    id,
    teamIds,
  }: {
    id: number;
    teamIds: number[];
  }): Promise<void> {
    await myFetch<null>(
      `${myEnv.backendApiUrl}/tournaments/${id}/participants`,
      {
        method: "POST",
        body: JSON.stringify({ team_ids: teamIds }),
      },
    );
  }

  static async generateBracket(id: number): Promise<void> {
    await myFetch<null>(
      `${myEnv.backendApiUrl}/tournaments/${id}/generate-bracket`,
      { method: "POST" },
    );
  }

  static async bracket(id: number): Promise<Match[]> {
    const rows = await myFetch<ServerMatch[]>(
      `${myEnv.backendApiUrl}/tournaments/${id}/bracket`,
    );
    return rows.map(serverMatchToMatch);
  }

  static async teamlist(id: number): Promise<TournamentParticipant[]> {
    const rows = await myFetch<ServerTournamentParticipant[]>(
      `${myEnv.backendApiUrl}/tournaments/${id}/participants`,
    );
    return serverParticipantsToParticipants(rows);
  }

  static async goalEvents(id: number): Promise<any[]> {
    const res = await myFetch<any>(
      `${myEnv.backendApiUrl}/tournaments/${id}/goal-events`,
      {
        method: "GET",
      },
    );

    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.payload)) return res.payload;
    if (Array.isArray(res?.data?.data)) return res.data.data;
    if (Array.isArray(res?.data?.payload)) return res.data.payload;

    return [];
  }

  static async players(id: number): Promise<any[]> {
    const res = await myFetch<any>(
      `${myEnv.backendApiUrl}/tournaments/${id}/players`,
      { method: "GET" },
    );

    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.payload)) return res.payload;
    if (Array.isArray(res?.data?.data)) return res.data.data;
    if (Array.isArray(res?.data?.payload)) return res.data.payload;

    return [];
  }

  /** true se il torneo ha già risultati (goal events) e match played mi servono entrambi */
  static async hasResults(id: number): Promise<boolean> {
    // 1) goal events
    const events = await TournamentService.goalEvents(id);
    if ((events?.length ?? 0) > 0) return true;

    // 2) match played / score
    const matches = await TournamentService.bracket(id);
    return (matches ?? []).some((m: any) => {
      const st = String(m.status ?? "").toLowerCase();
      return (
        st === "played" ||
        m.homeScore != null ||
        m.awayScore != null ||
        m.home_score != null ||
        m.away_score != null
      );
    });
  }

  static async assertNoResults(id: number): Promise<void> {
    const has = await TournamentService.hasResults(id);
    if (has) {
      throw new Error(
        "Operazione non consentita: il torneo contiene già risultati.",
      );
    }
  }

  static async update({
    id,
    data,
  }: {
    id: number;
    data: { name?: string; startDate?: string; status?: string };
  }): Promise<Tournament> {
    const t = await myFetch<ServerTournament>(
      `${myEnv.backendApiUrl}/tournaments/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          ...(data.name !== undefined ? { name: data.name } : {}),
          ...(data.startDate !== undefined
            ? { start_date: data.startDate }
            : {}),
          ...(data.status !== undefined ? { status: data.status } : {}),
        }),
      },
    );
    return serverTournamentToTournament(t);
  }

  static async remove(id: number): Promise<void> {
    await myFetch<null>(`${myEnv.backendApiUrl}/tournaments/${id}`, {
      method: "DELETE",
    });
  }

  static async updateMatches({
    id,
    matches,
  }: {
    id: number;
    matches: { id: number; teamAId?: number | null; teamBId?: number | null }[];
  }): Promise<void> {
    await myFetch<null>(`${myEnv.backendApiUrl}/tournaments/${id}/matches`, {
      method: "PUT",
      body: JSON.stringify({
        matches: matches.map((match) => {
          return {
            id: match.id,
            team_a_id: match.teamAId,
            team_b_id: match.teamBId,
          };
        }),
      }),
    });
  }
}
