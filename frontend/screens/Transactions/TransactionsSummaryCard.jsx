import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatBrl } from '@/lib/finance/format';
import { OVERVIEW_RADIUS, TOUCH_MIN } from '../Dashboard/overview/overviewTokens';

/** Abaixo disso (largura útil em dp, já considerando a fonte do sistema) os blocos ficam um embaixo do outro. */
const MIN_SIDE_BY_SIDE = 300;

function FlowTile({ tokens, label, value, count, tone }) {
  const fg = tone === 'income' ? tokens.income : tokens.expense;
  const bg = tone === 'income' ? tokens.incomeSoft : tokens.expenseSoft;
  const countText = `${count} ${count === 1 ? 'lançamento' : 'lançamentos'}`;
  return (
    <View
      style={[styles.tile, { backgroundColor: bg }]}
      accessible
      accessibilityLabel={`${label}: ${formatBrl(value)}, ${countText}`}
    >
      <View style={styles.tileHead}>
        <View style={[styles.tileIcon, { backgroundColor: tokens.card }]}>
          <Ionicons name={tone === 'income' ? 'arrow-down' : 'arrow-up'} size={14} color={fg} />
        </View>
        <Text style={[styles.tileLabel, { color: fg }]}>{label}</Text>
      </View>
      <Text style={[styles.tileValue, { color: fg }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
        {formatBrl(value)}
      </Text>
      <Text style={[styles.tileCount, { color: tokens.textSecondary }]}>{countText}</Text>
    </View>
  );
}

/** "Resumo do mês": entradas e saídas; "Detalhes" mostra saldo e o que os totais consideram. */
export function TransactionsSummaryCard({ tokens, kpis, isMonth, caption }) {
  const [open, setOpen] = useState(false);
  const { width, fontScale } = useWindowDimensions();
  const stacked = (width - 64) / Math.max(fontScale, 1) < MIN_SIDE_BY_SIDE;

  return (
    <View style={[styles.card, { backgroundColor: tokens.card, borderColor: tokens.cardBorder }, tokens.shadow]}>
      <View style={styles.head}>
        <Text style={[styles.title, { color: tokens.text }]}>{isMonth ? 'Resumo do mês' : 'Resumo do período'}</Text>
        <Pressable
          onPress={() => setOpen((v) => !v)}
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          accessibilityLabel={open ? 'Ocultar detalhes do resumo' : 'Ver detalhes do resumo'}
          hitSlop={6}
          style={({ pressed }) => [styles.detailsBtn, pressed && { opacity: 0.6 }]}
        >
          <Text style={[styles.detailsText, { color: tokens.primary }]}>Detalhes</Text>
          <Ionicons name={open ? 'chevron-up' : 'chevron-forward'} size={16} color={tokens.primary} />
        </Pressable>
      </View>

      <View style={[styles.tiles, stacked && styles.tilesStacked]}>
        <FlowTile tokens={tokens} label="Entradas" value={kpis.entradas} count={kpis.countEntradas} tone="income" />
        <FlowTile tokens={tokens} label="Saídas" value={kpis.saidas} count={kpis.countSaidas} tone="expense" />
      </View>

      {open ? (
        <View style={[styles.details, { borderTopColor: tokens.cardBorder }]}>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: tokens.textSecondary }]}>Saldo do período</Text>
            <Text style={[styles.detailValue, { color: kpis.saldo < 0 ? tokens.expense : tokens.income }]}>
              {formatBrl(kpis.saldo)}
            </Text>
          </View>
          <Text style={[styles.caption, { color: tokens.textTertiary }]}>{caption}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: OVERVIEW_RADIUS, borderWidth: 1, padding: 16, gap: 12 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: -6, marginBottom: -6 },
  title: { fontSize: 16, fontWeight: '700' },
  detailsBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, minHeight: TOUCH_MIN, paddingLeft: 8 },
  detailsText: { fontSize: 14, fontWeight: '600' },
  tiles: { flexDirection: 'row', gap: 10 },
  tilesStacked: { flexDirection: 'column' },
  tile: { flex: 1, minWidth: 0, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 12, gap: 6 },
  tileHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tileIcon: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tileLabel: { fontSize: 13, fontWeight: '700' },
  tileValue: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3, fontVariant: ['tabular-nums'] },
  tileCount: { fontSize: 12 },
  details: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 12, gap: 8 },
  detailRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  detailLabel: { fontSize: 14 },
  detailValue: { fontSize: 16, fontWeight: '800' },
  caption: { fontSize: 12, lineHeight: 17 },
});
