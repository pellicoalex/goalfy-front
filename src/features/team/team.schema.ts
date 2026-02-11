import { z } from "zod";

/**
 * Backend rules (Team::validationRules)
 * - name: required, min:1, max:150
 * - logo_url: sometimes, min:1, max:500
 */

export const teamCreateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nome obbligatorio")
    .max(150, "Max 150 caratteri"),
  logoUrl: z
    .string()
    .trim()
    .min(1, "URL logo non valida")
    .max(500, "Max 500 caratteri")
    .optional(),
});

export type TeamCreateData = z.infer<typeof teamCreateSchema>;

export const teamCreateDialogSchema = teamCreateSchema.pick({
  name: true,
});
export type TeamCreateDialogData = z.infer<typeof teamCreateDialogSchema>;
