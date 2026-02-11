import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, OctagonAlert, TriangleAlert } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";

import BracketFlow from "@/features/bracket/BracketFlow";
import { MatchService } from "@/features/match/match.service";
import type { Team } from "@/features/team/team.type";
import { TournamentService } from "@/features/tournment/tournament.service";
import TournamentHeader from "@/features/tournment/TournamentHeader";

function getErrorMessage(err: unknown, fallback = "Errore generico") {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return fallback;
}

const TournamentPage = () => {
  const params = useParams();
  const tournamentId = Number(params.id);

  const location = useLocation();
  const navigate = useNavigate();

  const isBuilder = new URLSearchParams(location.search).get("builder") === "1";

  const qc = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);

  const tournamentQuery = useQuery({
    queryKey: ["tournament", tournamentId],
    queryFn: () => TournamentService.get(tournamentId),
    enabled: Number.isFinite(tournamentId),
  });

  const bracketQuery = useQuery({
    queryKey: ["bracket", tournamentId],
    queryFn: () => TournamentService.bracket(tournamentId),
    enabled: Number.isFinite(tournamentId),
  });

  const teamsQuery = useQuery({
    queryKey: ["teams"],
    queryFn: () => TournamentService.teamlist(tournamentId),
  });

  const tournament = tournamentQuery.data?.tournament ?? null;
  const matches = bracketQuery.data ?? [];
  const tournamentParticipants = teamsQuery.data ?? [];
  const teams = tournamentParticipants
    .filter((t) => !!t.team)
    .map((t) => t.team) as Team[];

  const hasMatches = matches.length > 0;

  // builder disponibile solo se nessun match è played
  const anyPlayed = matches.some((m: any) => m.status === "played");
  const canOpenBuilder = hasMatches && !anyPlayed;

  // participants arrivano separati dal backend (TournamentService.get)
  const participantIds = useMemo(() => {
    return tournamentQuery.data?.participants?.map((p) => p.team_id) ?? [];
  }, [tournamentQuery.data]);

  const participantTeams = useMemo(() => {
    const map = new Map(teams.map((t: any) => [t.id, t]));
    return participantIds.map((id) => map.get(id)).filter(Boolean);
  }, [teams, participantIds]);

  const hasValidParticipants = participantTeams.length === 8;

  //  Mutation controllare SE
  const generateMutation = useMutation({
    mutationFn: () => TournamentService.generateBracket(tournamentId),
    onSuccess: async () => {
      setActionError(null);
      await qc.invalidateQueries({ queryKey: ["bracket", tournamentId] });
      await qc.invalidateQueries({ queryKey: ["tournament", tournamentId] });
      await bracketQuery.refetch();
    },
    onError: (err) => setActionError(getErrorMessage(err)),
  });

  const setParticipantsMutation = useMutation({
    mutationFn: (teamIds: number[]) =>
      TournamentService.setParticipants({
        id: tournamentId,
        teamIds,
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["tournament", tournamentId] });
    },
    onError: (err) => setActionError(getErrorMessage(err)),
  });

  // Salvataggio (solo score)

  const setResultMutation = useMutation({
    mutationFn: (p: { matchId: number; scoreA: number; scoreB: number }) =>
      MatchService.setResult({
        id: p.matchId,
        scoreA: p.scoreA,
        scoreB: p.scoreB,
      }),
    onSuccess: async () => {
      setActionError(null);
      await qc.invalidateQueries({ queryKey: ["bracket", tournamentId] });
      await qc.invalidateQueries({ queryKey: ["tournament", tournamentId] });
    },
    onError: (err) => setActionError(getErrorMessage(err)),
  });

  const matchUpdateMutation = useMutation({
    mutationFn: (
      matches: {
        id: number;
        teamAId?: number | null;
        teamBId?: number | null;
      }[],
    ) => TournamentService.updateMatches({ id: tournamentId, matches }),
    onSuccess: async () => {
      setActionError(null);
      await qc.invalidateQueries({ queryKey: ["bracket", tournamentId] });
      await qc.invalidateQueries({ queryKey: ["tournament", tournamentId] });
      await bracketQuery.refetch();
      navigate(`/tournaments/${tournamentId}`);
    },
    onError: (err) => setActionError(getErrorMessage(err)),
  });

  // Salvataggio completo (score + presenze + goal events)

  type ParticipationRow = { player_id: number; team_id: number };
  type GoalEventRow = {
    team_id: number;
    scorer_player_id: number;
    assist_player_id?: number | null;
    minute?: number | null;
  };

  function cleanFinalizePayload(p: {
    matchId: number;
    scoreA: number;
    scoreB: number;
    participations?: ParticipationRow[];
    goalEvents?: GoalEventRow[];
  }) {
    const participations =
      (p.participations ?? [])
        .filter((x) => Number(x.player_id) > 0 && Number(x.team_id) > 0)
        .map((x) => ({
          player_id: Number(x.player_id),
          team_id: Number(x.team_id),
        })) || [];

    const goalEvents =
      (p.goalEvents ?? [])
        .filter((g) => Number(g.team_id) > 0 && Number(g.scorer_player_id) > 0)
        .map((g) => ({
          team_id: Number(g.team_id),
          scorer_player_id: Number(g.scorer_player_id),
          assist_player_id:
            g.assist_player_id == null ? null : Number(g.assist_player_id),
          minute: g.minute == null ? null : Number(g.minute),
        })) || [];

    return {
      id: p.matchId,
      scoreA: p.scoreA,
      scoreB: p.scoreB,
      ...(participations.length ? { participations } : {}),
      ...(goalEvents.length ? { goalEvents } : {}),
    };
  }

  const finalizeResultMutation = useMutation({
    mutationFn: async (p: {
      matchId: number;
      scoreA: number;
      scoreB: number;
      participations?: { player_id: number; team_id: number }[];
      goalEvents?: {
        team_id: number;
        scorer_player_id: number;
        assist_player_id?: number | null;
        minute?: number | null;
      }[];
    }) => {
      // sanitize partecipations (evita null/0)
      const participations =
        (p.participations ?? [])
          .filter((x) => Number(x.player_id) > 0 && Number(x.team_id) > 0)
          .map((x) => ({
            player_id: Number(x.player_id),
            team_id: Number(x.team_id),
          })) || [];

      // sanitize goalEvents (evita null/0 + minute ok)
      const goalEvents =
        (p.goalEvents ?? [])
          .filter(
            (g) => Number(g.team_id) > 0 && Number(g.scorer_player_id) > 0,
          )
          .map((g) => ({
            team_id: Number(g.team_id),
            scorer_player_id: Number(g.scorer_player_id),
            assist_player_id:
              g.assist_player_id == null ? null : Number(g.assist_player_id),
            minute: g.minute == null ? null : Number(g.minute),
          })) || [];

      // invia SOLO se presenti (molto importante per evitare insert “strani” lato PHP)
      return MatchService.setResult({
        id: p.matchId,
        scoreA: p.scoreA,
        scoreB: p.scoreB,
        ...(participations.length ? { participations } : {}),
        ...(goalEvents.length ? { goalEvents } : {}),
      });
    },

    onSuccess: async () => {
      setActionError(null);
      await qc.invalidateQueries({ queryKey: ["bracket", tournamentId] });
      await qc.invalidateQueries({ queryKey: ["tournament", tournamentId] });
    },

    onError: (err) => {
      console.error("finalizeResult error", err);
      setActionError(getErrorMessage(err));
    },
  });

  //  Loading
  if (
    tournamentQuery.isPending ||
    bracketQuery.isPending ||
    teamsQuery.isPending
  ) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Loader2 className="animate-spin" />
          </EmptyMedia>
          <EmptyTitle>Caricamento...</EmptyTitle>
          <EmptyDescription>
            Sto caricando torneo, tabellone e squadre
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  //  error
  if (tournamentQuery.isError || bracketQuery.isError || teamsQuery.isError) {
    const err = (tournamentQuery.error ??
      bracketQuery.error ??
      teamsQuery.error) as any;

    return (
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
          <Button
            onClick={() => {
              tournamentQuery.refetch();
              bracketQuery.refetch();
              teamsQuery.refetch();
            }}
          >
            Riprova
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  async function handleGenerateBracketFromHeader() {
    setActionError(null);
    try {
      await generateMutation.mutateAsync();
      await bracketQuery.refetch();
    } catch (err) {
      setActionError(getErrorMessage(err));
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto mt-8 px-4 pb-6 space-y-4">
      {tournament ? (
        <TournamentHeader
          tournament={tournament}
          hasBracket={hasMatches}
          onRefresh={() => bracketQuery.refetch()}
          onGenerateBracket={handleGenerateBracketFromHeader}
          isRefreshing={bracketQuery.isFetching}
          isGenerating={generateMutation.isPending}
          isBuilder={isBuilder}
          canOpenBuilder={canOpenBuilder}
          onToggleBuilder={() => {
            if (isBuilder) {
              navigate(`/tournaments/${tournamentId}`);
            } else {
              navigate(`/tournaments/${tournamentId}?builder=1`);
            }
          }}
        />
      ) : null}

      {actionError ? (
        <Alert variant="destructive" className="border">
          <TriangleAlert className="h-4 w-4" />
          <AlertTitle>Operazione non riuscita</AlertTitle>
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      ) : null}

      {/* CONTENUTO */}
      {!hasMatches ? (
        hasValidParticipants ? (
          <Empty className="border">
            <EmptyHeader>
              <EmptyTitle>Nessun tabellone</EmptyTitle>
              <EmptyDescription>
                Hai già 8 partecipanti salvati, ma il bracket non è stato ancora
                generato. Puoi generarlo ora oppure tornare al setup.
              </EmptyDescription>
            </EmptyHeader>

            <EmptyContent className="flex gap-2 flex-wrap">
              <Button
                onClick={() => void handleGenerateBracketFromHeader()}
                disabled={generateMutation.isPending}
              >
                {generateMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Genera bracket
              </Button>

              <Link to={`/tournaments/${tournamentId}/setup`}>
                <Button variant="outline">Vai al setup</Button>
              </Link>
            </EmptyContent>
          </Empty>
        ) : (
          <Empty className="border">
            <EmptyHeader>
              <EmptyTitle>Nessun tabellone</EmptyTitle>
              <EmptyDescription>
                Devi prima impostare 8 squadre nel setup del torneo.
              </EmptyDescription>
            </EmptyHeader>

            <EmptyContent>
              <Link to={`/tournaments/${tournamentId}/setup`}>
                <Button variant="outline">Vai al setup</Button>
              </Link>
            </EmptyContent>
          </Empty>
        )
      ) : isBuilder ? (
        <BracketFlow
          tournamentId={tournamentId}
          matches={matches}
          teams={teams}
          builderMode
          onGenerate={async (slots) => {
            setActionError(null);

            if (slots.length !== 4) {
              setActionError(
                "Devi assegnare tutte le 8 squadre prima di salvare il tabellone.",
              );
              return;
            }

            if (!canOpenBuilder) {
              setActionError(
                "Non puoi modificare il bracket dopo aver inserito risultati.",
              );
              return;
            }

            try {
              // 1) salvo ordine partecipanti
              matchUpdateMutation.mutate(slots);
            } catch (err) {
              setActionError(getErrorMessage(err));
            }
          }}
        />
      ) : (
        <BracketFlow
          tournamentId={tournamentId}
          matches={matches}
          teams={teams}
          onSubmitResult={async (matchId, scoreA, scoreB) => {
            setActionError(null);
            try {
              await setResultMutation.mutateAsync({ matchId, scoreA, scoreB });
              await bracketQuery.refetch();
            } catch (err) {
              setActionError(getErrorMessage(err));
            }
          }}
          onFinalizeResult={async ({
            matchId,
            scoreA,
            scoreB,
            participations,
            goalEvents,
          }) => {
            setActionError(null);
            try {
              // USA LA MUTATION “PULITA”
              await finalizeResultMutation.mutateAsync({
                matchId,
                scoreA,
                scoreB,
                participations,
                goalEvents,
              });

              await bracketQuery.refetch();
            } catch (err) {
              setActionError(getErrorMessage(err));
            }
          }}
        />
      )}
    </div>
  );
};

export default TournamentPage;
