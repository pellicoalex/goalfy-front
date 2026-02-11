import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shuffle, RotateCcw, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { backendAssetUrl } from "@/lib/media";

export type BracketTeam = {
  id: number;
  name: string;
  logoUrl?: string | null;
};

export function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function initial(name?: string | null) {
  const n = (name ?? "").trim();
  return n ? n[0].toUpperCase() : "?";
}

export default function TeamsSidebar(props: {
  teams: BracketTeam[];
  filled: number;
  total: number;
  isGenerating?: boolean;

  onRandomAssign: () => void;
  onClear: () => void;
  onGenerate: () => void;
  generateDisabled?: boolean;

  onClose?: () => void;
}) {
  return (
    <aside className="w-85 shrink-0 rounded-2xl border bg-background/70 backdrop-blur p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-secondary" />
            Assegna squadre ai quarti
          </p>
          <p className="text-xs text-foreground mt-0.5">
            Trascina le squadre negli slot •{" "}
            <span className="font-semibold">
              {props.filled}/{props.total}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Badge
            className="shrink-0"
            style={{
              background: `linear-gradient(90deg, secondary, primary)`,
              color: "white",
            }}
          >
            Builder
          </Badge>

          {props.onClose ? (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={props.onClose}
              aria-label="Chiudi sidebar"
            >
              <X className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <Button
          size="sm"
          variant="outline"
          className="flex-1"
          onClick={props.onClear}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Svuota
        </Button>
        <Button size="sm" className="flex-1" onClick={props.onRandomAssign}>
          <Shuffle className="h-4 w-4 mr-2" />
          Random
        </Button>
      </div>

      <div className="mt-3 space-y-2 max-h-[50vh] overflow-auto pr-1">
        {props.teams.map((t) => (
          <div
            key={t.id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData(
                "application/goalfy-team",
                JSON.stringify({ teamId: t.id }),
              );
              e.dataTransfer.effectAllowed = "move";
            }}
            className={cn(
              "flex items-center gap-3 rounded-xl border bg-background p-2 cursor-grab active:cursor-grabbing",
              "hover:shadow-sm transition",
            )}
          >
            <Avatar className="h-9 w-9 shrink-0 rounded-full bg-card ring-1 ring-slate-200">
              <AvatarImage
                src={backendAssetUrl(t.logoUrl ?? null)}
                alt={t.name}
                className="object-contain p-1"
                loading="lazy"
              />
              <AvatarFallback className="text-[11px] font-black text-foreground/50">
                {initial(t.name)}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{t.name}</p>
              <p className="text-xs text-muted-foreground">Drag & drop</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3">
        <Button
          className="w-full"
          onClick={props.onGenerate}
          disabled={props.generateDisabled || props.isGenerating}
          style={{
            background: `linear-gradient(90deg, secondary, primary)`,
            color: "white",
          }}
        >
          {props.isGenerating ? "Generazione..." : "Aggiorna bracket"}
        </Button>
        <p className="mt-2 text-xs text-muted-foreground">
          Se non preferisci la modalità randomica degli accoppiamenti dragga le
          squadre verso gli slot che preferisci e clicca su Aggiorna bracket e
          crea il tuo bracket personalizzato
        </p>
      </div>
    </aside>
  );
}
