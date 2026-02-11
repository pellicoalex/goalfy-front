import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  NATIONALITY_OPTIONS,
  playerBaseSchema,
  type PlayerFormValues,
} from "../player/player.schema";

import { toast } from "sonner";

const ROLE_OPTIONS = [
  { value: "GOALKEEPER", label: "Portiere" },
  { value: "FIXO", label: "Fixo (Difensore)" },
  { value: "ALA", label: "Ala (Esterno)" },
  { value: "PIVO", label: "Pivot" },
  { value: "UNIVERSAL", label: "Universale" },
] as const;

function toIntOrNull(raw: string): number | null {
  const v = raw.trim();
  if (v === "") return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.trunc(n);
}

function getErrorMessage(err: unknown) {
  const anyErr = err as any;
  return (
    anyErr?.message ||
    anyErr?.response?.data?.message ||
    anyErr?.response?.data?.error ||
    "Errore durante il salvataggio"
  );
}

export default function PlayerFormDialog(props: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title?: string;

  initial?: Partial<PlayerFormValues>;
  onSubmit: (payload: PlayerFormValues) => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);

  const form = useForm<PlayerFormValues>({
    resolver: zodResolver(playerBaseSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      number: null,
      nationality: null,
      role: null,
      heightCm: null,
      weightKg: null,
      birthDate: null,
      ...props.initial,
    },
    mode: "onChange",
  });

  // preload in edit quando apro
  useEffect(() => {
    if (!props.open) return;

    form.reset({
      firstName: props.initial?.firstName ?? "",
      lastName: props.initial?.lastName ?? "",
      number: props.initial?.number ?? null,
      nationality: props.initial?.nationality ?? null,
      role: props.initial?.role ?? null,
      heightCm: props.initial?.heightCm ?? null,
      weightKg: props.initial?.weightKg ?? null,
      birthDate: props.initial?.birthDate ?? null,
    });
  }, [props.open, props.initial, form]);

  const firstNameWatch = form.watch("firstName");
  const lastNameWatch = form.watch("lastName");

  const canSave = useMemo(() => {
    const fn = (firstNameWatch ?? "").trim();
    const ln = (lastNameWatch ?? "").trim();
    return fn.length > 0 && ln.length > 0 && !loading;
  }, [firstNameWatch, lastNameWatch, loading]);

  async function handleSave(data: PlayerFormValues) {
    if (loading) return;

    setLoading(true);

    // opzionale: se vuoi distinguere crea/aggiorna
    const actionLabel = props.initial ? "Aggiornato" : "Salvato";

    try {
      await props.onSubmit({
        ...data,
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        nationality: data.nationality ? data.nationality.trim() : null,
        birthDate: data.birthDate ? data.birthDate.trim() : null,
      });

      toast.success(`Giocatore ${actionLabel} con successo`);
      props.onOpenChange(false);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const errors = form.formState.errors;

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{props.title ?? "Giocatore"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Nome</Label>
              <Input
                {...form.register("firstName")}
                disabled={loading}
                className={cn(errors.firstName && "border-red-500")}
              />
              {errors.firstName ? (
                <p className="text-xs text-destructive">
                  {errors.firstName.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-1">
              <Label>Cognome</Label>
              <Input
                {...form.register("lastName")}
                disabled={loading}
                className={cn(errors.lastName && "border-red-500")}
              />
              {errors.lastName ? (
                <p className="text-xs text-destructive">
                  {errors.lastName.message}
                </p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Numero maglia (opzionale)</Label>
              <Input
                inputMode="numeric"
                disabled={loading}
                value={form.watch("number") ?? ""}
                onChange={(e) => {
                  const n = toIntOrNull(e.target.value);
                  form.setValue("number", n, { shouldValidate: true });
                }}
                className={cn(errors.number && "border-red-500")}
              />
              {errors.number ? (
                <p className="text-xs text-destructive">
                  {errors.number.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-1">
              <Label>Nazionalità (opzionale)</Label>

              <Select
                value={form.watch("nationality") ?? ""}
                onValueChange={(v) => {
                  form.setValue("nationality", v === "" ? null : v, {
                    shouldValidate: true,
                  });
                }}
              >
                <SelectTrigger
                  disabled={loading}
                  className={cn(errors.nationality && "border-red-500")}
                >
                  {form.watch("nationality") ? (
                    <SelectValue />
                  ) : (
                    <span className="text-muted-foreground">
                      Seleziona nazionalità
                    </span>
                  )}
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="">Nessuna</SelectItem>

                  {NATIONALITY_OPTIONS.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      <span className="flex items-center gap-2">
                        <span>{c.flag}</span>
                        <span>{c.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {errors.nationality ? (
                <p className="text-xs text-destructive">
                  {errors.nationality.message}
                </p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Ruolo (opzionale)</Label>

              <Select
                value={form.watch("role") ?? ""}
                onValueChange={(v) => {
                  form.setValue("role", v === "" ? null : (v as any), {
                    shouldValidate: true,
                  });
                }}
              >
                <SelectTrigger
                  className={cn(errors.role && "border-red-500")}
                  disabled={loading}
                >
                  {form.watch("role") ? (
                    <SelectValue />
                  ) : (
                    <span className="text-muted-foreground">
                      Seleziona ruolo
                    </span>
                  )}
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="">Nessuno</SelectItem>
                  {ROLE_OPTIONS.map((x) => (
                    <SelectItem key={x.value} value={x.value}>
                      {x.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {errors.role ? (
                <p className="text-xs text-destructive">
                  {errors.role.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-1">
              <Label>Data di nascita (opzionale)</Label>
              <Input
                type="date"
                disabled={loading}
                value={form.watch("birthDate") ?? ""}
                onChange={(e) => {
                  const v = e.target.value.trim();
                  form.setValue("birthDate", v === "" ? null : v, {
                    shouldValidate: true,
                  });
                }}
                className={cn(errors.birthDate && "border-red-500")}
              />
              {errors.birthDate ? (
                <p className="text-xs text-destructive">
                  {errors.birthDate.message}
                </p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Altezza (cm)</Label>
              <Input
                inputMode="numeric"
                placeholder="es. 178"
                disabled={loading}
                value={form.watch("heightCm") ?? ""}
                onChange={(e) => {
                  const n = toIntOrNull(e.target.value);
                  form.setValue("heightCm", n, { shouldValidate: true });
                }}
                className={cn(errors.heightCm && "border-red-500")}
              />
              {errors.heightCm ? (
                <p className="text-xs text-destructive">
                  {errors.heightCm.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-1">
              <Label>Peso (kg)</Label>
              <Input
                inputMode="numeric"
                placeholder="es. 74"
                disabled={loading}
                value={form.watch("weightKg") ?? ""}
                onChange={(e) => {
                  const n = toIntOrNull(e.target.value);
                  form.setValue("weightKg", n, { shouldValidate: true });
                }}
                className={cn(errors.weightKg && "border-red-500")}
              />
              {errors.weightKg ? (
                <p className="text-xs text-destructive">
                  {errors.weightKg.message}
                </p>
              ) : null}
            </div>
          </div>

          <Button
            type="submit"
            variant="default"
            className="w-full"
            disabled={loading || !canSave}
          >
            {loading ? "Salvataggio..." : "Salva"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
