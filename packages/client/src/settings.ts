import { create } from 'zustand';

interface SettingsStore {
  themeId: string;
  setTheme(id: string): void;
}

const STORAGE_KEY = 'agent-citadel.theme';

export const useSettings = create<SettingsStore>((set) => ({
  themeId: localStorage.getItem(STORAGE_KEY) ?? 'fantasy',
  setTheme: (themeId) => {
    localStorage.setItem(STORAGE_KEY, themeId);
    set({ themeId });
  },
}));
