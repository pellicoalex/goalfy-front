import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Card, CardContent } from "@/components/ui/card";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Loader2,
  OctagonAlert,
  Trophy,
  TriangleAlert,
  RefreshCcw,
  Lock,
  Save,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";

import { TeamService } from "@/features/team/team.service";
import TeamPicker8 from "@/features/tournment/TeamPicker8";
import { TournamentService } from "@/features/tournment/tournament.service";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

function getErrorMessage(err: unknown, fallback = "Errore generico") {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return fallback;
}

export default function TournamentSetupPage() {
  const params = useParams();
  const tournamentId = Number(params.id);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);

  //  nome torneo editabile
  const [name, setName] = useState("");
  const [nameDirty, setNameDirty] = useState(false);

  //  blocco modifiche se esistono risultati
  const [hasResults, setHasResults] = useState(false);
  const [resultsChecked, setResultsChecked] = useState(false);

  const tournamentQuery = useQuery({
    queryKey: ["tournament", tournamentId],
    queryFn: () => TournamentService.get(tournamentId),
    enabled: Number.isFinite(tournamentId),
    staleTime: 0,
  });

  const readyTeamsQuery = useQuery({
    queryKey: ["teamsReady"],
    queryFn: TeamService.ready,
  });

  const bracketQuery = useQuery({
    queryKey: ["bracket", tournamentId],
    queryFn: () => TournamentService.bracket(tournamentId),
    enabled: Number.isFinite(tournamentId),
    staleTime: 0,
  });

  const hasMatches = (bracketQuery.data?.length ?? 0) > 0;

  // init nome + partecipanti esistenti
  useEffect(() => {
    const t = tournamentQuery.data?.tournament;
    if (t && !nameDirty) {
      setName(t.name ?? "");
    }

    const existing =
      tournamentQuery.data?.participants?.map((p: any) => p.team_id) ?? [];

    if (existing.length && selectedIds.length === 0) {
      setSelectedIds(existing);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournamentQuery.data]);

  //  check risultati (goal events) => blocco modifiche
  useEffect(() => {
    if (!Number.isFinite(tournamentId)) return;

    let alive = true;
    (async () => {
      try {
        const has = await TournamentService.hasResults(tournamentId);
        if (!alive) return;
        setHasResults(Boolean(has));
      } catch {
        // se il check fallisce, per sicurezza NON blocco,
        // ma lo segnaliamo.
        if (!alive) return;
        setHasResults(false);
      } finally {
        if (!alive) return;
        setResultsChecked(true);
      }
    })();

    return () => {
      alive = false;
    };
  }, [tournamentId]);

  const saveMutation = useMutation({
    mutationFn: (teamIds: number[]) =>
      TournamentService.setParticipants({ id: tournamentId, teamIds }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["tournament", tournamentId] });
      toast.success("Partecipanti salvati", {
        description: "Le 8 squadre sono state aggiornate correttamente.",
      });
    },
    onError: (err) => {
      const msg = getErrorMessage(err);
      setActionError(msg);
      toast.error("Errore salvataggio partecipanti", { description: msg });
    },
  });

  const generateMutation = useMutation({
    mutationFn: () => TournamentService.generateBracket(tournamentId),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["bracket", tournamentId] });
      await qc.invalidateQueries({ queryKey: ["tournament", tournamentId] });
      await bracketQuery.refetch();
      toast.success("Brackets generati", {
        description: "Tabellone creato correttamente.",
      });
    },
    onError: (err) => {
      const msg = getErrorMessage(err);
      setActionError(msg);
      toast.error("Errore generazione bracket", { description: msg });
    },
  });

  //  update nome torneo
  const updateNameMutation = useMutation({
    mutationFn: async (newName: string) => {
      const trimmed = newName.trim();
      if (!trimmed) throw new Error("Inserisci un nome valido per il torneo.");
      await TournamentService.update({
        id: tournamentId,
        data: { name: trimmed },
      });
    },
    onSuccess: async () => {
      setNameDirty(false);
      await qc.invalidateQueries({ queryKey: ["tournament", tournamentId] });
      await tournamentQuery.refetch();
      toast.success("Nome aggiornato", {
        description: "Il nome del torneo è stato salvato.",
      });
    },
    onError: (err) => {
      const msg = getErrorMessage(err);
      setActionError(msg);
      toast.error("Errore aggiornamento nome", { description: msg });
    },
  });

  const isBusy =
    saveMutation.isPending ||
    generateMutation.isPending ||
    updateNameMutation.isPending;

  //  blocco modifiche se risultati presenti
  const isLockedByResults = resultsChecked && hasResults;

  const canSave = selectedIds.length === 8 && !isBusy && !isLockedByResults;
  const canGenerate =
    selectedIds.length === 8 && !hasMatches && !isBusy && !isLockedByResults;

  const isLoading =
    tournamentQuery.isPending ||
    readyTeamsQuery.isPending ||
    bracketQuery.isPending ||
    !resultsChecked; // aspetta check risultati

  const tournament = tournamentQuery.data?.tournament;
  const teamsReady = readyTeamsQuery.data ?? [];
  const canGoToBracket = hasMatches;

  const titleLine = useMemo(() => {
    if (!tournament) return "";
    return `${tournament.name} • seleziona 8 squadre pronte (5/5)`;
  }, [tournament]);

  const onRefresh = async () => {
    setActionError(null);
    try {
      await Promise.all([
        tournamentQuery.refetch(),
        readyTeamsQuery.refetch(),
        bracketQuery.refetch(),
      ]);
      // refresh anche check risultati
      try {
        const has = await TournamentService.hasResults(tournamentId);
        setHasResults(Boolean(has));
      } catch {
        setHasResults(false);
      } finally {
        setResultsChecked(true);
      }
    } catch (err) {
      setActionError(getErrorMessage(err, "Errore durante aggiornamento dati"));
    }
  };

  // Stati
  if (isLoading) {
    return (
      <div className="w-full max-w-7xl mx-auto mt-8 px-4 pb-10">
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Loader2 className="animate-spin" />
            </EmptyMedia>
            <EmptyTitle>Caricamento...</EmptyTitle>
            <EmptyDescription>
              Sto caricando torneo, squadre pronte e tabellone
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  if (
    tournamentQuery.isError ||
    readyTeamsQuery.isError ||
    bracketQuery.isError
  ) {
    const err = (tournamentQuery.error ??
      readyTeamsQuery.error ??
      bracketQuery.error) as any;

    return (
      <div className="w-full max-w-7xl mx-auto mt-8 px-4 pb-10">
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <OctagonAlert />
            </EmptyMedia>
            <EmptyTitle>Errore</EmptyTitle>
            <EmptyDescription>
              {err?.message ?? "Errore imprevisto"}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => void onRefresh()}>Riprova</Button>
          </EmptyContent>
        </Empty>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto mt-8 px-4 pb-10 space-y-8">
      {/* HERO */}
      <div
        className={[
          "relative overflow-hidden rounded-[28px] border bg-card",
          "min-h-[220px] sm:min-h-[250px]",
        ].join(" ")}
        style={{ borderColor: "rgba(43,84,146,0.25)" }}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url(/bg-tornei.png)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        />
        <div className="absolute inset-0 bg-linear-to-r from-background/80 via-background/90 to-background/80" />
        <div
          className="pointer-events-none absolute -inset-10 blur-3xl"
          style={{
            background:
              "radial-gradient(circle_at_10%_10%, rgba(2,160,221,0.22), transparent 60%)," +
              "radial-gradient(circle_at_80%_20%, rgba(43,84,146,0.18), transparent 60%)",
          }}
        />

        <div className="relative p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <p className="text-[11px] text-primary dark:text-white uppercase tracking-widest font-semibold flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                GOALFY • Tournament Setup
              </p>

              <h1 className="mt-2 font-extrabold text-4xl sm:text-5xl tracking-tight text-primary dark:text-white">
                Setup torneo
              </h1>

              <div
                className="mt-3 h-1 w-40 rounded-full"
                style={{
                  background: `linear-gradient(90deg, primary, secondary)`,
                }}
              />

              <p className="mt-4 text-sm sm:text-base text-foreground/80 max-w-2xl">
                {titleLine}
              </p>

              <p className="mt-1 text-xs text-foreground">
                {hasMatches
                  ? "Tabellone già generato: puoi andare direttamente al bracket."
                  : "Il tabellone verrà generato dopo aver selezionato 8 squadre."}
              </p>

              {isLockedByResults ? (
                <p className="mt-2 text-xs text-red-700 font-semibold flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Torneo bloccato: contiene già risultati. Modifiche
                  disabilitate.
                </p>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="border-primary/30 text-primary hover:bg-secondary/10"
                onClick={() => void onRefresh()}
                disabled={
                  tournamentQuery.isFetching ||
                  readyTeamsQuery.isFetching ||
                  bracketQuery.isFetching
                }
              >
                <RefreshCcw
                  className={cn(
                    "mr-2 h-4 w-4",
                    (tournamentQuery.isFetching ||
                      readyTeamsQuery.isFetching ||
                      bracketQuery.isFetching) &&
                      "animate-spin",
                  )}
                />
                Aggiorna
              </Button>

              <Button
                className="bg-primary hover:bg-primary/90 text-white shadow-[0_10px_25px_-14px_rgba(2,160,221,0.55)]"
                disabled={!canGoToBracket}
                onClick={() => navigate(`/tournaments/${tournamentId}`)}
                title={
                  !canGoToBracket ? "Genera prima il tabellone" : undefined
                }
              >
                Vai al tabellone <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ERROR FEEDBACK */}
      {actionError ? (
        <Alert variant="destructive" className="border">
          <TriangleAlert className="h-4 w-4" />
          <AlertTitle>Operazione non riuscita</AlertTitle>
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      ) : null}

      {/*BLOCCO MODIFICHE SE RISULTATI */}
      {isLockedByResults ? (
        <Alert variant="destructive" className="border">
          <Lock className="h-4 w-4" />
          <AlertTitle>Torneo bloccato</AlertTitle>
          <AlertDescription>
            Questo torneo contiene già risultati (goal events). Non puoi
            modificare nome, partecipanti o generare nuovamente il tabellone.
          </AlertDescription>
        </Alert>
      ) : null}

      {/* CARD: NOME TORNEO */}
      <Card
        className="rounded-[22px] border bg-card"
        style={{ borderColor: "rgba(43,84,146,0.25)" }}
      >
        <CardContent className="p-5 sm:p-6">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div className="space-y-2 min-w-[260px] flex-1">
              <Label
                htmlFor="tournament-name"
                className="text-sm font-semibold"
              >
                Nome torneo
              </Label>
              <Input
                id="tournament-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setNameDirty(true);
                }}
                placeholder="Es. Coppa Primavera"
                disabled={isBusy || isLockedByResults}
              />
              <Button
                className="bg-primary hover:bg-primary/90 text-white shadow-[0_10px_25px_-14px_rgba(2,160,221,0.55)]"
                disabled={
                  isBusy ||
                  isLockedByResults ||
                  !nameDirty ||
                  name.trim().length === 0
                }
                onClick={async () => {
                  setActionError(null);
                  try {
                    await updateNameMutation.mutateAsync(name);
                  } catch (err) {
                    setActionError(getErrorMessage(err));
                  }
                }}
                title={
                  isLockedByResults
                    ? "Torneo bloccato: contiene già risultati"
                    : undefined
                }
              >
                {updateNameMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Salva nome
              </Button>
              <p className="text-xs text-foreground/80">
                Cambia il nome e salva. (Disabilitato se ci sono già risultati)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CONTENT */}
      {teamsReady.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>Nessuna squadra pronta</EmptyTitle>
            <EmptyDescription>
              Per partecipare al torneo una squadra deve avere esattamente 5
              giocatori. Vai su “Squadre” e completa i giocatori.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <Card
            className="rounded-[22px] border bg-card"
            style={{ borderColor: "rgba(43,84,146,0.25)" }}
          >
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    Selezionate:{" "}
                    <span className="font-semibold">{selectedIds.length}</span>
                    /8
                  </p>

                  {hasMatches ? (
                    <p className="text-xs text-primary dark:text-white">
                      Tabellone già generato. Se vuoi personalizzarlo, lo farai
                      dal bracket con “Builder” (prima di inserire risultati).
                    </p>
                  ) : selectedIds.length !== 8 ? (
                    <p className="text-xs text-primary dark:text-white">
                      Seleziona esattamente 8 squadre per salvare e generare.
                    </p>
                  ) : null}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="border-primary/30 text-primary hover:bg-secondary/10"
                    disabled={!canSave}
                    onClick={async () => {
                      if (isLockedByResults) {
                        toast.error("Torneo bloccato", {
                          description:
                            "Contiene già risultati: non puoi modificare i partecipanti.",
                        });
                        return;
                      }
                      setActionError(null);
                      try {
                        await saveMutation.mutateAsync(selectedIds);
                      } catch (err) {
                        setActionError(getErrorMessage(err));
                      }
                    }}
                    title={
                      isLockedByResults
                        ? "Torneo bloccato: contiene già risultati"
                        : undefined
                    }
                  >
                    {saveMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Salva partecipanti
                  </Button>

                  {!hasMatches ? (
                    <Button
                      className="bg-secondary hover:bg-secondary/90 text-white shadow-[0_10px_25px_-14px_rgba(2,160,221,0.55)]"
                      disabled={!canGenerate}
                      onClick={async () => {
                        if (isLockedByResults) {
                          toast.error("Torneo bloccato", {
                            description:
                              "Contiene già risultati: non puoi rigenerare il tabellone.",
                          });
                          return;
                        }
                        setActionError(null);
                        try {
                          // salva + genera + vai al bracket
                          await saveMutation.mutateAsync(selectedIds);
                          await generateMutation.mutateAsync();
                          navigate(`/tournaments/${tournamentId}`);
                        } catch (err) {
                          setActionError(getErrorMessage(err));
                        }
                      }}
                      title={
                        isLockedByResults
                          ? "Torneo bloccato: contiene già risultati"
                          : undefined
                      }
                    >
                      {isBusy ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Genera bracket
                    </Button>
                  ) : (
                    <Button
                      className="bg-primary hover:bg-primary/90 text-white shadow-[0_10px_25px_-14px_rgba(2,160,221,0.55)]"
                      onClick={() => navigate(`/tournaments/${tournamentId}`)}
                    >
                      Vai al tabellone <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="rounded-[22px] border bg-card"
            style={{ borderColor: "rgba(43,84,146,0.25)" }}
          >
            <CardContent className="p-4 sm:p-5">
              <TeamPicker8
                teams={teamsReady}
                selectedIds={selectedIds}
                onChange={setSelectedIds}
                max={8}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
