import { Button } from "@/components/ui/button";
import HomeInsightsSection from "@/features/dashboard/HomeInsightsSection";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router";

export default function HomePage() {
  return (
    <div className="w-full max-w-7xl mx-auto mt-8 px-4 pb-10 space-y-8">
      {/* HERO */}
      <div
        className={[
          "relative overflow-hidden rounded-[28px] border bg-card",
          "min-h-[260px] sm:min-h-[300px]",
        ].join(" ")}
        style={{ borderColor: "rgba(43,84,146,0.25)" }}
      >
        {/* background image */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url(/bg-1.png)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        />

        {/* overlay */}
        <div
          className="absolute inset-0 bg-linear-to-r from-background/80 via-background/90 to-background/80"
          // style={{
          //   background:
          //     "linear-gradient(90deg, rgba(255,255,255,0.84) 0%, rgba(255,255,255,0.92) 45%, rgba(255,255,255,0.78) 100%)",
          // }}
        />

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
          <p className="text-[11px] uppercase tracking-widest font-semibold text-primary dark:text-white">
            GOALFY • Tournament Manager
          </p>

          <h1 className="mt-2 font-extrabold text-4xl sm:text-5xl tracking-tight text-primary dark:text-white">
            Benvenuto in Goalfy
          </h1>

          <div className="mt-3 h-1 w-40 rounded-full gradient-primary dark:gradient-primary" />

          <p className="mt-4 text-sm sm:text-base text-foreground/80 max-w-xl">
            Crea le squadre, completa i roster (5 giocatori) e genera un torneo
            a eliminazione diretta con bracket automatico.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Button
              className="bg-primary hover:bg-primary/90 text-white shadow-[0_10px_25px_-14px_rgba(2,160,221,0.55)]"
              nativeButton={false}
              render={<Link to="/teams" />}
            >
              Inizia dalle squadre <ChevronRight className="ml-2 h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              className="border-primary/30 text-primary hover:bg-primary/10"
              nativeButton={false}
              render={<Link to="/tournaments" />}
            >
              Vai ai tornei <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      <HomeInsightsSection />
    </div>
  );
}
