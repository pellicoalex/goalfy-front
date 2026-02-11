import { ChevronRight, RefreshCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TournamentService } from "@/features/tournment/tournament.service";
import { cn } from "@/lib/utils";

import type { Tournament } from "@/features/tournment/tournament.type";
import { normalizeStatus } from "@/features/tournment/tournament.utils";
import { TournamentCard } from "@/features/tournment/TournamentCrad";

export default function TournamentsListPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      setError(null);

      const list = (await TournamentService.list()) as any[];

      // calcolo hasResults per ogni torneo
      const withResults: Tournament[] = await Promise.all(
        list.map(async (t) => {
          try {
            const has = await TournamentService.hasResults(t.id);
            return { ...t, hasResults: has };
          } catch {
            return { ...t, hasResults: false };
          }
        }),
      );

      setTournaments(withResults);
    } catch (e: any) {
      setError(e?.message ?? "Errore nel caricamento tornei");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const grouped = useMemo(() => {
    const created: Tournament[] = [];
    const ongoing: Tournament[] = [];
    const completed: Tournament[] = [];
    const other: Tournament[] = [];

    for (const t of tournaments) {
      const s = normalizeStatus(t.status);
      if (s === "created") created.push(t);
      else if (s === "ongoing") ongoing.push(t);
      else if (s === "completed") completed.push(t);
      else other.push(t);
    }

    return { created, ongoing, completed, other };
  }, [tournaments]);

  return (
    <div className="w-full max-w-7xl mx-auto mt-8 px-4 pb-12 space-y-8">
      {/* HERO */}
      <div
        className="relative overflow-hidden rounded-[28px] border bg-card"
        style={{ borderColor: "rgba(43,84,146,0.25)" }}
      >
        <div
          className="pointer-events-none absolute -inset-10 blur-3xl"
          style={{
            background:
              "radial-gradient(circle_at_10%_10%, rgba(2,160,221,0.22), transparent 60%)," +
              "radial-gradient(circle_at_80%_20%, rgba(43,84,146,0.18), transparent 60%)",
          }}
        />

        <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <p className="text-primary text-[11px] uppercase tracking-widest font-semibold dark:text-white">
              GOALFY • Tornei
            </p>

            <h1 className="text-primary mt-2 font-extrabold text-3xl sm:text-4xl tracking-tight dark:text-white">
              Tutti i tornei
            </h1>

            <div className="mt-3 h-1 w-36 rounded-full gradient-primary" />

            <p className="mt-4 text-sm sm:text-base text-foreground/80 max-w-xl">
              Gestisci i tornei creati, segui quelli in corso e consulta lo
              storico dei conclusi.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <Button
              variant="outline"
              className="border-primary/30 text-primary hover:bg-secondary/10"
              onClick={() => void load()}
              disabled={loading}
            >
              <RefreshCcw
                className={cn("mr-2 h-4 w-4", loading && "animate-spin")}
              />
              Aggiorna
            </Button>

            <Button
              className="bg-primary hover:bg-primary/90 text-white shadow-[0_10px_25px_-14px_rgba(2,160,221,0.55)]"
              nativeButton={false}
              render={<Link to="/tournaments/setup" />}
            >
              Crea torneo <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {error ? (
        <div
          className="rounded-2xl border p-4 bg-white"
          style={{ borderColor: "rgba(43,84,146,0.25)" }}
        >
          <p className="text-sm text-red-600 font-semibold">
            Errore caricamento tornei
          </p>
          <p className="text-sm text-gray-700 mt-1">{error}</p>
          <div className="mt-3">
            <Button
              className="bg-secondary hover:bg-secondary/90 text-white"
              onClick={() => void load()}
            >
              Riprova <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card
              key={i}
              className="relative overflow-hidden rounded-[22px] border bg-white"
              style={{ borderColor: "rgba(43,84,146,0.25)" }}
            >
              <CardContent className="p-6 space-y-3">
                <div className="h-4 w-1/3 rounded bg-slate-200 animate-pulse" />
                <div className="h-6 w-3/4 rounded bg-slate-200 animate-pulse" />
                <div className="h-4 w-1/2 rounded bg-slate-200 animate-pulse" />
                <div className="h-11 w-full rounded-2xl bg-slate-200 animate-pulse mt-4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      {!loading && !error && tournaments.length === 0 ? (
        <div
          className="rounded-2xl border p-6 bg-white"
          style={{ borderColor: "rgba(43,84,146,0.25)" }}
        >
          <p className="font-extrabold text-lg text-primary">
            Nessun torneo trovato
          </p>
          <p className="text-sm text-gray-700 mt-2">
            Crea il tuo primo torneo e genera il bracket automatico.
          </p>
          <div className="mt-4">
            <Button
              className="bg-primary hover:bg-primary/90 text-white"
              nativeButton={false}
              render={<Link to="/tournaments/setup" />}
            >
              Crea torneo <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}

      {!loading && !error && tournaments.length > 0 ? (
        <div className="space-y-10">
          {(
            [
              { title: "In programma", list: grouped.created },
              { title: "In corso", list: grouped.ongoing },
              { title: "Conclusi", list: grouped.completed },
            ] as { title: string; list: Tournament[] }[]
          ).map(({ title, list }) =>
            list.length ? (
              <section key={title} className="space-y-4">
                <h2 className="text-xl font-extrabold text-primary">{title}</h2>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                  {list.map((t) => (
                    <TournamentCard key={t.id} t={t} onDeleted={load} />
                  ))}
                </div>
              </section>
            ) : null,
          )}
        </div>
      ) : null}
    </div>
  );
}
