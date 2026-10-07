import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatBrl } from '@/lib/finance/format';
import { OVERVIEW_RADIUS, TOUCH_MIN } from '../Dashboard/overview/overviewTokens';

function FlowColumn({ tokens, label, value, count, tone }) {
  const fg = tone === 'income' ? tokens.income : tokens.expense;
  const bg = tone === 'income' ? tokens.incomeSoft : tokens.expenseSoft;
  return (
    <View style={styles.column} accessible accessibilityLabel={`${label}: ${formatBrl(value)}, ${count} lançamentos`}>
      <View style={styles.columnHead}>
        <View style={[styles.dotIcon, { backgroundColor: bg }]}>
          <Ionicons name={tone === 'income' ? 'arrow-down' : 'arrow-up'} size={14} color={fg} />
        </View>
        <Text style={[styles.columnLabel, { color: tokens.textSecondary }]}>{label}</Text>
      </View>
      <Text style={[styles.columnValue, { color: fg }]}>{formatBrl(value)}</Text>
    </View>
  );
}

/** "Resumo do mês": entradas e saídas; "Detalhes" mostra saldo, contagens e o que os totais consideram. */
export function TransactionsSummaryCard({ tokens, kpis, isMonth, caption }) {
  const [open, setOpen] = useState(false);
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

      <View style={styles.columns}>
        <FlowColumn tokens={tokens} label="Entradas" value={kpis.entradas} count={kpis.countEntradas} tone="income" />
        <View style={[styles.divider, { backgroundColor: tokens.cardBorder }]} />
        <FlowColumn tokens={tokens} label="Saídas" value={kpis.saidas} count={kpis.countSaidas} tone="expense" />
      </View>

      {open ? (
        <View style={[styles.details, { borderTopColor: tokens.cardBorder }]}>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: tokens.textSecondary }]}>Saldo do período</Text>
            <Text style={[styles.detailValue, { color: kpis.saldo < 0 ? tokens.expense : tokens.text }]}>
              {formatBrl(kpis.saldo)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: tokens.textSecondary }]}>Lançamentos</Text>
            <Text style={[styles.detailValue, { color: tokens.text }]}>
              {kpis.countEntradas} {kpis.countEntradas === 1 ? 'entrada' : 'entradas'} · {kpis.countSaidas}{' '}
              {kpis.countSaidas === 1 ? 'saída' : 'saídas'}
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
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' },
  title: { fontSize: 16, fontWeight: '700' },
  detailsBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, minHeight: TOUCH_MIN, paddingLeft: 8 },
  detailsText: { fontSize: 14, fontWeight: '600' },
  columns: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'stretch', rowGap: 12 },
  column: { flexGrow: 1, flexBasis: 140, gap: 6, paddingHorizontal: 4 },
  columnHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dotIcon: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  columnLabel: { fontSize: 13, fontWeight: '600' },
  columnValue: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  divider: { width: StyleSheet.hairlineWidth, marginHorizontal: 8 },
  details: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 12, gap: 8 },
  detailRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 },
  detailLabel: { fontSize: 14 },
  detailValue: { fontSize: 14, fontWeight: '700' },
  caption: { fontSize: 12, lineHeight: 17 },
});
