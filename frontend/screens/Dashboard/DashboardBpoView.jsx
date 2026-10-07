import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { MfPeriodNav } from '@/components/ui/MfPeriodNav';
import { useBpoData } from '@/hooks/useDashboardData';
import { normalizarTipo, normalizarValor, normalizeCategoryKey, parsearData } from '@/lib/finance/normalize';
import { createDashboardStyles } from './dashboardStyles';
import { BpoBudgetMatrixPanel } from './BpoBudgetMatrixPanel';
import { BpoCategoryCard } from './BpoCategoryCard';
import { findFirstBpoQuarterWithData } from './bpoChartHelpers';
import { SectionCard } from './overview/SectionCard';
import { TOUCH_MIN } from './overview/overviewTokens';

const BPO_YEAR_MIN = 2020;
const BPO_CHART_MIN_WIDTH = 260;
const BPO_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const BPO_QUARTERS = [
  { key: 'T1', label: '1° Trimestre', labels: ['Jan', 'Fev', 'Mar'], months: [0, 1, 2] },
  { key: 'T2', label: '2° Trimestre', labels: ['Abr', 'Mai', 'Jun'], months: [3, 4, 5] },
  { key: 'T3', label: '3° Trimestre', labels: ['Jul', 'Ago', 'Set'], months: [6, 7, 8] },
  { key: 'T4', label: '4° Trimestre', labels: ['Out', 'Nov', 'Dez'], months: [9, 10, 11] },
];

/**
 * Séries orçado × realizado por categoria no ano (mesma regra do `DashboardScreen.tsx` anterior).
 * `yearly` vem de `/categories/budgets/yearly` (`month` 0-based).
 */
export function buildBpoCategorySeries({ yearly, transactions, year, categoriasMap, categoriasTipoMap }) {
  const budgeted = {};
  const realized = {};
  const typeById = {};
  const ensure = (id) => {
    if (!budgeted[id]) budgeted[id] = Array(12).fill(0);
    if (!realized[id]) realized[id] = Array(12).fill(0);
  };

  yearly.forEach((row) => {
    const id = String(row.categorias_id || '');
    if (!id || row.month < 0 || row.month > 11) return;
    ensure(id);
    budgeted[id][row.month] += Number.isNaN(row.valor_orcado) ? 0 : Number(row.valor_orcado || 0);
    typeById[id] = categoriasTipoMap[id] || 'saida';
  });

  const nameToId = {};
  Object.entries(categoriasMap).forEach(([id, nome]) => {
    if (nome) nameToId[normalizeCategoryKey(nome)] = id;
  });

  transactions.forEach((t) => {
    const date = parsearData(t.data, t.criado_em);
    if (date.getFullYear() !== year) return;
    let id = '';
    if (t.categoria && categoriasMap[String(t.categoria)]) id = String(t.categoria);
    else id = nameToId[normalizeCategoryKey(String(t.classificacao || t.categoria || ''))] || '';
    if (!id) id = 'sem-categoria';
    ensure(id);
    realized[id][date.getMonth()] += normalizarValor(t.valor);
    if (!typeById[id]) typeById[id] = normalizarTipo(t.tipo);
  });

  return Array.from(new Set([...Object.keys(budgeted), ...Object.keys(realized)]))
    .map((id) => {
      const b = budgeted[id] || Array(12).fill(0);
      const r = realized[id] || Array(12).fill(0);
      return {
        id,
        name: categoriasMap[id] || (id === 'sem-categoria' ? 'Sem categoria' : id),
        type: typeById[id] || categoriasTipoMap[id] || 'saida',
        budgeted: b,
        realized: r,
        totalBudgeted: b.reduce((s, v) => s + v, 0),
        totalRealized: r.reduce((s, v) => s + v, 0),
      };
    })
    .filter((item) => item.totalBudgeted > 0)
    .sort((a, b) => b.totalRealized - a.totalRealized);
}

const formatCurrency = (value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const formatAxisValue = (raw) =>
  (Number.isFinite(raw) ? raw : 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

/** Visão BPO: matriz orçado × realizado e gráficos por categoria, ano a ano. */
export function DashboardBpoView({ tokens, userId, transactions, categories, subtitle }) {
  const { theme, isDarkMode } = tokens;
  const { width: winWidth } = useWindowDimensions();
  const isDesktop = winWidth >= 900;
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [mode, setMode] = useState('matriz');
  const [tooltip, setTooltip] = useState(null);
  const [quarterByCategory, setQuarterByCategory] = useState({});
  const bpo = useBpoData(userId, year, true);

  const changeYear = (delta) => {
    setYear((y) => Math.min(currentYear, Math.max(BPO_YEAR_MIN, y + delta)));
    setQuarterByCategory({});
    setTooltip(null);
  };

  const styles = useMemo(
    () => createDashboardStyles(theme, isDesktop, { isDarkMode, insidePanel: true, shellCanvas: true }),
    [theme, isDesktop, isDarkMode],
  );

  const series = useMemo(
    () =>
      buildBpoCategorySeries({
        yearly: bpo.yearly,
        transactions,
        year,
        categoriasMap: categories.categoriasMap,
        categoriasTipoMap: categories.categoriasTipoMap,
      }),
    [bpo.yearly, transactions, year, categories],
  );
  const byType = useMemo(
    () => ({
      entrada: series.filter((s) => s.type === 'entrada'),
      saida: series.filter((s) => s.type !== 'entrada'),
    }),
    [series],
  );

  const yAxisWidth = 72;
  const chartWidth = isDesktop
    ? Math.min(520, Math.max(BPO_CHART_MIN_WIDTH, Math.round(winWidth * 0.38)))
    : Math.max(BPO_CHART_MIN_WIDTH, Math.round(winWidth - 88));
  const chartAreaWidth = Math.max(120, chartWidth - yAxisWidth - 20);
  const chartHeight = 200;
  const chartPaddingTop = 15;
  const yAxisPaddingBottom = chartHeight - chartPaddingTop - chartHeight * 0.75;
  const chartConfigBase = {
    backgroundColor: 'transparent',
    backgroundGradientFrom: 'transparent',
    backgroundGradientTo: 'transparent',
    decimalPlaces: 0,
    barPercentage: 0.85,
    color: (opacity = 1) => `rgba(${isDarkMode ? '255, 255, 255' : '0, 0, 0'}, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(${isDarkMode ? '255, 255, 255' : '0, 0, 0'}, ${opacity})`,
    propsForBackgroundLines: { strokeDasharray: '4 6', stroke: theme.border },
    propsForLabels: { fontSize: 11 },
    propsForHorizontalLabels: { opacity: 0, fill: 'transparent' },
  };

  const renderCategory = (category, isIncome) => (
    <BpoCategoryCard
      key={category.id}
      category={category}
      chipLabel={isIncome ? 'Entrada' : 'Saída'}
      chipStyle={[styles.bpoCategoryChip, isIncome ? styles.bpoCategoryChipIncome : styles.bpoCategoryChipExpense]}
      chipTextStyle={[
        styles.bpoCategoryChipText,
        isIncome ? styles.bpoCategoryChipTextIncome : styles.bpoCategoryChipTextExpense,
      ]}
      bpoLabels={BPO_LABELS}
      bpoTooltip={tooltip}
      quarterIndex={quarterByCategory[String(category.id)] ?? findFirstBpoQuarterWithData(category, BPO_QUARTERS)}
      onQuarterChange={(key, index) =>
        setQuarterByCategory((prev) => (prev[key] === index ? prev : { ...prev, [key]: index }))
      }
      onMonthPress={(categoryId, monthIndex) =>
        setTooltip((prev) =>
          prev?.categoryId === categoryId && prev.monthIndex === monthIndex ? null : { categoryId, monthIndex },
        )
      }
      quarters={BPO_QUARTERS}
      chartWidth={chartWidth}
      chartAreaWidth={chartAreaWidth}
      chartHeight={chartHeight}
      yAxisWidth={yAxisWidth}
      yAxisTicks={6}
      chartPaddingTop={chartPaddingTop}
      yAxisPaddingBottom={yAxisPaddingBottom}
      chartPaddingRight={50}
      chartConfigBase={chartConfigBase}
      barPercentage={0.85}
      theme={theme}
      styles={styles}
      isDarkMode={isDarkMode}
      formatCurrency={formatCurrency}
      formatAxisValue={formatAxisValue}
    />
  );

  const section = (title, list, isIncome) => (
    <View style={styles.bpoSection}>
      <View style={styles.bpoSectionHeader}>
        <Text style={styles.bpoSectionTitle}>{title}</Text>
        <Text style={styles.bpoSectionCount}>{list.length} categorias</Text>
      </View>
      {list.length > 0 ? (
        list.map((c) => renderCategory(c, isIncome))
      ) : (
        <View style={styles.emptyCategoryContainer}>
          <Text style={styles.emptyCategoryText}>
            Nenhuma categoria de {isIncome ? 'entrada' : 'saída'} com orçamento.
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <SectionCard tokens={tokens} title="Visão BPO" icon="bar-chart-outline">
      <Text style={[local.subtitle, { color: tokens.textSecondary }]}>{subtitle}</Text>
      <View style={local.controls}>
        <View style={[local.tabs, { borderColor: tokens.cardBorder }]}>
          {[
            { key: 'matriz', label: 'Matriz' },
            { key: 'graficos', label: 'Gráficos' },
          ].map((opt) => {
            const active = mode === opt.key;
            return (
              <Pressable
                key={opt.key}
                onPress={() => setMode(opt.key)}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                style={[local.tab, { backgroundColor: active ? tokens.primarySoft : 'transparent' }]}
              >
                <Text style={[local.tabText, { color: active ? tokens.primary : tokens.textSecondary }]}>
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <MfPeriodNav
          label={String(year)}
          onPrevious={() => changeYear(-1)}
          onNext={() => changeYear(1)}
          disablePrevious={year <= BPO_YEAR_MIN}
          disableNext={year >= currentYear}
        />
      </View>

      {mode === 'matriz' ? (
        <BpoBudgetMatrixPanel
          year={year}
          categories={categories.list}
          cells={bpo.cells}
          transactions={transactions}
          loading={bpo.status === 'loading'}
          error={bpo.status === 'error' ? bpo.error?.message : null}
          onRetry={() => void bpo.retry()}
          theme={theme}
          styles={styles}
          isDarkMode={isDarkMode}
        />
      ) : bpo.status === 'loading' ? (
        <View style={local.center}>
          <ActivityIndicator color={tokens.primary} />
          <Text style={{ color: tokens.textSecondary }}>Carregando orçamentos de {year}...</Text>
        </View>
      ) : bpo.status === 'error' ? (
        <View style={local.center}>
          <Text style={{ color: tokens.textSecondary, textAlign: 'center' }}>{bpo.error?.message}</Text>
          <Pressable onPress={() => void bpo.retry()} accessibilityRole="button" style={local.retry}>
            <Text style={{ color: tokens.primary, fontWeight: '700' }}>Tentar de novo</Text>
          </Pressable>
        </View>
      ) : series.length > 0 ? (
        <>
          {section('Entradas', byType.entrada, true)}
          {section('Saídas', byType.saida, false)}
        </>
      ) : (
        <View style={styles.emptyCategoryContainer}>
          <Text style={styles.emptyCategoryText}>Nenhuma categoria com orçamento em {year}.</Text>
        </View>
      )}
    </SectionCard>
  );
}

const local = StyleSheet.create({
  subtitle: { fontSize: 13, marginTop: -6 },
  controls: { gap: 10 },
  tabs: { flexDirection: 'row', borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
  tab: { flex: 1, minHeight: 40, alignItems: 'center', justifyContent: 'center' },
  tabText: { fontSize: 13, fontWeight: '700' },
  center: { paddingVertical: 24, alignItems: 'center', gap: 8 },
  retry: { minHeight: TOUCH_MIN, justifyContent: 'center', paddingHorizontal: 12 },
});
