import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { fetchAllTutorials, fetchPublishedTutorials, fetchTutorialById } from '@/lib/tutoriaisApi';

const errorInfo = (error, fallback) => ({ message: error?.message || fallback, kind: error?.kind || 'http' });

const EMPTY = { key: null, data: null, unavailable: false, error: null, refreshing: false };

/**
 * Carrega com estados `loading` | `ready` | `error` (erro só sem dados já carregados),
 * puxar para atualizar e recarga silenciosa ao voltar para a tela.
 */
function useLoader(key, fetcher, fallbackMessage) {
  const [state, setState] = useState(EMPTY);
  const seqRef = useRef(0);

  const load = useCallback(
    async (mode) => {
      if (!key) return;
      const seq = ++seqRef.current;
      setState((prev) => {
        const base = prev.key === key ? prev : { ...EMPTY, key };
        return { ...base, key, refreshing: mode === 'pull', error: mode === 'silent' ? base.error : null };
      });
      try {
        const result = await fetcher();
        if (seq !== seqRef.current) return;
        setState({ key, data: result, unavailable: result?.unavailable === true, error: null, refreshing: false });
      } catch (error) {
        if (seq !== seqRef.current) return;
        setState((prev) => ({ ...prev, error: errorInfo(error, fallbackMessage), refreshing: false }));
      }
    },
    [key, fetcher, fallbackMessage],
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

  const own = state.key === key ? state : EMPTY;
  return {
    status: own.data ? 'ready' : own.error ? 'error' : 'loading',
    data: own.data,
    unavailable: own.unavailable,
    error: own.error,
    refreshing: own.refreshing,
    refresh,
    retry,
    mutate,
  };
}

/** `scope`: 'published' (central) ou 'all' (gestão do superadmin). */
export function useTutoriaisData(userId, scope = 'published') {
  const fetcher = scope === 'all' ? fetchAllTutorials : fetchPublishedTutorials;
  const loader = useLoader(userId ? `${userId}:${scope}` : null, fetcher, 'Não foi possível carregar os tutoriais.');
  return { ...loader, tutorials: loader.data?.tutorials || [] };
}

export function useTutorialDetail(userId, id) {
  const fetcher = useCallback(() => fetchTutorialById(id), [id]);
  const loader = useLoader(userId && id ? `${userId}:${id}` : null, fetcher, 'Não foi possível abrir o tutorial.');
  return { ...loader, tutorial: loader.data?.tutorial || null };
}
