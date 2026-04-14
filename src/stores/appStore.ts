import { create } from "zustand";
import type { Crepe } from "@milkdown/crepe";

interface AppState {
  currentFilePath: string | null;
  isDirty: boolean;
  sidebarOpen: boolean;
  theme: "light" | "dark";
  crepe: Crepe | null;

  setCurrentFile: (path: string | null) => void;
  setDirty: (dirty: boolean) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleTheme: () => void;
  setTheme: (theme: "light" | "dark") => void;
  setCrepe: (crepe: Crepe | null) => void;
}

const getInitialTheme = (): "light" | "dark" => {
  const stored = localStorage.getItem("clearly-theme");
  if (stored === "dark" || stored === "light") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

export const useAppStore = create<AppState>((set) => ({
  currentFilePath: null,
  isDirty: false,
  sidebarOpen: true,
  theme: getInitialTheme(),
  crepe: null,

  setCurrentFile: (path) => set({ currentFilePath: path, isDirty: false }),
  setDirty: (dirty) => set({ isDirty: dirty }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleTheme: () =>
    set((s) => {
      const next = s.theme === "light" ? "dark" : "light";
      localStorage.setItem("clearly-theme", next);
      return { theme: next };
    }),
  setTheme: (theme) => {
    localStorage.setItem("clearly-theme", theme);
    set({ theme });
  },
  setCrepe: (crepe) => set({ crepe }),
}));
