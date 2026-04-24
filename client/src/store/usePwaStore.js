import { create } from 'zustand';

const usePwaStore = create((set) => ({
  installPrompt: null,
  setInstallPrompt: (prompt) => set({ installPrompt: prompt }),
}));

export default usePwaStore;
