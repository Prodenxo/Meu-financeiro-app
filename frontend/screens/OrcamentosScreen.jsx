import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { useTransactionsViewStore } from '@/store/transactionsViewStore';
import { useNavigationDrawer } from '@/lib/navigationContext';
import { loadMonthSummary, useOrcamentosData } from '@/hooks/useOrcamentosData';
import { duplicateBudgets, removeBudget, saveBudget } from '@/lib/financeApi';
import { nextMonth, prevMonth } from '@/lib/finance/dashboard';
import { normalizarTipo } from '@/lib/finance/normalize';
import {
  buildDuplicatePlan,
  buildOrcamentosModel,
  deleteBudgetMessage,
  duplicateResultMessage,
  monthKey,
  monthTitle,
} from '@/lib/finance/orcamentosScreen';
import { ToastNotice } from '@/components/ToastNotice';
import { getOverviewTokens } from './Dashboard/overview/overviewTokens';
import { OverviewError, StaleBanner } from './Dashboard/overview/OverviewStates';
import { ContaConfirmSheet } from './Contas/ContaSheets';
import { CategoriasHeader } from './Categorias/CategoriasHeader';
import { MonthSwitcher } from './Categorias/CategoriasControls';
import { OrcamentosSummary, useStackedLayout } from './Orcamentos/OrcamentosSummary';
import { BudgetList } from './Orcamentos/BudgetList';
import { BudgetFormSheet, BudgetMenuSheet, DuplicateSheet } from './Orcamentos/OrcamentoSheets';
import { OrcamentosEmpty, OrcamentosSkeleton } from './Orcamentos/OrcamentosStates';

const CONTENT_MAX = 720;

const currentMonthRef = () => {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
};

const fieldErrorsOf = (error) => (error?.errors && Object.keys(error.errors).length ? error.errors : null);

export default function OrcamentosScreen() {
  const userId = useAuthStore((s) => s.userId);
  const displayName = useAuthStore((s) => s.displayName);
  const { isDarkMode } = useThemeStore();
  const { navigateTo, openDrawer, hasGlobalNav, requestSignOut } = useNavigationDrawer();
  const tokens = useMemo(() => getOverviewTokens(isDarkMode), [isDarkMode]);
  const setTxFilters = useTransactionsViewStore((s) => s.setFilters);
  const setTxMonth = useTransactionsViewStore((s) => s.setSelectedMonth);
  const { stacked } = useStackedLayout();

  const [selectedMonth, setSelectedMonth] = useState(currentMonthRef);
  const orcamentos = useOrcamentosData(userId, selectedMonth);
  const { data, mutate } = orcamentos;

  const model = useMemo(
    () => (data ? buildOrcamentosModel({ summary: data.summary, categories: data.categories, userId }) : null),
    [data, userId],
  );
  const allCategories = useMemo(
    () =>
      (data?.categories || [])
        .filter((c) => !c.user_id || c.user_id === userId)
        .map((c) => ({ id: c.id, nome: c.nome, tipo: normalizarTipo(c.tipo) }))
        .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
    [data, userId],
  );

  const [sheet, setSheet] = useState(null);
  const [busy, setBusy] = useState(null);
  const busyRef = useRef(false);
  const [toast, setToast] = useState(null);
  const notify = useCallback((message, variant = 'success') => setToast({ message, variant }), []);
  const closeSheet = useCallback(() => {
    if (!busyRef.current) setSheet(null);
  }, []);

  /** Uma gravação por vez (evita envio duplicado com toques repetidos). */
  const runExclusive = async (label, operation) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(label);
    try {
      await operation();
    } finally {
      busyRef.current = false;
      setBusy(null);
    }
  };

  const today = currentMonthRef();
  const isCurrentMonth = monthKey(selectedMonth) === monthKey(today);
  const monthLabel = monthTitle(selectedMonth);

  const openCreate = useCallback(() => setSheet({ type: 'form', item: null }), []);
  const openMenu = useCallback((item) => setSheet({ type: 'menu', item }), []);

  const seeTransactions = (item) => {
    setSheet(null);
    setTxFilters({
      period: 'Esse mês',
      dateRange: { start: '', end: '' },
      search: '',
      typeFilter: item.tipo,
      statusFilter: 'all',
      categoria: item.nome,
    });
    setTxMonth(selectedMonth);
    navigateTo('Transacoes');
  };

  const setFormErrors = (error, fallback) => {
    const fieldErrors = fieldErrorsOf(error);
    setSheet((s) =>
      s?.type === 'form'
        ? { ...s, serverErrors: fieldErrors, formError: fieldErrors ? null : error?.message || fallback }
        : s,
    );
  };

  const handleSubmit = (payload) =>
    runExclusive('save', async () => {
      const item = sheet?.item;
      setSheet((s) => (s ? { ...s, serverErrors: null, formError: null } : s));
      const otherMonth = monthKey(payload.month) !== monthKey(selectedMonth);
      try {
        if (!item && otherMonth) {
          const target = await loadMonthSummary(payload.month);
          const taken = target.find((r) => r.categorias_id === payload.categoriaId && r.valor_orcado !== null);
          if (taken) {
            setFormErrors({ errors: { categorias_id: `Esta categoria já tem orçamento em ${monthTitle(payload.month)}.` } });
            return;
          }
        }
        await mutate(() =>
          saveBudget({ categoriaId: payload.categoriaId, valor: payload.valor, month: payload.month, onlyIfEmpty: !item }),
        );
        setSheet(null);
        if (otherMonth) setSelectedMonth(payload.month);
        const nome = item?.nome || allCategories.find((c) => c.id === payload.categoriaId)?.nome || 'categoria';
        notify(item ? `Orçamento de “${nome}” atualizado.` : `Orçamento de “${nome}” criado em ${monthTitle(payload.month)}.`);
      } catch (error) {
        setFormErrors(error, 'Não foi possível salvar o orçamento.');
      }
    });

  const handleDelete = () =>
    runExclusive('delete', async () => {
      const item = sheet?.item;
      if (!item) return;
      try {
        await mutate(() => removeBudget({ categoriaId: item.id, month: selectedMonth }));
        setSheet(null);
        notify(`Orçamento de “${item.nome}” removido de ${monthLabel}.`);
      } catch (error) {
        setSheet((s) => (s ? { ...s, error: error?.message || 'Não foi possível remover o orçamento.' } : s));
      }
    });

  const loadDuplicatePlan = async () => {
    const target = selectedMonth;
    setSheet({ type: 'duplicate', loading: true, plan: null, loadError: null, error: null });
    try {
      const [sourceSummary, targetSummary] = await Promise.all([loadMonthSummary(prevMonth(target)), loadMonthSummary(target)]);
      const plan = buildDuplicatePlan({
        sourceSummary,
        targetSummary,
        categories: data?.categories || [],
        userId,
        targetMonth: target,
      });
      setSheet((s) => (s?.type === 'duplicate' ? { ...s, loading: false, plan } : s));
    } catch (error) {
      setSheet((s) => (s?.type === 'duplicate' ? { ...s, loading: false, loadError: { message: error?.message } } : s));
    }
  };

  /** `replace`: fluxo do servidor (copia tudo e substitui). `keep`: grava só as categorias livres no destino. */
  const handleDuplicate = (mode) =>
    runExclusive(mode, async () => {
      const plan = sheet?.plan;
      if (!plan) return;
      setSheet((s) => (s ? { ...s, error: null } : s));
      try {
        if (mode === 'replace') {
          await mutate(() => duplicateBudgets(plan.targetMonth));
          setSheet(null);
          notify(duplicateResultMessage(plan, 'replace'));
          return;
        }
        let failed = 0;
        let skipped = 0;
        await mutate(async () => {
          for (const row of plan.fresh) {
            try {
              await saveBudget({ categoriaId: row.id, valor: row.valor, month: plan.targetMonth, onlyIfEmpty: true });
            } catch (error) {
              if (error?.status === 409) skipped += 1;
              else failed += 1;
            }
          }
        });
        if (failed > 0) {
          setSheet((s) =>
            s
              ? { ...s, error: `${failed} ${failed === 1 ? 'limite não foi copiado' : 'limites não foram copiados'}. Confira a conexão e tente de novo.` }
              : s,
          );
          return;
        }
        setSheet(null);
        notify(
          skipped > 0
            ? `${duplicateResultMessage({ ...plan, fresh: plan.fresh.slice(skipped) }, 'keep')} ${skipped} já tinham limite e foram mantidos.`
            : duplicateResultMessage(plan, 'keep'),
        );
      } catch (error) {
        setSheet((s) => (s ? { ...s, error: error?.message || 'Não foi possível duplicar o mês.' } : s));
      }
    });

  let body;
  if (orcamentos.status === 'loading') {
    body = <OrcamentosSkeleton tokens={tokens} />;
  } else if (!model) {
    body = <OverviewError tokens={tokens} error={orcamentos.error} onRetry={orcamentos.retry} onSignIn={requestSignOut} />;
  } else {
    const empty = model.items.length === 0;
    body = (
      <>
        {orcamentos.error ? <StaleBanner tokens={tokens} error={orcamentos.error} onRetry={orcamentos.refresh} /> : null}
        {empty ? (
          <OrcamentosEmpty
            tokens={tokens}
            monthLabel={monthLabel}
            canDuplicate
            onCreate={openCreate}
            onDuplicate={loadDuplicatePlan}
          />
        ) : (
          <>
            <OrcamentosSummary tokens={tokens} totals={model.totals} />
            <View style={[styles.actions, stacked && styles.actionsStacked]}>
              <Pressable
                onPress={openCreate}
                accessibilityRole="button"
                style={({ pressed }) => [styles.actionBtn, { backgroundColor: tokens.primary }, tokens.shadow, pressed && { opacity: 0.88 }]}
              >
                <Ionicons name="add" size={22} color="#ffffff" />
                <Text style={styles.actionPrimaryText}>Novo orçamento</Text>
              </Pressable>
              <Pressable
                onPress={loadDuplicatePlan}
                accessibilityRole="button"
                accessibilityHint={`Copia os limites de ${monthTitle(prevMonth(selectedMonth))} para ${monthLabel}`}
                style={({ pressed }) => [
                  styles.actionBtn,
                  { backgroundColor: tokens.card, borderColor: tokens.primary, borderWidth: 1.5 },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Ionicons name="copy-outline" size={20} color={tokens.primary} />
                <Text style={[styles.actionSecondaryText, { color: tokens.primary }]}>Duplicar mês</Text>
              </Pressable>
            </View>
            <View style={styles.section}>
              <View>
                <Text style={[styles.sectionTitle, { color: tokens.text }]} accessibilityRole="header">
                  Por categoria
                </Text>
                <Text style={[styles.sectionHint, { color: tokens.textSecondary }]}>
                  {model.totals.count} {model.totals.count === 1 ? 'orçamento' : 'orçamentos'}
                </Text>
              </View>
              <BudgetList tokens={tokens} items={model.items} onOpenMenu={openMenu} />
              <Text style={[styles.footnote, { color: tokens.textTertiary }]}>
                Defina limites e acompanhe o realizado de cada categoria.
              </Text>
            </View>
          </>
        )}
      </>
    );
  }

  const sheetItem = sheet?.item;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: tokens.canvas }]} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.root}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={
          <RefreshControl
            refreshing={orcamentos.refreshing}
            onRefresh={orcamentos.refresh}
            tintColor={tokens.primary}
            colors={[tokens.primary]}
          />
        }
      >
        <CategoriasHeader
          tokens={tokens}
          title="Orçamentos"
          subtitle="Planeje seu mês por categoria"
          displayName={displayName}
          showMenu={!hasGlobalNav}
          onOpenMenu={openDrawer}
          onOpenProfile={() => navigateTo('Configuracoes')}
        />
        <MonthSwitcher
          tokens={tokens}
          label={monthLabel}
          isCurrentMonth={isCurrentMonth}
          onPrev={() => setSelectedMonth(prevMonth(selectedMonth))}
          onNext={() => setSelectedMonth(nextMonth(selectedMonth))}
          onToday={() => setSelectedMonth(currentMonthRef())}
        />
        {body}
      </ScrollView>

      {sheet?.type === 'menu' ? (
        <BudgetMenuSheet
          tokens={tokens}
          item={sheetItem}
          onClose={closeSheet}
          onEdit={(item) => setSheet({ type: 'form', item })}
          onSeeTransactions={seeTransactions}
          onDelete={(item) => setSheet({ type: 'delete', item })}
        />
      ) : null}

      {sheet?.type === 'form' && model ? (
        <BudgetFormSheet
          key={sheetItem?.id || 'novo'}
          tokens={tokens}
          item={sheetItem}
          screenMonth={selectedMonth}
          available={model.available}
          allCategories={allCategories}
          saving={busy === 'save'}
          serverErrors={sheet.serverErrors}
          formError={sheet.formError}
          onSubmit={handleSubmit}
          onClose={closeSheet}
        />
      ) : null}

      {sheet?.type === 'delete' ? (
        <ContaConfirmSheet
          tokens={tokens}
          title="Excluir orçamento"
          message={deleteBudgetMessage(sheetItem, monthLabel)}
          confirmLabel="Excluir orçamento"
          busyLabel="Removendo…"
          busy={busy === 'delete'}
          error={sheet.error}
          onConfirm={handleDelete}
          onClose={closeSheet}
        />
      ) : null}

      {sheet?.type === 'duplicate' ? (
        <DuplicateSheet
          tokens={tokens}
          plan={sheet.plan}
          loading={sheet.loading}
          loadError={sheet.loadError}
          busy={busy === 'replace' || busy === 'keep' ? busy : null}
          error={sheet.error}
          onRetry={loadDuplicatePlan}
          onConfirm={handleDuplicate}
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
  actions: { flexDirection: 'row', gap: 12 },
  actionsStacked: { flexDirection: 'column' },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    minHeight: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  actionPrimaryText: { color: '#ffffff', fontSize: 16, fontWeight: '700', flexShrink: 1, textAlign: 'center' },
  actionSecondaryText: { fontSize: 16, fontWeight: '700', flexShrink: 1, textAlign: 'center' },
  section: { gap: 10 },
  sectionTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.2 },
  sectionHint: { fontSize: 14, marginTop: 2 },
  footnote: { fontSize: 13, textAlign: 'center', marginTop: 4 },
});
