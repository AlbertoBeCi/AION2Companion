import { create } from 'zustand';

export type Page = 'dashboard' | 'trackers' | 'timers' | 'characters' | 'sources' | 'settings';
interface UiState {
  page: Page;
  setPage: (page: Page) => void;
  toast: string | null;
  notify: (message: string) => void;
  clearToast: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  page: 'dashboard',
  setPage: (page) => set({ page }),
  toast: null,
  notify: (message) => {
    set({ toast: message });
    window.setTimeout(() => set({ toast: null }), 2600);
  },
  clearToast: () => set({ toast: null }),
}));
