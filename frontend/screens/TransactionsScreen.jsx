import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, RefreshControl, SectionList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { useTransactionsViewStore } from '@/store/transactionsViewStore';
import { useNavigationDrawer } from '@/lib/navigationContext';
import { useTransactionsData } from '@/hooks/useTransactionsData';
import {
  createRecorrencia,
  createTransaction,
  deleteTransaction,
  updateTransaction,
} from '@/lib/financeApi';
import { createCalendarEvent } from '@/lib/google-calendar';
import { promptGoogleAuth } from '@/lib/google-auth-flow';
import { exportTransactionsToExcel } from '@/lib/exportTransactionsSpreadsheet';
import { buildContaNameMap } from '@/lib/finance/contas';
import { nextMonth, prevMonth } from '@/lib/finance/dashboard';
import { buildDuplicateDraft, buildMaterializationDraft } from '@/lib/finance/recorrencias';
import { toDayKey } from '@/lib/finance/normalize';
import { dayKeyToDate, monthsAhead, resolvePeriod } from '@/lib/finance/transactions';
import {
  buildTransactionsScreenModel,
  chipForFilters,
  countPanelFilters,
  groupRowsByDay,
  hasScreenFilters,
  paidStatusFor,
  summaryCaption,
} from '@/lib/finance/transactionsScreen';
import { saveTransaction } from '@/lib/finance/transactionSave';
import { ToastNotice } from '@/components/ToastNotice';
import { getOverviewTokens, TOUCH_MIN } from './Dashboard/overview/overviewTokens';
import { OverviewError, StaleBanner } from './Dashboard/overview/OverviewStates';
import { PeriodBar, TransactionsTopBar } from './Transactions/TransactionsTopBar';
import { TransactionsSummaryCard } from './Transactions/TransactionsSummaryCard';
import { TransactionsChips, TransactionsCountRow, TransactionsSearchBar } from './Transactions/TransactionsSearchBar';
import { DaySectionHeader, TransactionRow } from './Transactions/TransactionRow';
import { TransactionDetailsSheet } from './Transactions/TransactionDetailsSheet';
import { TransactionsFiltersSheet } from './Transactions/TransactionsFiltersSheet';
import { TransactionFormSheet } from './Transactions/TransactionFormSheet';
import { DeleteTransactionSheet } from './Transactions/DeleteTransactionSheet';
import { TransactionsEmpty, TransactionsSkeleton } from './Transactions/TransactionsStates';

const FAB_HEIGHT = 52;
const FAB_MARGIN = 16;
const LIST_BOTTOM_SPACE = FAB_HEIGHT + FAB_MARGIN * 2;
const SEARCH_DEBOUNCE_MS = 250;

const saveApi = { createTransaction, updateTransaction, createRecorrencia, createCalendarEvent, promptGoogleAuth };

export default function TransactionsScreen() {
  const userId = useAuthStore((s) => s.userId);
  const displayName = useAuthStore((s) => s.displayName);
  const { isDarkMode } = useThemeStore();
  const { navigateTo, requestSignOut } = useNavigationDrawer();
  const tokens = useMemo(() => getOverviewTokens(isDarkMode), [isDarkMode]);

  const filters = useTransactionsViewStore((s) => s.filters);
  const sort = useTransactionsViewStore((s) => s.sort);
  const selectedMonth = useTransactionsViewStore((s) => s.selectedMonth);
  const setFilters = useTransactionsViewStore((s) => s.setFilters);
  const setSort = useTransactionsViewStore((s) => s.setSort);
  const setSelectedMonth = useTransactionsViewStore((s) => s.setSelectedMonth);
  const resetFilters = useTransactionsViewStore((s) => s.resetFilters);

  const [searchText, setSearchText] = useState(filters.search);
  useEffect(() => {
    if (searchText === filters.search) return undefined;
    const timer = setTimeout(() => setFilters({ search: searchText.trim() }), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchText, filters.search, setFilters]);

  const txData = useTransactionsData(userId);
  const { data, mutate } = txData;

  const [sheet, setSheet] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [busyIds, setBusyIds] = useState(() => new Set());
  const [toast, setToast] = useState(null);
  const notify = useCallback((message, variant = 'success') => setToast({ message, variant }), []);
  const closeSheet = useCallback(() => setSheet(null), []);

  const contas = useMemo(() => data?.contas ?? [], [data]);
  const activeContas = useMemo(() => contas.filter((c) => c.ativo), [contas]);
  const contaNameById = useMemo(() => buildContaNameMap(contas), [contas]);
  const categoryList = data?.categories?.list;

  const effectiveFilters = useMemo(() => {
    const validConta =
      filters.contaFilter === 'all' ||
      filters.contaFilter === 'unassigned' ||
      contas.some((c) => c.id === filters.contaFilter);
    return validConta ? filters : { ...filters, contaFilter: 'all' };
  }, [filters, contas]);

  const todayKey = toDayKey(new Date());
  const today = useMemo(() => dayKeyToDate(todayKey), [todayKey]);
  const period = useMemo(
    () => resolvePeriod({ period: effectiveFilters.period, selectedMonth, dateRange: effectiveFilters.dateRange, today }),
    [effectiveFilters.period, effectiveFilters.dateRange, selectedMonth, today],
  );
  const model = useMemo(() => {
    if (!data) return null;
    return buildTransactionsScreenModel({
      transactions: data.transactions,
      recorrencias: data.recorrencias,
      skips: data.skips,
      filters: effectiveFilters,
      selectedMonth,
      today,
      sort,
    });
  }, [data, effectiveFilters, selectedMonth, sort, today]);

  const sections = useMemo(() => (model ? groupRowsByDay(model.rows, sort) : []), [model, sort]);
  const isMonth = period.mode === 'month';

  const setBusy = (id, on) =>
    setBusyIds((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  const handleMarkPaid = useCallback(
    async (item) => {
      setSheet(null);
      setBusy(item.id, true);
      try {
        await mutate(() => updateTransaction(item.id, { status: paidStatusFor(item) }));
        notify(paidStatusFor(item) === 'recebido' ? 'Marcado como recebido.' : 'Marcado como pago.');
      } catch (error) {
        notify(error?.message || 'Não foi possível atualizar.', 'error');
      } finally {
        setBusy(item.id, false);
      }
    },
    [mutate, notify],
  );

  const openForm = useCallback((draft) => setSheet({ type: 'form', draft }), []);
  const handleLaunch = useCallback((item) => openForm({ mode: 'launch', tx: buildMaterializationDraft(item) }), [openForm]);
  const handleOpenDetails = useCallback((item) => setSheet({ type: 'details', item }), []);
  const handleOpenMenu = useCallback((item) => setSheet({ type: 'menu', item }), []);

  const handleSubmit = async (values) => {
    const draft = sheet?.draft;
    setSaving(true);
    try {
      const { warnings } = await mutate(() => saveTransaction(values, draft, saveApi));
      setSheet(null);
      if (warnings.length) notify(warnings.join(' '), 'info');
      else notify(draft?.mode === 'edit' ? 'Transação atualizada.' : 'Transação salva.');
    } catch (error) {
      notify(error?.message || 'Não foi possível salvar.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (escopo) => {
    const item = sheet?.item;
    if (!item) return;
    setDeleting(true);
    try {
      await mutate(() => deleteTransaction(item.id, escopo));
      setSheet(null);
      notify(escopo === 'este' ? 'Transação excluída.' : 'Lançamentos da recorrência excluídos.');
    } catch (error) {
      notify(error?.message || 'Não foi possível excluir.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleExport = async () => {
    if (!model) return;
    setExporting(true);
    try {
      await exportTransactionsToExcel(model.exportRows);
    } catch (error) {
      notify(error?.message || 'Não foi possível exportar.', 'error');
    } finally {
      setExporting(false);
    }
  };

  const clearAll = useCallback(() => {
    setSearchText('');
    resetFilters();
  }, [resetFilters]);

  const activeChip = chipForFilters(effectiveFilters);
  const filtered = hasScreenFilters(effectiveFilters);
  const farAhead = isMonth && monthsAhead(selectedMonth, today) > 24;

  const header = (
    <View style={styles.header}>
      <TransactionsTopBar
        tokens={tokens}
        displayName={displayName}
        onBack={() => navigateTo('Dashboard')}
        onExport={handleExport}
        exporting={exporting}
        exportDisabled={!model}
        onOpenProfile={() => navigateTo('Configuracoes')}
      />
      <PeriodBar
        tokens={tokens}
        label={period.label}
        isMonth={isMonth}
        onPrev={() => setSelectedMonth(prevMonth)}
        onNext={() => setSelectedMonth(nextMonth)}
        onOpenPeriod={() => setSheet({ type: 'filters', section: 'period' })}
      />
      {model ? (
        <>
          {txData.error ? <StaleBanner tokens={tokens} error={txData.error} onRetry={txData.refresh} /> : null}
          {farAhead ? (
            <View style={[styles.info, { backgroundColor: tokens.primarySoft }]}>
              <Ionicons name="information-circle-outline" size={18} color={tokens.primary} />
              <Text style={[styles.infoText, { color: tokens.text }]}>
                Você está vendo um mês distante. Os valores projetados de recorrências não consideram inflação — o preço
                real pode ser diferente.
              </Text>
            </View>
          ) : null}
          <TransactionsSummaryCard
            tokens={tokens}
            kpis={model.kpis}
            isMonth={isMonth}
            caption={summaryCaption(model, effectiveFilters)}
          />
          <TransactionsSearchBar
            tokens={tokens}
            value={searchText}
            onChange={setSearchText}
            onOpenFilters={() => setSheet({ type: 'filters', section: 'all' })}
            activeFilterCount={countPanelFilters(effectiveFilters, sort)}
          />
          <TransactionsChips
            tokens={tokens}
            activeChip={activeChip}
            onSelect={(chip) => setFilters({ typeFilter: chip.typeFilter, statusFilter: chip.statusFilter })}
          />
          <TransactionsCountRow
            tokens={tokens}
            count={model.rows.length}
            sort={sort}
            onOpenSort={() => setSheet({ type: 'filters', section: 'sort' })}
          />
        </>
      ) : null}
    </View>
  );

  const emptyState =
    txData.status === 'loading' && !data ? (
      <TransactionsSkeleton tokens={tokens} />
    ) : txData.status === 'error' && !data ? (
      <OverviewError tokens={tokens} error={txData.error} onRetry={txData.retry} onSignIn={requestSignOut} />
    ) : model ? (
      <TransactionsEmpty
        tokens={tokens}
        filtered={filtered}
        onClear={clearAll}
        onCreate={() => openForm({ mode: 'create' })}
      />
    ) : null;

  const renderItem = useCallback(
    ({ item }) => (
      <TransactionRow
        item={item}
        tokens={tokens}
        contaNameById={contaNameById}
        busy={busyIds.has(item.id)}
        onPress={handleOpenDetails}
        onOpenMenu={handleOpenMenu}
        onMarkPaid={handleMarkPaid}
        onLaunch={handleLaunch}
      />
    ),
    [tokens, contaNameById, busyIds, handleOpenDetails, handleOpenMenu, handleMarkPaid, handleLaunch],
  );

  const renderSectionHeader = useCallback(
    ({ section }) => <DaySectionHeader tokens={tokens} title={section.title} />,
    [tokens],
  );

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: tokens.canvas }]} edges={['top', 'left', 'right']}>
      <SectionList
        style={styles.list}
        contentContainerStyle={[styles.content, { paddingBottom: LIST_BOTTOM_SPACE }]}
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={header}
        ListEmptyComponent={emptyState}
        initialNumToRender={14}
        maxToRenderPerBatch={14}
        windowSize={9}
        removeClippedSubviews={Platform.OS === 'android'}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={
          <RefreshControl
            refreshing={txData.refreshing}
            onRefresh={txData.refresh}
            tintColor={tokens.primary}
            colors={[tokens.primary]}
          />
        }
      />

      {data ? (
        <Pressable
          onPress={() => openForm({ mode: 'create' })}
          accessibilityRole="button"
          accessibilityLabel="Nova transação"
          style={({ pressed }) => [
            styles.fab,
            { backgroundColor: tokens.primary },
            tokens.shadow,
            pressed && { opacity: 0.88 },
          ]}
        >
          <Ionicons name="add" size={22} color="#ffffff" />
          <Text style={styles.fabText}>Nova</Text>
        </Pressable>
      ) : null}

      {sheet?.type === 'details' || sheet?.type === 'menu' ? (
        <TransactionDetailsSheet
          tokens={tokens}
          item={sheet.item}
          mode={sheet.type}
          contaNameById={contaNameById}
          onClose={closeSheet}
          onEdit={(item) => openForm({ mode: 'edit', tx: item })}
          onDuplicate={(item) => openForm({ mode: 'duplicate', tx: buildDuplicateDraft(item) })}
          onMarkPaid={handleMarkPaid}
          onLaunch={handleLaunch}
          onDelete={(item) => setSheet({ type: 'delete', item })}
        />
      ) : null}

      {sheet?.type === 'filters' ? (
        <TransactionsFiltersSheet
          tokens={tokens}
          section={sheet.section}
          filters={effectiveFilters}
          sort={sort}
          contas={activeContas}
          categories={categoryList}
          onChange={setFilters}
          onSort={setSort}
          onClear={clearAll}
          onClose={closeSheet}
        />
      ) : null}

      {sheet?.type === 'form' ? (
        <TransactionFormSheet
          tokens={tokens}
          draft={sheet.draft}
          contas={activeContas}
          categories={categoryList}
          saving={saving}
          onSubmit={handleSubmit}
          onClose={closeSheet}
        />
      ) : null}

      {sheet?.type === 'delete' ? (
        <DeleteTransactionSheet
          tokens={tokens}
          item={sheet.item}
          deleting={deleting}
          onConfirm={handleDelete}
          onClose={closeSheet}
        />
      ) : null}

      <ToastNotice
        visible={Boolean(toast)}
        message={toast?.message || ''}
        variant={toast?.variant}
        onDismiss={() => setToast(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  list: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 8, width: '100%', maxWidth: 720, alignSelf: 'center', flexGrow: 1 },
  header: { gap: 14, marginBottom: 6 },
  info: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', borderRadius: 14, padding: 12 },
  infoText: { flex: 1, fontSize: 13, lineHeight: 18 },
  fab: {
    position: 'absolute',
    right: FAB_MARGIN,
    bottom: FAB_MARGIN,
    height: FAB_HEIGHT,
    minWidth: TOUCH_MIN * 2,
    paddingHorizontal: 20,
    borderRadius: FAB_HEIGHT / 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  fabText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
});
