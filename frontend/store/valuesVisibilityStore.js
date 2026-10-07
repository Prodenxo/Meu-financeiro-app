import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@financas_pessoais:contas_valores_ocultos';

/** Mostrar/ocultar saldos na tela Contas (fica salvo no aparelho). */
export const useValuesVisibilityStore = create((set, get) => ({
  hidden: false,
  toggle: () => {
    const hidden = !get().hidden;
    set({ hidden });
    AsyncStorage.setItem(STORAGE_KEY, hidden ? '1' : '0').catch(() => {});
  },
}));

AsyncStorage.getItem(STORAGE_KEY)
  .then((saved) => {
    if (saved === '1') useValuesVisibilityStore.setState({ hidden: true });
  })
  .catch(() => {});
