import React from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatBrl } from '@/lib/finance/format';
import { OVERVIEW_RADIUS, TOUCH_MIN } from './overviewTokens';

/** Largura útil (dp ÷ escala da fonte) abaixo da qual entradas e saídas ficam uma embaixo da outra. */
const MIN_SIDE_BY_SIDE = 290;

function FlowCell({ tokens, label, value, hint, tone, onPress }) {
  const color = tone === 'income' ? '#6ee7a8' : '#fda4af';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label} do mês: ${formatBrl(value)}, ${hint}. Abrir transações`}
      style={({ pressed }) => [styles.cell, pressed && { backgroundColor: 'rgba(255,255,255,0.06)' }]}
    >
      <View style={styles.cellHead}>
        <View style={[styles.cellIcon, { backgroundColor: 'rgba(255,255,255,0.12)' }]}>
          <Ionicons name={tone === 'income' ? 'arrow-down' : 'arrow-up'} size={13} color={color} />
        </View>
        <Text style={[styles.cellLabel, { color: tokens.onNavySoft }]} numberOfLines={1}>
          {label}
        </Text>
      </View>
      <Text style={[styles.cellValue, { color }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
        {formatBrl(value)}
      </Text>
      <Text style={[styles.cellHint, { color: tokens.onNavySoft }]} numberOfLines={1}>
        {hint}
      </Text>
    </Pressable>
  );
}

/** Um card azul-marinho: saldo em destaque e, abaixo, entradas e saídas do mês. */
export function KpiCards({ tokens, balance, totals, onOpenContas, onOpenTransacoes }) {
  const { width, fontScale } = useWindowDimensions();
  const stacked = (width - 64) / Math.max(fontScale, 1) < MIN_SIDE_BY_SIDE;
  const incomeHint = `${totals.countIncome} recebimento${totals.countIncome === 1 ? '' : 's'}`;
  const expenseHint = `${totals.countExpenses} pagamento${totals.countExpenses === 1 ? '' : 's'}`;

  return (
    <View style={[styles.card, { backgroundColor: tokens.navy }, tokens.shadow]}>
      <Pressable
        onPress={onOpenContas}
        accessibilityRole="button"
        accessibilityLabel={`${balance.label}: ${formatBrl(balance.value)}. Abrir contas`}
        style={({ pressed }) => [styles.balance, pressed && { opacity: 0.85 }]}
      >
        <View style={styles.balanceBody}>
          <Text style={[styles.balanceLabel, { color: tokens.onNavySoft }]} numberOfLines={1}>
            {balance.label}
          </Text>
          <Text
            style={[styles.balanceValue, { color: tokens.onNavy }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.6}
          >
            {formatBrl(balance.value)}
          </Text>
          {balance.hint ? (
            <Text style={[styles.balanceHint, { color: tokens.onNavySoft }]} numberOfLines={2}>
              {balance.hint}
            </Text>
          ) : null}
        </View>
        <View style={styles.walletBtn}>
          <Ionicons name="wallet-outline" size={20} color={tokens.onNavy} />
        </View>
      </Pressable>

      <View style={[styles.flows, stacked && styles.flowsStacked]}>
        <FlowCell
          tokens={tokens}
          label="Entradas"
          value={totals.income}
          hint={incomeHint}
          tone="income"
          onPress={onOpenTransacoes}
        />
        <View style={stacked ? styles.dividerH : styles.dividerV} />
        <FlowCell
          tokens={tokens}
          label="Saídas"
          value={totals.expenses}
          hint={expenseHint}
          tone="expense"
          onPress={onOpenTransacoes}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: OVERVIEW_RADIUS + 4, padding: 18, gap: 16 },
  balance: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  balanceBody: { flex: 1, minWidth: 0, gap: 4 },
  balanceLabel: { fontSize: 13, fontWeight: '600' },
  balanceValue: { fontSize: 30, fontWeight: '800', letterSpacing: -0.6, fontVariant: ['tabular-nums'] },
  balanceHint: { fontSize: 12 },
  walletBtn: {
    width: TOUCH_MIN,
    height: TOUCH_MIN,
    borderRadius: TOUCH_MIN / 2,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flows: {
    flexDirection: 'row',
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.07)',
    overflow: 'hidden',
  },
  flowsStacked: { flexDirection: 'column' },
  cell: { flex: 1, minWidth: 0, paddingVertical: 12, paddingHorizontal: 12, gap: 4, minHeight: TOUCH_MIN },
  cellHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cellIcon: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  cellLabel: { fontSize: 13, fontWeight: '600', flexShrink: 1 },
  cellValue: { fontSize: 18, fontWeight: '800', letterSpacing: -0.2, fontVariant: ['tabular-nums'] },
  cellHint: { fontSize: 11 },
  dividerV: { width: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.18)', marginVertical: 10 },
  dividerH: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.18)', marginHorizontal: 12 },
});
