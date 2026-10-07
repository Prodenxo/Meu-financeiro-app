import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCategoryIconName } from '@/lib/categoryIcons';
import { formatBrl, formatDayMonth, formatSignedBrl } from '@/lib/finance/format';
import { getTransactionStatusLabel, getTransactionStatusTone } from '@/lib/finance/status';
import { EmptyNote, SectionCard } from './SectionCard';
import { toneColors } from './overviewTokens';

function AmountBox({ tokens, label, value, color, icon }) {
  return (
    <View style={[styles.amountBox, { backgroundColor: tokens.isDarkMode ? tokens.theme.cardMuted : '#f8f7fe' }]}>
      <View style={styles.amountHead}>
        <Ionicons name={icon} size={14} color={color} />
        <Text style={[styles.amountLabel, { color: tokens.textSecondary }]}>{label}</Text>
      </View>
      <Text style={[styles.amountValue, { color }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
        {value}
      </Text>
    </View>
  );
}

/** Entradas e saídas realizadas hoje. */
export function TodayCard({ tokens, todayFlow }) {
  const hasMoves = todayFlow.items.length > 0;
  return (
    <SectionCard tokens={tokens} title="Movimentação de hoje" icon="today-outline">
      <Text style={[styles.caption, { color: tokens.textTertiary }]}>{formatDayMonth(todayFlow.dayKey)}</Text>
      {hasMoves ? (
        <View style={styles.row2}>
          <AmountBox tokens={tokens} label="Entrou" value={formatBrl(todayFlow.income)} color={tokens.income} icon="arrow-down" />
          <AmountBox tokens={tokens} label="Saiu" value={formatBrl(todayFlow.expense)} color={tokens.expense} icon="arrow-up" />
        </View>
      ) : (
        <EmptyNote tokens={tokens} text="Nenhuma movimentação paga ou recebida hoje." />
      )}
    </SectionCard>
  );
}

/** Contas a pagar do mês ainda em aberto. */
export function AttentionCard({ tokens, pending, onOpenTransacoes }) {
  if (pending.items.length === 0) return null;
  const visible = pending.items.slice(0, 4);
  return (
    <SectionCard
      tokens={tokens}
      title="Precisa de atenção"
      icon="alert-circle-outline"
      actionLabel="Ver todas"
      onAction={onOpenTransacoes}
    >
      <Text style={[styles.caption, { color: tokens.textSecondary }]}>
        {pending.items.length} conta{pending.items.length === 1 ? '' : 's'} a pagar · {formatBrl(pending.total)}
      </Text>
      <View style={styles.list}>
        {visible.map((item) => (
          <View key={item.id} style={styles.line}>
            <View style={[styles.dot, { backgroundColor: tokens.warning }]} />
            <Text style={[styles.lineTitle, { color: tokens.text }]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={[styles.lineDate, { color: tokens.textTertiary }]}>{item.dateLabel}</Text>
            <Text style={[styles.lineValue, { color: tokens.expense }]}>{formatBrl(item.valor)}</Text>
          </View>
        ))}
      </View>
    </SectionCard>
  );
}

/** Últimas movimentações do mês, com atalho para a lista completa. */
export function RecentCard({ tokens, items, onOpenTransacoes }) {
  return (
    <SectionCard
      tokens={tokens}
      title="Últimas movimentações"
      icon="list-outline"
      actionLabel="Ver todas"
      onAction={onOpenTransacoes}
    >
      {items.length === 0 ? (
        <EmptyNote tokens={tokens} text="Nenhuma movimentação neste mês." />
      ) : (
        <View style={styles.list}>
          {items.map((item) => {
            const isIncome = item.tipo === 'entrada';
            const statusTone = getTransactionStatusTone(item.tipoRaw, item.status);
            const status = toneColors(tokens, statusTone === 'neutral' ? 'neutral' : statusTone);
            return (
              <View
                key={item.id}
                style={styles.recentRow}
                accessible
                accessibilityLabel={`${item.title}, ${item.dateLabel}, ${formatSignedBrl(item.valor, item.tipo)}, ${getTransactionStatusLabel(item.tipoRaw, item.status)}`}
              >
                <View style={[styles.recentIcon, { backgroundColor: isIncome ? tokens.incomeSoft : tokens.expenseSoft }]}>
                  <Ionicons
                    name={getCategoryIconName(item.categoryName)}
                    size={18}
                    color={isIncome ? tokens.income : tokens.expense}
                  />
                </View>
                <View style={styles.recentBody}>
                  <Text style={[styles.lineTitle, { color: tokens.text }]} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <View style={styles.recentMeta}>
                    <Text style={[styles.lineDate, { color: tokens.textTertiary }]}>{item.dateLabel}</Text>
                    <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
                      <Text style={[styles.statusText, { color: status.fg }]}>
                        {getTransactionStatusLabel(item.tipoRaw, item.status)}
                      </Text>
                    </View>
                  </View>
                </View>
                <Text style={[styles.recentValue, { color: isIncome ? tokens.income : tokens.expense }]}>
                  {formatSignedBrl(item.valor, item.tipo)}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  caption: { fontSize: 13, marginTop: -6 },
  row2: { flexDirection: 'row', gap: 10 },
  amountBox: { flex: 1, borderRadius: 14, padding: 12, gap: 4 },
  amountHead: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  amountLabel: { fontSize: 12, fontWeight: '600' },
  amountValue: { fontSize: 18, fontWeight: '800' },
  list: { gap: 12 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  lineTitle: { flex: 1, fontSize: 14, fontWeight: '600' },
  lineDate: { fontSize: 12 },
  lineValue: { fontSize: 14, fontWeight: '700' },
  recentRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 },
  recentIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  recentBody: { flex: 1, minWidth: 0, gap: 3 },
  recentMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusPill: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  statusText: { fontSize: 11, fontWeight: '700' },
  recentValue: { fontSize: 14, fontWeight: '700' },
});
