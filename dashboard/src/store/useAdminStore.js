import { create } from 'zustand';

// Deterministic colors for accounts based on index
const ACCOUNT_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#f43f5e', '#06b6d4', '#a855f7', '#ec4899', '#14b8a6'];

const useAdminStore = create((set, get) => ({
  accounts: [],            // all users with totals
  isAccountsLoaded: false,
  selectedId: null,        // currently viewed account userId (legacy)
  selectedAccountId: localStorage.getItem('xpense-selected-account') || null, // globally selected account for dashboard

  setAccounts: (accounts) => set((state) => {
    let current = state.selectedAccountId;
    if (!current || !accounts.find((a) => a.id === current)) {
      current = accounts[0]?.id ?? null;
      if (current) localStorage.setItem('xpense-selected-account', current);
    }
    return { accounts, isAccountsLoaded: true, selectedAccountId: current };
  }),

  getAccount: (userId) => get().accounts.find((a) => a.id === userId),

  getAccountColor: (userId) => {
    const idx = get().accounts.findIndex((a) => a.id === userId);
    return ACCOUNT_COLORS[idx % ACCOUNT_COLORS.length] || '#6366f1';
  },

  selectAccount: (userId) => set({ selectedId: userId }),

  setSelectedAccount: (accountId) => {
    if (accountId) localStorage.setItem('xpense-selected-account', accountId);
    set({ selectedAccountId: accountId });
  },

  getSelectedAccount: () => {
    const { accounts, selectedAccountId } = get();
    return accounts.find((a) => a.id === selectedAccountId) ?? null;
  },
}));

export default useAdminStore;
export { ACCOUNT_COLORS };
