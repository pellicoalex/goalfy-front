import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";

import { TournamentService } from "@/features/tournment/tournament.service";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import HistoryTournamentCard from "@/features/tournment/HistoryTournamentCard";
import { ChevronRight, History, RefreshCcw } from "lucide-react";

/* TYPES */ //controllare SE

export type WinnerStep = {
  round: 1 | 2 | 3;
  label: "Quarti" | "Semifinale" | "Finale";
  opponentName: string | null;
  scoreFor: number | null;
  scoreAgainst: number | null;
  matchId: number;
};

export type GoalEvent = {
  id: number;
  matchId: number;
  teamId: number;

  scorerPlayerId: number;
  scorerName: string;

  assistPlayerId?: number | null;
  assistName?: string | null;
};

export type TournamentPlayer = {
  id: number;
  firstName?: string | null;
  lastName?: string | null;
  role?: string | null;
  teamId?: number | null;
  teamName?: string | null;
};

/*  componente principale TOURNAMENT HISTORY PAGE */

export default function TournamentHistoryPage() {
  const [openId, setOpenId] = useState<number | null>(null);

  const tournamentsQuery = useQuery({
    queryKey: ["tournaments"],
    queryFn: TournamentService.list,
    staleTime: 10_000,
  });

  const completed = useMemo(() => {
    const all = tournamentsQuery.data ?? [];
    return all.filter((t) => t.status === "completed");
  }, [tournamentsQuery.data]);

  const bracketQuery = useQuery({
    queryKey: ["bracket", openId],
    queryFn: () => TournamentService.bracket(openId!),
    enabled: openId !== null,
    staleTime: 0,
  });

  const goalsQuery = useQuery({
    queryKey: ["tournament-goals", openId],
    queryFn: () => TournamentService.goalEvents(openId!),
    enabled: openId !== null,
    staleTime: 0,
  });

  const playersQuery = useQuery({
    queryKey: ["tournament-players", openId],
    queryFn: () => TournamentService.players(openId!),
    enabled: openId !== null,
    staleTime: 0,
  });

  useEffect(() => {
    if (openId == null) return;
    if (!completed.some((t) => t.id === openId)) setOpenId(null);
  }, [completed, openId]);

  const openMatches = openId != null ? (bracketQuery.data ?? []) : [];
  const openGoals =
    openId != null && goalsQuery.data ? (goalsQuery.data as GoalEvent[]) : [];

  const matchesWithGoals = useMemo(() => {
    if (openId == null) return [];

    const byMatch = new Map<number, GoalEvent[]>();
    for (const g of openGoals ?? []) {
      const mid = Number((g as any).matchId ?? (g as any).match_id ?? 0);
      if (!mid) continue;
      if (!byMatch.has(mid)) byMatch.set(mid, []);
      byMatch.get(mid)!.push(g);
    }

    return (openMatches ?? []).map((m: any) => {
      const mid = Number(m.id ?? 0);
      const evs = byMatch.get(mid) ?? [];
      return {
        ...m,
        goal_events: evs,
        goalEvents: evs,
        match_goal_events: evs,
        goals: evs,
      };
    });
  }, [openId, openMatches, openGoals]);

  const hero = (
    <div className="relative overflow-hidden rounded-[28px] border bg-card">
      <div
        className="pointer-events-none absolute -inset-10 blur-3xl"
        style={{
          background:
            "radial-gradient(circle_at_10%_10%, rgba(2,160,221,0.22), transparent 60%)," +
            "radial-gradient(circle_at_80%_20%, rgba(43,84,146,0.18), transparent 60%)",
        }}
      />

      <div className="relative p-6 sm:p-8 flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <p className="text-primary dark:text-white text-[11px] uppercase tracking-widest font-semibold flex items-center gap-2">
            <History className="h-4 w-4" />
            GOALFY • Storico tornei
          </p>

          <h1 className="mt-2 font-extrabold text-3xl sm:text-4xl tracking-tight text-primary dark:text-white">
            Storico
          </h1>

          <div className="mt-3 h-1 w-36 rounded-full gradient-primary" />

          <p className="mt-4 text-sm sm:text-base text-foreground/80 max-w-xl">
            Qui trovi solo i tornei{" "}
            <span className="font-semibold">conclusi</span>: vincitore, partite
            (quarti → semi → finale), marcatori e premi.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="border-primary/30 text-primary hover:bg-secondary/10"
            onClick={() => tournamentsQuery.refetch()}
            disabled={tournamentsQuery.isFetching}
          >
            <RefreshCcw
              className={cn(
                "mr-2 h-4 w-4",
                tournamentsQuery.isFetching && "animate-spin",
              )}
            />
            Aggiorna
          </Button>

          <Button
            className="bg-primary hover:bg-primary/90 text-white shadow-[0_10px_25px_-14px_rgba(2,160,221,0.55)]"
            nativeButton={false}
            render={<Link to="/tournament" />}
          >
            Lista Tornei <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  // Stati base
  if (tournamentsQuery.isPending) {
    return (
      <div className="w-full max-w-7xl mx-auto mt-8 px-4 pb-12 space-y-8">
        {hero}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card
              key={i}
              className="relative overflow-hidden rounded-[22px] border bg-white"
              style={{ borderColor: "rgba(43,84,146,0.25)" }}
            >
              <CardContent className="p-6 space-y-3">
                <div className="h-5 w-2/3 rounded bg-slate-200 animate-pulse" />
                <div className="h-4 w-1/2 rounded bg-slate-200 animate-pulse" />
                <div className="h-10 w-full rounded bg-slate-200 animate-pulse mt-4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (tournamentsQuery.isError) {
    return (
      <div className="w-full max-w-7xl mx-auto mt-8 px-4 pb-12 space-y-8">
        {hero}
        <div
          className="rounded-2xl border p-4 bg-white"
          style={{ borderColor: "rgba(43,84,146,0.25)" }}
        >
          <p className="text-sm text-red-600 font-semibold">
            Errore caricamento tornei
          </p>
          <p className="text-sm text-gray-700 mt-1">
            {(tournamentsQuery.error as any)?.message ?? "Errore imprevisto"}
          </p>
          <div className="mt-3">
            <Button
              className="bg-secondary hover:bg-secondary/90 text-white"
              onClick={() => tournamentsQuery.refetch()}
            >
              Riprova <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto mt-8 px-4 pb-12 space-y-8">
      {hero}

      {completed.length === 0 ? (
        <div
          className="rounded-2xl border p-6 bg-white"
          style={{ borderColor: "rgba(43,84,146,0.25)" }}
        >
          <p className="font-extrabold text-lg text-primary">
            Nessun torneo completato
          </p>
          <p className="text-sm text-gray-700 mt-2">
            Quando un torneo termina, qui vedrai il vincitore e tutti i
            dettagli.
          </p>
          <div className="mt-4 flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              className="border-primary/30 text-primary hover:bg-secondary/10"
            >
              <Link to="/tournaments">Vai alla lista</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6 items-start">
          {completed.map((t) => {
            const isOpen = openId === t.id;

            const loadingPath = bracketQuery.isPending && isOpen;
            const pathError =
              bracketQuery.isError && isOpen
                ? ((bracketQuery.error as any)?.message ?? "Errore bracket")
                : null;

            const matches = isOpen ? (bracketQuery.data ?? []) : [];

            const loadingExtras =
              isOpen &&
              (goalsQuery.isPending ||
                playersQuery.isPending ||
                goalsQuery.isFetching ||
                playersQuery.isFetching);

            const goals =
              isOpen && goalsQuery.data ? (goalsQuery.data as GoalEvent[]) : [];
            const players =
              isOpen && playersQuery.data
                ? (playersQuery.data as any[]).map((p) => ({
                    id: Number(p.id),
                    firstName: p.first_name ?? p.firstName ?? null,
                    lastName: p.last_name ?? p.lastName ?? null,
                    role: p.role ?? null,
                    teamId: Number(p.team_id ?? p.teamId ?? 0) || null,
                    teamName: p.team_name ?? p.teamName ?? null,
                    avatarUrl: p.avatar_url ?? p.avatarUrl ?? null,
                  }))
                : [];

            return (
              <div
                key={t.id}
                className={cn(
                  "self-start h-fit",
                  "md:col-span-2 lg:col-span-2",
                )}
              >
                <HistoryTournamentCard
                  t={t}
                  isOpen={isOpen}
                  onToggle={() =>
                    setOpenId((prev) => (prev === t.id ? null : t.id))
                  }
                  onOpenTournament={() => {
                    window.location.href = `/tournaments/${t.id}`;
                  }}
                  loadingPath={loadingPath}
                  pathError={pathError}
                  matches={matchesWithGoals}
                  goals={goals}
                  players={players}
                  loadingExtras={loadingExtras}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
