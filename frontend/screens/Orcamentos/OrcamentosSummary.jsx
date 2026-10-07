import React from 'react';
import { PixelRatio, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatBrl } from '@/lib/finance/format';
import { formatUsage } from '@/lib/finance/orcamentosScreen';
import { OVERVIEW_RADIUS, toneColors } from '../Dashboard/overview/overviewTokens';

/** Tela estreita ou fonte ampliada: os dois cards ficam um embaixo do outro para não cortar valores. */
export function useStackedLayout() {
  const { width } = useWindowDimensions();
  const fontScale = PixelRatio.getFontScale();
  return { stacked: width < 340 || fontScale > 1.3, iconTop: width < 420 || fontScale > 1.1 };
}

function MetricCard({ tokens, icon, iconTone, label, value, caption, highlight, stacked, iconTop }) {
  const tone = toneColors(tokens, iconTone);
  return (
    <View
      style={[
        styles.metric,
        stacked ? styles.metricRow : styles.metricSide,
        !stacked && !iconTop && styles.metricRow,
        { backgroundColor: highlight || tokens.card, borderColor: tokens.cardBorder },
        tokens.shadow,
      ]}
      accessible
      accessibilityLabel={`${label}: ${value}. ${caption}`}
    >
      <View style={[styles.metricIcon, { backgroundColor: tone.bg }]}>
        <Ionicons name={icon} size={22} color={tone.fg} />
      </View>
      <View style={styles.metricTexts}>
        <Text style={[styles.metricLabel, { color: tokens.textSecondary }]}>{label}</Text>
        <Text style={[styles.metricValue, { color: tokens.text }]}>{value}</Text>
        <Text style={[styles.metricCaption, { color: tokens.textSecondary }]}>{caption}</Text>
      </View>
    </View>
  );
}

/** Orçado e Realizado lado a lado (mesma largura e altura) + uso do orçamento. */
export function OrcamentosSummary({ tokens, totals }) {
  const { stacked, iconTop } = useStackedLayout();
  const usage = toneColors(tokens, totals.tone === 'neutral' ? 'accent' : totals.tone);
  const hasRealized = totals.realizado !== 0;
  const realizedSoft = tokens.isDarkMode ? tokens.card : '#f1fbf5';

  let usageHint;
  if (totals.count === 0) usageHint = 'Nenhum orçamento neste mês.';
  else if (!hasRealized) usageHint = 'Ainda não há valores realizados.';
  else if (totals.overCount > 0) {
    usageHint = `${totals.overCount} ${totals.overCount === 1 ? 'categoria acima do limite' : 'categorias acima do limite'}.`;
  } else if (totals.realizado < 0) usageHint = 'Os estornos superam os gastos do mês.';
  else usageHint = `${formatBrl(totals.realizado)} de ${formatBrl(totals.orcado)}.`;

  return (
    <View style={styles.stack}>
      <View style={[styles.metrics, stacked && styles.metricsStacked]}>
        <MetricCard
          tokens={tokens}
          stacked={stacked}
          iconTop={iconTop}
          icon="pie-chart-outline"
          iconTone="accent"
          label="Orçado"
          value={formatBrl(totals.orcado)}
          caption="Limites do mês"
        />
        <MetricCard
          tokens={tokens}
          stacked={stacked}
          iconTop={iconTop}
          icon="bar-chart-outline"
          iconTone="success"
          label="Realizado"
          value={formatBrl(totals.realizado)}
          caption={totals.percent === null ? 'Sem limite definido' : `${formatUsage(totals.percent)} do orçado`}
          highlight={realizedSoft}
        />
      </View>

      <View style={[styles.usage, { backgroundColor: tokens.card, borderColor: tokens.cardBorder }, tokens.shadow]}>
        <View style={styles.usageHead}>
          <Text style={[styles.usageTitle, { color: tokens.text }]}>Uso do orçamento</Text>
          <Text style={[styles.usagePct, { color: usage.fg }]}>{formatUsage(totals.percent)}</Text>
        </View>
        <View
          style={[styles.track, { backgroundColor: tokens.track }]}
          accessibilityRole="progressbar"
          accessibilityLabel="Uso do orçamento"
          accessibilityValue={{ min: 0, max: 100, now: Math.round(totals.bar), text: formatUsage(totals.percent) }}
        >
          <View style={[styles.fill, { width: `${totals.bar}%`, backgroundColor: usage.fg }]} />
        </View>
        <Text style={[styles.usageHint, { color: totals.overCount > 0 ? tokens.expense : tokens.textSecondary }]}>
          {usageHint}
        </Text>
        {totals.hasIncomeGoals ? (
          <Text style={[styles.usageNote, { color: tokens.textTertiary }]}>Os totais incluem as metas de receita.</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 12 },
  metrics: { flexDirection: 'row', gap: 12, alignItems: 'stretch' },
  metricsStacked: { flexDirection: 'column' },
  metric: {
    borderRadius: OVERVIEW_RADIUS,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  metricSide: { flex: 1, flexBasis: 0, minWidth: 0 },
  metricRow: { flexDirection: 'row', alignItems: 'center' },
  metricIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  metricTexts: { flexShrink: 1, minWidth: 0, gap: 2 },
  metricLabel: { fontSize: 14, fontWeight: '600' },
  metricValue: { fontSize: 22, fontWeight: '800', letterSpacing: -0.4, fontVariant: ['tabular-nums'] },
  metricCaption: { fontSize: 13 },
  usage: { borderRadius: OVERVIEW_RADIUS, borderWidth: 1, padding: 16, gap: 10 },
  usageHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  usageTitle: { fontSize: 16, fontWeight: '700', flexShrink: 1 },
  usagePct: { fontSize: 18, fontWeight: '800', fontVariant: ['tabular-nums'] },
  track: { height: 8, borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
  usageHint: { fontSize: 14 },
  usageNote: { fontSize: 12 },
});
