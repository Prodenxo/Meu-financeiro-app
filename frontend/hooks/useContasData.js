import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { fetchContas, fetchTransactions } from '@/lib/financeApi';
import { useContaFinanceiraStore } from '@/store/contaFinanceiraStore';
import { useTransactionStore } from '@/store/transactionStore';

const errorInfo = (error) => ({
  message: error?.message || 'Não foi possível carregar suas contas.',
  kind: error?.kind || 'http',
});

/** Seletores de conta ainda em TypeScript leem os stores antigos; mantém tudo igual depois de gravar. */
const syncLegacyStores = () => {
  const fetchLegacyContas = useContaFinanceiraStore.getState().fetchContas;
  if (typeof fetchLegacyContas === 'function') void fetchLegacyContas().catch(() => {});
  const fetchLegacyTx = useTransactionStore.getState().fetchTransactions;
  if (typeof fetchLegacyTx === 'function') void fetchLegacyTx().catch(() => {});
};

/**
 * Contas + lançamentos (o saldo atual de cada conta depende dos lançamentos realizados).
 * - `status`: 'loading' | 'ready' | 'error' (erro só quando ainda não há dados).
 * - `error` com dados = a última atualização falhou; os dados anteriores continuam na tela
 *   (falha de rede nunca vira "sem contas" nem saldo zero).
 */
export function useContasData(userId) {
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
        const [contas, transactions] = await Promise.all([fetchContas(), fetchTransactions()]);
        if (seq !== seqRef.current) return;
        setState({ owner: userId, status: 'ready', data: { contas, transactions }, error: null, refreshing: false });
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
