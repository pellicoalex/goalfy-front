import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2, ChevronRight, Pencil } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlayerService } from "@/features/player/player.service";
import ImageUploadButton from "@/components/ui/ImageUploadButton";
import { backendAssetUrl } from "@/lib/media";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import PlayerFormDialog from "./PlayerFormDialog";
import type { PlayerFormValues } from "../player/player.schema";
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

const ROLE_STYLE: Record<string, { bg: string; border: string; text: string }> =
  {
    GOALKEEPER: {
      bg: "rgba(43,84,146,0.15)",
      border: "rgba(43,84,146,0.40)",
      text: "#2B5492",
    },
    FIXO: {
      bg: "rgba(2,160,221,0.15)",
      border: "rgba(2,160,221,0.40)",
      text: "#02A0DD",
    },
    ALA: {
      bg: "rgba(0,200,150,0.15)",
      border: "rgba(0,200,150,0.40)",
      text: "#00C896",
    },
    PIVO: {
      bg: "rgba(255,159,67,0.18)",
      border: "rgba(255,159,67,0.45)",
      text: "#FF9F43",
    },
    UNIVERSAL: {
      bg: "rgba(120,120,120,0.15)",
      border: "rgba(120,120,120,0.40)",
      text: "#555",
    },
  };

function getErrorMessage(err: unknown) {
  const anyErr = err as any;
  return (
    anyErr?.message ||
    anyErr?.response?.data?.message ||
    anyErr?.response?.data?.error ||
    "Operazione non riuscita"
  );
}

/**
 * Normalizza qualunque Player "dal backend" in Partial<PlayerFormValues>
 * per evitare mismatch TS su initial={...}
 */
function toPlayerFormInitial(p: any): Partial<PlayerFormValues> {
  const toNumOrNull = (v: unknown) => {
    if (v === null || v === undefined || v === "") return null;
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const toStrOrNull = (v: unknown) => {
    if (v === null || v === undefined) return null;
    const s = String(v).trim();
    return s === "" ? null : s;
  };

  return {
    firstName: toStrOrNull(p.firstName) ?? "",
    lastName: toStrOrNull(p.lastName) ?? "",
    number: toNumOrNull(p.number),
    nationality: toStrOrNull(p.nationality),
    role: toStrOrNull(p.role) as any,
    heightCm: toNumOrNull(p.heightCm),
    weightKg: toNumOrNull(p.weightKg),
    birthDate: toStrOrNull(p.birthDate),
  };
}

export default function PlayersPanel(props: { teamId: number }) {
  const qc = useQueryClient();
  const navigate = useNavigate();

  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editPlayerId, setEditPlayerId] = useState<number | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [playerToDelete, setPlayerToDelete] = useState<any | null>(null);

  const playersQuery = useQuery({
    queryKey: ["teamPlayers", props.teamId],
    queryFn: () => PlayerService.listByTeam(props.teamId),
    enabled: Number.isFinite(props.teamId),
    staleTime: 10_000,
  });

  const createMutation = useMutation({
    mutationFn: PlayerService.create,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["teamPlayers", props.teamId] });
      await qc.invalidateQueries({ queryKey: ["teams"] });
      await qc.invalidateQueries({ queryKey: ["teamDetail", props.teamId] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (p: { id: number; patch: any }) =>
      PlayerService.update(p.id, p.patch),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["teamPlayers", props.teamId] });
      await qc.invalidateQueries({ queryKey: ["teams"] });
      await qc.invalidateQueries({ queryKey: ["teamDetail", props.teamId] });
    },
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: (p: { playerId: number; file: File }) =>
      PlayerService.uploadAvatar(p.playerId, p.file),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["teamPlayers", props.teamId] });
      await qc.invalidateQueries({ queryKey: ["teamDetail", props.teamId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: PlayerService.delete,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["teamPlayers", props.teamId] });
      await qc.invalidateQueries({ queryKey: ["teams"] });
      await qc.invalidateQueries({ queryKey: ["teamDetail", props.teamId] });
      setDeleteOpen(false);
      setPlayerToDelete(null);
    },
  });

  const confirmDelete = async () => {
    if (!playerToDelete) return;

    const fullName = `${playerToDelete.firstName ?? ""} ${
      playerToDelete.lastName ?? ""
    }`.trim();

    const toastId = toast.loading("Eliminazione giocatore...");
    try {
      await deleteMutation.mutateAsync(playerToDelete.id);
      toast.success(`Giocatore eliminato`, { id: toastId });
    } catch (err) {
      toast.error(getErrorMessage(err), { id: toastId });
    }
  };

  if (playersQuery.isPending) {
    return (
      <Card className="border" style={{ borderColor: "rgba(43,84,146,0.20)" }}>
        <CardContent className="p-4 text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 className="animate-spin" /> Caricamento giocatori...
        </CardContent>
      </Card>
    );
  }

  if (playersQuery.isError) {
    return (
      <Card className="border" style={{ borderColor: "rgba(43,84,146,0.20)" }}>
        <CardContent className="p-4 text-sm">
          <p className="text-destructive">
            {(playersQuery.error as any)?.message ??
              "Errore caricamento giocatori"}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3 border-primary/30 text-primary hover:bg-secondary/10"
            onClick={() => playersQuery.refetch()}
          >
            Riprova
          </Button>
        </CardContent>
      </Card>
    );
  }

  const players = playersQuery.data ?? [];
  const full = players.length >= 5;

  const editingPlayer =
    editPlayerId != null
      ? players.find((x: any) => x.id === editPlayerId)
      : null;

  return (
    <div className="space-y-3">
      {/* Header panel */}
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-primary">
            Giocatori{" "}
            <span className="text-muted-foreground font-medium">
              ({players.length}/5)
            </span>
          </p>
          <div
            className="mt-1 h-1 w-20 rounded-full"
            style={{ background: "linear-gradient(90deg, #02A0DD, #2B5492)" }}
          />
        </div>

        <Button
          size="sm"
          onClick={() => setOpenCreate(true)}
          disabled={full}
          className="bg-secondary hover:bg-secondary/90 text-white shadow-[0_6px_18px_rgba(2,160,221,0.28)] gap-2"
        >
          <Plus className="h-4 w-4" /> Aggiungi
        </Button>
      </div>

      <div className="space-y-2">
        {players.map((p: any) => {
          const fullName = `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim();

          return (
            <Card
              key={p.id}
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/players/${p.id}`)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  navigate(`/players/${p.id}`);
                }
              }}
              className={cn(
                "transition cursor-pointer border",
                "hover:shadow-md",
                "focus:outline-none focus:ring-2 bg-white dark:bg-foreground/5",
              )}
              style={{
                borderColor: "rgba(43,84,146,0.20)",
                boxShadow: "0 0 0 rgba(0,0,0,0)",
              }}
            >
              <CardContent className="p-3">
                {/* TOP */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-4 min-w-0">
                    {/* Avatar */}
                    <Avatar
                      className="h-14 w-14 border bg-white"
                      style={{ borderColor: "rgba(2,160,221,0.25)" }}
                    >
                      <AvatarImage
                        src={backendAssetUrl(p.avatarUrl ?? null)}
                        alt={fullName || "Player"}
                      />
                      <AvatarFallback className="text-base font-semibold text-primary">
                        {(p.firstName?.[0] ?? "P").toUpperCase()}
                        {(p.lastName?.[0] ?? "").toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="mt-1 flex items-center gap-2 min-w-0">
                      {/* Numero */}
                      <div
                        className="bg-secondary dark:bg-primary h-6 w-6 rounded-full flex items-center justify-center text-xs font-extrabold text-white tabular-nums shrink-0"
                        title="Numero maglia"
                      >
                        {p.number ?? "-"}
                      </div>

                      {/* Nome */}
                      <span
                        className="text-sm font-extrabold text-slate-900 dark:text-white truncate min-w-0"
                        title={fullName || "Giocatore"}
                      >
                        {fullName || "Giocatore"}
                      </span>

                      {/* Ruolo */}
                      {p.role ? (
                        <span
                          className="rounded-full px-2 py-[2px] text-[10px] font-semibold uppercase tracking-wider shrink-0"
                          style={{
                            backgroundColor:
                              ROLE_STYLE[p.role]?.bg ?? "rgba(2,160,221,0.10)",
                            border: `1px solid ${
                              ROLE_STYLE[p.role]?.border ??
                              "rgba(2,160,221,0.30)"
                            }`,
                            color: ROLE_STYLE[p.role]?.text ?? "#2B5492",
                          }}
                          title={`Ruolo: ${p.role}`}
                        >
                          {p.role}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground shrink-0">
                          —
                        </span>
                      )}
                    </div>
                  </div>

                  <ChevronRight className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
                </div>

                {/* Divider */}
                <div
                  className="my-3 h-px"
                  style={{
                    background:
                      "linear-gradient(to right, transparent, rgba(2,160,221,0.35), transparent)",
                  }}
                />

                {/* Bottom actions */}
                <div
                  className="flex items-center justify-between gap-2"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  <Button
                    size="sm"
                    className="gap-2 bg-secondary dark:bg-primary hover:bg-secondary/90 dark:bg-primary/90 text-white shadow-[0_6px_18px_rgba(2,160,221,0.22)]"
                    onClick={() => navigate(`/players/${p.id}`)}
                  >
                    Scheda Tecnica <ChevronRight className="h-4 w-4" />
                  </Button>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      title="Modifica"
                      className="border-primary/30 text-primary hover:bg-secondary/10"
                      onClick={() => {
                        setEditPlayerId(p.id);
                        setOpenEdit(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>

                    {/* Delete -> AlertDialog */}
                    <Button
                      variant="destructive"
                      size="icon"
                      title="Elimina giocatore"
                      disabled={deleteMutation.isPending}
                      onClick={() => {
                        setPlayerToDelete(p);
                        setDeleteOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>

                    {/* Upload avatar + toast */}
                    <ImageUploadButton
                      label="Avatar"
                      disabled={uploadAvatarMutation.isPending}
                      onPick={async (file: File) => {
                        const toastId = toast.loading("Caricamento avatar...");
                        try {
                          await uploadAvatarMutation.mutateAsync({
                            playerId: p.id,
                            file,
                          });
                          toast.success("Avatar aggiornato", { id: toastId });
                        } catch (err) {
                          toast.error(getErrorMessage(err), { id: toastId });
                        }
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* CREATE */}
      <PlayerFormDialog
        open={openCreate}
        onOpenChange={setOpenCreate}
        title="Aggiungi giocatore"
        onSubmit={async (values: PlayerFormValues) => {
          const toastId = toast.loading("Creazione giocatore...");
          try {
            await createMutation.mutateAsync({
              data: {
                teamId: props.teamId,
                ...values,
              },
            });
            toast.success("Giocatore creato", { id: toastId });
            setOpenCreate(false);
          } catch (err) {
            toast.error(getErrorMessage(err), { id: toastId });
          }
        }}
      />

      {/* EDIT */}
      <PlayerFormDialog
        open={openEdit}
        onOpenChange={setOpenEdit}
        title="Modifica giocatore"
        initial={editingPlayer ? toPlayerFormInitial(editingPlayer) : undefined}
        onSubmit={async (values: PlayerFormValues) => {
          if (!editingPlayer) return;

          const toastId = toast.loading("Aggiornamento giocatore...");
          try {
            await updateMutation.mutateAsync({
              id: editingPlayer.id,
              patch: {
                teamId: props.teamId,
                ...values,
              },
            });
            toast.success("Giocatore aggiornato", { id: toastId });
            setOpenEdit(false);
          } catch (err) {
            toast.error(getErrorMessage(err), { id: toastId });
          }
        }}
      />

      {/* AlertDialog conferma eliminazione giocatore */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare il giocatore?</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare “
              {playerToDelete
                ? `${playerToDelete.firstName ?? ""} ${
                    playerToDelete.lastName ?? ""
                  }`.trim() || "questo giocatore"
                : "questo giocatore"}
              ”? L’operazione è irreversibile.
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
    </div>
  );
}
