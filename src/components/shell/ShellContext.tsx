"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

type Shell = {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebarOnMobile: () => void;
  paletteOpen: boolean;
  setPaletteOpen: (open: boolean) => void;
  paletteQuery: string;
  openPalette: (query?: string) => void;
};

const Ctx = createContext<Shell | null>(null);
const KEY = "self-sidebar";

export function ShellProvider({ children }: { children: ReactNode }) {
  // Self5: the Notes drawer is closed until someone opens it (then remembered on larger screens).
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState("");

  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 767px)").matches;
    const saved = localStorage.getItem(KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read browser-only prefs once on mount
    setSidebarOpen(mobile ? false : saved === "open");
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((o) => {
      if (!window.matchMedia("(max-width: 767px)").matches) localStorage.setItem(KEY, o ? "closed" : "open");
      return !o;
    });
  }, []);

  const closeSidebarOnMobile = useCallback(() => {
    if (window.matchMedia("(max-width: 767px)").matches) setSidebarOpen(false);
  }, []);

  const openPalette = useCallback((query = "") => {
    setPaletteQuery(query);
    setPaletteOpen(true);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteQuery("");
        setPaletteOpen((o) => !o);
      } else if (mod && e.key === "\\") {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleSidebar]);

  return (
    <Ctx.Provider
      value={{ sidebarOpen, toggleSidebar, closeSidebarOnMobile, paletteOpen, setPaletteOpen, paletteQuery, openPalette }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useShell() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useShell outside ShellProvider");
  return s;
}
