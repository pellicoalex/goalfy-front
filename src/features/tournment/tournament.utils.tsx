import type {
  TournamentPlayer,
  GoalEvent,
  WinnerStep,
} from "@/pages/TournamentHistoryPage";
import type { Match } from "../match/match.type";
import type { Tournament, TournamentStatus } from "./tournament.type";
import {
  Badge,
  CalendarClock,
  CheckCircle2,
  Crown,
  FlagTriangleRight,
  PlayCircle,
  Swords,
} from "lucide-react";

function num(v: any): number | null {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * Normalizza un match supportando sia camelCase (frontend types)
 * sia snake_case (backend /bracket: m.*).
 */
function mget(match: any) {
  return {
    id: num(match?.id) ?? 0,
    round: (num(match?.round) ?? 0) as 1 | 2 | 3,

    nextMatchId: num(match?.nextMatchId ?? match?.next_match_id),
    winnerTeamId: num(match?.winnerTeamId ?? match?.winner_team_id),

    teamAId: num(match?.teamAId ?? match?.team_a_id),
    teamBId: num(match?.teamBId ?? match?.team_b_id),

    teamAName:
      match?.teamAName ??
      match?.team_a_name ??
      match?.teamA ??
      match?.team_a ??
      null,

    teamBName:
      match?.teamBName ??
      match?.team_b_name ??
      match?.teamB ??
      match?.team_b ??
      null,

    scoreA: num(match?.scoreA ?? match?.score_a),
    scoreB: num(match?.scoreB ?? match?.score_b),

    teamALogoUrl: match?.teamALogoUrl ?? match?.team_a_logo_url ?? null,
    teamBLogoUrl: match?.teamBLogoUrl ?? match?.team_b_logo_url ?? null,
  };
}

export function roundLabel(r: 1 | 2 | 3): WinnerStep["label"] {
  if (r === 1) return "Quarti";
  if (r === 2) return "Semifinale";
  return "Finale";
}

export function getOpponentAndScores(
  match: Match,
  winnerTeamId: number,
): Omit<WinnerStep, "round" | "label" | "matchId"> {
  const m = mget(match as any);

  const winnerIsA = m.teamAId === winnerTeamId;

  const opponentName = winnerIsA ? m.teamBName : m.teamAName;

  const scoreFor = winnerIsA ? m.scoreA : m.scoreB;
  const scoreAgainst = winnerIsA ? m.scoreB : m.scoreA;

  return { opponentName, scoreFor, scoreAgainst };
}

export function computeWinnerPath(
  matches: Match[],
  winnerTeamId: number,
): WinnerStep[] {
  const finalMatch = matches.find((m) => mget(m as any).round === 3) ?? null;
  if (!finalMatch) return [];

  const f = mget(finalMatch as any);

  const semiMatch =
    matches.find((m) => {
      const x = mget(m as any);
      return (
        x.round === 2 &&
        x.nextMatchId === f.id &&
        x.winnerTeamId === winnerTeamId
      );
    }) ?? null;

  const s = semiMatch ? mget(semiMatch as any) : null;

  const quarterMatch = semiMatch
    ? (matches.find((m) => {
        const x = mget(m as any);
        return (
          x.round === 1 &&
          x.nextMatchId === (s?.id ?? 0) &&
          x.winnerTeamId === winnerTeamId
        );
      }) ?? null)
    : null;

  const steps: WinnerStep[] = [];

  if (quarterMatch) {
    steps.push({
      round: 1,
      label: roundLabel(1),
      matchId: mget(quarterMatch as any).id,
      ...getOpponentAndScores(quarterMatch, winnerTeamId),
    });
  }

  if (semiMatch) {
    steps.push({
      round: 2,
      label: roundLabel(2),
      matchId: mget(semiMatch as any).id,
      ...getOpponentAndScores(semiMatch, winnerTeamId),
    });
  }

  steps.push({
    round: 3,
    label: roundLabel(3),
    matchId: f.id,
    ...getOpponentAndScores(finalMatch, winnerTeamId),
  });

  return steps;
}

export function statusBadge(status: Tournament["status"]) {
  if (status === "completed") {
    return <Crown className="h-5 w-5 text-emerald-600" />;
  }

  if (status === "ongoing") {
    return (
      <span className="text-xs font-semibold text-amber-700">In corso</span>
    );
  }

  return (
    <span className="text-xs font-semibold text-sky-700">In programma</span>
  );
}

export function stepIcon(round: 1 | 2 | 3) {
  if (round === 1) return <FlagTriangleRight className="h-4 w-4" />;
  if (round === 2) return <Swords className="h-4 w-4" />;
  return <Crown className="h-4 w-4" />;
}

export function fullName(p: Pick<TournamentPlayer, "firstName" | "lastName">) {
  return `${(p.firstName ?? "").trim()} ${(p.lastName ?? "").trim()}`.trim();
}

// random “stabile” per torneo
export function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickRandomStable<T>(arr: T[], seed: number): T | null {
  if (!arr.length) return null;
  const rnd = mulberry32(seed)();
  return arr[Math.floor(rnd * arr.length)] ?? null;
}

export function groupGoalsByMatch(goals: GoalEvent[]) {
  const map = new Map<number, GoalEvent[]>();

  for (const g of goals) {
    const mid = Number((g as any).matchId ?? (g as any).match_id ?? 0);
    if (!mid) continue;
    const list = map.get(mid) ?? [];
    list.push(g);
    map.set(mid, list);
  }

  for (const [k, v] of map.entries()) {
    v.sort((a: any, b: any) => Number(a.id ?? 0) - Number(b.id ?? 0));
    map.set(k, v);
  }

  return map;
}

export function computeTopScorer(goals: GoalEvent[]) {
  const counts = new Map<
    number,
    { playerId: number; name: string; goals: number }
  >();

  for (const g of goals) {
    const pid = Number(
      (g as any).scorerPlayerId ?? (g as any).scorer_player_id ?? 0,
    );
    if (!pid) continue;

    const name =
      ((g as any).scorerName ??
        (g as any).scorer_name ??
        `${(g as any).scorer_first_name ?? ""} ${(g as any).scorer_last_name ?? ""}`.trim()) ||
      `Player #${pid}`;

    const cur = counts.get(pid) ?? { playerId: pid, name, goals: 0 };
    cur.goals += 1;

    // se prima era un placeholder, aggiorna col nome migliore
    if (!cur.name || cur.name.startsWith("Player #")) {
      cur.name = name;
    }

    counts.set(pid, cur);
  }

  const list = Array.from(counts.values()).sort((a, b) => b.goals - a.goals);
  return list[0] ?? null;
}

export function getTeamPresentation(match: Match, teamId: number) {
  const m = mget(match as any);
  const isA = m.teamAId === teamId;

  return {
    name: isA ? (m.teamAName ?? "—") : (m.teamBName ?? "—"),
    logoUrl: isA ? m.teamALogoUrl : m.teamBLogoUrl,
    score: isA ? m.scoreA : m.scoreB,
  };
}

export function normalizeStatus(
  s: TournamentStatus,
): "created" | "ongoing" | "completed" | "other" {
  const v = String(s ?? "").toLowerCase();
  if (v === "created" || v === "draft") return "created";
  if (v === "ongoing") return "ongoing";
  if (v === "completed") return "completed";
  return "other";
}

export function StatusBadge({ status }: { status: TournamentStatus }) {
  const s = normalizeStatus(status);

  if (s === "completed") {
    return (
      <Badge className="gap-1 text-emerald-700 border">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Concluso
      </Badge>
    );
  }

  if (s === "ongoing") {
    return (
      <Badge className="gap-1 text-amber-700 border">
        <PlayCircle className="h-3.5 w-3.5" />
        In corso
      </Badge>
    );
  }

  return (
    <Badge className="gap-1  text-sky-700 border">
      <CalendarClock className="h-3.5 w-3.5" />
      In programma
    </Badge>
  );
}
