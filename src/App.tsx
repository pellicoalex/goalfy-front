import { useEffect, useState } from "react";
import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router";
import { Toaster } from "sonner";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";

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

  useEffect(() => {
    setShowPreloader(shouldShowPreloaderOnce());
  }, []);

  return (
    <>
      <Preloader
        open={showPreloader}
        onDone={() => {
          markPreloaderShown();
          setShowPreloader(false);
        }}
      />

      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />

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
