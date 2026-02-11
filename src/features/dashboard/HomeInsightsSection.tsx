import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router";
import {
  Users,
  Trophy,
  Activity,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  LoaderPinwheel,
  UserPlus,
} from "lucide-react";

import { TeamService } from "@/features/team/team.service";
import { TournamentService } from "@/features/tournment/tournament.service";
import type { Team } from "@/features/team/team.type";
import type { Tournament } from "@/features/tournment/tournament.type";
import type { Player, ServerPlayer } from "@/features/player/player.type";
import { serverPlayerToPlayer } from "@/features/player/player.type";
import { myFetch } from "@/lib/backend";
import myEnv from "@/lib/env";
import { safeDate, timeAgo } from "./homeInsights.utils";
import KpiCard from "./KpiCard";
import GoalfyCardShell from "./GoalfyCardShell";
import GoalfyRadarDefs from "./GoalfyRadarDefs";
import { AvatarCircle, Equalizer, LogoCircle } from "./MiniAvatars";

async function fetchPlayersAll(): Promise<Player[]> {
  const rows = await myFetch<ServerPlayer[]>(`${myEnv.backendApiUrl}/players`);
  return rows.map(serverPlayerToPlayer);
}

export default function HomeInsightsSection() {
  const teamsQ = useQuery({
    queryKey: ["home", "teams"],
    queryFn: () => TeamService.list(),
  });
  const tournamentsQ = useQuery({
    queryKey: ["home", "tournaments"],
    queryFn: () => TournamentService.list(),
  });
  const playersQ = useQuery({
    queryKey: ["home", "players"],
    queryFn: fetchPlayersAll,
  });

  const computed = useMemo(() => {
    const teams: Team[] = teamsQ.data ?? [];
    const tournaments: Tournament[] = tournamentsQ.data ?? [];
    const players: Player[] = playersQ.data ?? [];

    const teamsLatest = [...teams]
      .sort((a: any, b: any) => {
        const da = safeDate(a.createdAt ?? a.created_at)?.getTime() ?? 0;
        const db = safeDate(b.createdAt ?? b.created_at)?.getTime() ?? 0;
        return db - da;
      })
      .slice(0, 5);

    const tournamentsLatest = [...tournaments]
      .sort(
        (a, b) =>
          (safeDate(b.startDate)?.getTime() ?? 0) -
          (safeDate(a.startDate)?.getTime() ?? 0),
      )
      .slice(0, 5);

    const playersLatest = [...players].sort((a, b) => b.id - a.id).slice(0, 6);

    const draft = tournaments.filter((t) => t.status === "draft").length;
    const ongoing = tournaments.filter((t) => t.status === "ongoing").length;
    const completed = tournaments.filter(
      (t) => t.status === "completed",
    ).length;

    const days = Array.from({ length: 30 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      d.setHours(0, 0, 0, 0);
      return d;
    });

    const byDay30 = days.map((d) => {
      const count = tournaments.filter((t) => {
        const dt = safeDate(t.startDate);
        return (
          !!dt &&
          dt.getFullYear() === d.getFullYear() &&
          dt.getMonth() === d.getMonth() &&
          dt.getDate() === d.getDate()
        );
      }).length;

      const label = d.toLocaleDateString("it-IT", {
        day: "2-digit",
        month: "2-digit",
      });
      return { day: label, count };
    });

    const withMatches = tournaments.filter((t) => Boolean(t.hasMatches)).length;
    const withResults = tournaments.filter((t) => Boolean(t.hasResults)).length;

    return {
      teamsLatest,
      tournamentsLatest,
      playersLatest,
      teamsTotal: teams.length,
      tournamentsTotal: tournaments.length,
      playersTotal: players.length,
      draft,
      ongoing,
      completed,
      byDay30,
      withMatches,
      withResults,
    };
  }, [teamsQ.data, tournamentsQ.data, playersQ.data]);

  const radarData = useMemo(
    () => [
      { metric: "Draft", value: computed.draft },
      { metric: "In corso", value: computed.ongoing },
      { metric: "Conclusi", value: computed.completed },
    ],
    [computed.draft, computed.ongoing, computed.completed],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-[11px] uppercase tracking-widest font-semibold text-primary dark:text-white flex items-center gap-2">
          <LoaderPinwheel className="h-4 w-4" />
          GOALFY • Dashboard
        </p>
        <h2 className="mt-1 text-xl sm:text-2xl font-extrabold tracking-tight text-primary dark:text-white">
          Insights & storico
        </h2>
        <p className="mt-1 text-sm text-foreground/70">
          Ultimi 30 giorni e nuovi ingressi.
        </p>
      </div>

      {/* KPI */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={<Users className="h-5 w-5" />}
          label="Squadre"
          value={computed.teamsTotal}
          hint={
            computed.teamsLatest[0]?.name
              ? `Ultima: ${computed.teamsLatest[0].name} • ${timeAgo(
                  (computed.teamsLatest[0] as any).createdAt ??
                    (computed.teamsLatest[0] as any).created_at,
                )}`
              : undefined
          }
        />
        <KpiCard
          icon={<Trophy className="h-5 w-5" />}
          label="Tornei"
          value={computed.tournamentsTotal}
          hint={`Con match: ${computed.withMatches} • Con risultati: ${computed.withResults}`}
        />
        <KpiCard
          icon={<Activity className="h-5 w-5" />}
          label="In corso"
          value={computed.ongoing}
        />
        <KpiCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Conclusi"
          value={computed.completed}
        />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Radar */}
        <GoalfyCardShell>
          <CardHeader className="relative pb-2">
            <CardTitle className="text-primary dark:text-white font-bold">
              Stati tornei
            </CardTitle>
          </CardHeader>

          <div className="relative px-6 py-2">
            <div className="h-1.5 w-full rounded-full gradient-primary" />
          </div>

          <CardContent className="relative h-[300px]">
            <GoalfyRadarDefs />

            <div
              className="pointer-events-none absolute inset-0 opacity-70"
              style={{
                background:
                  "radial-gradient(circle_at_50%_40%, rgba(2,160,221,0.22), transparent 55%)," +
                  "radial-gradient(circle_at_70%_70%, rgba(43,84,146,0.14), transparent 60%)",
              }}
            />

            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="78%">
                <PolarGrid gridType="polygon" stroke="rgba(43,84,146,0.18)" />
                <PolarAngleAxis
                  dataKey="metric"
                  tick={{ fontSize: 12, fill: "currentColor" }}
                />
                <PolarRadiusAxis
                  angle={90}
                  allowDecimals={false}
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                />

                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="rounded-xl border bg-card/95 px-3 py-2 shadow-lg">
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className="text-sm font-semibold text-primary">
                          {payload[0].value as any}
                        </p>
                      </div>
                    );
                  }}
                />

                <Radar
                  dataKey="value"
                  stroke="url(#goalfyRadarStroke)"
                  strokeWidth={7}
                  fill="transparent"
                  style={{ filter: "url(#goalfyGlow)" }}
                  isAnimationActive
                />
                <Radar
                  dataKey="value"
                  stroke="rgba(2,160,221,0.65)"
                  strokeWidth={4}
                  fill="transparent"
                  style={{ filter: "url(#goalfyGlow)" }}
                  isAnimationActive
                />
                <Radar
                  dataKey="value"
                  stroke="url(#goalfyRadarStroke)"
                  strokeWidth={2.5}
                  fill="url(#goalfyRadarFill)"
                  fillOpacity={1}
                  isAnimationActive
                />
              </RadarChart>
            </ResponsiveContainer>

            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Totale tornei</p>
                <p className="text-4xl font-extrabold text-foreground">
                  {computed.tournamentsTotal}
                </p>
              </div>
            </div>
          </CardContent>
        </GoalfyCardShell>

        {/* 30 days */}
        <GoalfyCardShell>
          <CardHeader className="relative pb-2">
            <CardTitle className="text-primary dark:text-white font-bold">
              Tornei ultimi 30 giorni
            </CardTitle>
          </CardHeader>

          <div className="relative px-6 py-2">
            <div className="h-1.5 w-full rounded-full gradient-primary" />
          </div>

          <CardContent className="relative h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={computed.byDay30}
                margin={{ left: 8, right: 8, top: 8, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" interval={4} />
                <YAxis allowDecimals={false} width={28} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="count"
                  strokeWidth={2}
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </GoalfyCardShell>
      </div>

      {/* Lista card stessa altezza per team ,tornei e players */}
      <div className="grid lg:grid-cols-3 gap-6 items-stretch">
        {/* Teams */}
        <GoalfyCardShell className="h-[520px]">
          <CardHeader className="relative">
            <CardTitle className="flex gap-2 text-primary dark:text-white font-bold">
              <Sparkles className="h-4 w-4 text-primary dark:text-white" />
              Ultime squadre
            </CardTitle>
          </CardHeader>

          <div className="relative px-6 py-3">
            <div className="h-1.5 w-full rounded-full gradient-primary" />
          </div>

          <CardContent className="relative p-6 pt-4 h-full">
            <div className="relative">
              <div className="space-y-3 overflow-hidden max-h-[310px]">
                {computed.teamsLatest.map((t: any) => (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22 }}
                    className="flex items-center justify-between gap-3 rounded-xl border bg-card/50 px-3 py-2"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <LogoCircle logoUrl={t.logoUrl} name={t.name} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {t.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {timeAgo(t.createdAt ?? t.created_at)}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      #{t.id}
                    </span>
                  </motion.div>
                ))}
              </div>

              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-background via-background/80 to-transparent dark:from-card dark:via-card/90" />
            </div>

            <div className="absolute left-6 right-6 bottom-6">
              <Button
                render={<Link to="/teams" />}
                className="w-full h-11 text-white bg-primary hover:bg-primary/90"
              >
                Vai alle squadre <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </GoalfyCardShell>

        {/* Tournaments */}
        <GoalfyCardShell className="h-[520px]">
          <CardHeader className="relative">
            <CardTitle className="text-primary dark:text-white font-bold flex gap-2">
              <Sparkles className="h-4 w-4 text-primary dark:text-white" />
              Ultimi tornei
            </CardTitle>
          </CardHeader>

          <div className="relative px-6 py-3">
            <div className="h-1.5 w-full rounded-full gradient-primary" />
          </div>

          <CardContent className="relative p-6 pt-4 h-full">
            <div className="relative">
              <div className="space-y-3 overflow-hidden max-h-[310px]">
                {computed.tournamentsLatest.map((t) => (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22 }}
                    className="flex items-center justify-between gap-3 rounded-xl border bg-card/50 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{t.name}</p>
                      <p className="text-xs text-muted-foreground flex flex-wrap items-center gap-1">
                        <span>
                          {t.status} • {t.startDate}
                        </span>
                        {t.status === "completed" && t.winnerName ? (
                          <span className="inline-flex items-center gap-1">
                            <span>•</span>
                            <Trophy className="h-3.5 w-3.5 text-primary" />
                            <span className="font-medium">{t.winnerName}</span>
                          </span>
                        ) : null}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      #{t.id}
                    </span>
                  </motion.div>
                ))}
              </div>

              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-background via-background/80 to-transparent dark:from-card dark:via-card/90" />
            </div>

            <div className="absolute left-6 right-6 bottom-6">
              <Button
                render={<Link to="/tournaments" />}
                className="w-full h-11 text-white bg-primary hover:bg-primary/90"
              >
                Vai ai tornei <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </GoalfyCardShell>

        {/* Players */}
        <GoalfyCardShell className="h-[520px]">
          <CardHeader className="relative">
            <CardTitle className="text-base flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-primary dark:text-white font-bold">
                <Sparkles className="h-4 w-4 text-primary dark:text-white" />
                Ultimi players in GOALFY
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-muted-foreground bg-card/60">
                <Equalizer />
                vibe
              </span>
            </CardTitle>
          </CardHeader>

          <div className="relative px-6 py-3">
            <div className="h-1.5 w-full rounded-full gradient-primary" />
          </div>

          <CardContent className="relative p-6 pt-4 h-full">
            <div className="flex items-center justify-between gap-3 rounded-2xl border bg-card/50 p-3">
              <div className="flex -space-x-2">
                {computed.playersLatest.slice(0, 5).map((p: any) => (
                  <div
                    key={p.id}
                    className="ring-2 ring-background rounded-full"
                  >
                    <AvatarCircle
                      avatarUrl={p.avatarUrl ?? null}
                      label={p.firstName ?? "P"}
                    />
                  </div>
                ))}
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Player totali</p>
                <p className="text-2xl font-extrabold">
                  {computed.playersTotal}
                </p>
              </div>
            </div>

            <div className="relative mt-4">
              <div className="space-y-3 overflow-hidden max-h-[250px]">
                {computed.playersLatest.map((p: any) => {
                  const full =
                    (p.fullName ??
                      `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim()) ||
                    `Player #${p.id}`;

                  return (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.22 }}
                      className="flex items-center justify-between gap-3 rounded-xl border bg-card/50 px-3 py-2"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <AvatarCircle
                          avatarUrl={p.avatarUrl ?? null}
                          label={p.firstName ?? "P"}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">
                            {full}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {p.role ? p.role : "Player"} • #{p.number ?? "—"} •
                            Team ID: {p.teamId ?? p.team_id ?? "—"}
                          </p>
                        </div>
                      </div>

                      <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-muted-foreground bg-card/70">
                        <UserPlus className="h-3.5 w-3.5" />
                        new
                      </span>
                    </motion.div>
                  );
                })}
              </div>

              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-background via-background/80 to-transparent dark:from-card dark:via-card/90" />
            </div>
          </CardContent>
        </GoalfyCardShell>
      </div>
    </div>
  );
}
