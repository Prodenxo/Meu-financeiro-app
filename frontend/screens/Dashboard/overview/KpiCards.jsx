import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatBrl } from '@/lib/finance/format';
import { OVERVIEW_GAP, OVERVIEW_RADIUS } from './overviewTokens';

const CARD_HEIGHT = 92;

function KpiCard({ tokens, variant, label, value, hint, icon, onPress, accessibilityLabel }) {
  const isNavy = variant === 'navy';
  const accent = variant === 'income' ? tokens.income : variant === 'expense' ? tokens.expense : tokens.onNavy;
  const accentSoft =
    variant === 'income' ? tokens.incomeSoft : variant === 'expense' ? tokens.expenseSoft : 'rgba(255,255,255,0.14)';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.card,
        isNavy
          ? { backgroundColor: tokens.navy, borderColor: tokens.navy }
          : { backgroundColor: tokens.card, borderColor: tokens.cardBorder },
        tokens.shadow,
        pressed && { opacity: 0.9 },
      ]}
    >
      {!isNavy ? (
        <View style={[styles.icon, { backgroundColor: accentSoft }]}>
          <Ionicons
            name={icon}
            size={20}
            color={accent}
            style={{ transform: [{ rotate: variant === 'income' ? '-45deg' : '45deg' }] }}
          />
        </View>
      ) : null}
      <View style={styles.body}>
        <Text style={[styles.label, { color: isNavy ? tokens.onNavySoft : tokens.textSecondary }]} numberOfLines={1}>
          {label}
        </Text>
        <Text
          style={[styles.value, { color: isNavy ? tokens.onNavy : accent }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
        >
          {value}
        </Text>
        {hint ? (
          <Text style={[styles.hint, { color: isNavy ? tokens.onNavySoft : tokens.textTertiary }]} numberOfLines={1}>
            {hint}
          </Text>
        ) : null}
      </View>
      {isNavy ? (
        <View style={[styles.icon, { backgroundColor: accentSoft }]}>
          <Ionicons name={icon} size={20} color={tokens.onNavy} />
        </View>
      ) : (
        <Ionicons name="chevron-forward" size={18} color={tokens.textTertiary} />
      )}
    </Pressable>
  );
}

/** Saldo (azul-marinho), Entradas (verde) e Saídas (coral) — mesmo tamanho e espaçamento. */
export function KpiCards({ tokens, balance, totals, onOpenContas, onOpenTransacoes }) {
  const incomeHint = `${totals.countIncome} recebimento${totals.countIncome === 1 ? '' : 's'} no mês`;
  const expenseHint = `${totals.countExpenses} pagamento${totals.countExpenses === 1 ? '' : 's'} no mês`;
  return (
    <View style={styles.stack}>
      <KpiCard
        tokens={tokens}
        variant="navy"
        label={balance.label}
        value={formatBrl(balance.value)}
        hint={balance.hint}
        icon="wallet-outline"
        onPress={onOpenContas}
        accessibilityLabel={`${balance.label}: ${formatBrl(balance.value)}. Abrir contas`}
      />
      <KpiCard
        tokens={tokens}
        variant="income"
        label="Entradas"
        value={formatBrl(totals.income)}
        hint={incomeHint}
        icon="arrow-down-outline"
        onPress={onOpenTransacoes}
        accessibilityLabel={`Entradas do mês: ${formatBrl(totals.income)}. Abrir transações`}
      />
      <KpiCard
        tokens={tokens}
        variant="expense"
        label="Saídas"
        value={formatBrl(totals.expenses)}
        hint={expenseHint}
        icon="arrow-up-outline"
        onPress={onOpenTransacoes}
        accessibilityLabel={`Saídas do mês: ${formatBrl(totals.expenses)}. Abrir transações`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: OVERVIEW_GAP },
  card: {
    minHeight: CARD_HEIGHT,
    borderRadius: OVERVIEW_RADIUS,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  icon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, minWidth: 0, gap: 2 },
  label: { fontSize: 13, fontWeight: '600' },
  value: { fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  hint: { fontSize: 12 },
});
