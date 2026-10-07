import { create } from 'zustand';
import { SCREEN_DEFAULT_FILTERS } from '@/lib/finance/transactionsScreen';

const currentMonth = () => {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
};

/** Filtros, ordenação e mês da tela Transações (continuam iguais ao voltar para a tela). */
export const useTransactionsViewStore = create((set) => ({
  filters: SCREEN_DEFAULT_FILTERS,
  sort: 'recentes',
  selectedMonth: currentMonth(),
  setFilters: (patch) => set((s) => ({ filters: { ...s.filters, ...patch } })),
  setSort: (sort) => set({ sort }),
  setSelectedMonth: (updater) =>
    set((s) => ({ selectedMonth: typeof updater === 'function' ? updater(s.selectedMonth) : updater })),
  resetFilters: () => set({ filters: SCREEN_DEFAULT_FILTERS, sort: 'recentes', selectedMonth: currentMonth() }),
}));
