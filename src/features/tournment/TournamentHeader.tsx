import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Loader2, RefreshCw, Brackets, Trophy, Wrench } from "lucide-react";
import type { Tournament } from "./tournament.type";

type Props = {
  tournament: Tournament;
  hasBracket: boolean;

  onRefresh?: () => void;
  onGenerateBracket?: () => void;

  isRefreshing?: boolean;
  isGenerating?: boolean;

  isBuilder?: boolean;
  canOpenBuilder?: boolean; // true solo se bracket quindi modalità builder con Drag esiste e nessun match played
  onToggleBuilder?: () => void; // entra/esci da builder controllare SE
};

function StatusBadge({ status }: { status: Tournament["status"] }) {
  if (status === "completed") {
    return (
      <Badge className="bg-emerald-600/15 text-emerald-700 border border-emerald-600/25">
        Concluso
      </Badge>
    );
  }

  if (status === "ongoing") {
    return (
      <Badge className="bg-amber-500/15 text-amber-700 border border-amber-500/25">
        In corso
      </Badge>
    );
  }

  return (
    <Badge className="bg-sky-500/15 text-sky-700 border border-sky-500/25">
      In programma
    </Badge>
  );
}

export default function TournamentHeader({
  tournament,
  hasBracket,
  onRefresh,
  onGenerateBracket,
  isRefreshing,
  isGenerating,

  isBuilder,
  canOpenBuilder,
  onToggleBuilder,
}: Props) {
  const dateLabel = (() => {
    try {
      return new Date(tournament.startDate).toLocaleString();
    } catch {
      return "";
    }
  })();

  const showBuilderButton = hasBracket; // il builder ha senso solo se c'è già un tabellone

  return (
    <Card
      className="rounded-[22px] border bg-card"
      style={{ borderColor: "rgba(43,84,146,0.25)" }}
    >
      <CardHeader className="space-y-2">
        <CardTitle className="flex items-center justify-between gap-3">
          <span
            className="truncate text-lg sm:text-xl font-extrabold text-primary dark:text-white"
            title={tournament.name}
          >
            {tournament.name}
          </span>

          <StatusBadge status={tournament.status} />
        </CardTitle>

        <CardDescription className="text-sm text-primary dark:text-white">
          Eliminazione diretta • 8 squadre
          {dateLabel ? ` • ${dateLabel}` : ""}
          {tournament.status === "completed" && tournament.winnerName
            ? ` • Vincitore: ${tournament.winnerName}`
            : ""}
        </CardDescription>

        {tournament.status === "completed" && tournament.winnerName ? (
          <div className="flex items-center gap-2 text-sm text-foreground/80 pt-1">
            <Trophy className="h-4 w-4 text-primary" />
            <span>
              Vincitore:{" "}
              <span className="font-semibold">{tournament.winnerName}</span>
            </span>
          </div>
        ) : null}
      </CardHeader>

      <CardFooter className="mt-auto flex flex-col sm:flex-row gap-2">
        <Button
          variant="outline"
          className="w-full sm:w-auto border-primary/30 text-primary hover:bg-secondary/10"
          onClick={onRefresh}
          disabled={!onRefresh || !!isRefreshing}
        >
          {isRefreshing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Aggiorna
        </Button>

        {/* Builder */}
        {showBuilderButton ? (
          <Button
            variant="outline"
            className="w-full sm:w-auto border-primary/30 text-primary hover:bg-secondary/10"
            onClick={onToggleBuilder}
            disabled={!onToggleBuilder || (!isBuilder && !canOpenBuilder)}
            title={
              !isBuilder && !canOpenBuilder
                ? "Non puoi modificare il bracket dopo aver inserito risultati."
                : undefined
            }
          >
            <Wrench className="mr-2 h-4 w-4" />
            {isBuilder ? "Torna al torneo" : "Builder"}
          </Button>
        ) : null}

        {/* Genera bracket: serve solo se NON esiste già */}
        <Button
          className="w-full sm:w-auto bg-secondary hover:bg-secondary/90 text-white shadow-[0_10px_25px_-14px_rgba(2,160,221,0.55)]"
          onClick={onGenerateBracket}
          disabled={!onGenerateBracket || hasBracket || !!isGenerating}
          title={hasBracket ? "Bracket già generato" : undefined}
        >
          {isGenerating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Brackets className="mr-2 h-4 w-4" />
          )}
          {hasBracket ? "Bracket già generato" : "Genera bracket"}
        </Button>
      </CardFooter>
    </Card>
  );
}
