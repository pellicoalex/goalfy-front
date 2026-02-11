import { Link } from "react-router";
import Lottie from "lottie-react";
import footballerAnim from "@/assets/lottie/Footballer.json";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <div className="fixed inset-0 bg-white dark:bg-[#0E1627] flex items-center justify-center">
      <div className="w-full max-w-2xl px-4">
        <div className="rounded-3xl border border-primary/15 dark:border-white/10 bg-white/80 dark:bg-white/5 p-6 sm:p-10 backdrop-blur">
          <div className="flex flex-col items-center text-center gap-6">
            <div className="w-full max-w-md">
              <Lottie animationData={footballerAnim} loop autoplay />
            </div>

            <div>
              <p className="text-6xl font-semibold tracking-widest uppercase text-primary/80 animate-bounce">
                Errore 404
              </p>
              <h1 className="mt-2 text-xl sm:text-4xl font-extrabold text-primary dark:text-white">
                Qui non c’è nessun torneo… solo fuorigioco
              </h1>
              <p className="mt-3 text-base text-slate-600 dark:text-slate-200/80">
                La pagina che cerchi non esiste o è finita negli spogliatoi.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Link to="/" className="w-full sm:w-auto">
                <Button
                  variant="default"
                  className="w-full bg-primary text-white hover:bg-primary/90"
                >
                  Torna alla Home
                </Button>
              </Link>

              <Link to="/tournaments" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  className="w-full border-primary/25 text-primary hover:bg-primary/10"
                >
                  Vai ai tornei
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
