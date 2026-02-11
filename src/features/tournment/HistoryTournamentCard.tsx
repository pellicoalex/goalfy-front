import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  History,
  Loader2,
  Trophy,
} from "lucide-react";
import WinnerStory from "./WinnerStory";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type {
  GoalEvent,
  TournamentPlayer,
} from "@/pages/TournamentHistoryPage";
import type { Match } from "../match/match.type";
import type { Tournament } from "./tournament.type";
import { statusBadge } from "./tournament.utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { backendAssetUrl } from "@/lib/media";

function logoFromMatch(match: Match | null, teamId: number | null) {
  if (!match || !teamId) return null;
  const raw =
    match.teamAId === teamId ? match.teamALogoUrl : match.teamBLogoUrl;
  return raw ? backendAssetUrl(raw) : null;
}

function HistoryTournamentCard(props: {
  t: Tournament;
  isOpen: boolean;
  onToggle: () => void;
  onOpenTournament: () => void;

  loadingPath: boolean;
  pathError: string | null;
  matches: Match[];

  loadingExtras: boolean;
  goals: GoalEvent[];
  players: TournamentPlayer[];
}) {
  const { t, isOpen } = props;

  const winnerName =
    (t as any).winnerName ??
    (t as any).winner_name ??
    (t as any).winnerTeamName ??
    "—";

  // winnerTeamId: da torneo (se presente) oppure dal match di finale quando apri la card
  const finalMatch = props.matches.find((m) => m.round === 3) ?? null;

  const winnerTeamId =
    (t as any).winnerTeamId ??
    (t as any).winner_team_id ??
    finalMatch?.winnerTeamId ??
    null;

  // logo da bracket (quando card aperta)
  const winnerLogoFromBracket = logoFromMatch(finalMatch, winnerTeamId);

  // logo da lista tornei (quando card chiusa) — richiede backend: winner_team_logo_url
  const winnerLogoFromListRaw =
    (t as any).winnerTeamLogoUrl ?? (t as any).winner_team_logo_url ?? null;

  const winnerLogoFromList = winnerLogoFromListRaw
    ? backendAssetUrl(winnerLogoFromListRaw)
    : null;

  // priorità: bracket > list
  const winnerLogo = winnerLogoFromBracket ?? winnerLogoFromList ?? null;

  return (
    <Card
      className="group relative overflow-hidden rounded-[22px] border bg-card transition hover:shadow-lg"
      style={{ borderColor: "rgba(43,84,146,0.25)" }}
    >
      {/* glow */}
      <div
        className="pointer-events-none absolute -inset-10 blur-3xl opacity-80"
        style={{
          background:
            "radial-gradient(circle_at_15%_15%, rgba(2,160,221,0.18), transparent 60%)," +
            "radial-gradient(circle_at_85%_25%, rgba(43,84,146,0.14), transparent 60%)",
        }}
      />

      {/* mini top bar */}
      <div className="relative h-1.5 w-full gradient-primary" />

      <CardContent className="relative p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-primary" />
              <p className="text-[11px] uppercase tracking-widest font-semibold text-primary">
                GOALFY • Storico
              </p>
            </div>

            <h3
              className="truncate font-extrabold text-lg text-primary dark:text-white"
              title={t.name}
            >
              {t.name}
            </h3>

            <p className="text-sm text-foreground/80">
              Eliminazione diretta • 8 squadre
            </p>
          </div>

          {statusBadge(t.status)}
        </div>

        {/* VINCITORE (logo da list o da bracket) */}
        <div className="mt-4 flex items-center gap-2 text-sm text-foreground/80">
          <Trophy className="h-4 w-4 shrink-0 text-primary" />

          <Avatar className="h-12 w-12 ring-1 ring-slate-200 shrink-0">
            <AvatarImage src={winnerLogo ?? undefined} alt={winnerName} />
            <AvatarFallback className="text-[10px] font-bold">
              {winnerName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <span className="truncate">
            Vincitore: <span className="font-semibold">{winnerName}</span>
          </span>
        </div>

        <p className="mt-1 text-xs text-foreground/80">
          Espandi per vedere partite + marcatori e i premi del torneo.
        </p>

        <div className="mt-4 flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            className="w-full sm:w-auto border-primary/30 text-primary hover:bg-secondary/10"
            onClick={props.onOpenTournament}
          >
            Apri torneo <ChevronRight className="ml-2 h-4 w-4" />
          </Button>

          <Button
            className={cn(
              "w-full sm:w-auto",
              "bg-primary hover:bg-primary/90 text-white",
              "shadow-[0_10px_25px_-14px_rgba(2,160,221,0.55)]",
            )}
            onClick={props.onToggle}
          >
            {isOpen ? (
              <>
                <ChevronUp className="mr-2 h-4 w-4" />
                Chiudi dettagli
              </>
            ) : (
              <>
                <ChevronDown className="mr-2 h-4 w-4" />
                Percorso + premi
              </>
            )}
          </Button>
        </div>

        {/* aperta */}
        {isOpen ? (
          <div className="mt-5 pt-5 border-t border-slate-200/70">
            {props.loadingPath ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Caricamento bracket...
              </div>
            ) : props.pathError ? (
              <p className="text-sm text-red-600 font-semibold">
                {props.pathError}
              </p>
            ) : (
              <WinnerStory
                tournament={t}
                matches={props.matches}
                goals={props.goals}
                players={props.players}
                loading={props.loadingExtras}
              />
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default HistoryTournamentCard;
