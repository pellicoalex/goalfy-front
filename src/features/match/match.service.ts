import { myFetch } from "@/lib/backend";
import myEnv from "@/lib/env";

// stats reali (payload PATCH)
export type ParticipationPayload = {
  player_id: number;
  team_id: number;
};

export type GoalEventPayload = {
  team_id: number;
  scorer_player_id: number;
  assist_player_id?: number | null;
  minute?: number | null;
};

// GET /goal-events (ci torna più roba)
export type GoalEvent = {
  id?: number;
  match_id?: number;
  matchId?: number;

  team_id?: number;
  teamId?: number;

  scorer_player_id?: number;
  scorerPlayerId?: number;

  assist_player_id?: number | null;
  assistPlayerId?: number | null;

  minute?: number | null;

  // opzionali se fai join lato backend
  scorer_name?: string;
  scorerName?: string;
  assist_name?: string;
  assistName?: string;

  scorer_first_name?: string;
  scorer_last_name?: string;
  assist_first_name?: string;
  assist_last_name?: string;

  scorer_avatar_url?: string | null;
  assist_avatar_url?: string | null;
};

export class MatchService {
  static async setResult({
    id,
    scoreA,
    scoreB,
    participations,
    goalEvents,
  }: {
    id: number;
    scoreA: number;
    scoreB: number;
    participations?: ParticipationPayload[];
    goalEvents?: GoalEventPayload[];
  }): Promise<void> {
    const body: any = {
      scoreA,
      scoreB,
      score_a: scoreA,
      score_b: scoreB,
    };

    if (Array.isArray(participations) && participations.length > 0) {
      body.participations = participations;
      body.match_player_participations = participations;
      body.player_participations = participations;
    }

    if (Array.isArray(goalEvents) && goalEvents.length > 0) {
      body.goalEvents = goalEvents;
      body.goal_events = goalEvents;
      body.match_goal_events = goalEvents;
      body.goals = goalEvents;
    }

    await myFetch<null>(`${myEnv.backendApiUrl}/matches/${id}/result`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  static async getGoalEvents(
    id: number,
    signal?: AbortSignal,
  ): Promise<GoalEvent[]> {
    const res = await myFetch<any>(
      `${myEnv.backendApiUrl}/matches/${id}/goal-events`,
      { method: "GET", signal },
    );

    // casi più comuni
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.payload)) return res.payload;

    // annidamenti
    if (Array.isArray(res?.data?.data)) return res.data.data;
    if (Array.isArray(res?.data?.payload)) return res.data.payload;

    // { goalEvents: [...] } / { goal_events: [...] }
    if (Array.isArray(res?.goalEvents)) return res.goalEvents;
    if (Array.isArray(res?.goal_events)) return res.goal_events;

    console.log("[getGoalEvents] shape unexpected:", res);
    return [];
  }
}
