/* import "./index.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import { createBrowserRouter, RouterProvider } from "react-router";
import { Toaster } from "sonner";
import MainLayout from "./layouts/MainLayout";
import HomePage from "./pages/HomePage";
import TournamentPage from "./pages/TournamentPage";
import TeamPage from "./pages/TeamPage";
import TournamentSetupPage from "./pages/TournamentSetupPage";
import TournamentHistoryPage from "./pages/TournamentHistoryPage";
import PlayerPage from "./pages/PlayerPage";
import TournamentsListPage from "./pages/TournamentsListPage";
import { initTheme } from "./lib/theme";
import NotFoundPage from "./pages/NotFoundPage";

initTheme();

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "teams", element: <TeamPage /> },
      { path: "tournaments", element: <TournamentsListPage /> },
      { path: "tournaments/history", element: <TournamentHistoryPage /> },
      { path: "tournaments/:id", element: <TournamentPage /> },
      { path: "tournaments/:id/setup", element: <TournamentSetupPage /> },
      { path: "players/:id", element: <PlayerPage /> },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);

const queryClient = new QueryClient();

declare global {
  interface Window {
    __TANSTACK_QUERY_CLIENT__: import("@tanstack/query-core").QueryClient;
  }
}
window.__TANSTACK_QUERY_CLIENT__ = queryClient;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster position="bottom-right" richColors closeButton duration={3500} />
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
  </StrictMode>,
); */

//nuovo main + APP

import "./index.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient } from "@tanstack/react-query";
import { createBrowserRouter } from "react-router";
import { initTheme } from "./lib/theme";

import MainLayout from "./layouts/MainLayout";
import HomePage from "./pages/HomePage";
import TournamentPage from "./pages/TournamentPage";
import TeamPage from "./pages/TeamPage";
import TournamentSetupPage from "./pages/TournamentSetupPage";
import TournamentHistoryPage from "./pages/TournamentHistoryPage";
import PlayerPage from "./pages/PlayerPage";
import TournamentsListPage from "./pages/TournamentsListPage";
import NotFoundPage from "./pages/NotFoundPage";

import AppBootstrap from "./App";

initTheme();

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "teams", element: <TeamPage /> },
      { path: "tournaments", element: <TournamentsListPage /> },
      { path: "tournaments/history", element: <TournamentHistoryPage /> },
      { path: "tournaments/:id", element: <TournamentPage /> },
      { path: "tournaments/:id/setup", element: <TournamentSetupPage /> },
      { path: "players/:id", element: <PlayerPage /> },
    ],
  },
  { path: "*", element: <NotFoundPage /> },
]);

const queryClient = new QueryClient();

declare global {
  interface Window {
    __TANSTACK_QUERY_CLIENT__: import("@tanstack/query-core").QueryClient;
  }
}
window.__TANSTACK_QUERY_CLIENT__ = queryClient;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppBootstrap queryClient={queryClient} router={router} />
  </StrictMode>,
);
