import { create } from 'zustand';

export const useThemeStore = create((set, get) => ({
  theme: localStorage.getItem('teamup_theme') || 'dark',

  toggleTheme: () => {
    const newTheme = get().theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('teamup_theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    set({ theme: newTheme });
  },

  initTheme: () => {
    const saved = localStorage.getItem('teamup_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    set({ theme: saved });
  },
}));
