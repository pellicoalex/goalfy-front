import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { Loader2, PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { TournamentService } from "./tournament.service";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { cn } from "@/lib/utils";
import {
  tournamentCreateDialogSchema,
  type TournamentCreateDialogData,
} from "./tournament.schema";

export default function TournamentCreateButton() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [open, setOpen] = useState(false);

  const { mutateAsync, isPending } = useMutation({
    mutationFn: TournamentService.create,
    onSuccess: (t) => {
      qc.invalidateQueries({ queryKey: ["tournaments"] });
      setOpen(false);
      form.reset({ name: "" });
      navigate(`/tournaments/${t.id}/setup`);
    },
  });

  const form = useForm<TournamentCreateDialogData>({
    resolver: zodResolver(tournamentCreateDialogSchema),
    defaultValues: { name: "" },
    mode: "onChange",
  });

  const nameValue = form.watch("name");
  const trimmed = useMemo(() => (nameValue ?? "").trim(), [nameValue]);

  // UX  minimo 3 caratteri per abilitare bottone
  const canSubmitUX = trimmed.length >= 3;

  async function onCreate(data?: TournamentCreateDialogData) {
    if (isPending) return;

    // se chiamato da Enter senza handleSubmit, validiamo a mano
    const payload = data ?? (await form.trigger().then(() => form.getValues()));
    if (!payload?.name?.trim()) return;

    await mutateAsync({
      data: {
        name: payload.name.trim(),
        startDate: new Date().toISOString(),
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !isPending && setOpen(o)}>
      <DialogTrigger
        render={
          <Button
            className="relative w-full bg-primary text-white hover:bg-primary/80 gap-2"
            style={{ boxShadow: "0 10px 25px -14px rgba(2,160,221,0.55)" }}
          />
        }
      >
        <PlusIcon className="h-4 w-4" />
        Crea torneo
      </DialogTrigger>

      <DialogContent className="sm:max-w-130">
        <DialogHeader>
          <DialogTitle className="text-primary dark:text-white">
            Nuovo torneo
          </DialogTitle>
          <DialogDescription className="text-primary dark:text-white">
            Inserisci un nome. Potrai poi selezionare le 8 squadre e generare il
            bracket.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit((d) => void onCreate(d))}
          className="space-y-2"
        >
          <label className="text-sm font-semibold text-primary dark:text-white">
            Nome torneo
          </label>

          <Input
            className={cn(
              "mt-2",
              form.formState.errors.name && "border-red-500",
            )}
            placeholder="Es. Coppa GOALFY - Febbraio"
            disabled={isPending}
            {...form.register("name")}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void form.handleSubmit((d) => onCreate(d))();
              }
            }}
          />

          {/* Messaggio errore Zod */}
          {form.formState.errors.name ? (
            <p className="text-xs text-red-500">
              {form.formState.errors.name.message}
            </p>
          ) : (
            <p className="text-xs text-primary dark:text-white">
              {trimmed.length === 0
                ? "Suggerimento: usa un nome riconoscibile (data, città, stagione)."
                : trimmed.length < 3
                  ? "Nome corto (consigliato min 3)."
                  : "Ok."}
            </p>
          )}
        </form>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            className="border-primary/30 text-primary hover:bg-secondary/10"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Annulla
          </Button>

          <Button
            className="cursor-pointer bg-primary hover:bg-primary/90 text-white gap-2 dark:border-white dark:text-white"
            style={{ boxShadow: "0 10px 25px -14px rgba(2,160,221,0.55)" }}
            onClick={() => void form.handleSubmit((d) => onCreate(d))()}
            disabled={!canSubmitUX || isPending}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Crea e vai al setup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
