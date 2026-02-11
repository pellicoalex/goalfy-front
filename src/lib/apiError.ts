export function getErrorMessage(err: unknown, fallback = "Errore generico") {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return fallback;
}

//solo per farmi tornare degli errori almeno capisco cosa non va
