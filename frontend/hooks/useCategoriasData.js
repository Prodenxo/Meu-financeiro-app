import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { fetchCategoriaRows, fetchTransactions } from '@/lib/financeApi';
import { useTransactionStore } from '@/store/transactionStore';

const errorInfo = (error) => ({
  message: error?.message || 'Não foi possível carregar suas categorias.',
  kind: error?.kind || 'http',
});

/** Renomear/excluir categoria muda a categoria dos lançamentos; telas ainda em TS leem o store antigo. */
const syncLegacyStores = () => {
  const fetchLegacyTx = useTransactionStore.getState().fetchTransactions;
  if (typeof fetchLegacyTx === 'function') void fetchLegacyTx().catch(() => {});
};

/**
 * Categorias + todos os lançamentos (o servidor devolve a lista inteira; mês e tipo são calculados no app).
 * - `status`: 'loading' | 'ready' | 'error' (erro só quando ainda não há dados).
 * - `error` com dados = a última atualização falhou; os dados anteriores continuam na tela.
 */
export function useCategoriasData(userId) {
  const [state, setState] = useState({ owner: null, status: 'loading', data: null, error: null, refreshing: false });
  const seqRef = useRef(0);

  const load = useCallback(
    async (mode) => {
      if (!userId) return;
      const seq = ++seqRef.current;
      setState((prev) => {
        const sameOwner = prev.owner === userId;
        return {
          ...prev,
          owner: userId,
          data: sameOwner ? prev.data : null,
          status: sameOwner && prev.data ? prev.status : 'loading',
          refreshing: mode === 'pull',
          error: mode === 'silent' && sameOwner ? prev.error : null,
        };
      });
      try {
        const [categories, transactions] = await Promise.all([fetchCategoriaRows(), fetchTransactions()]);
        if (seq !== seqRef.current) return;
        setState({ owner: userId, status: 'ready', data: { categories, transactions }, error: null, refreshing: false });
      } catch (error) {
        if (seq !== seqRef.current) return;
        setState((prev) => ({
          ...prev,
          status: prev.data ? 'ready' : 'error',
          error: errorInfo(error),
          refreshing: false,
        }));
      }
    },
    [userId],
  );

  useEffect(() => {
    void load('initial');
    return () => {
      seqRef.current += 1;
    };
  }, [load]);

  const firstFocusRef = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (firstFocusRef.current) {
        firstFocusRef.current = false;
        return;
      }
      void load('silent');
    }, [load]),
  );

  const refresh = useCallback(() => load('pull'), [load]);
  const retry = useCallback(() => load('initial'), [load]);

  /** Roda a gravação e recarrega mesmo se ela falhar (o servidor pode ter gravado). */
  const mutate = useCallback(
    async (operation) => {
      try {
        return await operation();
      } finally {
        await load('silent');
        syncLegacyStores();
      }
    },
    [load],
  );

  const { owner, ...rest } = state;
  if (owner !== userId) {
    return { ...rest, status: 'loading', data: null, error: null, refreshing: false, refresh, retry, mutate };
  }
  return { ...rest, refresh, retry, mutate };
}
