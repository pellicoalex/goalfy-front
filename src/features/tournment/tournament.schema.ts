import { z } from "zod";

export const tournamentCreateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nome obbligatorio")
    .max(120, "Max 120 caratteri"),
  startDate: z
    .string()
    .min(1, "Data di inizio obbligatoria")
    .refine((v) => !Number.isNaN(Date.parse(v)), "Data non valida (ISO)"),
  status: z.string().optional(),
  winnerTeamId: z.coerce.number().int().optional(),
});

export type TournamentCreateData = z.infer<typeof tournamentCreateSchema>;

export const tournamentCreateDialogSchema = tournamentCreateSchema.pick({
  name: true,
});

export type TournamentCreateDialogData = z.infer<
  typeof tournamentCreateDialogSchema
>;
