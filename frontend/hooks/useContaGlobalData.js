import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { fetchContasMoedaGlobal, fetchCotacoesBrl } from '@/lib/financeApi';

const errorInfo = (error, fallback) => ({ message: error?.message || fallback, kind: error?.kind || 'http' });

const EMPTY = {
  owner: null,
  contas: null,
  error: null,
  refreshing: false,
  rates: {},
  sources: [],
  ratesStatus: 'loading',
  ratesError: null,
};

/**
 * Saldos da Conta global + cotações das moedas cadastradas.
 * - `status`: 'loading' | 'ready' | 'error' (erro só quando ainda não há saldos carregados).
 * - Cotações falhando não escondem os saldos: `ratesStatus` = 'error' e a tela mostra a conversão indisponível.
 */
export function useContaGlobalData(userId) {
  const [state, setState] = useState(EMPTY);
  const seqRef = useRef(0);

  const load = useCallback(
    async (mode) => {
      if (!userId) return;
      const seq = ++seqRef.current;
      setState((prev) => {
        const base = prev.owner === userId ? prev : { ...EMPTY, owner: userId };
        return {
          ...base,
          owner: userId,
          refreshing: mode === 'pull',
          error: mode === 'silent' ? base.error : null,
        };
      });

      let contas;
      try {
        contas = await fetchContasMoedaGlobal();
      } catch (error) {
        if (seq !== seqRef.current) return;
        setState((prev) => ({ ...prev, error: errorInfo(error, 'Não foi possível carregar a Conta global.'), refreshing: false }));
        return;
      }
      if (seq !== seqRef.current) return;
      setState((prev) => {
        const known = prev.ratesStatus === 'ready' && contas.every((c) => c.moeda === 'BRL' || prev.rates[c.moeda] != null);
        return { ...prev, contas, error: null, refreshing: false, ratesStatus: !contas.length || known ? 'ready' : 'loading' };
      });
      if (!contas.length) return;

      try {
        const { rates, sources } = await fetchCotacoesBrl(contas.map((c) => c.moeda));
        if (seq !== seqRef.current) return;
        setState((prev) => ({ ...prev, rates, sources, ratesStatus: 'ready', ratesError: null }));
      } catch (error) {
        if (seq !== seqRef.current) return;
        setState((prev) => ({
          ...prev,
          rates: {},
          sources: [],
          ratesStatus: 'error',
          ratesError: errorInfo(error, 'Não foi possível consultar as cotações agora.'),
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
      }
    },
    [load],
  );

  const own = state.owner === userId ? state : EMPTY;
  const hasData = Array.isArray(own.contas);
  return {
    status: hasData ? 'ready' : own.error ? 'error' : 'loading',
    contas: own.contas || [],
    error: own.error,
    refreshing: own.refreshing,
    rates: own.rates,
    sources: own.sources,
    ratesStatus: own.ratesStatus,
    ratesError: own.ratesError,
    refresh,
    retry,
    mutate,
  };
}
