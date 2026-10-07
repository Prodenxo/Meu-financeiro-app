import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OVERVIEW_GAP, OVERVIEW_RADIUS, TOUCH_MIN } from '../Dashboard/overview/overviewTokens';

/** Esqueleto da primeira carga (sem valores inventados). */
export function TransactionsSkeleton({ tokens }) {
  const color = tokens.isDarkMode ? tokens.theme.cardMuted : '#e7e4f7';
  return (
    <View style={styles.stack} accessibilityRole="progressbar" accessibilityLabel="Carregando transações">
      <View style={[styles.block, { height: 118, backgroundColor: color }]} />
      <View style={[styles.block, { height: 48, backgroundColor: color }]} />
      {[0, 1, 2, 3, 4].map((i) => (
        <View key={i} style={[styles.rowBlock, { backgroundColor: color }]} />
      ))}
    </View>
  );
}

/** Lista vazia: sem lançamentos no período ou nenhum resultado para a busca/filtros. */
export function TransactionsEmpty({ tokens, filtered, onClear, onCreate }) {
  return (
    <View style={[styles.empty, { backgroundColor: tokens.card, borderColor: tokens.cardBorder }]}>
      <View style={[styles.emptyIcon, { backgroundColor: tokens.primarySoft }]}>
        <Ionicons name={filtered ? 'search-outline' : 'receipt-outline'} size={24} color={tokens.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: tokens.text }]}>
        {filtered ? 'Nenhum resultado' : 'Nenhuma transação neste período'}
      </Text>
      <Text style={[styles.emptyText, { color: tokens.textSecondary }]}>
        {filtered
          ? 'Nada encontrado com a busca e os filtros atuais.'
          : 'Registre entradas e saídas para acompanhar seu mês.'}
      </Text>
      <Pressable
        onPress={filtered ? onClear : onCreate}
        accessibilityRole="button"
        style={({ pressed }) => [styles.btn, { borderColor: tokens.primary }, pressed && { opacity: 0.8 }]}
      >
        <Text style={[styles.btnText, { color: tokens.primary }]}>{filtered ? 'Limpar filtros' : 'Nova transação'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: OVERVIEW_GAP },
  block: { borderRadius: OVERVIEW_RADIUS },
  rowBlock: { height: 64, borderRadius: 14 },
  empty: { borderRadius: OVERVIEW_RADIUS, borderWidth: 1, padding: 24, alignItems: 'center', gap: 10, marginTop: 8 },
  emptyIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 17, fontWeight: '700', textAlign: 'center' },
  emptyText: { fontSize: 14, textAlign: 'center' },
  btn: {
    minHeight: TOUCH_MIN,
    paddingHorizontal: 20,
    borderRadius: 999,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  btnText: { fontSize: 15, fontWeight: '700' },
});
