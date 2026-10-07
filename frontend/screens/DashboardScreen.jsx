import React, { useMemo, useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { useNavigationDrawer } from '@/lib/navigationContext';
import { useShellLayout } from '@/components/shell/useShellLayout';
import { MfScrollView } from '@/components/ui/MfScrollView';
import { useBudgetSummary, useDashboardData } from '@/hooks/useDashboardData';
import { buildDashboardModel, nextMonth, prevMonth } from '@/lib/finance/dashboard';
import { formatMonthLabel } from '@/lib/finance/format';
import { getOverviewTokens, OVERVIEW_GAP } from './Dashboard/overview/overviewTokens';
import { MonthBar, OverviewHeader } from './Dashboard/overview/OverviewHeader';
import { ContaChips } from './Dashboard/overview/ContaChips';
import { KpiCards } from './Dashboard/overview/KpiCards';
import { ContaGlobalCard, InsightGrid } from './Dashboard/overview/InsightGrid';
import { BudgetCard } from './Dashboard/overview/BudgetCard';
import { AttentionCard, RecentCard, TodayCard } from './Dashboard/overview/ActivityCards';
import { SaldoChartCard } from './Dashboard/overview/SaldoChartCard';
import { ExpensesCard } from './Dashboard/overview/ExpensesCard';
import { AccessRequestsCard } from './Dashboard/overview/AccessRequestsCard';
import { OverviewError, OverviewSkeleton, StaleBanner } from './Dashboard/overview/OverviewStates';
import { DashboardBpoView } from './Dashboard/DashboardBpoView';
import { filterTransactionsByConta } from '@/lib/finance/contas';

const currentMonth = () => {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
};

export default function DashboardScreen() {
  const userId = useAuthStore((s) => s.userId);
  const displayName = useAuthStore((s) => s.displayName);
  const { isDarkMode } = useThemeStore();
  const { navigateTo, requestSignOut } = useNavigationDrawer();
  const { isWebDesktop } = useShellLayout();
  const tokens = useMemo(() => getOverviewTokens(isDarkMode), [isDarkMode]);

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [contaFilter, setContaFilter] = useState('all');
  const [bpoActive, setBpoActive] = useState(false);

  const dashboard = useDashboardData(userId);
  const budget = useBudgetSummary(userId, selectedMonth.year, selectedMonth.month, dashboard.version);

  const data = dashboard.data;
  const activeContas = useMemo(() => (data ? data.contas.filter((c) => c.ativo) : []), [data]);
  const effectiveFilter =
    contaFilter === 'all' || contaFilter === 'unassigned' || activeContas.some((c) => c.id === contaFilter)
      ? contaFilter
      : 'all';

  const model = useMemo(() => {
    if (!data) return null;
    return buildDashboardModel({
      transactions: data.transactions,
      contas: data.contas,
      categoriasMap: data.categories.categoriasMap,
      categoriasTipoMap: data.categories.categoriasTipoMap,
      budgetSummary: budget.rows,
      selectedMonth,
      contaFilter: effectiveFilter,
    });
  }, [data, budget.rows, selectedMonth, effectiveFilter]);

  const scopedTransactions = useMemo(
    () => (data ? filterTransactionsByConta(data.transactions, effectiveFilter) : []),
    [data, effectiveFilter],
  );

  const today = currentMonth();
  const isCurrentMonth = selectedMonth.year === today.year && selectedMonth.month === today.month;
  const bpoSubtitle =
    effectiveFilter === 'all'
      ? 'Orçamento x realizado por categoria'
      : effectiveFilter === 'unassigned'
        ? 'Sem conta vinculada · orçamento x realizado'
        : `${model?.contaNameById[effectiveFilter] || 'Conta'} · orçamento x realizado`;

  const goTransacoes = () => navigateTo('Transacoes');

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: tokens.canvas }]} edges={['top', 'left', 'right']}>
      <MfScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={dashboard.refreshing}
            onRefresh={dashboard.refresh}
            tintColor={tokens.primary}
            colors={[tokens.primary]}
          />
        }
      >
        <View style={styles.column}>
          <OverviewHeader
            tokens={tokens}
            displayName={displayName}
            showBrand={!isWebDesktop}
            onOpenProfile={() => navigateTo('Configuracoes')}
          />
          <MonthBar
            tokens={tokens}
            label={formatMonthLabel(selectedMonth)}
            onPrev={() => setSelectedMonth(prevMonth)}
            onNext={() => setSelectedMonth(nextMonth)}
            bpoActive={bpoActive}
            onToggleBpo={() => setBpoActive((v) => !v)}
          />

          {dashboard.status === 'loading' && !data ? (
            <OverviewSkeleton tokens={tokens} />
          ) : dashboard.status === 'error' && !data ? (
            <OverviewError
              tokens={tokens}
              error={dashboard.error}
              onRetry={dashboard.retry}
              onSignIn={requestSignOut}
            />
          ) : model ? (
            <>
              {dashboard.error ? (
                <StaleBanner tokens={tokens} error={dashboard.error} onRetry={dashboard.refresh} />
              ) : null}

              {activeContas.length > 0 ? (
                <ContaChips
                  tokens={tokens}
                  contas={activeContas}
                  value={effectiveFilter}
                  onChange={setContaFilter}
                />
              ) : null}

              {bpoActive ? (
                <DashboardBpoView
                  tokens={tokens}
                  userId={userId}
                  transactions={scopedTransactions}
                  categories={data.categories}
                  subtitle={bpoSubtitle}
                />
              ) : (
                <>
                  <KpiCards
                    tokens={tokens}
                    balance={model.balance}
                    totals={model.totals}
                    onOpenContas={() => navigateTo('Contas')}
                    onOpenTransacoes={goTransacoes}
                  />
                  <InsightGrid tokens={tokens} insights={model.insights} />
                  <ContaGlobalCard tokens={tokens} onPress={() => navigateTo('ContaGlobal')} />
                  <BudgetCard
                    tokens={tokens}
                    budgets={model.budgets}
                    status={budget.status}
                    error={budget.error}
                    onRetry={budget.retry}
                    onOpenBudgets={() => navigateTo('Orcamentos')}
                  />
                  <AttentionCard tokens={tokens} pending={model.pending} onOpenTransacoes={goTransacoes} />
                  {isCurrentMonth ? <TodayCard tokens={tokens} todayFlow={model.todayFlow} /> : null}
                  <SaldoChartCard tokens={tokens} series={model.saldoSeries} />
                  <ExpensesCard tokens={tokens} expenses={model.expensesByCategory} />
                  <RecentCard tokens={tokens} items={model.recent} onOpenTransacoes={goTransacoes} />
                </>
              )}
              <AccessRequestsCard tokens={tokens} />
            </>
          ) : null}
        </View>
      </MfScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32, flexGrow: 1 },
  column: { width: '100%', maxWidth: 720, alignSelf: 'center', gap: OVERVIEW_GAP + 4 },
});
