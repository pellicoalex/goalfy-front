import { useMemo } from "react";
import { Loader2, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

import type {
  GoalEvent,
  TournamentPlayer,
} from "@/pages/TournamentHistoryPage";
import type { Match } from "../match/match.type";
import type { Tournament } from "./tournament.type";

import {
  computeTopScorer,
  computeWinnerPath,
  fullName,
  getTeamPresentation,
  groupGoalsByMatch,
  pickRandomStable,
  stepIcon,
} from "./tournament.utils";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { backendAssetUrl } from "@/lib/media";

//helpers

function safe2(s?: string | null) {
  const t = (s ?? "").trim();
  return t ? t.slice(0, 2).toUpperCase() : "PL";
}

function logoFromMatch(match: any | null, teamId: number | null) {
  if (!match || !teamId) return null;

  const teamAId = Number(match.teamAId ?? match.team_a_id ?? 0);
  const teamBId = Number(match.teamBId ?? match.team_b_id ?? 0);

  const raw =
    teamAId === teamId
      ? (match.teamALogoUrl ?? match.team_a_logo_url ?? null)
      : teamBId === teamId
        ? (match.teamBLogoUrl ?? match.team_b_logo_url ?? null)
        : null;

  return raw ? backendAssetUrl(raw) : null;
}

function playerAvatar(p: TournamentPlayer | null) {
  if (!p) return null;
  const raw = (p as any).avatarUrl ?? (p as any).avatar_url ?? null;
  return raw ? backendAssetUrl(raw) : null;
}

function playerById(players: TournamentPlayer[], id: number) {
  return players.find((p) => Number((p as any).id) === Number(id)) ?? null;
}

function sortGoalsByMinute(goals: GoalEvent[]) {
  return goals.slice().sort((a, b) => {
    const am = Number((a as any).minute ?? 0);
    const bm = Number((b as any).minute ?? 0);
    return am - bm;
  });
}

/**
 * Estrae goal events da un match in modo robusto (snake/camel).
 */
function extractGoalEventsFromMatch(m: any): GoalEvent[] {
  const raw =
    (Array.isArray(m?.goal_events) && m.goal_events) ||
    (Array.isArray(m?.goalEvents) && m.goalEvents) ||
    (Array.isArray(m?.match_goal_events) && m.match_goal_events) ||
    (Array.isArray(m?.goals) && m.goals) ||
    [];
  return raw as GoalEvent[];
}

//componente principale

export function WinnerStory(props: {
  tournament: Tournament;
  matches: Match[];
  goals: GoalEvent[];
  players: TournamentPlayer[];
  loading: boolean;
}) {
  const finalMatch = useMemo(
    () => props.matches.find((m) => (m as any).round === 3) ?? null,
    [props.matches],
  );

  const winnerTeamId = useMemo(() => {
    const tWinner = (props.tournament as any).winnerTeamId ?? null;
    const mWinner = (finalMatch as any)?.winnerTeamId ?? null;
    const id = tWinner ?? mWinner ?? null;
    return id != null ? Number(id) : null;
  }, [props.tournament, finalMatch]);

  const steps = useMemo(() => {
    if (!winnerTeamId) return [];
    return computeWinnerPath(props.matches, winnerTeamId);
  }, [props.matches, winnerTeamId]);

  /**
    goal events persistiti dentro i match.
   */
  const goalsFromMatches = useMemo(() => {
    const all: GoalEvent[] = [];

    for (const m of props.matches ?? []) {
      const mid = Number((m as any).id ?? 0);
      const evs = extractGoalEventsFromMatch(m);

      for (const e of evs) {
        const scorerNameFromParts =
          `${(e as any).scorer_first_name ?? ""} ${(e as any).scorer_last_name ?? ""}`.trim() ||
          `${(e as any).scorerFirstName ?? ""} ${(e as any).scorerLastName ?? ""}`.trim();

        const assistNameFromParts =
          `${(e as any).assist_first_name ?? ""} ${(e as any).assist_last_name ?? ""}`.trim() ||
          `${(e as any).assistFirstName ?? ""} ${(e as any).assistLastName ?? ""}`.trim();

        all.push({
          ...(e as any),

          // normalizziamo chiavi principali
          matchId: (e as any).matchId ?? (e as any).match_id ?? mid,
          teamId: (e as any).teamId ?? (e as any).team_id ?? null,
          scorerPlayerId:
            (e as any).scorerPlayerId ?? (e as any).scorer_player_id ?? null,
          assistPlayerId:
            (e as any).assistPlayerId ?? (e as any).assist_player_id ?? null,
          minute: (e as any).minute ?? null,

          // nomi (se backend fa join, meglio)
          scorerName:
            ((e as any).scorerName ??
              (e as any).scorer_name ??
              scorerNameFromParts) ||
            undefined,

          assistName:
            ((e as any).assistName ??
              (e as any).assist_name ??
              assistNameFromParts) ||
            undefined,

          //  avatar opzionali da backend (se li mandi nei goal_events)
          scorerAvatarUrl:
            (e as any).scorerAvatarUrl ??
            (e as any).scorer_avatar_url ??
            undefined,
          assistAvatarUrl:
            (e as any).assistAvatarUrl ??
            (e as any).assist_avatar_url ??
            undefined,
        } as any);
      }
    }

    return all;
  }, [props.matches]);

  const goalsByMatch = useMemo(
    () => groupGoalsByMatch(goalsFromMatches),
    [goalsFromMatches],
  );

  const topScorer = useMemo(
    () => computeTopScorer(goalsFromMatches),
    [goalsFromMatches],
  );

  const topScorerPlayer = useMemo(() => {
    const pid = Number((topScorer as any)?.playerId ?? 0);
    if (!pid) return null;
    return playerById(props.players, pid);
  }, [topScorer, props.players]);

  const mvpRandom = useMemo(() => {
    const seed = Number((props.tournament as any).id ?? 1) * 99991;
    return pickRandomStable(props.players, seed);
  }, [props.players, (props.tournament as any).id]);

  const bestGoalkeeper = useMemo(() => {
    const gks = props.players.filter(
      (p) => ((p.role ?? "") as string).toUpperCase() === "GOALKEEPER",
    );
    const seed = Number((props.tournament as any).id ?? 1) * 77777 + 11;
    return pickRandomStable(gks, seed);
  }, [props.players, (props.tournament as any).id]);

  if (!winnerTeamId) {
    return (
      <p className="text-sm text-muted-foreground">
        Vincitore non disponibile.
      </p>
    );
  }

  if (steps.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Percorso non disponibile.</p>
    );
  }

  return (
    <div className="space-y-5">
      {/* PREMI */}
      <div className="grid gap-3 sm:grid-cols-3">
        {/* CAPOCANNONIERE */}
        <div className="rounded-2xl border bg-card/80 p-3 ring-1 ring-slate-200/60">
          <p className="text-xs font-extrabold tracking-wide text-foreground/80">
            CAPOCANNONIERE
          </p>

          <div className="mt-2 flex items-center gap-3">
            <Avatar className="h-10 w-10 ring-1 ring-slate-200">
              <AvatarImage src={playerAvatar(topScorerPlayer) ?? undefined} />
              <AvatarFallback className="text-[11px] font-black text-foreground/80">
                {safe2((topScorer as any)?.name ?? null)}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-black truncate text-primary dark:text-white">
                {topScorer ? (topScorer as any).name : "—"}
              </p>
              <p className="text-xs text-foreground/80 truncate">
                Squadra:{" "}
                <span className="font-semibold">
                  {(topScorerPlayer as any)?.teamName ?? "—"}
                </span>
              </p>
            </div>

            <div className="rounded-xl border bg-card px-2 py-1">
              <p className="text-[10px] font-extrabold text-foreground/80">
                GOL
              </p>
              <p className="text-sm font-black text-foreground/80 tabular-nums">
                {(topScorer as any)?.goals ?? 0}
              </p>
            </div>
          </div>
        </div>

        {/* MVP */}
        <div className="rounded-2xl border bg-card/80 p-3 ring-1 ring-slate-200/60">
          <p className="text-xs font-extrabold tracking-wide text-foreground/80">
            MIGLIOR GIOCATORE
          </p>

          <div className="mt-2 flex items-center gap-3">
            <Avatar className="h-10 w-10 ring-1 ring-slate-200">
              <AvatarImage src={playerAvatar(mvpRandom) ?? undefined} />
              <AvatarFallback className="text-[11px] font-black text-foreground/80">
                {safe2(mvpRandom ? fullName(mvpRandom) : null)}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0">
              <p className="text-sm font-black truncate text-primary dark:text-white">
                {mvpRandom ? fullName(mvpRandom) : "—"}
              </p>
              <p className="text-xs text-foreground/80 truncate">
                Squadra:{" "}
                <span className="font-semibold">
                  {(mvpRandom as any)?.teamName ?? "—"}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* GK */}
        <div className="rounded-2xl border bg-card/80 p-3 ring-1 ring-slate-200/60">
          <p className="text-xs font-extrabold tracking-wide text-foreground/80">
            MIGLIOR PORTIERE
          </p>

          <div className="mt-2 flex items-center gap-3">
            <Avatar className="h-10 w-10 ring-1 ring-slate-200">
              <AvatarImage src={playerAvatar(bestGoalkeeper) ?? undefined} />
              <AvatarFallback className="text-[11px] font-black text-foreground/80">
                {safe2(bestGoalkeeper ? fullName(bestGoalkeeper) : null)}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0">
              <p className="text-sm font-black truncate text-primary dark:text-white">
                {bestGoalkeeper ? fullName(bestGoalkeeper) : "—"}
              </p>
              <p className="text-xs text-foreground/80 truncate">
                Squadra:{" "}
                <span className="font-semibold">
                  {(bestGoalkeeper as any)?.teamName ?? "—"}
                </span>
              </p>
            </div>

            <div className="inline-flex items-center rounded-full border bg-card px-2 py-1">
              <span className="text-[10px] font-extrabold text-foreground">
                GK
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* MATCH DEL VINCITORE */}
      <div className="relative">
        <div className="hidden sm:block absolute left-[14px] top-2 bottom-2 w-px bg-card" />

        <div className="space-y-3">
          {props.loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Caricamento marcatori e premi...
            </div>
          ) : null}

          {steps.map((s) => {
            const match =
              props.matches.find(
                (m) => Number((m as any).id) === Number(s.matchId),
              ) ?? null;

            const isFinal = s.round === 3;

            const matchGoalsRaw = goalsByMatch.get(s.matchId) ?? [];
            const matchGoals = sortGoalsByMinute(matchGoalsRaw);

            const winnerTeamGoals = matchGoals.filter(
              (g) => Number((g as any).teamId) === Number(winnerTeamId),
            );
            const oppGoals = matchGoals.filter(
              (g) => Number((g as any).teamId) !== Number(winnerTeamId),
            );

            const winnerTeam = match
              ? getTeamPresentation(match, winnerTeamId)
              : null;

            const teamAId = Number(
              (match as any)?.teamAId ?? (match as any)?.team_a_id ?? 0,
            );
            const teamBId = Number(
              (match as any)?.teamBId ?? (match as any)?.team_b_id ?? 0,
            );

            const opponentTeamId =
              teamAId === winnerTeamId
                ? teamBId
                : teamBId === winnerTeamId
                  ? teamAId
                  : null;

            const opponentTeam =
              match && opponentTeamId
                ? getTeamPresentation(match, opponentTeamId)
                : null;

            const winnerLogo = logoFromMatch(match as any, winnerTeamId);
            const oppLogo = logoFromMatch(match as any, opponentTeamId ?? null);

            return (
              <div
                key={s.matchId}
                className={cn(
                  "rounded-2xl border bg-card/80 p-3 ring-1 ring-slate-200/60",
                  isFinal && "border-emerald-500/40 bg-emerald-500/5",
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "mt-0.5 h-7 w-7 rounded-full grid place-items-center shrink-0",
                      isFinal ? "bg-emerald-600/15" : "bg-sky-500/15",
                    )}
                    style={{
                      color: isFinal ? "rgb(4 120 87)" : "text-primary",
                      border: "1px solid rgba(43,84,146,0.18)",
                    }}
                  >
                    {stepIcon(s.round)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-extrabold text-primary dark:text-white">
                          {s.label}
                        </p>

                        <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <Avatar className="h-7 w-7 ring-1 ring-slate-200">
                              <AvatarImage src={winnerLogo ?? undefined} />
                              <AvatarFallback className="text-[10px] font-black text-foreground/80">
                                {safe2((winnerTeam as any)?.name ?? null)}
                              </AvatarFallback>
                            </Avatar>
                            <p className="text-xs font-extrabold text-foreground/90 truncate">
                              {(winnerTeam as any)?.name ?? "Vincitore"}
                            </p>
                          </div>

                          <div className="shrink-0 text-base tabular-nums font-black text-foreground/90">
                            {s.scoreFor ?? "-"}{" "}
                            <span className="text-slate-300 mx-1">:</span>{" "}
                            {s.scoreAgainst ?? "-"}
                          </div>

                          <div className="flex items-center gap-2 min-w-0 justify-end">
                            <p className="text-xs font-extrabold text-foreground/90 truncate text-right">
                              {(opponentTeam as any)?.name ??
                                (s as any).opponentName ??
                                "TBD"}
                            </p>
                            <Avatar className="h-7 w-7 ring-1 ring-slate-200">
                              <AvatarImage src={oppLogo ?? undefined} />
                              <AvatarFallback className="text-[10px] font-black text-foreground/80">
                                {safe2((opponentTeam as any)?.name ?? null)}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                        </div>
                      </div>

                      {isFinal ? (
                        <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1">
                          <Trophy className="h-4 w-4 text-primary dark:text-white" />
                          <span className="text-xs font-extrabold text-foreground/80">
                            Campione
                          </span>
                        </div>
                      ) : null}
                    </div>

                    {/* MARCATORI */}
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <div className="rounded-xl border bg-card p-2">
                        <p className="text-[11px] font-extrabold text-foreground/70">
                          Marcatori {(winnerTeam as any)?.name ?? "Vincitore"}
                        </p>

                        {winnerTeamGoals.length ? (
                          <ul className="mt-2 space-y-2">
                            {winnerTeamGoals.map((g, idx) => {
                              const scorerId = Number(
                                (g as any).scorerPlayerId ?? 0,
                              );
                              const p = scorerId
                                ? playerById(props.players, scorerId)
                                : null;

                              const key =
                                (g as any).id ??
                                `${s.matchId}-${scorerId}-${(g as any).minute ?? "x"}-${idx}`;

                              const scorerName =
                                (g as any).scorerName ||
                                `${(g as any).scorer_first_name ?? ""} ${(g as any).scorer_last_name ?? ""}`.trim() ||
                                (p ? fullName(p as any) : "") ||
                                (scorerId ? `Player #${scorerId}` : "—");

                              const assistName =
                                (g as any).assistName ||
                                `${(g as any).assist_first_name ?? ""} ${(g as any).assist_last_name ?? ""}`.trim() ||
                                undefined;

                              const avatarFromEvent =
                                (g as any).scorerAvatarUrl ??
                                (g as any).scorer_avatar_url ??
                                null;

                              return (
                                <li
                                  key={key}
                                  className="text-xs text-foreground/80 flex items-center gap-2"
                                >
                                  <Avatar className="h-6 w-6 ring-1 ring-slate-200">
                                    <AvatarImage
                                      src={
                                        playerAvatar(p) ??
                                        (avatarFromEvent
                                          ? backendAssetUrl(avatarFromEvent)
                                          : undefined)
                                      }
                                    />
                                    <AvatarFallback className="text-[10px] font-black text-foreground/80">
                                      {safe2(scorerName)}
                                    </AvatarFallback>
                                  </Avatar>

                                  <div className="min-w-0">
                                    <span className="font-semibold">
                                      {scorerName}
                                    </span>
                                    {assistName ? (
                                      <span className="text-foreground/80">
                                        {" "}
                                        • assist {assistName}
                                      </span>
                                    ) : null}
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        ) : (
                          <p className="mt-2 text-xs text-slate-400">
                            Nessun gol
                          </p>
                        )}
                      </div>

                      <div className="rounded-xl border bg-card p-2">
                        <p className="text-[11px] font-extrabold text-foreground/70">
                          Marcatori{" "}
                          {(opponentTeam as any)?.name ?? "Avversario"}
                        </p>

                        {oppGoals.length ? (
                          <ul className="mt-2 space-y-2">
                            {oppGoals.map((g, idx) => {
                              const scorerId = Number(
                                (g as any).scorerPlayerId ?? 0,
                              );
                              const p = scorerId
                                ? playerById(props.players, scorerId)
                                : null;

                              const key =
                                (g as any).id ??
                                `${s.matchId}-${scorerId}-${(g as any).minute ?? "x"}-${idx}`;

                              const scorerName =
                                (g as any).scorerName ||
                                `${(g as any).scorer_first_name ?? ""} ${(g as any).scorer_last_name ?? ""}`.trim() ||
                                (p ? fullName(p as any) : "") ||
                                (scorerId ? `Player #${scorerId}` : "—");

                              const assistName =
                                (g as any).assistName ||
                                `${(g as any).assist_first_name ?? ""} ${(g as any).assist_last_name ?? ""}`.trim() ||
                                undefined;

                              const avatarFromEvent =
                                (g as any).scorerAvatarUrl ??
                                (g as any).scorer_avatar_url ??
                                null;

                              return (
                                <li
                                  key={key}
                                  className="text-xs text-foreground/80 flex items-center gap-2"
                                >
                                  <Avatar className="h-6 w-6 ring-1 ring-slate-200">
                                    <AvatarImage
                                      src={
                                        playerAvatar(p) ??
                                        (avatarFromEvent
                                          ? backendAssetUrl(avatarFromEvent)
                                          : undefined)
                                      }
                                    />
                                    <AvatarFallback className="text-[10px] font-black text-foreground/70">
                                      {safe2(scorerName)}
                                    </AvatarFallback>
                                  </Avatar>

                                  <div className="min-w-0">
                                    <span className="font-semibold">
                                      {scorerName}
                                    </span>
                                    {assistName ? (
                                      <span className="text-foreground/70">
                                        {" "}
                                        • assist {assistName}
                                      </span>
                                    ) : null}
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        ) : (
                          <p className="mt-2 text-xs text-foreground/60">
                            Nessun gol
                          </p>
                        )}
                      </div>
                    </div>

                    {isFinal ? (
                      <div className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-emerald-700">
                        <Trophy className="h-4 w-4" />
                        Finale vinta
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default WinnerStory;
