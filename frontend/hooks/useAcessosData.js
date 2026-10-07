import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { fetchEmpresas, fetchInvites, fetchManagedUsers } from '@/lib/acessosApi';

const errorInfo = (error, fallback) => ({ message: error?.message || fallback, kind: error?.kind || 'http' });

const EMPTY = {
  owner: null,
  users: null,
  empresas: [],
  error: null,
  refreshing: false,
  invites: null,
  invitesError: null,
};

/**
 * Listas completas de "Gerenciar acessos" (o backend não pagina: busca, filtros, ordem,
 * páginas e indicadores são calculados sobre o conjunto inteiro na tela).
 * - `status`: 'loading' | 'ready' | 'error' (erro só quando ainda não há usuários carregados).
 * - Convites têm estado próprio: falha neles não esconde a lista de usuários.
 */
export function useAcessosData(userId) {
  const [state, setState] = useState(EMPTY);
  const seqRef = useRef(0);

  const load = useCallback(
    async (mode) => {
      if (!userId) return;
      const seq = ++seqRef.current;
      setState((prev) => {
        const base = prev.owner === userId ? prev : { ...EMPTY, owner: userId };
        return { ...base, owner: userId, refreshing: mode === 'pull', error: mode === 'silent' ? base.error : null };
      });

      const [usersRes, empresasRes, invitesRes] = await Promise.allSettled([
        fetchManagedUsers(),
        fetchEmpresas(),
        fetchInvites(),
      ]);
      if (seq !== seqRef.current) return;

      setState((prev) => ({
        ...prev,
        refreshing: false,
        users: usersRes.status === 'fulfilled' ? usersRes.value : prev.users,
        empresas: empresasRes.status === 'fulfilled' ? empresasRes.value : prev.empresas,
        error:
          usersRes.status === 'rejected'
            ? errorInfo(usersRes.reason, 'Não foi possível carregar os usuários.')
            : empresasRes.status === 'rejected'
              ? errorInfo(empresasRes.reason, 'Não foi possível carregar as empresas.')
              : null,
        invites: invitesRes.status === 'fulfilled' ? invitesRes.value : prev.invites,
        invitesError:
          invitesRes.status === 'rejected' ? errorInfo(invitesRes.reason, 'Não foi possível carregar os convites.') : null,
      }));
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
  const hasData = Array.isArray(own.users);
  return {
    status: hasData ? 'ready' : own.error ? 'error' : 'loading',
    users: own.users || [],
    empresas: own.empresas,
    error: own.error,
    refreshing: own.refreshing,
    invites: own.invites || [],
    invitesStatus: Array.isArray(own.invites) ? 'ready' : own.invitesError ? 'error' : 'loading',
    invitesError: own.invitesError,
    refresh,
    retry,
    mutate,
  };
}
