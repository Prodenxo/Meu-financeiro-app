import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { checkGoogleConnection, fetchGoogleEvents } from '@/lib/googleCalendarApi';
import { googleTimeRange, todayKeyInAppTimeZone } from '@/lib/finance/agendaScreen';
import { useGoogleCalendarStore } from '@/store/googleCalendarStore';

/**
 * Estado real da Google Agenda (edge function `google-calendar`).
 * - `status`: 'loading' | 'connected' | 'not_connected' | 'expired' | 'error'.
 * `check-auth` responde só sim/não; quando é "não", uma consulta curta de eventos diz se nunca
 * conectou ou se a autorização expirou/foi revogada.
 */
export function useGoogleConnection(userId) {
  const [state, setState] = useState({ owner: null, status: 'loading', error: null });
  const seqRef = useRef(0);
  const connectionVersion = useGoogleCalendarStore((s) => s.connectionVersion);

  const check = useCallback(async () => {
    if (!userId) return;
    const seq = ++seqRef.current;
    setState((prev) => ({ owner: userId, status: prev.owner === userId && prev.status !== 'error' ? prev.status : 'loading', error: null }));
    const finish = (status, error = null) => {
      if (seq === seqRef.current) setState({ owner: userId, status, error });
    };
    try {
      if (await checkGoogleConnection()) {
        finish('connected');
        return;
      }
      const today = todayKeyInAppTimeZone();
      await fetchGoogleEvents(googleTimeRange({ startKey: today, endKey: today }));
      finish('connected');
    } catch (error) {
      if (error?.kind === 'not_connected' || error?.kind === 'expired') {
        finish(error.kind);
        return;
      }
      finish('error', { message: error?.message || 'Não foi possível verificar a Google Agenda.', kind: error?.kind || 'http' });
    }
  }, [userId]);

  useEffect(() => {
    void check();
  }, [check, connectionVersion]);

  const firstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      void check();
    }, [check]),
  );

  if (state.owner !== userId) return { status: 'loading', error: null, check };
  return { status: state.status, error: state.error, check };
}
