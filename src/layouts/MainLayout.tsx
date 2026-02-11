import React, { useMemo, useState } from "react";
import { Outlet, useLocation, Link } from "react-router";
import {
  Sidebar,
  SidebarBody,
  SidebarLink,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { AnimatedThemeToggler } from "@/components/ui/AnimatedThemeToggler";
import TournamentCreateButton from "@/features/tournment/TournamentCreateButton";
import { Home, Users, Trophy, History, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export function SidebarLogo() {
  const { open, animate } = useSidebar();

  return (
    <Link
      to="/"
      className={cn(
        "flex items-center",
        open ? "gap-3 px-1" : "justify-center",
      )}
    >
      <img
        src="/logo.png"
        alt="GOALFY"
        className={cn(
          "object-contain shrink-0",
          open ? "h-15 w-15" : "h-15 w-15",
        )}
      />

      <motion.div
        animate={{
          display: animate ? (open ? "block" : "none") : "block",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className="min-w-0"
      >
        <p className="font-extrabold text-lg leading-tight text-primary dark:text-white truncate">
          GOALFY
        </p>
        <p className="text-primary dark:text-white truncate font-bold text-sm">
          Tournament Manager
        </p>
      </motion.div>
    </Link>
  );
}

function ThemeRow() {
  return <AnimatedThemeToggler className="hover:bg-primary/10" />;
}

function CreateTournamentArea() {
  const { open, animate } = useSidebar();

  return (
    <div className={cn(open ? "px-1" : "px-0", "w-full")}>
      <motion.div
        animate={{
          display: "block",
          opacity: 1,
        }}
      >
        {open ? (
          <TournamentCreateButton />
        ) : (
          <div className="flex justify-center">
            <Button
              className="rounded-lg relative bg-primary text-white hover:bg-secondary/90 gap-2"
              style={{
                boxShadow: "0 10px 25px -14px rgba(2,160,221,0.55)",
              }}
              title="Crea torneo"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

const MainLayout = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const links = useMemo(
    () => [
      {
        label: "Home",
        href: "/",
        icon: (
          <Home className="h-7 w-7 flex-shrink-0 text-primary dark:text-white" />
        ),
      },
      {
        label: "Squadre",
        href: "/teams",
        icon: (
          <Users className="h-7 w-7 flex-shrink-0 text-primary dark:text-white" />
        ),
      },
      {
        label: "Tornei",
        href: "/tournaments",
        icon: (
          <Trophy className="h-7 w-7 flex-shrink-0 text-primary dark:text-white" />
        ),
      },
      {
        label: "Storico",
        href: "/tournaments/history",
        icon: (
          <History className="h-7 w-7 flex-shrink-0 text-primary dark:text-white" />
        ),
      },
    ],
    [],
  );

  const isActive = (href: string) => {
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen w-full bg-background dark:bg-background">
      <div className="md:flex h-screen w-full">
        <Sidebar open={open} setOpen={setOpen}>
          <SidebarBody className="h-screen justify-between gap-6 border-r border-primary/10 dark:border-white/10">
            {/* TOP */}
            <div className="flex flex-col">
              <SidebarLogo />

              <div className="mt-4 w-full">
                <CreateTournamentArea />
              </div>

              {/* NAV */}
              <div className="mt-6 flex flex-col gap-2">
                {links.map((link) => (
                  <SidebarLink
                    key={link.href}
                    link={link}
                    className={cn(
                      isActive(link.href) && "bg-primary/10 dark:bg-white/10",
                    )}
                  />
                ))}
              </div>
            </div>

            {/* BOTTOM */}
            <div className="flex gap-3">
              <ThemeRow />
            </div>
          </SidebarBody>
        </Sidebar>

        {/* CONTENT */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl px-4 py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
