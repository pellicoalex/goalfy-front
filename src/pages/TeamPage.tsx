import TeamCreateButton from "@/features/team/TeamCreateButton";
import TeamList from "@/features/team/TeamList";
import { Users } from "lucide-react";

export default function TeamPage() {
  return (
    <div className="w-full max-w-7xl mx-auto mt-8 px-4 pb-10 space-y-8">
      {/* HERO */}
      <div
        className={[
          "relative overflow-hidden rounded-[28px] border bg-card",
          "min-h-[220px] sm:min-h-[250px]",
        ].join(" ")}
        style={{ borderColor: "rgba(43,84,146,0.25)" }}
      >
        {/* background image */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url(/bg-squadre.png)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        />

        {/* overlay */}
        <div className="absolute inset-0 bg-linear-to-r from-background/80 via-background/90 to-background/80" />

        {/* glow */}
        <div
          className="pointer-events-none absolute -inset-10 blur-3xl"
          style={{
            background:
              "radial-gradient(circle_at_10%_10%, rgba(2,160,221,0.22), transparent 60%)," +
              "radial-gradient(circle_at_80%_20%, rgba(43,84,146,0.18), transparent 60%)",
          }}
        />

        <div className="relative p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <p className="text-primary text-[11px] uppercase tracking-widest font-semibold flex items-center gap-2 dark:text-white">
                <Users className="h-4 w-4" />
                GOALFY • Team Manager
              </p>

              <h1 className="mt-2 font-extrabold text-4xl sm:text-5xl tracking-tight text-primary dark:text-white">
                Squadre
              </h1>

              <div className="mt-3 h-1 w-40 rounded-full gradient-primary" />

              <p className="mt-4 text-sm sm:text-base text-foreground/80 max-w-2xl">
                Crea le squadre, aggiungi fino a <b>5 giocatori</b> e rendile
                pronte per partecipare ai tornei a eliminazione diretta.
              </p>

              <p className="mt-1 text-xs text-primary">
                Flusso GOALFY: crea squadra → aggiungi 5 giocatori → squadra
                pronta (5/5).
              </p>
            </div>

            {/* CTA */}
            <div className="flex items-center gap-2">
              <TeamCreateButton />
            </div>
          </div>
        </div>
      </div>

      {/* LISTA */}
      <div
        className="rounded-[22px] border bg-card p-4 sm:p-6"
        style={{ borderColor: "rgba(43,84,146,0.25)" }}
      >
        <TeamList />
      </div>
    </div>
  );
}
