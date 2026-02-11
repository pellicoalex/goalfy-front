import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter as DialogFooterUI,
  DialogHeader as DialogHeaderUI,
  DialogTitle as DialogTitleUI,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useMemo, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  Pencil,
  Shield,
  Trash2,
  Users,
} from "lucide-react";

import ImageUploadButton from "@/components/ui/ImageUploadButton";
import { backendAssetUrl } from "@/lib/media";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import PlayersPanel from "./PlayersPanel";
import { TeamService } from "./team.service";
import type { Team } from "./team.type";

export default function TeamCard(props: { team: Team }) {
  const qc = useQueryClient();
  const team = props.team;

  const [open, setOpen] = useState(false);

  const [renameOpen, setRenameOpen] = useState(false);
  const [name, setName] = useState(team.name ?? "");

  const [deleteOpen, setDeleteOpen] = useState(false);

  const detailQuery = useQuery({
    queryKey: ["teamDetail", team.id],
    queryFn: () => TeamService.get(team.id),
    enabled: Number.isFinite(team.id),
    staleTime: 10_000,
  });

  const playersCount = detailQuery.data?.players?.length ?? 0;
  const maxPlayers = 5;

  const progress = useMemo(() => {
    const pct = (playersCount / maxPlayers) * 100;
    return Number.isFinite(pct) ? Math.max(0, Math.min(100, pct)) : 0;
  }, [playersCount]);

  const status = useMemo<"success" | "warning" | "danger">(() => {
    if (progress >= 100) return "success";
    if (progress >= 60) return "warning";
    return "danger";
  }, [progress]);

  const uploadLogoMutation = useMutation({
    mutationFn: (file: File) => TeamService.uploadLogo(team.id, file),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["teams"] });
      await qc.invalidateQueries({ queryKey: ["teamDetail", team.id] });
    },
  });

  const renameMutation = useMutation({
    mutationFn: (newName: string) =>
      TeamService.update(team.id, { name: newName }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["teams"] });
      await qc.invalidateQueries({ queryKey: ["teamDetail", team.id] });
      setRenameOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: TeamService.delete,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["teams"] });
      await qc.invalidateQueries({ queryKey: ["teamDetail", team.id] });
      toast.success("Squadra eliminata con successo");
      setDeleteOpen(false);
    },
    onError: () => {
      toast.error("La squadra non può essere eliminata");
    },
  });

  const confirmDelete = () => {
    deleteMutation.mutate(team.id);
  };

  const canRename = useMemo(() => {
    const t = name.trim();
    return t.length > 0 && t !== team.name && !renameMutation.isPending;
  }, [name, team.name, renameMutation.isPending]);

  return (
    <>
      <Card className="overflow-hidden border shadow-sm transition hover:shadow-md border-[rgba(43,84,146,0.25)] dark:bg-foreground/5">
        {/* HEADER */}
        <CardHeader className="pb-4 relative">
          {/* glow come l'altro */}
          <div
            className="pointer-events-none absolute -inset-6 blur-2xl"
            style={{
              background:
                "radial-gradient(circle_at_10%_0%, rgba(2,160,221,0.25), transparent 60%)",
            }}
          />

          <CardTitle className="relative flex items-center justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate">{team.name}</span>

                <Badge
                  className={cn(
                    "gap-1 text-white",
                    status === "success" && "bg-green-500",
                    status === "warning" && "bg-orange-500",
                    status === "danger" && "bg-red-500",
                  )}
                >
                  {status === "success" ? (
                    <>
                      <Shield className="h-3.5 w-3.5" />
                      Pronta
                    </>
                  ) : (
                    <>
                      <Users className="h-3.5 w-3.5" />
                      {playersCount}/{maxPlayers}
                    </>
                  )}
                </Badge>
              </div>

              <p className="mt-1 text-[11px] uppercase tracking-widest text-primary">
                GOALFY • Team
              </p>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <ChevronUp /> : <ChevronDown />}
            </Button>
          </CardTitle>

          {/* TEAM INFO */}
          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar
                className="h-16 w-16 rounded-full overflow-hidden ring-2"
                style={{ boxShadow: "0 0 0 4px rgba(2,160,221,0.35)" }}
              >
                <AvatarImage
                  src={backendAssetUrl(team.logoUrl)}
                  alt={team.name}
                />
                <AvatarFallback className="font-semibold">
                  {team.name?.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0">
                <p className="font-semibold truncate">{team.name}</p>
                <p className="text-xs text-muted-foreground">Logo squadra</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                size={"icon"}
                variant="destructive"
                onClick={() => setDeleteOpen(true)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setName(team.name ?? "");
                  setRenameOpen(true);
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>

              <ImageUploadButton
                label="Logo"
                disabled={uploadLogoMutation.isPending}
                onPick={(file: File) => uploadLogoMutation.mutate(file)}
              />
            </div>
          </div>

          {/* PROGRESS */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Giocatori: <span className="font-medium">{playersCount}</span>/
                {maxPlayers}
              </span>
              <span className="tabular-nums">{Math.round(progress)}%</span>
            </div>

            <Progress
              value={progress}
              className="h-2"
              indicatorClassName={cn(
                status === "success" &&
                  "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.45)]",
                status === "warning" && "bg-orange-500",
                status === "danger" && "bg-red-500",
              )}
            />
          </div>

          {detailQuery.isFetching && (
            <div className="mt-2 text-xs text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> aggiornamento…
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-3 pt-4">
          <Button
            className="w-full gap-2 bg-secondary dark:bg-primary hover:bg-secondary/90 dark:bg-primary/90 text-white shadow-[0_6px_18px_rgba(2,160,221,0.22)]"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "Chiudi giocatori" : "Gestisci giocatori"}
          </Button>

          {open && (
            <>
              <Separator />
              <PlayersPanel teamId={team.id} />
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog per rinominare */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <DialogHeaderUI>
            <DialogTitleUI>Modifica nome squadra</DialogTitleUI>
            <DialogDescription>Cambia il nome della squadra.</DialogDescription>
          </DialogHeaderUI>

          <div className="space-y-2">
            <Label htmlFor={`team-name-${team.id}`}>Nome squadra</Label>
            <Input
              id={`team-name-${team.id}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <DialogFooterUI className="gap-2">
            <Button variant="outline" onClick={() => setRenameOpen(false)}>
              Annulla
            </Button>
            <Button
              onClick={() => renameMutation.mutate(name.trim())}
              disabled={!canRename}
            >
              {renameMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Salva
            </Button>
          </DialogFooterUI>
        </DialogContent>
      </Dialog>

      {/* AlertDialog conferma eliminazione */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare la squadra?</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare “{team.name}”? L’operazione è
              irreversibile.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Annulla
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive/10 hover:bg-destructive/20 text-destructive
              focus-visible:ring-destructive/20 focus-visible:border-destructive/40
              dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40
              aria-invalid:ring-destructive/20 aria-invalid:border-destructive"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Elimino..." : "Elimina"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
