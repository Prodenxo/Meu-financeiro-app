import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { useAgendaViewStore } from '@/store/agendaViewStore';
import { useGoogleCalendarStore } from '@/store/googleCalendarStore';
import { useTransactionsViewStore } from '@/store/transactionsViewStore';
import { useNavigationDrawer } from '@/lib/navigationContext';
import { useAgendaData } from '@/hooks/useAgendaData';
import { createGoogleEvent, deleteGoogleEvent, disconnectGoogle, updateGoogleEvent } from '@/lib/googleCalendarApi';
import { startGoogleAuthFlow, promptGoogleAuth } from '@/lib/google-auth-flow';
import { createCalendarEvent } from '@/lib/google-calendar';
import { createRecorrencia, createTransaction, updateTransaction } from '@/lib/financeApi';
import { formToGooglePayload, googleEventToForm, monthOfKey } from '@/lib/finance/agenda';
import {
  buildAgendaModel,
  newEventForm,
  periodTitle,
  shiftDay,
  splitDayItems,
  todayKeyInAppTimeZone,
  viewRange,
} from '@/lib/finance/agendaScreen';
import { saveTransaction } from '@/lib/finance/transactionSave';
import { ToastNotice } from '@/components/ToastNotice';
import { getOverviewTokens, TOUCH_MIN } from './Dashboard/overview/overviewTokens';
import { OverviewError, StaleBanner } from './Dashboard/overview/OverviewStates';
import { ContasTopBar } from './Contas/ContasTopBar';
import { TransactionFormSheet } from './Transactions/TransactionFormSheet';
import { AgendaDayHeading, AgendaMonthGrid, AgendaPeriodBar, AgendaViewTabs, AgendaWeekStrip } from './Agenda/AgendaCalendar';
import { AgendaItemList } from './Agenda/AgendaItemRow';
import { AgendaEmptyDay, AgendaGoogleBanner, AgendaGoogleStatusRow, AgendaListSkeleton } from './Agenda/AgendaStates';
import { AgendaConnectSheet, AgendaDeleteSheet, AgendaDetailsSheet, AgendaGoogleManageSheet } from './Agenda/AgendaSheets';
import { AgendaEventFormSheet } from './Agenda/AgendaEventFormSheet';

const CONTENT_MAX = 720;
const MIN_HEADING_ROW = 340;
const saveApi = { createTransaction, updateTransaction, createRecorrencia, createCalendarEvent, promptGoogleAuth };

export default function AgendaScreen() {
  const userId = useAuthStore((s) => s.userId);
  const displayName = useAuthStore((s) => s.displayName);
  const { isDarkMode } = useThemeStore();
  const { navigateTo, openDrawer, hasGlobalNav, requestSignOut } = useNavigationDrawer();
  const tokens = useMemo(() => getOverviewTokens(isDarkMode), [isDarkMode]);
  const { width, fontScale } = useWindowDimensions();
  const stackedHeading = (Math.min(width, CONTENT_MAX) - 32) / Math.max(fontScale || 1, 1) < MIN_HEADING_ROW;

  const view = useAgendaViewStore((s) => s.view);
  const setView = useAgendaViewStore((s) => s.setView);
  const storedDay = useAgendaViewStore((s) => s.selectedDay);
  const setSelectedDay = useAgendaViewStore((s) => s.setSelectedDay);
  const setTxMonth = useTransactionsViewStore((s) => s.setSelectedMonth);

  const todayKey = todayKeyInAppTimeZone();
  const selectedDay = storedDay || todayKey;
  const range = useMemo(() => viewRange(view, selectedDay), [view, selectedDay]);

  const agenda = useAgendaData(userId, range);
  const { finance, google, mutateGoogle, mutateFinance } = agenda;
  const connected = google.connection === 'connected';

  const model = useMemo(
    () =>
      buildAgendaModel({
        transactions: finance.data?.transactions ?? [],
        contas: finance.data?.contas ?? [],
        googleEvents: google.events,
        startKey: range.startKey,
        endKey: range.endKey,
      }),
    [finance.data, google.events, range.startKey, range.endKey],
  );
  const dayItems = model.byDay[selectedDay] || [];
  const sections = useMemo(() => {
    if (view !== 'day') return [{ key: 'all', title: null, items: dayItems }];
    const { untimed, timed } = splitDayItems(dayItems);
    return [
      { key: 'untimed', title: 'Dia inteiro e lançamentos', items: untimed },
      { key: 'timed', title: 'Com horário', items: timed },
    ];
  }, [view, dayItems]);

  const [sheet, setSheet] = useState(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [toast, setToast] = useState(null);
  const notify = useCallback((message, variant = 'success') => setToast({ message, variant }), []);
  const closeSheet = useCallback(() => {
    if (!busyRef.current) setSheet(null);
  }, []);

  /** Uma gravação por vez (evita envio duplicado com toques repetidos). */
  const runExclusive = async (operation) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      await operation();
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const selectDay = useCallback((key) => setSelectedDay(key === todayKey ? null : key), [setSelectedDay, todayKey]);
  const goStep = (direction) => selectDay(shiftDay(view, selectedDay, direction));

  const needsGoogle = (next) => {
    if (connected) {
      next();
      return;
    }
    if (google.status === 'loading' && google.connection === 'unknown') {
      notify('Carregando sua Google Agenda…', 'info');
      return;
    }
    if (google.status === 'error' && google.error?.kind !== 'auth') {
      notify('Não foi possível falar com a Google Agenda agora. Tente de novo.', 'error');
      void agenda.retryGoogle();
      return;
    }
    if (google.status === 'error') {
      requestSignOut();
      return;
    }
    setSheet({ type: 'connect' });
  };

  const openNew = (isAllDay = false) =>
    needsGoogle(() => setSheet({ type: 'form', item: null, form: newEventForm(selectedDay, { isAllDay }) }));

  const openEdit = (item) => setSheet({ type: 'form', item, form: googleEventToForm(item.raw) });

  const handleConnect = () =>
    runExclusive(async () => {
      const ok = await startGoogleAuthFlow();
      if (ok === true) {
        setSheet(null);
        useGoogleCalendarStore.getState().notifyConnectionChanged();
        notify('Google Agenda conectada.');
      }
    });

  const handleSaveEvent = (form) =>
    runExclusive(async () => {
      const item = sheet?.item;
      setSheet((s) => (s ? { ...s, error: null } : s));
      try {
        const payload = formToGooglePayload(form);
        await mutateGoogle(() => (item ? updateGoogleEvent(item.sourceId, payload) : createGoogleEvent(payload)));
        setSheet(null);
        selectDay(form.startDate);
        notify(item ? 'Compromisso atualizado.' : 'Compromisso criado.');
      } catch (error) {
        if (error?.kind === 'not_connected' || error?.kind === 'expired') {
          setSheet({ type: 'connect' });
          return;
        }
        setSheet((s) => (s?.type === 'form' ? { ...s, error: error?.message || 'Não foi possível salvar o compromisso.' } : s));
      }
    });

  const handleDelete = (scope) =>
    runExclusive(async () => {
      const item = sheet?.item;
      if (!item) return;
      const eventId = scope === 'series' && item.recurringEventId ? item.recurringEventId : item.sourceId;
      try {
        await mutateGoogle(() => deleteGoogleEvent(eventId));
        setSheet(null);
        notify(scope === 'series' ? 'Série de compromissos excluída.' : 'Compromisso excluído.');
      } catch (error) {
        setSheet((s) => (s ? { ...s, error: error?.message || 'Não foi possível excluir o compromisso.' } : s));
      }
    });

  const handleSync = () => {
    setSheet(null);
    void agenda.retryGoogle();
    notify('Atualizando seus compromissos…', 'info');
  };

  const handleDisconnect = () =>
    runExclusive(async () => {
      try {
        await disconnectGoogle();
        setSheet(null);
        useGoogleCalendarStore.getState().notifyConnectionChanged();
        notify('Google Agenda desconectada.');
      } catch (error) {
        setSheet((s) => (s ? { ...s, error: error?.message || 'Não foi possível desconectar.' } : s));
      }
    });

  const handleSaveTransaction = (values) =>
    runExclusive(async () => {
      const draft = sheet?.draft;
      try {
        const { warnings } = await mutateFinance(() => saveTransaction(values, draft, saveApi));
        setSheet(null);
        if (warnings.length) notify(warnings.join(' '), 'info');
        else notify('Transação salva.');
      } catch (error) {
        notify(error?.message || 'Não foi possível salvar.', 'error');
      }
    });

  const openTransactions = (item) => {
    setSheet(null);
    setTxMonth(monthOfKey(item.dayKey));
    navigateTo('Transacoes');
  };

  let listBody;
  if (finance.status === 'loading' && !finance.data) {
    listBody = <AgendaListSkeleton tokens={tokens} />;
  } else if (!finance.data) {
    listBody = <OverviewError tokens={tokens} error={finance.error} onRetry={agenda.retryFinance} onSignIn={requestSignOut} />;
  } else if (dayItems.length === 0) {
    listBody = <AgendaEmptyDay tokens={tokens} google={google} onNew={() => openNew(false)} />;
  } else {
    listBody = <AgendaItemList tokens={tokens} sections={sections} onPress={(item) => setSheet({ type: 'details', item })} />;
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: tokens.canvas }]} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.root}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={agenda.refreshing} onRefresh={agenda.refresh} tintColor={tokens.primary} colors={[tokens.primary]} />
        }
      >
        <ContasTopBar
          tokens={tokens}
          title="Agenda"
          displayName={displayName}
          showMenu={!hasGlobalNav}
          onOpenMenu={openDrawer}
          onOpenProfile={() => navigateTo('Configuracoes')}
        />
        <AgendaPeriodBar
          tokens={tokens}
          title={periodTitle(view, selectedDay)}
          view={view}
          isToday={selectedDay === todayKey}
          onPrev={() => goStep(-1)}
          onNext={() => goStep(1)}
          onToday={() => setSelectedDay(null)}
        />
        <AgendaViewTabs tokens={tokens} value={view} onChange={setView} />

        {finance.data && finance.error ? <StaleBanner tokens={tokens} error={finance.error} onRetry={agenda.refresh} /> : null}

        {view === 'month' ? (
          <AgendaMonthGrid tokens={tokens} selectedDay={selectedDay} todayKey={todayKey} dots={model.dots} onSelect={selectDay} />
        ) : null}
        {view === 'week' ? (
          <AgendaWeekStrip tokens={tokens} selectedDay={selectedDay} todayKey={todayKey} dots={model.dots} onSelect={selectDay} />
        ) : null}

        <AgendaGoogleBanner
          tokens={tokens}
          google={google}
          busy={busy}
          onConnect={handleConnect}
          onRetry={agenda.retryGoogle}
          onSignIn={requestSignOut}
        />

        <AgendaDayHeading tokens={tokens} selectedDay={selectedDay} todayKey={todayKey} stacked={stackedHeading} />
        {listBody}

        <Pressable
          onPress={() => openNew(false)}
          accessibilityRole="button"
          style={({ pressed }) => [styles.newBtn, { borderColor: tokens.primary }, pressed && { backgroundColor: tokens.primarySoft }]}
        >
          <Ionicons name="add" size={20} color={tokens.primary} />
          <Text style={[styles.newText, { color: tokens.primary }]}>Novo compromisso</Text>
        </Pressable>
        <View style={styles.quickRow}>
          <Pressable
            onPress={() => openNew(true)}
            accessibilityRole="button"
            accessibilityLabel="Criar lembrete de dia inteiro"
            style={({ pressed }) => [styles.quickBtn, { backgroundColor: tokens.card, borderColor: tokens.cardBorder }, pressed && { opacity: 0.75 }]}
          >
            <Ionicons name="notifications-outline" size={16} color={tokens.text} />
            <Text style={[styles.quickText, { color: tokens.text }]}>Criar lembrete</Text>
          </Pressable>
          <Pressable
            onPress={() => setSheet({ type: 'tx', draft: { mode: 'create', tx: { data: selectedDay, tipo: 'saida', status: 'a_pagar' } } })}
            disabled={!finance.data}
            accessibilityRole="button"
            accessibilityState={{ disabled: !finance.data }}
            style={({ pressed }) => [
              styles.quickBtn,
              { backgroundColor: tokens.card, borderColor: tokens.cardBorder },
              (pressed || !finance.data) && { opacity: 0.6 },
            ]}
          >
            <Ionicons name="receipt-outline" size={16} color={tokens.text} />
            <Text style={[styles.quickText, { color: tokens.text }]}>Adicionar pagamento</Text>
          </Pressable>
        </View>
        {view !== 'day' ? (
          <Text style={[styles.hint, { color: tokens.textSecondary }]}>Selecione um dia para ver seus eventos.</Text>
        ) : null}
        <AgendaGoogleStatusRow tokens={tokens} google={google} onManage={() => setSheet({ type: 'manage' })} />
      </ScrollView>

      {sheet?.type === 'details' ? (
        <AgendaDetailsSheet
          tokens={tokens}
          item={sheet.item}
          canEditGoogle={connected}
          onClose={closeSheet}
          onOpenTransactions={openTransactions}
          onEdit={openEdit}
          onDelete={(item) => setSheet({ type: 'delete', item })}
        />
      ) : null}

      {sheet?.type === 'form' ? (
        <AgendaEventFormSheet
          key={sheet.item?.id || 'novo'}
          tokens={tokens}
          initialForm={sheet.form}
          isEdit={Boolean(sheet.item)}
          isOccurrence={Boolean(sheet.item?.isRecurring)}
          saving={busy}
          error={sheet.error}
          onSubmit={handleSaveEvent}
          onClose={closeSheet}
        />
      ) : null}

      {sheet?.type === 'delete' ? (
        <AgendaDeleteSheet tokens={tokens} item={sheet.item} busy={busy} error={sheet.error} onConfirm={handleDelete} onClose={closeSheet} />
      ) : null}

      {sheet?.type === 'manage' ? (
        <AgendaGoogleManageSheet
          tokens={tokens}
          busy={busy}
          confirming={Boolean(sheet.confirming)}
          error={sheet.error}
          onSync={handleSync}
          onAskDisconnect={() => setSheet({ type: 'manage', confirming: true })}
          onCancelDisconnect={() => setSheet({ type: 'manage' })}
          onDisconnect={handleDisconnect}
          onClose={closeSheet}
        />
      ) : null}

      {sheet?.type === 'connect' ? (
        <AgendaConnectSheet tokens={tokens} expired={google.connection === 'expired'} busy={busy} onConnect={handleConnect} onClose={closeSheet} />
      ) : null}

      {sheet?.type === 'tx' ? (
        <TransactionFormSheet
          tokens={tokens}
          draft={sheet.draft}
          contas={(finance.data?.contas ?? []).filter((c) => c.ativo)}
          categories={finance.data?.categories?.list}
          saving={busy}
          onSubmit={handleSaveTransaction}
          onClose={closeSheet}
        />
      ) : null}

      <ToastNotice visible={Boolean(toast)} message={toast?.message || ''} variant={toast?.variant} onDismiss={() => setToast(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 32,
    gap: 14,
    width: '100%',
    maxWidth: CONTENT_MAX,
    alignSelf: 'center',
    flexGrow: 1,
  },
  newBtn: {
    flexDirection: 'row',
    gap: 8,
    minHeight: TOUCH_MIN + 8,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  newText: { fontSize: 16, fontWeight: '700' },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: -4 },
  quickBtn: {
    flexGrow: 1,
    flexBasis: 150,
    flexDirection: 'row',
    gap: 6,
    minHeight: TOUCH_MIN,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  quickText: { fontSize: 14, fontWeight: '600' },
  hint: { fontSize: 13, textAlign: 'center' },
});
