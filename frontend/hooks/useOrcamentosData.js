import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { fetchBudgetSummary, fetchCategoriaRows } from '@/lib/financeApi';
import { monthKey, normalizeBudgetSummaryRow } from '@/lib/finance/orcamentosScreen';

const errorInfo = (error) => ({
  message: error?.message || 'Não foi possível carregar seus orçamentos.',
  kind: error?.kind || 'http',
});

export async function loadMonthSummary(month) {
  return (await fetchBudgetSummary(month)).map(normalizeBudgetSummaryRow);
}

const EMPTY = { owner: null, categories: null, summaries: {}, errors: {}, refreshing: false };

/**
 * Categorias + resumo de orçamento do mês (orçado e realizado calculados pelo servidor).
 * - `status`: 'loading' | 'ready' | 'error' — erro só quando o mês ainda não tem dados; realizado zero
 *   carregado é 'ready', nunca confundido com falha.
 * - `error` com dados = a última atualização falhou; os valores anteriores continuam na tela.
 * Meses já abertos ficam guardados e são atualizados em segundo plano.
 */
export function useOrcamentosData(userId, selectedMonth) {
  const [state, setState] = useState(EMPTY);
  const seqRef = useRef(0);
  const key = monthKey(selectedMonth);
  const monthRef = useRef(selectedMonth);
  monthRef.current = selectedMonth;

  const load = useCallback(
    async (mode) => {
      if (!userId) return;
      const month = monthRef.current;
      const k = monthKey(month);
      const seq = ++seqRef.current;
      setState((prev) => {
        const base = prev.owner === userId ? prev : { ...EMPTY, owner: userId };
        const errors = { ...base.errors };
        if (mode !== 'silent') delete errors[k];
        return { ...base, owner: userId, errors, refreshing: mode === 'pull' };
      });
      try {
        const [categories, summary] = await Promise.all([fetchCategoriaRows(), loadMonthSummary(month)]);
        if (seq !== seqRef.current) return;
        setState((prev) => {
          const errors = { ...prev.errors };
          delete errors[k];
          return { ...prev, categories, summaries: { ...prev.summaries, [k]: summary }, errors, refreshing: false };
        });
      } catch (error) {
        if (seq !== seqRef.current) return;
        setState((prev) => ({ ...prev, errors: { ...prev.errors, [k]: errorInfo(error) }, refreshing: false }));
      }
    },
    [userId],
  );

  useEffect(() => {
    void load('month');
  }, [load, key]);

  useEffect(
    () => () => {
      seqRef.current += 1;
    },
    [],
  );

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
  const retry = useCallback(() => load('month'), [load]);

  /** Roda a gravação e recarrega mesmo se ela falhar (o servidor pode ter gravado). */
  const mutate = useCallback(
    async (operation) => {
      try {
        return await operation();
      } finally {
        await load('silent');
      }
    },
    [load],
  );

  const ownState = state.owner === userId ? state : EMPTY;
  const summary = ownState.summaries[key];
  const hasData = Boolean(ownState.categories && summary);
  const error = ownState.errors[key] || null;
  return {
    status: hasData ? 'ready' : error ? 'error' : 'loading',
    data: hasData ? { categories: ownState.categories, summary } : null,
    error,
    refreshing: ownState.refreshing,
    refresh,
    retry,
    mutate,
  };
}
