import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import type { Team } from "@/features/team/team.type";
import type { ServerPlayer } from "@/features/player/player.type";

import { myFetch } from "@/lib/backend";
import myEnv from "@/lib/env";
import { backendAssetUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

function initials(name: string) {
  const t = name.trim();
  if (!t) return "??";
  return t.slice(0, 2).toUpperCase();
}

function PlayerAvatar(props: {
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
}) {
  const full = `${props.firstName ?? ""} ${props.lastName ?? ""}`.trim();
  return (
    <Avatar className="h-9 w-9">
      <AvatarImage
        src={backendAssetUrl(props.avatarUrl ?? null)}
        alt={full || "Player"}
      />
      <AvatarFallback className="text-[11px] font-semibold">
        {full
          ? full
              .split(" ")
              .map((s) => s[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()
          : "PL"}
      </AvatarFallback>
    </Avatar>
  );
}

export default function TeamPicker8(props: {
  teams: Team[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  max?: number;
}) {
  const max = props.max ?? 8;

  const [activeTeamId, setActiveTeamId] = useState<number | null>(null);

  const selectedSet = useMemo(
    () => new Set(props.selectedIds),
    [props.selectedIds],
  );

  const activeTeam = useMemo(
    () => props.teams.find((t) => t.id === activeTeamId) ?? null,
    [props.teams, activeTeamId],
  );

  // players del team attivo (clicco card)
  const playersQuery = useQuery({
    queryKey: ["players", activeTeamId],
    queryFn: async () => {
      if (!activeTeamId) return [];
      return await myFetch<ServerPlayer[]>(
        `${myEnv.backendApiUrl}/players?team_id=${activeTeamId}`,
      );
    },
    enabled: !!activeTeamId,
    staleTime: 10_000,
  });

  const canAddMore = props.selectedIds.length < max;

  const addTeam = (teamId: number) => {
    if (selectedSet.has(teamId)) return;
    if (!canAddMore) return;
    props.onChange([...props.selectedIds, teamId]);
  };

  const removeTeam = (teamId: number) => {
    if (!selectedSet.has(teamId)) return;

    props.onChange(props.selectedIds.filter((id) => id !== teamId));

    // se sto guardando quel team e lo rimuovo, chiude il dettaglio
    setActiveTeamId((prev) => (prev === teamId ? null : prev));
  };

  const toggleActive = (teamId: number) => {
    setActiveTeamId((prev) => (prev === teamId ? null : teamId));
  };

  // count dinamico nel pannello dettaglio
  const activePlayersCount = playersQuery.data?.length ?? 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[2fr_360px] gap-4">
      {/* LISTA SQUADRE */}
      <div className="space-y-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {props.teams.map((t) => {
            const isSelected = selectedSet.has(t.id);
            const isActive = activeTeamId === t.id;

            return (
              <Card
                key={t.id}
                role="button"
                tabIndex={0}
                onClick={() => toggleActive(t.id)} // toggle dettaglio
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") toggleActive(t.id);
                }}
                className={cn(
                  "bg-card p-3 flex flex-col gap-3 cursor-pointer transition border-muted/60 hover:shadow-sm",
                  isActive && "ring-2 ring-primary/50 bg-muted/30",
                  // card selezionata  verde
                  isSelected && "border-green-500 ring-3 ring-green-500/30",
                )}
              >
                {/* HEADER */}
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="h-14 w-14 rounded-full overflow-hidden border">
                    <AvatarImage
                      className="object-cover"
                      src={backendAssetUrl(t.logoUrl)}
                      alt={t.name}
                    />
                    <AvatarFallback className="rounded-full font-semibold">
                      {initials(t.name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      <p className="text-base font-semibold truncate">
                        {t.name}
                      </p>
                      <Badge className="h-5 shrink-0 text-white">
                        Pronta (5/5)
                      </Badge>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      {isActive
                        ? "Clicca per chiudere"
                        : "Clicca per vedere i giocatori"}
                    </p>
                  </div>
                </div>

                {/* CTA FULL WIDTH */}
                <div className="flex items-center gap-2 w-full">
                  {isSelected ? (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="w-full cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeTeam(t.id);
                      }}
                    >
                      <XCircle className="h-4 w-4" />
                      Rimuovi
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      disabled={!canAddMore}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        addTeam(t.id);
                      }}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Seleziona
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        <div className="pt-2 text-sm text-primary dark:text-white">
          Selezionate:{" "}
          <span className="font-medium">{props.selectedIds.length}</span>/{max}
          {!canAddMore ? (
            <span className="ml-2">• limite raggiunto</span>
          ) : null}
        </div>
      </div>

      {/* DETTAGLIO */}
      <Card className="bg-card p-3 h-fit lg:sticky lg:top-4">
        {!activeTeam ? (
          <div className="text-sm text-primary dark:text-white cursor-pointer">
            Clicca una squadra per vedere i giocatori.
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar className="h-12 w-12 rounded-full overflow-hidden border">
                  <AvatarImage
                    className="object-cover"
                    src={backendAssetUrl(activeTeam.logoUrl)}
                    alt={activeTeam.name}
                  />
                  <AvatarFallback className="rounded-full font-semibold">
                    {initials(activeTeam.name)}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0">
                  <p className="font-semibold truncate">{activeTeam.name}</p>

                  {/* dinamico */}
                  <p className="text-xs text-muted-foreground">
                    Giocatori ({activePlayersCount}/5)
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTeamId(null)}
              >
                Chiudi
              </Button>
            </div>

            <Separator />

            {playersQuery.isPending ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Caricamento giocatori...
              </div>
            ) : playersQuery.isError ? (
              <div className="text-sm text-destructive">
                Errore nel caricamento giocatori
              </div>
            ) : (
              <div className="space-y-2">
                {(playersQuery.data ?? []).map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-3 border rounded-lg px-2 py-2"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <PlayerAvatar
                        firstName={p.first_name}
                        lastName={p.last_name}
                        avatarUrl={p.avatar_url ?? null}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {p.first_name} {p.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Numero: {p.number ?? "-"}
                        </p>
                      </div>
                    </div>

                    <span className="text-xs text-muted-foreground tabular-nums">
                      #{p.number ?? "-"}
                    </span>
                  </div>
                ))}

                {(playersQuery.data ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nessun giocatore trovato.
                  </p>
                ) : null}
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
