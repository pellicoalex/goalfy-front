import {
  CalendarDays,
  ChevronRight,
  LoaderPinwheel,
  Lock,
  Pencil,
  Trash2,
  Trophy,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TournamentService } from "@/features/tournment/tournament.service";
import { cn, formatDate } from "@/lib/utils";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Tournament } from "./tournament.type";
import { normalizeStatus, StatusBadge } from "./tournament.utils";

export function TournamentCard({
  t,
  onDeleted,
}: {
  t: Tournament;
  onDeleted: () => void;
}) {
  const navigate = useNavigate();
  const s = normalizeStatus(t.status);

  const hasResults = Boolean(t.hasResults);

  // regole
  const canEdit = s !== "completed" && !hasResults;
  const canDelete = s !== "completed" && !hasResults;

  const lockReason = hasResults
    ? "Non puoi modificare/eliminare: il torneo contiene già risultati."
    : s === "completed"
      ? "Non puoi modificare/eliminare: il torneo è concluso."
      : "";

  const primaryCta =
    s === "completed"
      ? { label: "Apri torneo", variant: "outline" as const }
      : { label: "Vai al tabellone", variant: "default" as const };

  const metaDate = formatDate(t.startDate ?? null);

  const [deleteOpen, setDeleteOpen] = useState(false);

  function showLockedToast(action: "modificare" | "eliminare") {
    toast.error(
      action === "modificare"
        ? "Torneo non modificabile"
        : "Torneo non eliminabile",
      { description: lockReason || "Operazione non consentita." },
    );
  }

  function onEditClick() {
    if (!canEdit) return showLockedToast("modificare");
    navigate(`/tournaments/${t.id}/setup`);
    toast.success("Modifica torneo", {
      description: "Hai aperto la schermata di setup del torneo.",
    });
  }

  function onTrashClick() {
    if (!canDelete) return showLockedToast("eliminare");
    setDeleteOpen(true);
  }

  async function confirmDelete() {
    try {
      await TournamentService.remove(t.id);
      toast.success("Torneo eliminato con successo", {
        description: `“${t.name}” è stato eliminato.`,
      });
      onDeleted();
    } catch (e: any) {
      toast.error("Errore eliminazione torneo", {
        description: e?.message ?? "Non puoi eliminare questo torneo.",
      });
    } finally {
      setDeleteOpen(false);
    }
  }

  return (
    <>
      <Card
        className={cn(
          "group relative overflow-hidden rounded-[22px] border bg-card gap-0",
          "transition-all duration-200",
          "hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-26px_rgba(2,160,221,0.65)]",
        )}
        style={{ borderColor: "rgba(43,84,146,0.25)" }}
      >
        <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-white via-slate-50 to-slate-100 dark:from-card dark:via-card/95 dark:to-black" />
        <div className="pointer-events-none bg-secondary absolute -top-24 -left-24 h-64 w-64 rounded-full blur-3xl opacity-20" />
        <div className="pointer-events-none bg-primary absolute -bottom-28 -right-24 h-72 w-72 rounded-full blur-3xl opacity-15" />
        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/5 via-transparent to-black/5" />

        <div className="relative px-6 pt-5">
          <div className="h-1.5 w-full rounded-full gradient-primary" />
        </div>

        <CardContent className="relative p-6 pt-4 flex flex-col justify-between h-full">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-primary text-[11px] uppercase tracking-widest font-semibold flex items-center gap-2">
                  <LoaderPinwheel className="h-4 w-4" />
                  GOALFY • Tournament
                </p>

                <h3
                  className="text-primary dark:text-white mt-1 truncate font-extrabold text-lg sm:text-xl tracking-tight"
                  title={t.name}
                >
                  {t.name}
                </h3>
                <p className="mt-1 text-sm text-foreground/80">
                  Eliminazione diretta • 8 squadre
                </p>
              </div>

              <div className="shrink-0 flex flex-col items-end gap-2">
                <StatusBadge status={t.status} />

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className={cn(
                      "h-9 w-9 p-0 border-primary/30 text-primary hover:bg-secondary/10 relative z-10",
                      !canEdit && "opacity-60",
                    )}
                    onClick={onEditClick}
                    title={canEdit ? "Modifica torneo" : lockReason}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="destructive"
                    className={cn(
                      "h-9 w-9 p-0 relative z-10",
                      !canDelete && "opacity-60",
                    )}
                    onClick={onTrashClick}
                    title={canDelete ? "Elimina torneo" : lockReason}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {(!canEdit || !canDelete) && (
                  <span
                    className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                    title={lockReason || "Operazione non consentita"}
                  >
                    <Lock className="h-3.5 w-3.5" />
                    Bloccato
                  </span>
                )}
              </div>
            </div>

            {metaDate ? (
              <div className="flex items-center gap-2 text-xs text-foreground/80">
                <CalendarDays className="h-4 w-4 text-foreground/80" />
                <span className="truncate">Data: {metaDate}</span>
              </div>
            ) : null}

            {s === "completed" && t.winnerName ? (
              <div className="flex items-center gap-2 text-sm text-foreground/80">
                <Trophy className="h-4 w-4 text-primary" />
                <span className="truncate">
                  Vincitore:{" "}
                  <span className="font-semibold">{t.winnerName}</span>
                </span>
              </div>
            ) : null}

            <div className="pt-1">
              <div className="h-px w-full bg-slate-200/70" />
            </div>
          </div>

          <div className="pt-4 space-y-2">
            <Button
              className={cn(
                "w-full h-11",
                primaryCta.variant === "default"
                  ? "text-white shadow-[0_10px_25px_-14px_rgba(2,160,221,0.55)] gradient-primary"
                  : "border-primary/30 text-primary hover:bg-secondary/10",
              )}
              variant={primaryCta.variant}
              nativeButton={false}
              render={<Link to={`/tournaments/${t.id}`} />}
            >
              {primaryCta.label}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>

            {s === "ongoing" ? (
              <p className="text-[11px] text-foreground/80">
                Continua il torneo inserendo i risultati dei match.
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare il torneo?</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare “{t.name}”? L’operazione è
              irreversibile.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive/10 hover:bg-destructive/20 text-destructive
              focus-visible:ring-destructive/20 focus-visible:border-destructive/40
              dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40
              aria-invalid:ring-destructive/20 aria-invalid:border-destructive"
              onClick={confirmDelete}
            >
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
