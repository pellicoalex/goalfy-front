import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

//se si volesse togliere il preloader con localstorage ripristinare il file main.tsx con l'originale(commentato sopra)
//eliminare il file preloader.ts nella cartella lib
//e eliminare il file App.tsx in quanto creato perchè in main.tsx non si possono utilizzare gli hook

type PreloaderProps = {
  open: boolean;
  onDone: () => void;
  minDurationMs?: number;
};

export default function Preloader({
  open,
  onDone,
  minDurationMs = 4000,
}: PreloaderProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!open) return;

    setProgress(0);
    const start = Date.now();

    const tick = setInterval(() => {
      const elapsed = Date.now() - start;
      const p = Math.min(100, Math.floor((elapsed / minDurationMs) * 100));
      setProgress(p);

      if (p >= 100) {
        clearInterval(tick);
        setTimeout(onDone, 250);
      }
    }, 16);

    return () => clearInterval(tick);
  }, [open, minDurationMs, onDone]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-background overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Ambient glow */}
          <div
            className="pointer-events-none absolute inset-0 opacity-80"
            style={{
              background:
                "radial-gradient(circle_at_50%_35%, rgba(2,160,221,0.20), transparent 55%)," +
                "radial-gradient(circle_at_70%_70%, rgba(43,84,146,0.15), transparent 60%)",
            }}
          />

          <div className="relative flex w-[420px] max-w-[90vw] flex-col items-center gap-7">
            <motion.div
              className="relative"
              initial={{ opacity: 0, y: 10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
            >
              {/* Glow ring */}
              <motion.div
                className="pointer-events-none absolute -inset-14 rounded-full blur-3xl"
                animate={{
                  opacity: [0.25, 0.55, 0.25],
                  scale: [0.98, 1.06, 0.98],
                }}
                transition={{
                  duration: 2.8,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                style={{
                  background:
                    "radial-gradient(circle, rgba(2,160,221,0.55), transparent 62%)",
                }}
              />

              <motion.img
                src="/logo.png"
                alt="GOALFY"
                className="relative h-36 sm:h-44 w-auto drop-shadow-[0_18px_40px_rgba(2,160,221,0.25)]"
                animate={{ y: [0, -6, 0] }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </motion.div>

            <motion.div
              className="h-12 w-12 rounded-full border-2 border-primary/30 border-t-primary"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }}
            />

            <div className="w-full">
              <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                <span className="uppercase tracking-widest">Caricamento</span>
                <span>{progress}%</span>
              </div>

              <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-muted/70">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background:
                      "linear-gradient(90deg, rgb(2,160,221), rgb(43,84,146))",
                  }}
                  initial={{ width: "0%" }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                />

                <motion.div
                  className="pointer-events-none absolute inset-y-0 w-28 opacity-35"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)",
                  }}
                  animate={{ x: ["-35%", "135%"] }}
                  transition={{
                    duration: 1.15,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </div>
            </div>

            <motion.p
              className="text-xs text-muted-foreground uppercase tracking-[0.22em]"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              GOALFY • Tournament Manager
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
