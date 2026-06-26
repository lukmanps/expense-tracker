import { create } from 'zustand';

// Deterministic colors for accounts based on index
const ACCOUNT_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#f43f5e', '#06b6d4', '#a855f7', '#ec4899', '#14b8a6'];

const useAdminStore = create((set, get) => ({
  accounts: [],            // all users with totals
  selectedId: null,        // currently viewed account userId (legacy)
  selectedAccountId: null, // globally selected account for dashboard

  setAccounts: (accounts) => set((state) => ({
    accounts,
    // Auto-select first account if none selected yet
    selectedAccountId: state.selectedAccountId ?? (accounts[0]?.id ?? null),
  })),

  getAccount: (userId) => get().accounts.find((a) => a.id === userId),

  getAccountColor: (userId) => {
    const idx = get().accounts.findIndex((a) => a.id === userId);
    return ACCOUNT_COLORS[idx % ACCOUNT_COLORS.length] || '#6366f1';
  },

  selectAccount: (userId) => set({ selectedId: userId }),

  setSelectedAccount: (accountId) => set({ selectedAccountId: accountId }),

  getSelectedAccount: () => {
    const { accounts, selectedAccountId } = get();
    return accounts.find((a) => a.id === selectedAccountId) ?? null;
  },
}));

export default useAdminStore;
export { ACCOUNT_COLORS };
