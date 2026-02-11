import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Frown,
  Loader2,
  Lock,
  OctagonAlert,
  Pencil,
  Trash2,
} from "lucide-react";
import { Link, useNavigate } from "react-router";
import { TournamentService } from "./tournament.service";
import TournamentCreateButton from "./TournamentCreateButton";

const TournamentList = () => {
  const {
    data: tournaments = [],
    isPending,
    isError,
    refetch,
    error,
  } = useQuery({
    queryKey: ["tournaments"],
    queryFn: TournamentService.list,
  });

  const qc = useQueryClient();
  const navigate = useNavigate();

  const deleteMut = useMutation({
    mutationFn: async (id: number) => {
      await TournamentService.remove(id);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["tournaments"] });
    },
    onError: (e: any) => {
      alert(e?.message ?? "Non puoi eliminare questo torneo.");
    },
  });

  function handleEdit(id: number, canEditDelete: boolean, lockReason: string) {
    if (!canEditDelete) {
      alert(lockReason || "Operazione non consentita.");
      return;
    }
    navigate(`/tournaments/${id}/setup`);
  }

  async function handleDelete(
    id: number,
    canEditDelete: boolean,
    lockReason: string,
  ) {
    if (!canEditDelete) {
      alert(lockReason || "Operazione non consentita.");
      return;
    }

    const ok = confirm("Vuoi eliminare questo torneo?");
    if (!ok) return;

    await deleteMut.mutateAsync(id);
  }

  if (isPending) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Loader2 className="animate-spin" />
          </EmptyMedia>
          <EmptyTitle>Caricamento...</EmptyTitle>
          <EmptyDescription>
            Attendi mentre vengono caricati i tornei
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  if (isError) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <OctagonAlert />
          </EmptyMedia>
          <EmptyTitle>Errore imprevisto</EmptyTitle>
          <EmptyDescription>{(error as any)?.message}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button onClick={() => refetch()}>Riprova</Button>
        </EmptyContent>
      </Empty>
    );
  }

  if (!tournaments.length) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Frown />
          </EmptyMedia>
          <EmptyTitle>Non ci sono Tornei</EmptyTitle>
          <EmptyDescription>
            Non hai ancora creato nessun torneo
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <TournamentCreateButton />
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {tournaments.map((t) => {
        const canEditDelete = t.status === "draft" && !t.hasResults;

        const lockReason =
          t.status !== "draft"
            ? "Puoi modificare/eliminare solo tornei in bozza (draft)"
            : t.hasResults
              ? "Non puoi modificare/eliminare: il torneo contiene già risultati"
              : "";

        const showLockBadge = !canEditDelete;

        return (
          <Card key={t.id} className="relative">
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-3">
                <span className="truncate">{t.name}</span>

                <div className="flex items-center gap-2">
                  {showLockBadge && (
                    <span
                      className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                      title={lockReason || "Operazione non consentita"}
                    >
                      <Lock className="h-3.5 w-3.5" />
                      Bloccato
                    </span>
                  )}

                  <span className="text-xs text-muted-foreground">
                    {t.status}
                  </span>
                </div>
              </CardTitle>

              <CardDescription>
                {new Date(t.startDate).toLocaleString()}
                {t.status === "completed" && t.winnerName
                  ? ` • Vincitore: ${t.winnerName}`
                  : ""}
              </CardDescription>
            </CardHeader>

            <CardFooter className="mt-auto gap-2">
              <Button
                variant="secondary"
                className="w-full after:absolute after:inset-0 shrink"
                nativeButton={false}
                render={<Link to={"/tournaments/" + t.id} />}
              >
                Apri torneo
                <ArrowRight />
              </Button>

              <Button
                variant="outline"
                className="shrink-0"
                disabled={!canEditDelete}
                onClick={() => handleEdit(t.id, canEditDelete, lockReason)}
                title={canEditDelete ? "Modifica torneo" : lockReason}
              >
                <Pencil className="h-4 w-4" />
              </Button>

              <Button
                variant="destructive"
                className="shrink-0"
                disabled={!canEditDelete || deleteMut.isPending}
                onClick={() => handleDelete(t.id, canEditDelete, lockReason)}
                title={canEditDelete ? "Elimina torneo" : lockReason}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
};

export default TournamentList;
