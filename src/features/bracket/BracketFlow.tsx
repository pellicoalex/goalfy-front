import {
  Background,
  Controls,
  ReactFlow,
  type Edge,
  type EdgeProps,
  type EdgeTypes,
  type Node,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useEffect, useMemo, useState } from "react";

import BracketNode from "./BracketNode";
import ResultDialog, {
  type GoalEventPayload,
  type ParticipationPayload,
  type Scorer,
} from "./ResultDialog";
import TeamsSidebar, { type BracketTeam } from "./TeamsSidebar";

import { Button } from "@/components/ui/button";
import { PanelRightClose, PanelRightOpen, X } from "lucide-react";

import { PlayerService } from "@/features/player/player.service";
import type { Player } from "@/features/player/player.type";

import type { Match } from "@/features/match/match.type";
import type { Team } from "@/features/team/team.type";
import { cn } from "@/lib/utils";
import { MatchService } from "../match/match.service";

const nodeTypes: NodeTypes = { match: BracketNode };

function roundLabel(r: number) {
  if (r === 1) return "Quarti";
  if (r === 2) return "Semifinali";
  return "Finale";
}
function roundShort(r: number) {
  if (r === 1) return "Q";
  if (r === 2) return "S";
  return "F";
}

// type Slots = Record<
//   "Q1A" | "Q1B" | "Q2A" | "Q2B" | "Q3A" | "Q3B" | "Q4A" | "Q4B",
//   number | null
// >;

// const SLOT_ORDER: (keyof Slots)[] = [
//   "Q1A",
//   "Q1B",
//   "Q2A",
//   "Q2B",
//   "Q3A",
//   "Q3B",
//   "Q4A",
//   "Q4B",
// ];

// function emptySlots(): Slots {
//   return {
//     Q1A: null,
//     Q1B: null,
//     Q2A: null,
//     Q2B: null,
//     Q3A: null,
//     Q3B: null,
//     Q4A: null,
//     Q4B: null,
//   };
// }

function BracketEdge(props: EdgeProps) {
  const { id, sourceX, sourceY, targetX, targetY, style, markerEnd } = props;

  const dx = targetX - sourceX;
  const goingRight = dx >= 0;

  const JOIN_OFFSET = 90;
  const joinX = goingRight ? targetX - JOIN_OFFSET : targetX + JOIN_OFFSET;

  const d = `M ${sourceX},${sourceY} L ${joinX},${sourceY} L ${joinX},${targetY} L ${targetX},${targetY}`;
  return <path id={id} d={d} fill="none" style={style} markerEnd={markerEnd} />;
}

const edgeTypes: EdgeTypes = { bracket: BracketEdge };

function useIsMobile(breakpointPx = 1024) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpointPx - 1}px)`);
    const onChange = () => setIsMobile(mq.matches);
    onChange();
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, [breakpointPx]);

  return isMobile;
}

// Payload backend-ready (resta compatibile con il backend)

export type MatchParticipationPayload = ParticipationPayload;
export type MatchGoalEventPayload = GoalEventPayload;

//Prova a leggere goal events dal match (best-effort).
//Supporta shape diverse: goalEvents / goal_events / match_goal_events / goals

function extractGoalEventsFromMatch(m: any): any[] {
  if (!m) return [];
  const raw =
    (Array.isArray(m?.goalEvents) && m.goalEvents) ||
    (Array.isArray(m?.goal_events) && m.goal_events) ||
    (Array.isArray(m?.match_goal_events) && m.match_goal_events) ||
    (Array.isArray(m?.goals) && m.goals) ||
    [];
  return raw;
}

// Converte goal events (backend) in Scorer[] per ResultDialog (locked view).
// Funziona anche SENZA players caricati (usa campi opzionali dall'evento).

function mapEventsToScorers(
  events: any[],
  players?: Player[] | null,
): Scorer[] {
  const byId = new Map<number, Player>();
  for (const p of players ?? []) byId.set(Number(p.id), p);

  const res: Scorer[] = [];

  for (const ev of events ?? []) {
    const scorerId = Number(
      ev?.scorer_player_id ?? ev?.scorerPlayerId ?? ev?.scorer_id ?? 0,
    );
    if (!scorerId) continue;

    const minuteRaw = ev?.minute ?? null;
    const minute =
      typeof minuteRaw === "number"
        ? minuteRaw
        : minuteRaw == null
          ? 1
          : Number(minuteRaw);

    const p = byId.get(scorerId);

    // prova a ricostruire nome dai campi evento (se backend fa join)
    const nameFromEvent =
      `${ev?.scorer_first_name ?? ""} ${ev?.scorer_last_name ?? ""}`.trim() ||
      `${ev?.scorerFirstName ?? ""} ${ev?.scorerLastName ?? ""}`.trim();

    const name =
      nameFromEvent ||
      ev?.scorer_name ||
      ev?.scorerName ||
      p?.fullName ||
      (p ? `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim() : "") ||
      `Player #${scorerId}`;

    const avatarUrl =
      ev?.scorer_avatar_url ?? ev?.scorerAvatarUrl ?? p?.avatarUrl ?? null;

    res.push({
      id: scorerId,
      name,
      minute: Number.isFinite(minute) ? minute : 1,
      avatarUrl,
    });
  }

  res.sort((a, b) => a.minute - b.minute);
  return res;
}

export default function BracketFlow(props: {
  tournamentId: number;
  matches: Match[];
  teams: Team[];
  builderMode?: boolean;
  onRefresh?: () => void;

  onGenerate?: (
    matches: { id: number; teamAId?: number | null; teamBId?: number | null }[],
  ) => Promise<void>;

  // salva solo score
  onSubmitResult?: (
    matchId: number,
    scoreA: number,
    scoreB: number,
  ) => Promise<void>;

  // salva score + presenze + goalEvents

  onFinalizeResult?: (payload: {
    matchId: number;
    scoreA: number;
    scoreB: number;
    participations: MatchParticipationPayload[];
    goalEvents: MatchGoalEventPayload[];
  }) => Promise<void>;
}) {
  const builderMode = !!props.builderMode;
  const isMobile = useIsMobile(1024);

  const [sidebarOpen, setSidebarOpen] = useState<boolean>(
    () => builderMode && !isMobile,
  );

  useEffect(() => {
    if (builderMode) setSidebarOpen(!isMobile);
  }, [builderMode, isMobile]);

  const defaultSlots = props.matches
    .filter((m) => m.round === 1)
    .map((m) => ({ id: m.id }));
  const [slots, setSlots] =
    useState<
      { id: number; teamAId?: number | null; teamBId?: number | null }[]
    >(defaultSlots);
  const [activeId, setActiveId] = useState<number | null>(null);

  const [localMatches, setLocalMatches] = useState<Match[]>(
    () => props.matches ?? [],
  );
  useEffect(() => setLocalMatches(props.matches ?? []), [props.matches]);

  const [playersA, setPlayersA] = useState<Player[]>([]);
  const [playersB, setPlayersB] = useState<Player[]>([]);
  const [playersLoading, setPlayersLoading] = useState(false);

  // Serve quando il backend NON rimanda subito i goalEvents nella lista matches.

  const [scorersCache, setScorersCache] = useState<
    Record<number, { a: Scorer[]; b: Scorer[] }>
  >({});

  const assignedIds = useMemo(() => {
    return slots.reduce((prev, curr) => {
      curr.teamAId && prev.push(curr.teamAId);
      curr.teamBId && prev.push(curr.teamBId);
      return prev;
    }, [] as number[]);
  }, [slots]);
  const filled = assignedIds.length;

  const availableTeams = useMemo(() => {
    if (!builderMode) return props.teams ?? [];
    return props.teams.filter((team) => !assignedIds.includes(team.id));
  }, [builderMode, props.teams, assignedIds]);

  const teamById = useMemo(() => {
    const map = new Map<number, Team>();
    for (const t of props.teams ?? []) map.set(Number((t as any).id), t);
    return map;
  }, [props.teams]);

  const resolveTeam = useMemo(() => {
    return (id?: number | string | null, fallbackName?: string | null) => {
      const numId = id == null ? null : Number(id);
      const t = numId ? teamById.get(numId) : undefined;
      return {
        id: numId,
        name: t?.name ?? fallbackName ?? null,
        logoUrl: (t as any)?.logoUrl ?? (t as any)?.logo_url ?? null,
      };
    };
  }, [teamById]);

  const activeMatch = useMemo(() => {
    if (!activeId) return null;
    return (
      localMatches.find((m) => Number((m as any).id) === Number(activeId)) ??
      null
    );
  }, [activeId, localMatches]);

  const locked =
    (activeMatch as any)?.status === "played" || !!(activeMatch as any)?.locked;

  const dropTeam = (match: {
    id: number;
    teamId: number;
    teamName: string;
  }) => {
    console.log("🚀 ~ dropTeam ~ match:", match);
    setSlots((prev) => {
      return prev.map((m) =>
        m.id === match.id ? { ...m, [match.teamName]: match.teamId } : m,
      );
    });
  };

  const clearSlot = (id: number) =>
    setSlots((prev) => prev.filter((m) => m.id !== id));

  const clearAll = () => setSlots(defaultSlots);

  const shuffleTeams = () => {
    const shuffledTeams = [...props.teams].sort(() => Math.random() - 0.5);
    setSlots((prev) => {
      return prev.map((slot, i) => ({
        ...slot,
        teamAId: shuffledTeams[i * 2].id,
        teamBId: shuffledTeams[i * 2 + 1].id,
      }));
    });
  };

  // players per marcatori/presenze (solo se c'è match attivo)
  useEffect(() => {
    if (!activeMatch) return;

    const teamAId = Number(
      (activeMatch as any).teamAId ?? (activeMatch as any).team_a_id ?? 0,
    );
    const teamBId = Number(
      (activeMatch as any).teamBId ?? (activeMatch as any).team_b_id ?? 0,
    );

    if (!teamAId || !teamBId) {
      setPlayersA([]);
      setPlayersB([]);
      return;
    }

    setPlayersLoading(true);
    Promise.all([
      PlayerService.listByTeam(teamAId),
      PlayerService.listByTeam(teamBId),
    ])
      .then(([a, b]) => {
        setPlayersA(a ?? []);
        setPlayersB(b ?? []);
      })
      .catch(() => {
        setPlayersA([]);
        setPlayersB([]);
      })
      .finally(() => setPlayersLoading(false));
  }, [activeMatch]);

  const getTeam = (id: number | null) => (id ? teamById.get(id) : undefined);

  const { nodes, edges } = useMemo(() => {
    const X_GAP = 430;
    const Y_GAP = 175;

    const baseEdgeStyle = { stroke: "rgba(2,160,221,0.55)", strokeWidth: 2 };

    if (builderMode) {
      const posQ = [
        { x: 0, y: 0 },
        { x: 0, y: 2 * Y_GAP },
        { x: 4 * X_GAP, y: 0 },
        { x: 4 * X_GAP, y: 2 * Y_GAP },
      ];

      const nodesQ: Node[] = slots.map((slot, idx) => {
        const aId = slot.teamAId;
        const bId = slot.teamBId;

        const a = getTeam(aId || null);
        const b = getTeam(bId || null);

        return {
          id: `builder-q${idx + 1}`,
          type: "match",
          position: posQ[idx],
          data: {
            builderMode: true,
            roundLabel: "Quarti",
            roundShort: "Q",
            matchId: slot.id,
            matchNumber: idx + 1,
            side: idx + 1 <= 2 ? "left" : "right",

            teamA: a?.name ?? null,
            teamB: b?.name ?? null,
            teamALogoUrl: (a as any)?.logoUrl ?? (a as any)?.logo_url ?? null,
            teamBLogoUrl: (b as any)?.logoUrl ?? (b as any)?.logo_url ?? null,

            slotAId: aId,
            slotBId: bId,
            onClearSlot: (slotId: number) => clearSlot(slotId),
            onDropTeam: (match: {
              id: number;
              teamId: number;
              teamName: string;
            }) => dropTeam(match),
          },
        };
      });

      const nodesS: Node[] = [
        {
          id: "builder-s1",
          type: "match",
          position: { x: 1 * X_GAP, y: 1 * Y_GAP },
          data: {
            builderMode: true,
            roundLabel: "Semifinali",
            roundShort: "S",
            matchNumber: 1,
            side: "left",
            teamA: null,
            teamB: null,
            teamALogoUrl: null,
            teamBLogoUrl: null,
          },
        },
        {
          id: "builder-s2",
          type: "match",
          position: { x: 3 * X_GAP, y: 1 * Y_GAP },
          data: {
            builderMode: true,
            roundLabel: "Semifinali",
            roundShort: "S",
            matchNumber: 2,
            side: "right",
            teamA: null,
            teamB: null,
            teamALogoUrl: null,
            teamBLogoUrl: null,
          },
        },
      ];

      const nodeF: Node = {
        id: "builder-f1",
        type: "match",
        position: { x: 2 * X_GAP, y: 1 * Y_GAP },
        data: {
          builderMode: true,
          roundLabel: "Finale",
          roundShort: "F",
          matchNumber: 1,
          side: "center",
          teamA: null,
          teamB: null,
          teamALogoUrl: null,
          teamBLogoUrl: null,
        },
      };

      const edges: Edge[] = [
        {
          id: "e-q1-s1",
          source: "builder-q1",
          sourceHandle: "out",
          target: "builder-s1",
          targetHandle: "in-A",
        },
        {
          id: "e-q2-s1",
          source: "builder-q2",
          sourceHandle: "out",
          target: "builder-s1",
          targetHandle: "in-B",
        },
        {
          id: "e-q3-s2",
          source: "builder-q3",
          sourceHandle: "out",
          target: "builder-s2",
          targetHandle: "in-A",
        },
        {
          id: "e-q4-s2",
          source: "builder-q4",
          sourceHandle: "out",
          target: "builder-s2",
          targetHandle: "in-B",
        },
        {
          id: "e-s1-f1",
          source: "builder-s1",
          sourceHandle: "out",
          target: "builder-f1",
          targetHandle: "in-A",
        },
        {
          id: "e-s2-f1",
          source: "builder-s2",
          sourceHandle: "out",
          target: "builder-f1",
          targetHandle: "in-B",
        },
      ].map((e) => ({
        ...e,
        type: "bracket",
        animated: false,
        style: baseEdgeStyle,
        markerEnd: undefined,
      }));

      return { nodes: [...nodesQ, ...nodesS, nodeF], edges };
    }

    const colX = {
      LQ: 0,
      LS: X_GAP,
      F: X_GAP * 2,
      RS: X_GAP * 3,
      RQ: X_GAP * 4,
    } as const;

    const quarti = localMatches
      .filter((m) => (m as any).round === 1)
      .slice()
      .sort((a, b) => (a as any).matchNumber - (b as any).matchNumber);

    const semi = localMatches
      .filter((m) => (m as any).round === 2)
      .slice()
      .sort((a, b) => (a as any).matchNumber - (b as any).matchNumber);

    const finale = localMatches
      .filter((m) => (m as any).round === 3)
      .slice()
      .sort((a, b) => (a as any).matchNumber - (b as any).matchNumber);

    const pos = new Map<number, { x: number; y: number }>();

    quarti.forEach((m) => {
      const mn = Number((m as any).matchNumber ?? 1);
      const isLeft = mn <= 2;
      const idx = isLeft ? mn - 1 : mn - 3;
      pos.set((m as any).id, {
        x: isLeft ? colX.LQ : colX.RQ,
        y: idx * 2 * 175,
      });
    });

    const avgYFromSources = (pool: Match[], targetId: number) => {
      const sources = pool.filter(
        (s) => Number((s as any).nextMatchId) === targetId,
      );
      const ys = sources
        .map((s) => pos.get((s as any).id)?.y)
        .filter((y): y is number => typeof y === "number");
      if (!ys.length) return 0;
      return ys.reduce((a, b) => a + b, 0) / ys.length;
    };

    semi.forEach((m) => {
      const targetId = Number((m as any).id);
      const sources = quarti.filter(
        (s) => Number((s as any).nextMatchId) === targetId,
      );
      const isLeft = sources.every(
        (s) => Number((s as any).matchNumber ?? 1) <= 2,
      );
      pos.set(targetId, {
        x: isLeft ? colX.LS : colX.RS,
        y: avgYFromSources(quarti, targetId) || 175,
      });
    });

    finale.forEach((m) => {
      const targetId = Number((m as any).id);
      pos.set(targetId, {
        x: colX.F,
        y: avgYFromSources(semi, targetId) || 175,
      });
    });

    console.log({ localMatches });

    const nodes: Node[] = localMatches.map((m) => {
      const p = pos.get((m as any).id) ?? { x: 0, y: 0 };
      const r = Number((m as any).round);
      const mn = Number((m as any).matchNumber ?? 1);

      let side: "left" | "right" | "center" = "center";
      if (r === 1) side = mn <= 2 ? "left" : "right";
      else if (r === 2) side = p.x < colX.F ? "left" : "right";
      else side = "center";

      const a = resolveTeam(
        (m as any).teamAId ?? null,
        (m as any).teamAName ?? null,
      );
      const b = resolveTeam(
        (m as any).teamBId ?? null,
        (m as any).teamBName ?? null,
      );

      return {
        id: String((m as any).id),
        type: "match",
        position: p,
        data: {
          roundLabel: roundLabel(r),
          roundShort: roundShort(r),
          matchNumber: (m as any).matchNumber,
          side,

          matchId: (m as any).id,
          status: (m as any).status,

          teamA: a.name,
          teamB: b.name,
          teamALogoUrl: a.logoUrl,
          teamBLogoUrl: b.logoUrl,

          scoreA: (m as any).scoreA ?? null,
          scoreB: (m as any).scoreB ?? null,

          winnerName: (m as any).winnerName ?? null,
          onOpenResult: (id: number) => setActiveId(id),
        },
      };
    });

    const edges: Edge[] = localMatches
      .filter((m) => !!(m as any).nextMatchId)
      .map((m) => {
        const nextSlot = (m as any).nextSlot ?? (m as any).next_slot ?? null;
        const targetHandle =
          nextSlot === "A" ? "in-A" : nextSlot === "B" ? "in-B" : undefined;

        const played = (m as any).status === "played";

        return {
          id: `e-${(m as any).id}-${(m as any).nextMatchId}`,
          source: String((m as any).id),
          sourceHandle: "out",
          target: String((m as any).nextMatchId),
          targetHandle,
          type: "bracket",
          animated: false,
          style: {
            stroke: played ? "rgba(2,160,221,0.35)" : "rgba(2,160,221,0.65)",
            strokeWidth: 2,
          },
          markerEnd: undefined,
        };
      });

    return { nodes, edges };
  }, [builderMode, localMatches, slots, resolveTeam, teamById]);

  const dialogTeamA = useMemo(() => {
    if (!activeMatch)
      return { id: null as number | null, name: null, logoUrl: null };
    const a = resolveTeam(
      (activeMatch as any).teamAId ?? (activeMatch as any).team_a_id ?? null,
      (activeMatch as any).teamAName ?? null,
    );
    return { id: a.id, name: a.name, logoUrl: a.logoUrl };
  }, [activeMatch, resolveTeam]);

  const dialogTeamB = useMemo(() => {
    if (!activeMatch)
      return { id: null as number | null, name: null, logoUrl: null };
    const b = resolveTeam(
      (activeMatch as any).teamBId ?? (activeMatch as any).team_b_id ?? null,
      (activeMatch as any).teamBName ?? null,
    );
    return { id: b.id, name: b.name, logoUrl: b.logoUrl };
  }, [activeMatch, resolveTeam]);

  const defaultScoreA = (activeMatch as any)?.scoreA ?? null;
  const defaultScoreB = (activeMatch as any)?.scoreB ?? null;

  // scorers salvati (se presenti nel match) per view locked
  const initialScorersA = useMemo(() => {
    if (!activeMatch || !locked) return [];
    const matchId = Number((activeMatch as any).id ?? 0);
    const teamAId = Number(
      (activeMatch as any).teamAId ?? (activeMatch as any).team_a_id ?? 0,
    );
    if (!matchId || !teamAId) return [];

    const evs = extractGoalEventsFromMatch(activeMatch as any);
    const teamEvents = evs.filter(
      (e) => Number(e?.team_id ?? e?.teamId ?? 0) === teamAId,
    );

    // fallback cache se backend non manda goalEvents
    if (!teamEvents.length) return scorersCache[matchId]?.a ?? [];
    return mapEventsToScorers(teamEvents, playersA);
  }, [activeMatch, locked, playersA, scorersCache]);

  const initialScorersB = useMemo(() => {
    if (!activeMatch || !locked) return [];
    const matchId = Number((activeMatch as any).id ?? 0);
    const teamBId = Number(
      (activeMatch as any).teamBId ?? (activeMatch as any).team_b_id ?? 0,
    );
    if (!matchId || !teamBId) return [];

    const evs = extractGoalEventsFromMatch(activeMatch as any);
    const teamEvents = evs.filter(
      (e) => Number(e?.team_id ?? e?.teamId ?? 0) === teamBId,
    );

    //  fallback cache se backend non manda goalEvents
    if (!teamEvents.length) return scorersCache[matchId]?.b ?? [];
    return mapEventsToScorers(teamEvents, playersB);
  }, [activeMatch, locked, playersB, scorersCache]);

  async function onSubmitResult(scoreA: number, scoreB: number) {
    if (!activeMatch) return;
    if ((activeMatch as any).status === "played") return;

    await props.onSubmitResult?.(
      Number((activeMatch as any).id),
      scoreA,
      scoreB,
    );
  }

  // chiamata dal ResultDialog quando premi "Risultato finale"

  async function onFinalizeResult(payload: {
    matchId: number;
    scoreA: number;
    scoreB: number;
    winnerSide: "A" | "B";
    scorersA: Scorer[];
    scorersB: Scorer[];
    participations: MatchParticipationPayload[];
    goalEvents: MatchGoalEventPayload[];
  }) {
    if (!activeMatch) return;
    if (!props.onFinalizeResult) return;
    if ((activeMatch as any).status === "played") return;

    // cache immediata (se backend non rimanda goal_events subito)
    setScorersCache((prev) => ({
      ...prev,
      [payload.matchId]: {
        a: payload.scorersA ?? [],
        b: payload.scorersB ?? [],
      },
    }));

    // optimistic update: status played + score + attach goal events in più shape
    setLocalMatches((prev) =>
      prev.map((m) => {
        if (Number((m as any).id) !== Number(payload.matchId)) return m;
        return {
          ...(m as any),
          status: "played",
          locked: true,
          scoreA: payload.scoreA,
          scoreB: payload.scoreB,

          // IMPORTANTE: attacchiamo su più chiavi per compatibilità
          goalEvents: payload.goalEvents,
          goal_events: payload.goalEvents,
          match_goal_events: payload.goalEvents,
        } as any;
      }),
    );

    await props.onFinalizeResult({
      matchId: payload.matchId,
      scoreA: payload.scoreA,
      scoreB: payload.scoreB,
      participations: payload.participations,
      goalEvents: payload.goalEvents,
    });
    // dopo il save backend
    try {
      const evs = await MatchService.getGoalEvents(payload.matchId);
      setLocalMatches((prev) =>
        prev.map((m) => {
          if (Number((m as any).id) !== Number(payload.matchId)) return m;
          return {
            ...(m as any),
            goalEvents: evs,
            goal_events: evs,
            match_goal_events: evs,
          } as any;
        }),
      );
    } catch {}

    props.onRefresh?.();
  }

  const flowHeightClass = isMobile ? "h-[calc(100vh-220px)]" : "h-[75vh]";
  const flowWidthClass =
    !isMobile && builderMode && sidebarOpen ? "w-[calc(100%-360px)]" : "w-full";

  return (
    <div
      className={cn(
        "w-full",
        builderMode ? "flex gap-4" : "flex justify-center",
        isMobile && "flex-col",
      )}
    >
      <div
        className={cn(
          "relative rounded-2xl border overflow-hidden bg-card",
          flowHeightClass,
          flowWidthClass,
        )}
      >
        <div className="absolute inset-0 bg-linear-to-br from-white via-slate-50 to-slate-100 dark:from-card dark:via-card/95 dark:to-black" />
        <div
          className={cn(
            "absolute -top-24 -left-24 h-72 w-72 rounded-full blur-3xl bg-secondary",
            isMobile ? "opacity-15" : "opacity-20",
          )}
        />
        <div
          className={cn(
            "absolute -bottom-28 -right-28 h-80 w-80 rounded-full blur-3xl bg-primary",
            isMobile ? "opacity-12" : "opacity-18",
          )}
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/5 via-transparent to-black/5" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.0)_25%,rgba(0,0,0,0.06)_92%)]" />

        {builderMode ? (
          <div
            className={cn(
              "absolute z-20",
              isMobile ? "top-3 left-3" : "top-3 right-3",
            )}
          >
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setSidebarOpen((v) => !v)}
              className="gap-2 bg-white/75 backdrop-blur border border-slate-200 hover:bg-white"
            >
              {sidebarOpen ? (
                <>
                  <PanelRightClose className="h-4 w-4" />
                  {isMobile ? "Chiudi" : "Chiudi builder"}
                </>
              ) : (
                <>
                  <PanelRightOpen className="h-4 w-4" />
                  {isMobile ? "Builder" : "Apri builder"}
                </>
              )}
            </Button>
          </div>
        ) : null}

        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={{
            type: "bracket",
            animated: false,
            style: { stroke: "rgba(2,160,221,0.55)", strokeWidth: 2 },
          }}
          fitView
          fitViewOptions={{ padding: isMobile ? 0.35 : 0.2 }}
          minZoom={isMobile ? 0.3 : 0.5}
          maxZoom={isMobile ? 1.6 : 2}
          //se si vuole zoomare di più
          /* minZoom={isMobile ? 0.3 : 1}
          maxZoom={isMobile ? 1.6 : 4} */
          proOptions={{ hideAttribution: true }}
          className="relative"
        >
          <Background
            gap={isMobile ? 32 : 26}
            size={1}
            color="rgba(2,6,23,0.08)"
          />
          <Controls
            showZoom
            showFitView
            showInteractive={false}
            className={cn(
              "bg-white/75 backdrop-blur border-slate-200 text-slate-900",
              isMobile && "scale-110 origin-bottom-left",
            )}
          />
        </ReactFlow>
      </div>

      {builderMode && sidebarOpen && !isMobile ? (
        <TeamsSidebar
          teams={availableTeams as any as BracketTeam[]}
          filled={filled}
          total={slots.length}
          onRandomAssign={shuffleTeams}
          onClear={clearAll}
          onGenerate={() => void props.onGenerate?.(slots)}
          onClose={() => setSidebarOpen(false)}
        />
      ) : null}

      {builderMode && sidebarOpen && isMobile ? (
        <div className="fixed inset-0 z-50">
          <button
            className="absolute inset-0 bg-black/35"
            onClick={() => setSidebarOpen(false)}
            aria-label="Chiudi builder"
          />
          <div className="absolute right-0 top-0 h-full w-[92vw] max-w-[380px] bg-white shadow-2xl border-l">
            <div className="h-14 px-4 flex items-center justify-between border-b">
              <div className="font-extrabold text-slate-900">Builder</div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="h-[calc(100%-56px)] overflow-y-auto">
              <TeamsSidebar
                teams={availableTeams as any as BracketTeam[]}
                filled={filled}
                total={slots.length}
                onRandomAssign={shuffleTeams}
                onClear={clearAll}
                onGenerate={() => {
                  void props.onGenerate?.(slots);
                  setSidebarOpen(false);
                }}
                onClose={() => setSidebarOpen(false)}
              />
            </div>
          </div>
        </div>
      ) : null}

      <ResultDialog
        open={!!activeId}
        onOpenChange={(o) => !o && setActiveId(null)}
        matchId={activeMatch ? Number((activeMatch as any).id) : null}
        locked={locked}
        initialScorersA={locked ? initialScorersA : undefined}
        initialScorersB={locked ? initialScorersB : undefined}
        fetchGoalEvents={async (matchId: number, signal?: AbortSignal) => {
          const res = await MatchService.getGoalEvents(matchId, signal as any);
          if (Array.isArray(res)) return res;
          if (Array.isArray((res as any)?.data)) return (res as any).data;
          if (Array.isArray((res as any)?.data?.data))
            return (res as any).data.data;
          return [];
        }}
        teamA={dialogTeamA.name}
        teamB={dialogTeamB.name}
        logoA={dialogTeamA.logoUrl}
        logoB={dialogTeamB.logoUrl}
        teamAId={dialogTeamA.id}
        teamBId={dialogTeamB.id}
        defaultScoreA={defaultScoreA}
        defaultScoreB={defaultScoreB}
        playersA={playersA.map((p) => ({
          id: p.id,
          name: p.fullName ?? `${p.firstName} ${p.lastName}`,
          avatarUrl: p.avatarUrl ?? null,
        }))}
        playersB={playersB.map((p) => ({
          id: p.id,
          name: p.fullName ?? `${p.firstName} ${p.lastName}`,
          avatarUrl: p.avatarUrl ?? null,
        }))}
        confirmLabel="Conferma risultato finale"
        onSubmit={onSubmitResult}
        onFinalize={onFinalizeResult}
      />
    </div>
  );
}
