import { useEffect, useState } from "react";
import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router";
import { Toaster } from "sonner";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import { motion, AnimatePresence } from "framer-motion";

import Preloader from "./pages/Preloader";
import { markPreloaderShown, shouldShowPreloaderOnce } from "./lib/preloader";

type AppBootstrapProps = {
  queryClient: QueryClient;
  router: any;
};

export default function AppBootstrap({
  queryClient,
  router,
}: AppBootstrapProps) {
  const [showPreloader, setShowPreloader] = useState(false);
  const [appVisible, setAppVisible] = useState(true);

  useEffect(() => {
    const mustShow = shouldShowPreloaderOnce();
    setShowPreloader(mustShow);
    setAppVisible(!mustShow); // se c'è preloader nascondo app finché non finisce
  }, []);

  return (
    <>
      <Preloader
        open={showPreloader}
        onDone={() => {
          markPreloaderShown();
          setShowPreloader(false);
          setAppVisible(true); // smooth reveal
        }}
      />

      <QueryClientProvider client={queryClient}>
        <AnimatePresence mode="wait">
          {appVisible && (
            <motion.div
              key="app"
              initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="min-h-dvh"
            >
              <RouterProvider router={router} />
            </motion.div>
          )}
        </AnimatePresence>

        <Toaster
          position="bottom-right"
          richColors
          closeButton
          duration={3500}
        />

        <TanStackDevtools
          config={{ position: "middle-left" }}
          plugins={[
            {
              name: "TanStack Query",
              render: <ReactQueryDevtoolsPanel />,
              defaultOpen: false,
            },
          ]}
        />
      </QueryClientProvider>
    </>
  );
}
