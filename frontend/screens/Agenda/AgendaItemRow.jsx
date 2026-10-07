import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatSignedBrl } from '@/lib/finance/format';
import { OVERVIEW_RADIUS, TOUCH_MIN } from '../Dashboard/overview/overviewTokens';

/** Situação do lançamento: realizado (Pago/Recebido) com ✓; pendente com relógio. Pago nunca usa cor de erro. */
export function statusAppearance(tokens, item) {
  if (item.pending) return { icon: 'time-outline', fg: tokens.warning, bg: tokens.warningSoft };
  if (item.isIncome) return { icon: 'checkmark-circle', fg: tokens.income, bg: tokens.incomeSoft };
  return { icon: 'checkmark-circle', fg: tokens.textSecondary, bg: tokens.track };
}

function TransactionContent({ tokens, item }) {
  const fg = item.isIncome ? tokens.income : tokens.expense;
  const bg = item.isIncome ? tokens.incomeSoft : tokens.expenseSoft;
  const status = statusAppearance(tokens, item);
  const origin = item.subtitle || (item.isIncome ? 'Recebimento' : 'Pagamento');
  return (
    <>
      <View style={[styles.icon, { backgroundColor: bg }]}>
        <Ionicons name={item.isIncome ? 'arrow-down' : 'arrow-up'} size={18} color={fg} />
      </View>
      <View style={styles.middle}>
        <Text style={[styles.title, { color: tokens.text }]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={[styles.origin, { color: tokens.textSecondary }]} numberOfLines={1}>
          {origin}
        </Text>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="wallet-outline" size={13} color={tokens.textTertiary} />
            <Text style={[styles.metaText, { color: tokens.textSecondary }]} numberOfLines={1}>
              {item.contaName}
            </Text>
          </View>
          <View style={[styles.pill, { backgroundColor: status.bg }]}>
            <Ionicons name={status.icon} size={12} color={status.fg} />
            <Text style={[styles.pillText, { color: status.fg }]}>{item.statusLabel}</Text>
          </View>
          {item.googleEvent ? (
            <View style={styles.metaItem}>
              <Ionicons name="notifications-outline" size={13} color={tokens.primary} />
              <Text style={[styles.metaText, { color: tokens.primary }]}>No Google</Text>
            </View>
          ) : null}
        </View>
      </View>
      <Text style={[styles.value, { color: fg }]}>{formatSignedBrl(item.amount, item.isIncome ? 'entrada' : 'saida')}</Text>
    </>
  );
}

function GoogleContent({ tokens, item }) {
  const color = item.raw?.colorId ? item.color : tokens.primary;
  return (
    <>
      <View style={[styles.icon, { backgroundColor: tokens.primarySoft }]}>
        <Ionicons name={item.isAllDay ? 'notifications-outline' : 'calendar-outline'} size={18} color={color} />
      </View>
      <View style={styles.middle}>
        <Text style={[styles.title, { color: tokens.text }]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={[styles.origin, { color: tokens.textSecondary }]} numberOfLines={1}>
          {item.location ? `Google Agenda · ${item.location}` : 'Google Agenda'}
        </Text>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name={item.time ? 'time-outline' : 'sunny-outline'} size={13} color={tokens.textTertiary} />
            <Text style={[styles.metaText, { color: tokens.textSecondary }]}>{item.timeLabel}</Text>
          </View>
          {item.isRecurring ? (
            <View style={styles.metaItem} accessibilityLabel="Repete">
              <Ionicons name="repeat" size={13} color={tokens.textTertiary} />
              <Text style={[styles.metaText, { color: tokens.textSecondary }]}>Repete</Text>
            </View>
          ) : null}
          {item.meetLink ? (
            <View style={[styles.pill, { backgroundColor: tokens.primarySoft }]}>
              <Ionicons name="videocam-outline" size={12} color={tokens.primary} />
              <Text style={[styles.pillText, { color: tokens.primary }]}>Meet</Text>
            </View>
          ) : null}
        </View>
      </View>
    </>
  );
}

function accessibleLabel(item) {
  if (item.source === 'transaction') {
    const value = formatSignedBrl(item.amount, item.isIncome ? 'entrada' : 'saida');
    return `${item.isIncome ? 'Entrada' : 'Saída'}: ${item.title}, ${value}, ${item.statusLabel}, conta ${item.contaName}${
      item.googleEvent ? ', com lembrete no Google Agenda' : ''
    }. Ver detalhes`;
  }
  return `Compromisso: ${item.title}, ${item.timeLabel}${item.isRecurring ? ', repete' : ''}${
    item.meetLink ? ', com Google Meet' : ''
  }. Ver detalhes`;
}

export const AgendaItemRow = memo(function AgendaItemRow({ tokens, item, onPress, last }) {
  return (
    <Pressable
      onPress={() => onPress(item)}
      accessibilityRole="button"
      accessibilityLabel={accessibleLabel(item)}
      style={({ pressed }) => [
        styles.row,
        !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: tokens.cardBorder },
        pressed && { backgroundColor: tokens.track },
      ]}
    >
      {item.source === 'transaction' ? <TransactionContent tokens={tokens} item={item} /> : <GoogleContent tokens={tokens} item={item} />}
      <Ionicons name="chevron-forward" size={18} color={tokens.textTertiary} style={styles.chevron} />
    </Pressable>
  );
});

/** Lista agrupada num cartão branco; com `sections`, cada grupo ganha um rótulo ("Dia inteiro", "Com horário"). */
export function AgendaItemList({ tokens, sections, onPress }) {
  const visible = sections.filter((s) => s.items.length);
  return (
    <View style={styles.stack}>
      {visible.map((section) => (
        <View key={section.key} style={styles.stack}>
          {section.title ? (
            <Text style={[styles.sectionTitle, { color: tokens.textSecondary }]} accessibilityRole="header">
              {section.title}
            </Text>
          ) : null}
          <View style={[styles.card, { backgroundColor: tokens.card, borderColor: tokens.cardBorder }, tokens.shadow]}>
            {section.items.map((item, i) => (
              <AgendaItemRow key={item.id} tokens={tokens} item={item} onPress={onPress} last={i === section.items.length - 1} />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

const ICON = 40;

const styles = StyleSheet.create({
  stack: { gap: 8 },
  sectionTitle: { fontSize: 13, fontWeight: '700', marginTop: 4, marginLeft: 4 },
  card: { borderRadius: OVERVIEW_RADIUS, borderWidth: 1, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: TOUCH_MIN + 20,
    paddingVertical: 12,
    paddingLeft: 14,
    paddingRight: 8,
  },
  icon: { width: ICON, height: ICON, borderRadius: ICON / 2, alignItems: 'center', justifyContent: 'center' },
  middle: { flex: 1, minWidth: 0, gap: 2 },
  title: { fontSize: 15, fontWeight: '700' },
  origin: { fontSize: 13 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 10, rowGap: 4, marginTop: 2 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4, maxWidth: '100%' },
  metaText: { fontSize: 12, fontWeight: '600', flexShrink: 1 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  pillText: { fontSize: 12, fontWeight: '700' },
  value: { fontSize: 15, fontWeight: '800', fontVariant: ['tabular-nums'], flexShrink: 0, maxWidth: '40%', textAlign: 'right' },
  chevron: { marginLeft: -2 },
});
