import { z } from "zod";

export const playerRoleEnum = z.enum([
  "GOALKEEPER",
  "FIXO",
  "ALA",
  "PIVO",
  "UNIVERSAL",
]);

export const NATIONALITY_OPTIONS = [
  { code: "IT", label: "Italia", flag: "🇮🇹" },
  { code: "FR", label: "Francia", flag: "🇫🇷" },
  { code: "ES", label: "Spagna", flag: "🇪🇸" },
  { code: "DE", label: "Germania", flag: "🇩🇪" },
  { code: "BR", label: "Brasile", flag: "🇧🇷" },
  { code: "AR", label: "Argentina", flag: "🇦🇷" },
  { code: "PT", label: "Portogallo", flag: "🇵🇹" },
  { code: "NL", label: "Olanda", flag: "🇳🇱" },
  { code: "GB", label: "Inghilterra", flag: "🇬🇧" },
  { code: "RU", label: "Russia", flag: "🇷🇺" },
] as const;

//   Backend (Player::validationRules)
// - team_id required (non nel dialog: lo gestiamo fuori)
// - first_name required min:1 max:100
// - last_name required min:1 max:100
// - number sometimes
// - avatar_url sometimes min:1 max:500
// - nationality sometimes min:2 max:50
// - role sometimes min:2 max:50
// - height_cm/weight_kg sometimes
// - birth_date sometimes
//

// Input type="date" -> "YYYY-MM-DD". Date.parse lo digerisce, ma facciamo check leggero.
const dateStringSchema = z
  .string()
  .trim()
  .min(1)
  .refine((v) => !Number.isNaN(Date.parse(v)), "Data non valida");

export const playerBaseSchema = z.object({
  firstName: z.string().trim().min(1, "Nome obbligatorio").max(100, "Max 100"),

  lastName: z
    .string()
    .trim()
    .min(1, "Cognome obbligatorio")
    .max(100, "Max 100"),

  // opzionali -> number|null|undefined
  number: z.number().int("Deve essere un intero").nullable().optional(),

  nationality: z
    .string()
    .trim()
    .min(2, "Min 2 caratteri")
    .max(50, "Max 50")
    .nullable()
    .optional(),

  role: playerRoleEnum.nullable().optional(),

  heightCm: z.number().int("Deve essere un intero").nullable().optional(),
  weightKg: z.number().int("Deve essere un intero").nullable().optional(),

  birthDate: dateStringSchema.nullable().optional(),
});

export type PlayerFormValues = z.infer<typeof playerBaseSchema>;

export const playerApiSchema = z.object({
  team_id: z.coerce.number().int(),
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  number: z.number().int().nullable().optional(),
  nationality: z.string().min(2).max(50).nullable().optional(),
  role: z.string().min(2).max(50).nullable().optional(),
  height_cm: z.number().int().nullable().optional(),
  weight_kg: z.number().int().nullable().optional(),
  birth_date: z.string().nullable().optional(),
  avatar_url: z.string().min(1).max(500).nullable().optional(),
});
