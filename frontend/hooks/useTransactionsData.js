import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  fetchCategories,
  fetchContas,
  fetchRecorrenciaSkips,
  fetchRecorrencias,
  fetchTransactions,
} from '@/lib/financeApi';
import { useTransactionStore } from '@/store/transactionStore';

const errorInfo = (error) => ({
  message: error?.message || 'Não foi possível carregar suas transações.',
  kind: error?.kind || 'http',
});

/** Telas ainda em TypeScript (Agenda, Contas, Recorrências) leem o store antigo; mantém tudo igual depois de gravar. */
const syncLegacyStore = () => {
  const fetchLegacy = useTransactionStore.getState().fetchTransactions;
  if (typeof fetchLegacy === 'function') void fetchLegacy().catch(() => {});
};

/**
 * Base completa da tela Transações (o servidor não pagina `/transactions`; os totais
 * precisam do conjunto inteiro, igual ao site).
 * - `status`: 'loading' | 'ready' | 'error' (erro só quando ainda não há dados).
 * - `error` com dados = a última atualização falhou e os dados anteriores continuam na tela.
 * - respostas antigas são descartadas (sequência), inclusive depois de uma gravação.
 */
export function useTransactionsData(userId) {
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
        const [transactions, contas, categories, recorrencias, skips] = await Promise.all([
          fetchTransactions(),
          fetchContas(),
          fetchCategories(),
          fetchRecorrencias(),
          fetchRecorrenciaSkips(),
        ]);
        if (seq !== seqRef.current) return;
        setState({
          owner: userId,
          status: 'ready',
          data: { transactions, contas, categories, recorrencias, skips },
          error: null,
          refreshing: false,
        });
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

  /** Roda a gravação e recarrega a base mesmo se ela falhar (o servidor pode ter gravado parte). */
  const mutate = useCallback(
    async (operation) => {
      try {
        return await operation();
      } finally {
        await load('silent');
        syncLegacyStore();
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
