import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import { PlayerService } from "@/features/player/player.service";
import { backendAssetUrl } from "@/lib/media";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import BigStat from "@/features/player/BigStat";
import SkillBar from "@/features/player/SkillBar";
import TechTag from "@/features/player/TechTag";
import {
  ArrowLeft,
  BadgeCheck,
  Calendar,
  Flag,
  Loader2,
  LoaderPinwheel,
  Ruler,
  User,
  Weight,
} from "lucide-react";
import { Link, useParams } from "react-router";

function initials(first?: string | null, last?: string | null) {
  const f = (first ?? "").trim();
  const l = (last ?? "").trim();
  const s = `${f} ${l}`.trim();
  if (!s) return "PL";
  return s
    .split(" ")
    .filter(Boolean)
    .map((x) => x[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// valori “random” stabili per player

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function stat60to100(rand: () => number) {
  return 60 + Math.floor(rand() * 41);
}

/** row dato con icona */
function InfoRow(props: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div
      className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2"
      style={{
        borderColor: "rgba(43,84,146,0.20)",
        background:
          "linear-gradient(180deg, rgba(2,160,221,0.07), rgba(43,84,146,0.03))",
      }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border text-primary"
          style={{
            borderColor: "rgba(2,160,221,0.25)",
            background: "rgba(2,160,221,0.10)",
          }}
        >
          {props.icon}
        </span>

        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            {props.label}
          </p>
          <p className="text-sm font-semibold truncate text-primary">
            {props.value}
          </p>
        </div>
      </div>
    </div>
  );
}

// stats (quando backend le manda)
type PlayerStats = {
  matches: number;
  goals: number;
  assists: number;
};

export default function PlayerPage() {
  const params = useParams();
  const playerId = Number(params.id);

  const query = useQuery({
    queryKey: ["playerDetail", playerId],
    queryFn: () => PlayerService.get(playerId),
    enabled: Number.isFinite(playerId),
    staleTime: 10_000,
  });

  const [animateBars, setAnimateBars] = useState(false);

  useEffect(() => {
    setAnimateBars(false);
    const t = setTimeout(() => setAnimateBars(true), 80);
    return () => clearTimeout(t);
  }, [playerId]);

  const fullName = useMemo(() => {
    const p = query.data?.player;
    if (!p) return "";
    return `${p.firstName} ${p.lastName}`.trim();
  }, [query.data]);

  if (query.isPending) {
    return (
      <div className="w-full max-w-6xl mx-auto mt-8 px-4 pb-6">
        <Card
          className="p-6 border"
          style={{ borderColor: "rgba(43,84,146,0.2)" }}
        >
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Caricamento scheda giocatore...
          </div>
        </Card>
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="w-full max-w-6xl mx-auto mt-8 px-4 pb-6">
        <Card
          className="p-6 border"
          style={{ borderColor: "rgba(43,84,146,0.2)" }}
        >
          <p className="text-destructive">
            {(query.error as any)?.message ?? "Errore caricamento giocatore"}
          </p>
          <Button
            variant="outline"
            className="mt-3 border-primary/30 text-primary hover:bg-secondary/10"
            onClick={() => query.refetch()}
          >
            Riprova
          </Button>
        </Card>
      </div>
    );
  }

  const { player: p, team: t } = query.data!;

  // stats “random” ma stabili (skills)
  const rng = mulberry32(Number.isFinite(playerId) ? playerId * 1337 : 1337);
  const tecnica = stat60to100(rng);
  const tiro = stat60to100(rng);
  const velocita = stat60to100(rng);
  const passaggio = stat60to100(rng);
  const overall = Math.round((tecnica + tiro + velocita + passaggio) / 4);

  // stats reali (quando backend disponibili)
  const stats: PlayerStats | null =
    (p as any)?.stats &&
    typeof (p as any).stats === "object" &&
    (p as any).stats !== null
      ? ({
          matches: Number((p as any).stats.matches ?? 0),
          goals: Number((p as any).stats.goals ?? 0),
          assists: Number((p as any).stats.assists ?? 0),
        } as PlayerStats)
      : null;

  // Mostra "—" solo se stats non ci sono proprio
  const matches = stats ? stats.matches : "—";
  const goals = stats ? stats.goals : "—";
  const assists = stats ? stats.assists : "—";

  const roleLabel = p.role ?? "—";

  return (
    <div className="w-full max-w-6xl mx-auto mt-8 px-4 pb-10 space-y-4">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3">
        <Link to="/teams">
          <Button
            variant="outline"
            className="border-primary/30 text-primary hover:bg-secondary/10 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Torna alle squadre
          </Button>
        </Link>

        <div className="text-right">
          <p className="text-xs text-muted-foreground dark:text-white">
            Scheda giocatore
          </p>
          <h1 className="font-extrabold text-2xl text-primary">{fullName}</h1>
        </div>
      </div>

      {/* CARD “TRADING”*/}
      <div className="relative">
        {/* glow/backdrop */}
        <div
          className="pointer-events-none absolute -inset-6 rounded-[34px] blur-3xl"
          style={{
            background:
              "radial-gradient(circle_at_14%_15%, rgba(2,160,221,0.28), transparent 58%)," +
              "radial-gradient(circle_at_88%_18%, rgba(43,84,146,0.18), transparent 60%)," +
              "radial-gradient(circle_at_50%_110%, rgba(2,160,221,0.12), transparent 65%)",
          }}
        />

        <Card
          className="relative overflow-hidden rounded-[28px] border shadow-xl"
          style={{
            // backgroundColor: "#FBFAFA",
            borderColor: "rgba(43,84,146,0.25)",
            boxShadow: "0 18px 80px -55px rgba(2,160,221,0.50)",
          }}
        >
          {/* cornici */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 opacity-[0.22] [background:linear-gradient(to_right,rgba(43,84,146,0.18)_1px,transparent_1px),linear-gradient(to_bottom,rgba(2,160,221,0.16)_1px,transparent_1px)] [background-size:28px_28px]" />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(135deg, rgba(2,160,221,0.10), transparent 38%, rgba(43,84,146,0.10))",
              }}
            />
            <div
              className="absolute -top-24 -left-24 h-72 w-72 rotate-12 rounded-[56px] border bg-white/50 dark:bg-white/5"
              style={{ borderColor: "rgba(2,160,221,0.18)" }}
            />
            <div
              className="absolute -bottom-24 -right-24 h-72 w-72 -rotate-12 rounded-[56px] border bg-white/40 dark:bg-white/5"
              style={{ borderColor: "rgba(43,84,146,0.16)" }}
            />
          </div>

          <div className="relative grid grid-cols-1 lg:grid-cols-[1fr_1.15fr]">
            {/* LEFT PANEL */}
            <div className="p-6 lg:p-8">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p
                    className="text-[11px] uppercase tracking-widest font-extrabold"
                    style={{ color: "rgba(43,84,146,0.85)" }}
                  >
                    GOALFY • PLAYER CARD
                  </p>

                  <h2 className="mt-2 text-3xl font-extrabold leading-tight truncate text-primary">
                    {fullName}
                  </h2>

                  <div className="mt-2 flex items-center gap-2">
                    <TechTag>{roleLabel}</TechTag>

                    <span
                      className="text-primary dark:text-white inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-extrabold"
                      style={{
                        borderColor: "rgba(2,160,221,0.25)",
                        background: "rgba(2,160,221,0.10)",
                      }}
                      title="Numero maglia"
                    >
                      <BadgeCheck className="h-4 w-4" />#{p.number ?? "—"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <Avatar
                    className="h-12 w-12 rounded-full overflow-hidden border bg-card"
                    style={{ borderColor: "rgba(2,160,221,0.22)" }}
                  >
                    <AvatarImage
                      className="object-cover"
                      src={backendAssetUrl(t.logoUrl ?? null)}
                      alt={t.name}
                    />
                    <AvatarFallback className="font-semibold">
                      {t.name?.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>

              <div className="mt-5 flex items-center gap-4">
                <div className="relative">
                  <div
                    className="absolute -inset-2 rounded-full blur-xl"
                    style={{ backgroundColor: "rgba(2,160,221,0.22)" }}
                  />
                  <div
                    className="relative rounded-full border p-1 bg-card"
                    style={{ borderColor: "rgba(43,84,146,0.22)" }}
                  >
                    <Avatar className="h-16 w-16 rounded-full overflow-hidden">
                      <AvatarImage
                        className="object-cover"
                        src={backendAssetUrl(p.avatarUrl ?? null)}
                        alt={fullName || "Player"}
                      />
                      <AvatarFallback className="text-lg font-extrabold text-primary dark:text-white">
                        {initials(p.firstName, p.lastName)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>

                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Squadra</p>
                  <p className="font-extrabold truncate text.primary">
                    {t.name}
                  </p>
                </div>
              </div>

              <div
                className="my-6 h-px"
                style={{
                  background:
                    "linear-gradient(to right, transparent, rgba(2,160,221,0.55), transparent)",
                }}
              />

              <div className="grid grid-cols-1 gap-2">
                <InfoRow
                  icon={<User className="h-4 w-4" />}
                  label="Nazionalità"
                  value={p.nationality ?? "—"}
                />
                <InfoRow
                  icon={<Calendar className="h-4 w-4" />}
                  label="Data di nascita"
                  value={p.birthDate ?? "—"}
                />
                <InfoRow
                  icon={<Flag className="h-4 w-4" />}
                  label="Ruolo"
                  value={p.role ?? "—"}
                />
                <div className="grid grid-cols-2 gap-2">
                  <InfoRow
                    icon={<Ruler className="h-4 w-4" />}
                    label="Altezza"
                    value={p.heightCm ? `${p.heightCm} cm` : "—"}
                  />
                  <InfoRow
                    icon={<Weight className="h-4 w-4" />}
                    label="Peso"
                    value={p.weightKg ? `${p.weightKg} kg` : "—"}
                  />
                </div>
              </div>

              {/*stats reali se presenti */}
              <div className="mt-6 grid grid-cols-3 gap-3">
                <BigStat label="Partite" value={matches} />
                <BigStat label="Gol" value={goals} />
                <BigStat label="Assist" value={assists} />
              </div>
            </div>

            {/* RIGHT PANEL */}
            <div className="relative p-6 lg:p-8">
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "radial-gradient(circle_at_65%_20%, rgba(2,160,221,0.16), transparent 55%)," +
                    "radial-gradient(circle_at_30%_85%, rgba(43,84,146,0.12), transparent 60%)," +
                    "linear-gradient(180deg, rgba(2,160,221,0.06), rgba(255,255,255,0.00) 55%, rgba(43,84,146,0.06))",
                }}
              />

              <div
                className="pointer-events-none absolute right-5 top-5 h-24 w-40 rounded-[22px] border bg-white/55 dark:bg-white/5"
                style={{
                  borderColor: "rgba(2,160,221,0.18)",
                }}
              />
              <div
                className="pointer-events-none absolute left-6 bottom-6 h-24 w-40 rounded-[22px] border bg-white/55 dark:bg-white/5"
                style={{
                  borderColor: "rgba(43,84,146,0.14)",
                }}
              />

              <div className="absolute right-6 top-6">
                <div className="relative">
                  <div
                    className="absolute -inset-4 rounded-3xl blur-xl"
                    style={{ backgroundColor: "rgba(2,160,221,0.22)" }}
                  />
                  <div
                    className="relative rounded-3xl border px-5 py-4 text-center bg-card"
                    style={{
                      borderColor: "rgba(43,84,146,0.24)",
                      boxShadow: "0 18px 60px -50px rgba(2,160,221,0.6)",
                    }}
                  >
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      Overall
                    </p>
                    <p className="text-5xl font-extrabold tabular-nums leading-none text-primary">
                      {overall}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-12 lg:mt-14 flex justify-center">
                <div className="relative">
                  <div
                    className="pointer-events-none absolute -inset-7 rounded-[36px] blur-2xl"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(2,160,221,0.30), rgba(43,84,146,0.16))",
                    }}
                  />

                  <div
                    className="relative rounded-[30px] border bg-card p-4"
                    style={{
                      borderColor: "rgba(2,160,221,0.22)",
                      boxShadow: "0 20px 70px -55px rgba(2,160,221,0.55)",
                    }}
                  >
                    <div className="relative">
                      <div
                        className="pointer-events-none absolute -top-6 -left-6 h-24 w-24 rounded-full border"
                        style={{
                          borderColor: "rgba(2,160,221,0.25)",
                          background: "rgba(2,160,221,0.08)",
                        }}
                      />
                      <div
                        className="pointer-events-none absolute -bottom-6 -right-6 h-28 w-28 rounded-full border"
                        style={{
                          borderColor: "rgba(43,84,146,0.18)",
                          background: "rgba(43,84,146,0.06)",
                        }}
                      />

                      <Avatar
                        className="h-[300px] w-[300px] rounded-[24px] overflow-hidden border bg-card"
                        style={{ borderColor: "rgba(43,84,146,0.22)" }}
                      >
                        <AvatarImage
                          className="object-cover"
                          src={backendAssetUrl(p.avatarUrl ?? null)}
                          alt={fullName || "Player"}
                        />
                        <AvatarFallback className="text-5xl font-extrabold text-primary">
                          {initials(p.firstName, p.lastName)}
                        </AvatarFallback>
                      </Avatar>
                    </div>

                    <div
                      className="mt-4 rounded-2xl border px-4 py-3"
                      style={{
                        borderColor: "rgba(43,84,146,0.18)",
                        background:
                          "linear-gradient(180deg, rgba(2,160,221,0.07), rgba(43,84,146,0.03))",
                      }}
                    >
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                        Player
                      </p>
                      <p className="text-base font-extrabold truncate text-primary">
                        {fullName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {t.name} • #{p.number ?? "—"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <div className="flex items-center gap-2">
                  <LoaderPinwheel className="h-4 w-4 text-secondary" />
                  <p
                    className="text-[11px] uppercase tracking-widest font-extrabold"
                    style={{ color: "rgba(43,84,146,0.85)" }}
                  >
                    Skills
                  </p>
                </div>

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <SkillBar
                    label="Tecnica"
                    value={tecnica}
                    animate={animateBars}
                  />
                  <SkillBar label="Tiro" value={tiro} animate={animateBars} />
                  <SkillBar
                    label="Velocità"
                    value={velocita}
                    animate={animateBars}
                  />
                  <SkillBar
                    label="Passaggio"
                    value={passaggio}
                    animate={animateBars}
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
