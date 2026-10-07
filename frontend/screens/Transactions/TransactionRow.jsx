import React, { memo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCategoryIconName } from '@/lib/categoryIcons';
import { formatSignedBrl } from '@/lib/finance/format';
import { normalizarTipo, normalizarValor } from '@/lib/finance/normalize';
import { isProjecao } from '@/lib/finance/recorrencias';
import {
  isEntrada,
  isPendingTransaction,
  markPaidLabel,
  rowSubtitle,
  transactionStatusLabel,
} from '@/lib/finance/transactionsScreen';
import { TOUCH_MIN } from '../Dashboard/overview/overviewTokens';

export const TransactionRow = memo(function TransactionRow({
  item,
  tokens,
  contaNameById,
  busy,
  onPress,
  onOpenMenu,
  onMarkPaid,
  onLaunch,
}) {
  const entrada = isEntrada(item);
  const projection = isProjecao(item);
  const pending = isPendingTransaction(item);
  const fg = entrada ? tokens.income : tokens.expense;
  const bg = entrada ? tokens.incomeSoft : tokens.expenseSoft;
  const statusColor = projection ? tokens.primary : pending ? tokens.warning : tokens.income;
  const statusText = projection ? 'Prevista' : transactionStatusLabel(item);
  const value = formatSignedBrl(normalizarValor(item.valor), normalizarTipo(item.tipo));
  const title = item.classificacao || 'Sem categoria';
  const subtitle = rowSubtitle(item, contaNameById);

  return (
    <View style={[styles.wrap, { backgroundColor: tokens.card }]}>
      <Pressable
        onPress={() => onPress(item)}
        accessibilityRole="button"
        accessibilityLabel={`${title}, ${value}, ${statusText}, ${subtitle}. Ver detalhes`}
        style={({ pressed }) => [styles.row, pressed && { backgroundColor: tokens.track }]}
      >
        <View style={[styles.icon, { backgroundColor: bg }]}>
          <Ionicons name={getCategoryIconName(title)} size={18} color={fg} />
        </View>
        <View style={styles.middle}>
          <Text style={[styles.title, { color: tokens.text }]} numberOfLines={1}>
            {title}
          </Text>
          <Text style={[styles.subtitle, { color: tokens.textSecondary }]} numberOfLines={1}>
            {subtitle}
          </Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
          </View>
        </View>
        <View style={styles.right}>
          <Text style={[styles.value, { color: fg }]}>{value}</Text>
          <Pressable
            onPress={() => onOpenMenu(item)}
            accessibilityRole="button"
            accessibilityLabel={`Mais ações para ${title}`}
            hitSlop={4}
            style={({ pressed }) => [styles.menuBtn, pressed && { opacity: 0.6 }]}
          >
            <Ionicons name="ellipsis-horizontal" size={20} color={tokens.textSecondary} />
          </Pressable>
        </View>
      </Pressable>

      {projection || pending ? (
        <View style={styles.actionRow}>
          <Pressable
            onPress={() => (projection ? onLaunch(item) : onMarkPaid(item))}
            disabled={busy}
            hitSlop={{ top: 4, bottom: 4 }}
            accessibilityRole="button"
            accessibilityState={{ disabled: Boolean(busy), busy: Boolean(busy) }}
            style={({ pressed }) => [
              styles.actionPill,
              { borderColor: tokens.primary },
              pressed && { backgroundColor: tokens.primarySoft },
            ]}
          >
            {busy ? (
              <ActivityIndicator size="small" color={tokens.primary} />
            ) : (
              <Ionicons
                name={projection ? 'add-circle-outline' : 'checkmark-circle-outline'}
                size={16}
                color={tokens.primary}
              />
            )}
            <Text style={[styles.actionText, { color: tokens.primary }]}>
              {projection ? 'Lançar agora' : markPaidLabel(item)}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
});

export function DaySectionHeader({ tokens, title }) {
  if (!title) return null;
  return (
    <View style={[styles.dayHeader, { backgroundColor: tokens.canvas }]} accessibilityRole="header">
      <Text style={[styles.dayText, { color: tokens.textSecondary }]}>{title}</Text>
    </View>
  );
}

const ICON = 40;

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 4 },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: 12,
    rowGap: 2,
    paddingVertical: 10,
    paddingLeft: 10,
    borderRadius: 12,
  },
  icon: { width: ICON, height: ICON, borderRadius: ICON / 2, alignItems: 'center', justifyContent: 'center' },
  middle: { flexGrow: 1, flexShrink: 1, flexBasis: 130, minWidth: 0, gap: 2 },
  title: { fontSize: 15, fontWeight: '700' },
  subtitle: { fontSize: 13 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: '600' },
  right: { flexDirection: 'row', alignItems: 'center', flexShrink: 0, marginLeft: 'auto' },
  value: { fontSize: 15, fontWeight: '800', fontVariant: ['tabular-nums'] },
  menuBtn: { width: TOUCH_MIN, height: TOUCH_MIN, alignItems: 'center', justifyContent: 'center' },
  actionRow: { paddingLeft: 10 + ICON + 12, paddingBottom: 10 },
  actionPill: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    gap: 6,
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
  },
  actionText: { fontSize: 13, fontWeight: '700' },
  dayHeader: { paddingHorizontal: 12, paddingVertical: 8, marginTop: 8, borderRadius: 10 },
  dayText: { fontSize: 13, fontWeight: '700' },
});
