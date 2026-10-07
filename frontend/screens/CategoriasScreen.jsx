import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { useTransactionsViewStore } from '@/store/transactionsViewStore';
import { useNavigationDrawer } from '@/lib/navigationContext';
import { useCategoriasData } from '@/hooks/useCategoriasData';
import { createCategoria, deleteCategoria, updateCategoria } from '@/lib/financeApi';
import { formatMonthLabel } from '@/lib/finance/format';
import { nextMonth, prevMonth } from '@/lib/finance/dashboard';
import {
  DEFAULT_CATEGORY_FILTERS,
  activeFilterCount,
  buildCategoriasScreenModel,
  countCategoryTransactions,
  deleteCategoriaMessage,
} from '@/lib/finance/categoriasScreen';
import { ToastNotice } from '@/components/ToastNotice';
import { getOverviewTokens } from './Dashboard/overview/overviewTokens';
import { OverviewError, StaleBanner } from './Dashboard/overview/OverviewStates';
import { ContaConfirmSheet } from './Contas/ContaSheets';
import { CategoriasHeader } from './Categorias/CategoriasHeader';
import { MonthSwitcher, SearchRow, TipoTabs } from './Categorias/CategoriasControls';
import { CategoriasSummaryCard } from './Categorias/CategoriasSummaryCard';
import { CategoryGroup, IdleGroup } from './Categorias/CategoryList';
import { CategoriaFormSheet, CategoriaMenuSheet, CategoriasFiltersSheet } from './Categorias/CategoriaSheets';
import { CategoriasEmpty, CategoriasNoResults, CategoriasSkeleton, NoMovementNotice } from './Categorias/CategoriasStates';

const CONTENT_MAX = 720;

const currentMonthRef = () => {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
};

export default function CategoriasScreen() {
  const userId = useAuthStore((s) => s.userId);
  const displayName = useAuthStore((s) => s.displayName);
  const { isDarkMode } = useThemeStore();
  const { navigateTo, openDrawer, hasGlobalNav, requestSignOut } = useNavigationDrawer();
  const tokens = useMemo(() => getOverviewTokens(isDarkMode), [isDarkMode]);
  const setTxFilters = useTransactionsViewStore((s) => s.setFilters);
  const setTxMonth = useTransactionsViewStore((s) => s.setSelectedMonth);

  const categoriasData = useCategoriasData(userId);
  const { data, mutate } = categoriasData;

  const [selectedMonth, setSelectedMonth] = useState(currentMonthRef);
  const [viewTipo, setViewTipo] = useState('saida');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState(DEFAULT_CATEGORY_FILTERS);
  const [expandedId, setExpandedId] = useState(null);
  const [idleOpen, setIdleOpen] = useState(false);

  const model = useMemo(
    () =>
      data
        ? buildCategoriasScreenModel({
            categories: data.categories,
            transactions: data.transactions,
            selectedMonth,
            viewTipo,
            search,
            filters,
          })
        : null,
    [data, selectedMonth, viewTipo, search, filters],
  );

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

  const today = currentMonthRef();
  const isCurrentMonth = selectedMonth.year === today.year && selectedMonth.month === today.month;
  const monthLabel = formatMonthLabel(selectedMonth).replace(' ', ' de ');

  const goToMonth = (month) => {
    setSelectedMonth(month);
    setExpandedId(null);
  };
  const changeTipo = (tipo) => {
    setViewTipo(tipo);
    setExpandedId(null);
  };

  const canManage = (row) => !row.isOrphan && Boolean(userId) && row.user_id === userId;

  const openCreate = useCallback(() => setSheet({ type: 'form', categoria: null }), []);
  const openMenu = (row) => setSheet({ type: 'menu', row });

  const seeTransactions = (row) => {
    setSheet(null);
    setTxFilters({
      period: 'Esse mês',
      dateRange: { start: '', end: '' },
      search: '',
      typeFilter: viewTipo,
      statusFilter: 'all',
      categoria: row.nome,
    });
    setTxMonth(selectedMonth);
    navigateTo('Transacoes');
  };

  const handleSubmit = (payload) =>
    runExclusive(async () => {
      const categoria = sheet?.categoria;
      setSheet((s) => (s ? { ...s, serverErrors: null, formError: null } : s));
      try {
        await mutate(() =>
          categoria
            ? updateCategoria(categoria.id, payload, { previousName: categoria.nome })
            : createCategoria(payload),
        );
        setSheet(null);
        if (payload.tipo !== viewTipo) setViewTipo(payload.tipo);
        notify(categoria ? `Categoria “${payload.nome}” atualizada.` : `Categoria “${payload.nome}” criada.`);
      } catch (error) {
        const fieldErrors = error?.errors && Object.keys(error.errors).length ? error.errors : null;
        setSheet((s) =>
          s?.type === 'form'
            ? {
                ...s,
                serverErrors: fieldErrors,
                formError: fieldErrors ? null : error?.message || 'Não foi possível salvar a categoria.',
              }
            : s,
        );
      }
    });

  const handleDelete = () =>
    runExclusive(async () => {
      const row = sheet?.row;
      if (!row) return;
      try {
        const result = await mutate(() => deleteCategoria(row.id));
        setSheet(null);
        setExpandedId(null);
        notify(
          result.movedTo
            ? `Categoria “${row.nome}” excluída. Lançamentos movidos para “${result.movedTo}”.`
            : `Categoria “${row.nome}” excluída. Os lançamentos dela aparecem em “Sem categoria”.`,
        );
      } catch (error) {
        setSheet((s) => (s ? { ...s, error: error?.message || 'Não foi possível excluir a categoria.' } : s));
      }
    });

  const rowProps = (row) => ({
    total: model.total,
    viewTipo,
    expanded: expandedId === row.id,
    onToggle: () => setExpandedId((cur) => (cur === row.id ? null : row.id)),
    onOpenMenu: row.isOrphan ? null : () => openMenu(row),
    onSeeAll: row.isOrphan ? null : () => seeTransactions(row),
  });

  let body;
  if (categoriasData.status === 'loading' && !data) {
    body = <CategoriasSkeleton tokens={tokens} />;
  } else if (!model) {
    body = (
      <OverviewError tokens={tokens} error={categoriasData.error} onRetry={categoriasData.retry} onSignIn={requestSignOut} />
    );
  } else {
    const showIdle = model.idleRows.length > 0;
    const idleExpanded = idleOpen || model.isSearching || filters.show === 'sem';
    const realActive = model.activeRows.filter((r) => !r.isOrphan).length;
    body = (
      <>
        {categoriasData.error ? (
          <StaleBanner tokens={tokens} error={categoriasData.error} onRetry={categoriasData.refresh} />
        ) : null}
        <CategoriasSummaryCard
          tokens={tokens}
          viewTipo={viewTipo}
          total={model.total}
          withMovement={model.counts.withMovement}
          distribution={model.distribution}
        />
        {!model.hasCategories ? (
          <CategoriasEmpty tokens={tokens} onCreate={openCreate} />
        ) : (
          <>
            <SearchRow
              tokens={tokens}
              value={search}
              onChange={setSearch}
              filterCount={activeFilterCount(filters)}
              onOpenFilters={() => setSheet({ type: 'filters' })}
            />
            {model.resultCount === 0 && (model.isSearching || filters.show !== 'todas') ? (
              <CategoriasNoResults
                tokens={tokens}
                search={model.isSearching ? search : ''}
                onClear={() => (model.isSearching ? setSearch('') : setFilters(DEFAULT_CATEGORY_FILTERS))}
              />
            ) : (
              <>
                {filters.show !== 'sem' ? (
                  <View style={styles.section}>
                    <View>
                      <Text style={[styles.sectionTitle, { color: tokens.text }]} accessibilityRole="header">
                        Com movimento
                      </Text>
                      <Text style={[styles.sectionHint, { color: tokens.textSecondary }]}>
                        {realActive} de {model.counts.ofTipo} {model.counts.ofTipo === 1 ? 'categoria' : 'categorias'}
                        {model.activeRows.some((r) => r.isOrphan) ? ' + lançamentos sem categoria' : ''}
                      </Text>
                    </View>
                    {model.activeRows.length > 0 ? (
                      <CategoryGroup tokens={tokens} rows={model.activeRows} renderRowProps={rowProps} />
                    ) : model.isSearching ? (
                      <Text style={[styles.sectionHint, { color: tokens.textSecondary }]}>
                        Nenhuma categoria com movimento corresponde à busca.
                      </Text>
                    ) : (
                      <NoMovementNotice tokens={tokens} viewTipo={viewTipo} monthLabel={monthLabel} />
                    )}
                  </View>
                ) : null}
                {showIdle ? (
                  <IdleGroup
                    tokens={tokens}
                    rows={model.idleRows}
                    open={idleExpanded}
                    onToggle={() => setIdleOpen(!idleExpanded)}
                    renderRowProps={rowProps}
                  />
                ) : null}
              </>
            )}
          </>
        )}
      </>
    );
  }

  const sheetRow = sheet?.row;
  const linked = sheet?.type === 'delete' && data ? countCategoryTransactions(data.transactions, sheetRow.nome) : 0;
  const showFooter = Boolean(model);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: tokens.canvas }]} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.root}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={
          <RefreshControl
            refreshing={categoriasData.refreshing}
            onRefresh={categoriasData.refresh}
            tintColor={tokens.primary}
            colors={[tokens.primary]}
          />
        }
      >
        <CategoriasHeader
          tokens={tokens}
          displayName={displayName}
          showMenu={!hasGlobalNav}
          onOpenMenu={openDrawer}
          onOpenProfile={() => navigateTo('Configuracoes')}
        />
        <MonthSwitcher
          tokens={tokens}
          label={monthLabel}
          isCurrentMonth={isCurrentMonth}
          onPrev={() => goToMonth(prevMonth(selectedMonth))}
          onNext={() => goToMonth(nextMonth(selectedMonth))}
          onToday={() => goToMonth(currentMonthRef())}
        />
        <TipoTabs tokens={tokens} value={viewTipo} onChange={changeTipo} />
        {body}
      </ScrollView>

      {showFooter ? (
        <View style={[styles.footer, { backgroundColor: tokens.canvas }]}>
          <Pressable
            onPress={openCreate}
            accessibilityRole="button"
            style={({ pressed }) => [styles.addBtn, { backgroundColor: tokens.primary }, tokens.shadow, pressed && { opacity: 0.88 }]}
          >
            <Ionicons name="add" size={22} color="#ffffff" />
            <Text style={styles.addText}>Nova categoria</Text>
          </Pressable>
        </View>
      ) : null}

      {sheet?.type === 'menu' ? (
        <CategoriaMenuSheet
          tokens={tokens}
          row={sheetRow}
          canManage={canManage(sheetRow)}
          onClose={closeSheet}
          onEdit={(row) => setSheet({ type: 'form', categoria: row })}
          onSeeTransactions={seeTransactions}
          onDelete={(row) => setSheet({ type: 'delete', row })}
        />
      ) : null}

      {sheet?.type === 'form' ? (
        <CategoriaFormSheet
          key={sheet.categoria?.id || 'nova'}
          tokens={tokens}
          categoria={sheet.categoria}
          defaultTipo={viewTipo}
          categories={data?.categories || []}
          saving={busy}
          serverErrors={sheet.serverErrors}
          formError={sheet.formError}
          onSubmit={handleSubmit}
          onClose={closeSheet}
        />
      ) : null}

      {sheet?.type === 'delete' ? (
        <ContaConfirmSheet
          tokens={tokens}
          title="Excluir categoria"
          message={deleteCategoriaMessage(sheetRow.nome, linked)}
          confirmLabel="Excluir categoria"
          busyLabel="Excluindo…"
          busy={busy}
          error={sheet.error}
          onConfirm={handleDelete}
          onClose={closeSheet}
        />
      ) : null}

      {sheet?.type === 'filters' ? (
        <CategoriasFiltersSheet tokens={tokens} filters={filters} onChange={setFilters} onClose={closeSheet} />
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
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 16,
    width: '100%',
    maxWidth: CONTENT_MAX,
    alignSelf: 'center',
    flexGrow: 1,
  },
  section: { gap: 10 },
  sectionTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.2 },
  sectionHint: { fontSize: 14, marginTop: 2 },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    width: '100%',
    maxWidth: CONTENT_MAX,
    alignSelf: 'center',
  },
  addBtn: {
    flexDirection: 'row',
    gap: 8,
    minHeight: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  addText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
});
