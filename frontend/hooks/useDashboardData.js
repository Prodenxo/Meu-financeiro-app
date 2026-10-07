import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  fetchBudgetSummary,
  fetchBudgetsYearly,
  fetchCategories,
  fetchContas,
  fetchDreMatrix,
  fetchTransactions,
} from '@/lib/financeApi';

const errorInfo = (error) => ({
  message: error?.message || 'Não foi possível carregar seus dados.',
  kind: error?.kind || 'http',
});

/**
 * Lançamentos, contas e categorias do usuário.
 * - `status`: 'loading' | 'ready' | 'error' (erro só quando ainda não há dados).
 * - `error` com dados presentes = última atualização falhou; os valores exibidos são os anteriores.
 * - `version` muda a cada carga bem-sucedida (dependentes, como orçamentos, recarregam junto).
 */
export function useDashboardData(userId) {
  const [state, setState] = useState({
    owner: null,
    status: 'loading',
    data: null,
    error: null,
    refreshing: false,
    version: 0,
  });
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
        const [transactions, contas, categories] = await Promise.all([
          fetchTransactions(),
          fetchContas(),
          fetchCategories(),
        ]);
        if (seq !== seqRef.current) return;
        setState((prev) => ({
          owner: userId,
          status: 'ready',
          data: { transactions, contas, categories },
          error: null,
          refreshing: false,
          version: prev.version + 1,
        }));
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

  const { owner, ...rest } = state;
  if (owner !== userId) {
    return { ...rest, status: 'loading', data: null, error: null, refreshing: false, refresh, retry };
  }
  return { ...rest, refresh, retry };
}

/** Resumo de orçamento do mês (`month` 1–12). Respostas de meses anteriores são descartadas. */
export function useBudgetSummary(userId, year, month, version) {
  const [state, setState] = useState({ key: null, status: 'loading', rows: [], error: null });
  const seqRef = useRef(0);
  const key = `${userId}:${year}-${month}`;

  const load = useCallback(async () => {
    if (!userId) return;
    const seq = ++seqRef.current;
    setState((prev) => ({
      key,
      status: 'loading',
      rows: prev.key === key ? prev.rows : [],
      error: null,
    }));
    try {
      const rows = await fetchBudgetSummary({ year, month });
      if (seq !== seqRef.current) return;
      setState({ key, status: 'ready', rows, error: null });
    } catch (error) {
      if (seq !== seqRef.current) return;
      setState({ key, status: 'error', rows: [], error: errorInfo(error) });
    }
  }, [userId, year, month, key]);

  useEffect(() => {
    void load();
    return () => {
      seqRef.current += 1;
    };
  }, [load, version]);

  if (state.key !== key) return { status: 'loading', rows: [], error: null, retry: load };
  return { status: state.status, rows: state.rows, error: state.error, retry: load };
}

/** Matriz orçado × realizado e orçamentos do ano para a Visão BPO (só carrega quando `enabled`). */
export function useBpoData(userId, year, enabled) {
  const [state, setState] = useState({ key: null, status: 'idle', cells: [], yearly: [], error: null });
  const seqRef = useRef(0);
  const key = `${userId}:${year}`;

  const load = useCallback(async () => {
    if (!userId || !enabled) return;
    const seq = ++seqRef.current;
    setState({ key, status: 'loading', cells: [], yearly: [], error: null });
    try {
      const [cells, yearly] = await Promise.all([fetchDreMatrix(year), fetchBudgetsYearly(year)]);
      if (seq !== seqRef.current) return;
      setState({ key, status: 'ready', cells, yearly, error: null });
    } catch (error) {
      if (seq !== seqRef.current) return;
      setState({ key, status: 'error', cells: [], yearly: [], error: errorInfo(error) });
    }
  }, [userId, year, enabled, key]);

  useEffect(() => {
    void load();
    return () => {
      seqRef.current += 1;
    };
  }, [load]);

  if (state.key !== key) return { status: 'loading', cells: [], yearly: [], error: null, retry: load };
  return { status: state.status, cells: state.cells, yearly: state.yearly, error: state.error, retry: load };
}
