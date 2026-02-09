import { create } from 'zustand';

interface AppState {
  language: string;
  setLanguage: (lang: string) => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  language: 'tr',
  setLanguage: (lang) => set({ language: lang }),
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
}));
