import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { fetchCategories, fetchContas, fetchTransactions } from '@/lib/financeApi';
import { fetchGoogleEvents } from '@/lib/googleCalendarApi';
import { googleTimeRange } from '@/lib/finance/agendaScreen';
import { useGoogleCalendarStore } from '@/store/googleCalendarStore';
import { useTransactionStore } from '@/store/transactionStore';

const errorInfo = (error, fallback) => ({ message: error?.message || fallback, kind: error?.kind || 'http' });

const syncLegacyTransactions = () => {
  const fetchLegacyTx = useTransactionStore.getState().fetchTransactions;
  if (typeof fetchLegacyTx === 'function') void fetchLegacyTx().catch(() => {});
};

const IDLE_GOOGLE = { rangeKey: null, status: 'loading', connection: 'unknown', events: [], error: null };

/**
 * Lançamentos + contas (API do Meu Financeiro) e eventos do Google Agenda do intervalo visível.
 * - `finance.status` / `google.status`: 'loading' | 'ready' | 'error'.
 * - `google.connection`: 'unknown' | 'connected' | 'not_connected' | 'expired' (vem da resposta real da edge function).
 * - Respostas antigas (troca rápida de período) são descartadas e nunca mudam o dia escolhido.
 */
export function useAgendaData(userId, range) {
  const [finance, setFinance] = useState({ owner: null, status: 'loading', data: null, error: null });
  const [google, setGoogle] = useState(IDLE_GOOGLE);
  const [refreshing, setRefreshing] = useState(false);
  const financeSeq = useRef(0);
  const googleSeq = useRef(0);
  const googleAbort = useRef(null);
  const rangeKey = `${range.startKey}_${range.endKey}`;
  const rangeRef = useRef(range);
  rangeRef.current = range;
  const connectionVersion = useGoogleCalendarStore((s) => s.connectionVersion);

  const loadFinance = useCallback(
    async (mode) => {
      if (!userId) return;
      const seq = ++financeSeq.current;
      setFinance((prev) => {
        const same = prev.owner === userId;
        return {
          owner: userId,
          data: same ? prev.data : null,
          status: same && prev.data ? prev.status : 'loading',
          error: mode === 'silent' && same ? prev.error : null,
        };
      });
      try {
        const [transactions, contas, categories] = await Promise.all([
          fetchTransactions(),
          fetchContas(),
          fetchCategories().catch(() => null),
        ]);
        if (seq !== financeSeq.current) return;
        setFinance({ owner: userId, status: 'ready', data: { transactions, contas, categories }, error: null });
      } catch (error) {
        if (seq !== financeSeq.current) return;
        setFinance((prev) => ({
          ...prev,
          status: prev.data ? 'ready' : 'error',
          error: errorInfo(error, 'Não foi possível carregar seus lançamentos.'),
        }));
      }
    },
    [userId],
  );

  const loadGoogle = useCallback(
    async (mode) => {
      if (!userId) return;
      const current = rangeRef.current;
      const key = `${current.startKey}_${current.endKey}`;
      const seq = ++googleSeq.current;
      googleAbort.current?.abort();
      const controller = new AbortController();
      googleAbort.current = controller;
      setGoogle((prev) => ({
        ...prev,
        rangeKey: key,
        status: mode === 'silent' && prev.rangeKey === key && prev.status === 'ready' ? 'ready' : 'loading',
        events: prev.rangeKey === key ? prev.events : [],
        error: mode === 'silent' && prev.rangeKey === key ? prev.error : null,
      }));
      try {
        const events = await fetchGoogleEvents(googleTimeRange(current), { signal: controller.signal });
        if (seq !== googleSeq.current) return;
        setGoogle({ rangeKey: key, status: 'ready', connection: 'connected', events, error: null });
      } catch (error) {
        if (seq !== googleSeq.current || controller.signal.aborted) return;
        if (error?.kind === 'not_connected' || error?.kind === 'expired') {
          setGoogle({ rangeKey: key, status: 'ready', connection: error.kind, events: [], error: null });
          return;
        }
        setGoogle((prev) => ({
          ...prev,
          rangeKey: key,
          status: 'error',
          error: errorInfo(error, 'Não foi possível carregar a Google Agenda.'),
        }));
      }
    },
    [userId],
  );

  useEffect(() => {
    void loadFinance('initial');
    return () => {
      financeSeq.current += 1;
    };
  }, [loadFinance]);

  useEffect(() => {
    void loadGoogle('initial');
  }, [loadGoogle, rangeKey, connectionVersion]);

  useEffect(
    () => () => {
      googleSeq.current += 1;
      googleAbort.current?.abort();
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
      void loadFinance('silent');
      void loadGoogle('silent');
    }, [loadFinance, loadGoogle]),
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadFinance('pull'), loadGoogle('initial')]);
    } finally {
      setRefreshing(false);
    }
  }, [loadFinance, loadGoogle]);

  const retryFinance = useCallback(() => loadFinance('initial'), [loadFinance]);
  const retryGoogle = useCallback(() => loadGoogle('initial'), [loadGoogle]);

  /** Grava no Google e recarrega mesmo se falhar (o Google pode ter gravado). */
  const mutateGoogle = useCallback(
    async (operation) => {
      try {
        return await operation();
      } finally {
        await loadGoogle('silent');
      }
    },
    [loadGoogle],
  );

  /** Grava um lançamento; recarrega os dois lados (o lançamento pode ter criado um lembrete no Google). */
  const mutateFinance = useCallback(
    async (operation) => {
      try {
        return await operation();
      } finally {
        await Promise.all([loadFinance('silent'), loadGoogle('silent')]);
        syncLegacyTransactions();
      }
    },
    [loadFinance, loadGoogle],
  );

  const ownFinance =
    finance.owner === userId ? finance : { owner: userId, status: 'loading', data: null, error: null };
  const googleForRange =
    google.rangeKey === rangeKey ? google : { ...google, rangeKey, status: 'loading', events: [], error: null };

  return {
    finance: ownFinance,
    google: googleForRange,
    refreshing,
    refresh,
    retryFinance,
    retryGoogle,
    mutateGoogle,
    mutateFinance,
  };
}
