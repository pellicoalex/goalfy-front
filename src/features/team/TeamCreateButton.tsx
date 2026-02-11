import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, PlusIcon } from "lucide-react";
import { TeamService } from "./team.service";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  teamCreateDialogSchema,
  type TeamCreateDialogData,
} from "./team.schema";

export default function TeamCreateButton() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { mutate, isPending, isError, error } = useMutation({
    mutationFn: TeamService.create,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["teams"] });
      form.reset({ name: "" });
      setOpen(false);
    },
  });

  const form = useForm<TeamCreateDialogData>({
    resolver: zodResolver(teamCreateDialogSchema),
    defaultValues: { name: "" },
    mode: "onChange",
  });

  const nameValue = form.watch("name");
  const trimmed = useMemo(() => (nameValue ?? "").trim(), [nameValue]);

  const canSubmitUX = trimmed.length > 0 && !isPending;

  function onCreate(data: TeamCreateDialogData) {
    if (!canSubmitUX) return;
    mutate({ data: { name: data.name.trim() } });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !isPending && setOpen(o)}>
      {/* Trigger */}
      <DialogTrigger>
        <Button
          className="
            relative
            bg-primary
            text-white
            hover:bg-primary/90
            shadow-[0_6px_20px_rgba(2,160,221,0.35)]
            gap-2
          "
        >
          <PlusIcon className="h-4 w-4" />
          Nuova squadra
        </Button>
      </DialogTrigger>

      <DialogContent className="border-primary/20">
        <DialogHeader>
          <div className="space-y-1">
            <DialogTitle className="text-primary dark:text-white">
              Crea nuova squadra
            </DialogTitle>
            <div className="h-1 w-24 rounded-full gradient-primary" />
          </div>

          <DialogDescription className="text-primary dark:text-white">
            Inserisci il nome della squadra. Potrai modificarlo anche dopo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onCreate)} className="space-y-2">
          <Label htmlFor="team-name" className="text-primary dark:text-white">
            Nome squadra
          </Label>

          <Input
            id="team-name"
            placeholder="Es. Futsal Pescara"
            disabled={isPending}
            {...form.register("name")}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void form.handleSubmit(onCreate)();
              }
            }}
            className={cn(
              "border-[#2B5492]/25 focus-visible:ring-[#02A0DD]/30",
              form.formState.errors.name && "border-red-500",
            )}
          />

          {/* Errore Zod */}
          {form.formState.errors.name ? (
            <p className="text-sm text-destructive">
              {form.formState.errors.name.message}
            </p>
          ) : null}

          {/* Errore server */}
          {isError ? (
            <p className="text-sm text-destructive">
              {(error as any)?.message ?? "Errore durante la creazione"}
            </p>
          ) : null}
        </form>

        <DialogFooter className="gap-2">
          <Button
            variant="default"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Annulla
          </Button>

          <Button
            variant="outline"
            disabled={!canSubmitUX}
            onClick={() => void form.handleSubmit(onCreate)()}
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Crea
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
