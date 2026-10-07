import { create } from 'zustand';

/** Vista e dia escolhidos na Agenda (continuam iguais ao voltar para a tela). `selectedDay` nulo = hoje. */
export const useAgendaViewStore = create((set) => ({
  view: 'month',
  selectedDay: null,
  setView: (view) => set({ view }),
  setSelectedDay: (selectedDay) => set({ selectedDay }),
}));
