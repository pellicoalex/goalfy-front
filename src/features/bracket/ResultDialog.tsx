import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { backendAssetUrl } from "@/lib/media";
import { Trophy, Lock, Loader2 } from "lucide-react";

type PlayerLite = { id: number; name: string; avatarUrl?: string | null };

export type Scorer = {
  id: number;
  name: string;
  minute: number;
  avatarUrl?: string | null;
};

/** Payload backend */
export type ParticipationPayload = { player_id: number; team_id: number };
export type GoalEventPayload = {
  team_id: number;
  scorer_player_id: number;
  assist_player_id: number | null;
  minute: number | null;

  // opzionali se backend li manda
  scorer_name?: string | null;
  scorer_avatar_url?: string | null;
  assist_name?: string | null;
  assist_avatar_url?: string | null;
};

function initial(name?: string | null) {
  const n = (name ?? "").trim();
  return n ? n[0].toUpperCase() : "?";
}

function clampTeamName(name: string | null, max = 14) {
  const n = (name ?? "").trim();
  if (!n) return "TBD";
  return n.length > max ? n.slice(0, max - 1) + "…" : n;
}

function winnerSide(a: number | null, b: number | null) {
  if (a == null || b == null) return null;
  if (a === b) return null;
  return a > b ? "A" : "B";
}

function TeamLogo({
  logoUrl,
  name,
  size = 76,
}: {
  logoUrl?: string | null;
  name?: string | null;
  size?: number;
}) {
  const src = logoUrl ? backendAssetUrl(logoUrl) : undefined;

  return (
    <Avatar
      className="rounded-2xl bg-card ring-1 ring-slate-200 shrink-0"
      style={{ width: size, height: size }}
    >
      {src ? (
        <AvatarImage
          src={src}
          alt={name ?? "team logo"}
          className="object-contain p-2"
        />
      ) : null}
      <AvatarFallback className="text-lg font-black text-foreground/70">
        {initial(name)}
      </AvatarFallback>
    </Avatar>
  );
}

function ScoreInput({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  return (
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      inputMode="numeric"
      placeholder="0"
      disabled={disabled}
      className={cn(
        "h-14 w-24 sm:w-28 rounded-2xl text-center",
        "text-foreground text-2xl font-black tabular-nums",
        "bg-card/90 ring-1 ring-slate-200 shadow-sm",
      )}
    />
  );
}

function generateRandomScorers(
  goals: number,
  players: PlayerLite[] | undefined,
  maxMinute = 50,
): Scorer[] {
  if (!players || players.length === 0 || goals <= 0) return [];

  const res: Scorer[] = [];
  for (let i = 0; i < goals; i++) {
    const p = players[Math.floor(Math.random() * players.length)];
    const minute = 1 + Math.floor(Math.random() * maxMinute);
    res.push({
      id: p.id,
      name: p.name,
      avatarUrl: p.avatarUrl ?? null,
      minute,
    });
  }

  res.sort((a, b) => a.minute - b.minute);
  return res;
}

function ScorerRow(props: {
  name: string;
  minute: number;
  avatarUrl?: string | null;
}) {
  const src = props.avatarUrl ? backendAssetUrl(props.avatarUrl) : undefined;

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <Avatar className="h-7 w-7 ring-1 ring-slate-200">
          {src ? (
            <AvatarImage src={src} alt={props.name} className="object-cover" />
          ) : null}
          <AvatarFallback className="text-[10px] font-black text-foreground/70">
            {initial(props.name)}
          </AvatarFallback>
        </Avatar>
        <span className="font-semibold text-foreground/80 truncate">
          {props.name}
        </span>
      </div>
      <span className="text-foreground/60 tabular-nums shrink-0">
        {props.minute}'
      </span>
    </div>
  );
}

function mapGoalEventsToScorers(args: {
  goalEvents: GoalEventPayload[];
  teamAId?: number | null;
  teamBId?: number | null;
  playersA?: PlayerLite[];
  playersB?: PlayerLite[];
}): { a: Scorer[]; b: Scorer[] } {
  const { goalEvents, teamAId, teamBId, playersA, playersB } = args;

  const idx = new Map<number, PlayerLite>();
  for (const p of playersA ?? []) idx.set(p.id, p);
  for (const p of playersB ?? []) idx.set(p.id, p);

  const a: Scorer[] = [];
  const b: Scorer[] = [];

  for (const ev of goalEvents ?? []) {
    const scorerId = Number(ev?.scorer_player_id ?? 0);
    if (!scorerId) continue;

    const p = idx.get(scorerId);

    const s: Scorer = {
      id: scorerId,
      name: p?.name ?? ev?.scorer_name ?? `#${scorerId}`,
      avatarUrl: p?.avatarUrl ?? ev?.scorer_avatar_url ?? null,
      minute:
        ev.minute != null && Number.isFinite(Number(ev.minute))
          ? Number(ev.minute)
          : 0,
    };

    const tId = Number(ev?.team_id ?? 0);

    if (teamAId && tId === Number(teamAId)) a.push(s);
    else if (teamBId && tId === Number(teamBId)) b.push(s);
    else {
      const inA = (playersA ?? []).some((x) => x.id === scorerId);
      const inB = (playersB ?? []).some((x) => x.id === scorerId);
      if (inA && !inB) a.push(s);
      else if (inB && !inA) b.push(s);
      else a.push(s);
    }
  }

  a.sort((x, y) => x.minute - y.minute);
  b.sort((x, y) => x.minute - y.minute);

  return { a, b };
}

async function defaultFetchGoalEvents(matchId: number, signal?: AbortSignal) {
  const candidates = [
    `/api/matches/${matchId}/goal-events`,
    `/matches/${matchId}/goal-events`,
  ];

  let lastErr: unknown = null;

  for (const url of candidates) {
    try {
      const res = await fetch(url, {
        method: "GET",
        signal,
        headers: { Accept: "application/json" },
      });
      if (!res.ok) {
        lastErr = new Error(`HTTP ${res.status}`);
        continue;
      }
      const data = await res.json();
      const arr = Array.isArray(data)
        ? data
        : (data?.goalEvents ?? data?.goal_events);
      if (!Array.isArray(arr)) return [];
      return arr as GoalEventPayload[];
    } catch (e) {
      lastErr = e;
    }
  }

  throw lastErr ?? new Error("Impossibile caricare goal events.");
}

export default function ResultDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  matchId?: number | null;

  teamA: string | null;
  teamB: string | null;

  logoA?: string | null;
  logoB?: string | null;

  teamAId?: number | null;
  teamBId?: number | null;

  defaultScoreA: number | null;
  defaultScoreB: number | null;

  locked?: boolean;

  initialScorersA?: Scorer[];
  initialScorersB?: Scorer[];

  onSubmit: (scoreA: number, scoreB: number) => Promise<void> | void;

  onFinalize?: (payload: {
    matchId: number;
    scoreA: number;
    scoreB: number;
    winnerSide: "A" | "B";
    scorersA: Scorer[];
    scorersB: Scorer[];
    participations: ParticipationPayload[];
    goalEvents: GoalEventPayload[];
  }) => Promise<void> | void;

  playersA?: PlayerLite[];
  playersB?: PlayerLite[];
  confirmLabel?: string;

  fetchGoalEvents?: (
    matchId: number,
    signal?: AbortSignal,
  ) => Promise<GoalEventPayload[]>;
}) {
  const locked = !!props.locked;

  const [scoreA, setScoreA] = useState<string>("");
  const [scoreB, setScoreB] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [scorersA, setScorersA] = useState<Scorer[]>([]);
  const [scorersB, setScorersB] = useState<Scorer[]>([]);
  const [loadingScorers, setLoadingScorers] = useState(false);

  useEffect(() => {
    if (!props.open) return;

    setError(null);
    setLoadingScorers(false);

    setScoreA(props.defaultScoreA != null ? String(props.defaultScoreA) : "");
    setScoreB(props.defaultScoreB != null ? String(props.defaultScoreB) : "");

    if (locked) {
      setScorersA(props.initialScorersA ?? []);
      setScorersB(props.initialScorersB ?? []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.open, props.defaultScoreA, props.defaultScoreB, locked]);

  const parsedA = useMemo(() => {
    const n = Number(scoreA);
    return Number.isFinite(n) ? n : null;
  }, [scoreA]);

  const parsedB = useMemo(() => {
    const n = Number(scoreB);
    return Number.isFinite(n) ? n : null;
  }, [scoreB]);

  const w = winnerSide(parsedA, parsedB);

  useEffect(() => {
    if (!props.open) return;
    if (locked) return;

    const a = parsedA ?? 0;
    const b = parsedB ?? 0;

    if (props.playersA?.length)
      setScorersA(generateRandomScorers(a, props.playersA));
    else setScorersA([]);

    if (props.playersB?.length)
      setScorersB(generateRandomScorers(b, props.playersB));
    else setScorersB([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.open, parsedA, parsedB, locked]);

  useEffect(() => {
    if (!props.open) return;
    if (!locked) return;

    const a0 = (props.initialScorersA ?? []).length === 0;
    const b0 = (props.initialScorersB ?? []).length === 0;
    if (!a0 && !b0) return;

    const matchId = Number(props.matchId ?? 0);
    if (!matchId) return;

    const controller = new AbortController();
    const fetcher = props.fetchGoalEvents ?? defaultFetchGoalEvents;

    (async () => {
      try {
        setLoadingScorers(true);

        const goalEvents = await fetcher(matchId, controller.signal);

        const mapped = mapGoalEventsToScorers({
          goalEvents,
          teamAId: props.teamAId,
          teamBId: props.teamBId,
          playersA: props.playersA,
          playersB: props.playersB,
        });

        if (a0) setScorersA(mapped.a);
        if (b0) setScorersB(mapped.b);
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : "Errore nel caricamento marcatori.";
        setError((prev) => prev ?? `Marcatori non caricati: ${msg}`);
      } finally {
        setLoadingScorers(false);
      }
    })();

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    props.open,
    locked,
    props.matchId,
    props.teamAId,
    props.teamBId,
    props.initialScorersA,
    props.initialScorersB,
  ]);

  function validateScores() {
    const a = Number(scoreA);
    const b = Number(scoreB);

    if (!Number.isFinite(a) || !Number.isFinite(b)) {
      setError("Inserisci due punteggi validi.");
      return null;
    }
    if (a < 0 || b < 0) {
      setError("I punteggi non possono essere negativi.");
      return null;
    }
    return { a: Math.trunc(a), b: Math.trunc(b) };
  }

  /** prende scoreA/scoreB validati come input */
  function buildBackendPayload(
    scoreAValue: number,
    scoreBValue: number,
  ): {
    participations: ParticipationPayload[];
    goalEvents: GoalEventPayload[];
    scorersAForPayload: Scorer[];
    scorersBForPayload: Scorer[];
    warnings: string[];
  } {
    const warnings: string[] = [];

    const teamAId = props.teamAId ?? null;
    const teamBId = props.teamBId ?? null;

    if (!teamAId || !teamBId) {
      warnings.push(
        "teamAId/teamBId mancanti: impossibile valorizzare team_id per goal/presenze.",
      );
    }

    const participations: ParticipationPayload[] = [];
    if (teamAId && props.playersA?.length) {
      for (const p of props.playersA) {
        participations.push({ player_id: p.id, team_id: teamAId });
      }
    }
    if (teamBId && props.playersB?.length) {
      for (const p of props.playersB) {
        participations.push({ player_id: p.id, team_id: teamBId });
      }
    }

    const goalEvents: GoalEventPayload[] = [];

    const aGoals = scoreAValue ?? 0;
    const bGoals = scoreBValue ?? 0;

    const scorersAForPayload =
      scorersA.length > 0
        ? scorersA
        : aGoals > 0 && props.playersA?.length
          ? generateRandomScorers(aGoals, props.playersA)
          : [];

    const scorersBForPayload =
      scorersB.length > 0
        ? scorersB
        : bGoals > 0 && props.playersB?.length
          ? generateRandomScorers(bGoals, props.playersB)
          : [];

    if (!locked) {
      if (!scorersA.length && scorersAForPayload.length)
        setScorersA(scorersAForPayload);
      if (!scorersB.length && scorersBForPayload.length)
        setScorersB(scorersBForPayload);
    }

    if (teamAId) {
      for (const s of scorersAForPayload) {
        goalEvents.push({
          team_id: teamAId,
          scorer_player_id: s.id,
          assist_player_id: null,
          minute: Number.isFinite(s.minute) ? s.minute : null,
        });
      }
    }
    if (teamBId) {
      for (const s of scorersBForPayload) {
        goalEvents.push({
          team_id: teamBId,
          scorer_player_id: s.id,
          assist_player_id: null,
          minute: Number.isFinite(s.minute) ? s.minute : null,
        });
      }
    }

    return {
      participations,
      goalEvents,
      scorersAForPayload,
      scorersBForPayload,
      warnings,
    };
  }

  async function onSave() {
    if (locked) return;

    if (props.onFinalize) {
      return onFinalize();
    }

    setError(null);
    const v = validateScores();
    if (!v) return;

    try {
      setSaving(true);
      await props.onSubmit(v.a, v.b);
      props.onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore nel salvataggio.");
    } finally {
      setSaving(false);
    }
  }

  async function onFinalize() {
    if (locked) return;

    setError(null);
    const v = validateScores();
    if (!v) return;

    const winner = winnerSide(v.a, v.b);
    if (!winner) {
      setError("Il risultato finale non può essere in pareggio.");
      return;
    }

    const matchId = Number(props.matchId ?? 0);
    if (!matchId) {
      setError("matchId mancante: impossibile salvare risultato finale.");
      return;
    }

    const built = buildBackendPayload(v.a, v.b);

    if (props.onFinalize && built.warnings.length) {
      setError(built.warnings.join(" "));
      return;
    }

    try {
      setFinalizing(true);

      if (props.onFinalize) {
        await props.onFinalize({
          matchId,
          scoreA: v.a,
          scoreB: v.b,
          winnerSide: winner,
          scorersA: built.scorersAForPayload,
          scorersB: built.scorersBForPayload,
          participations: built.participations,
          goalEvents: built.goalEvents,
        });
      } else {
        await props.onSubmit(v.a, v.b);
      }

      props.onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore nel salvataggio.");
    } finally {
      setFinalizing(false);
    }
  }

  const winnerText =
    w == null
      ? "Pari: nessun vincitore."
      : `Vince: ${w === "A" ? props.teamA : props.teamB}`;

  const showScorers =
    locked ||
    ((props.playersA?.length || props.playersB?.length) &&
      ((parsedA ?? 0) > 0 || (parsedB ?? 0) > 0));

  const busy = saving || finalizing;

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent
        className={cn(
          "p-0 overflow-hidden",
          "w-[calc(100vw-1.5rem)] sm:w-[calc(100vw-3rem)]",
          "max-w-[1100px] xl:max-w-[1200px] 2xl:max-w-[1400px]",
          "max-h-[calc(100vh-1.5rem)] sm:max-h-[calc(100vh-3rem)]",
          "flex flex-col",
        )}
      >
        <div className="px-6 pt-5 pb-3 border-b bg-card/90">
          <DialogHeader>
            <DialogTitle className="text-primary dark:text-white">
              {locked ? "Risultato confermato" : "Inserisci risultato"}
            </DialogTitle>
            <DialogDescription className="text-primary dark:text-white">
              {locked
                ? "Match già disputato: punteggi e marcatori sono bloccati."
                : "Inserisci i punteggi: la preview del vincitore si aggiorna in tempo reale."}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="relative flex-1 overflow-y-auto">
          <div className="absolute inset-0 bg-linear-to-br from-white via-slate-50 to-slate-100 dark:from-card dark:via-card/95 dark:to-black" />

          <div className="relative px-6 py-5">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px_1fr] gap-4 items-stretch">
              <div
                className={cn(
                  "rounded-3xl p-4 bg-card/85 backdrop-blur ring-1 ring-slate-200 shadow-sm min-w-0",
                  w && w !== "A" && "opacity-80 grayscale-25",
                  w === "A" &&
                    "ring-2 ring-emerald-400 bg-emerald-50/70 shadow-[0_0_18px_rgba(52,211,153,0.22)]",
                )}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <TeamLogo logoUrl={props.logoA} name={props.teamA} />
                  <div className="min-w-0 flex-1">
                    <div className="text-foreground/80 font-extrabold text-lg truncate">
                      {props.teamA ?? "TBD"}
                    </div>
                    <div className="mt-1 text-[11px] text-foreground/60">
                      Squadra casa
                    </div>
                  </div>
                  <div className="shrink-0 flex flex-col items-center gap-2">
                    <div className="text-[11px] font-semibold text-foreground/60">
                      Punteggio
                    </div>
                    <ScoreInput
                      value={scoreA}
                      onChange={setScoreA}
                      disabled={busy || locked}
                    />
                  </div>
                </div>
              </div>

              <div
                className={cn(
                  "rounded-3xl ring-1 ring-slate-200 bg-card/75 shadow-sm px-5 py-4",
                  "flex flex-col items-center justify-center text-center",
                )}
              >
                <div className="inline-flex items-center gap-2 rounded-full border bg-card/70 px-3 py-1 text-[11px] font-semibold text-foreground/60">
                  {locked ? (
                    <>
                      <Lock className="h-3.5 w-3.5" />
                      Bloccato
                    </>
                  ) : (
                    <>
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      Live
                    </>
                  )}
                </div>

                <div className="mt-4 w-full">
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                    <div className="flex flex-col items-center gap-2 min-w-0">
                      <TeamLogo
                        logoUrl={props.logoA}
                        name={props.teamA}
                        size={56}
                      />
                      <div className="text-[12px] font-semibold text-foreground/70 truncate max-w-[10rem]">
                        {clampTeamName(props.teamA, 16)}
                      </div>
                    </div>

                    <div className="flex flex-col items-center">
                      <div className="text-6xl font-black tabular-nums text-foreground/80 leading-none whitespace-nowrap">
                        {parsedA ?? 0}
                        <span className="text-slate-300 mx-2">:</span>
                        {parsedB ?? 0}
                      </div>
                      <div className="mt-2 text-[12px] text-foreground/60">
                        {winnerText}
                      </div>
                    </div>

                    <div className="flex flex-col items-center gap-2 min-w-0">
                      <TeamLogo
                        logoUrl={props.logoB}
                        name={props.teamB}
                        size={56}
                      />
                      <div className="text-[12px] font-semibold text-foreground/70 truncate max-w-[10rem]">
                        {clampTeamName(props.teamB, 16)}
                      </div>
                    </div>
                  </div>
                </div>

                {w != null ? (
                  <div
                    className="text-primary dark:text-white mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px] font-semibold"
                    style={{
                      background: "rgba(2,160,221,0.12)",
                      border: "1px solid rgba(2,160,221,0.25)",
                    }}
                  >
                    <Trophy className="h-4 w-4" />
                    {locked ? "Vincitore confermato" : "Vincitore live"}
                  </div>
                ) : null}
              </div>

              <div
                className={cn(
                  "rounded-3xl p-4 bg-card/85 backdrop-blur ring-1 ring-slate-200 shadow-sm min-w-0",
                  w && w !== "B" && "opacity-80 grayscale-25",
                  w === "B" &&
                    "ring-2 ring-emerald-400 bg-emerald-50/70 shadow-[0_0_18px_rgba(52,211,153,0.22)]",
                )}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="shrink-0 flex flex-col items-center gap-2">
                    <div className="text-[11px] font-semibold text-foreground/70">
                      Punteggio
                    </div>
                    <ScoreInput
                      value={scoreB}
                      onChange={setScoreB}
                      disabled={busy || locked}
                    />
                  </div>

                  <div className="min-w-0 flex-1 text-right">
                    <div className="text-foreground/80 font-extrabold text-lg truncate">
                      {props.teamB ?? "TBD"}
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500">
                      Squadra trasferta
                    </div>
                  </div>

                  <TeamLogo logoUrl={props.logoB} name={props.teamB} />
                </div>
              </div>
            </div>

            {showScorers ? (
              <div className="mt-4 rounded-3xl ring-1 ring-slate-200 bg-card/80 p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-extrabold text-foreground/80">
                    Marcatori
                  </div>

                  <Button
                    type="button"
                    variant="secondary"
                    className="h-9 rounded-2xl dark:text-white"
                    disabled={busy || locked}
                    onClick={() => {
                      if (locked) return;
                      const a = parsedA ?? 0;
                      const b = parsedB ?? 0;
                      setScorersA(
                        props.playersA?.length
                          ? generateRandomScorers(a, props.playersA)
                          : [],
                      );
                      setScorersB(
                        props.playersB?.length
                          ? generateRandomScorers(b, props.playersB)
                          : [],
                      );
                    }}
                  >
                    Rigenera
                  </Button>
                </div>

                {locked && loadingScorers ? (
                  <div className="mt-3 flex items-center gap-2 text-sm text-foreground/60">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Carico marcatori dal backend...
                  </div>
                ) : null}

                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-card/70 ring-1 ring-slate-200 p-3">
                    <div className="text-xs font-semibold text-foreground/60">
                      {props.teamA ?? "Team A"}
                    </div>
                    <div className="mt-2 space-y-1.5">
                      {scorersA.length ? (
                        scorersA.map((s, idx) => (
                          <ScorerRow
                            key={`${s.id}-${idx}`}
                            name={s.name}
                            minute={s.minute}
                            avatarUrl={s.avatarUrl}
                          />
                        ))
                      ) : (
                        <div className="text-sm text-foreground/60">
                          Nessun goal
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-card/70 ring-1 ring-slate-200 p-3">
                    <div className="text-xs font-semibold text-slate-600">
                      {props.teamB ?? "Team B"}
                    </div>
                    <div className="mt-2 space-y-1.5">
                      {scorersB.length ? (
                        scorersB.map((s, idx) => (
                          <ScorerRow
                            key={`${s.id}-${idx}`}
                            name={s.name}
                            minute={s.minute}
                            avatarUrl={s.avatarUrl}
                          />
                        ))
                      ) : (
                        <div className="text-sm text-foreground/60">
                          Nessun goal
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-3 text-[11px] text-foreground/60">
                  {locked
                    ? "* Marcatori bloccati: mostrati dal backend (goal_events persistiti)."
                    : "* Marcatori generati automaticamente (random) dai player della squadra. Assist non impostati (null)."}
                </div>
              </div>
            ) : null}

            {error ? (
              <div className="mt-4 rounded-2xl bg-red-50 text-red-700 ring-1 ring-red-200 px-4 py-3 text-sm">
                {error}
              </div>
            ) : null}
          </div>
        </div>

        <div className="border-t bg-card/90 px-6 py-4">
          {locked ? (
            <div className="flex justify-end">
              <Button
                className="h-11 rounded-2xl"
                onClick={() => props.onOpenChange(false)}
              >
                Chiudi
              </Button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
              <Button
                variant="secondary"
                className="h-11 rounded-2xl"
                onClick={() => props.onOpenChange(false)}
                disabled={busy}
              >
                Annulla
              </Button>

              {/* button eliminato nella risult dialog che nn serve salva */}

              {/*   <Button
                variant="outline"
                className="h-11 rounded-2xl"
                onClick={onSave}
                disabled={busy}
              >
                {saving ? "Salvataggio..." : (props.confirmLabel ?? "Salva")}
              </Button> */}

              <Button
                className="h-11 rounded-2xl"
                onClick={onFinalize}
                disabled={busy}
                style={{
                  background: `linear-gradient(90deg, secondary, primary})`,
                  color: "white",
                }}
              >
                {finalizing ? "Conferma..." : "Risultato finale"}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
