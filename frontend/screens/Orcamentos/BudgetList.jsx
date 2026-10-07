import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCategoryIconName } from '@/lib/categoryIcons';
import { formatBrl } from '@/lib/finance/format';
import { formatUsage } from '@/lib/finance/orcamentosScreen';
import { OVERVIEW_RADIUS, TOUCH_MIN, toneColors } from '../Dashboard/overview/overviewTokens';
import { useStackedLayout } from './OrcamentosSummary';

function Amount({ tokens, label, value, color }) {
  return (
    <View style={styles.amount}>
      <Text style={[styles.amountLabel, { color: tokens.textSecondary }]}>{label}</Text>
      <Text style={[styles.amountValue, { color: color || tokens.text }]}>{formatBrl(value)}</Text>
    </View>
  );
}

function BudgetItem({ tokens, item, onOpenMenu }) {
  const { stacked } = useStackedLayout();
  const tone = toneColors(tokens, item.state.tone);
  const barColor = item.state.tone === 'neutral' ? tokens.primary : tone.fg;
  const isOver = item.state.key === 'over';
  const usageText =
    item.percent === null ? (item.realizado > 0 ? 'Sem limite definido' : 'Limite zerado') : `${formatUsage(item.percent)} ${item.tipo === 'entrada' ? 'da meta' : 'utilizado'}`;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: tokens.card, borderColor: isOver ? tokens.expense : tokens.cardBorder },
        tokens.shadow,
      ]}
    >
      <View style={styles.head}>
        <View style={[styles.icon, { backgroundColor: item.tipo === 'entrada' ? tokens.incomeSoft : tokens.primarySoft }]}>
          <Ionicons
            name={getCategoryIconName(item.nome)}
            size={22}
            color={item.tipo === 'entrada' ? tokens.income : tokens.primary}
          />
        </View>
        <View style={styles.titleWrap}>
          <Text style={[styles.title, { color: tokens.text }]} numberOfLines={2}>
            {item.nome}
          </Text>
          <View style={styles.badges}>
            {item.tipo === 'entrada' ? (
              <Text style={[styles.badge, { color: tokens.income, backgroundColor: tokens.incomeSoft }]}>Receita</Text>
            ) : null}
            {item.state.key !== 'idle' ? (
              <Text style={[styles.badge, { color: tone.fg, backgroundColor: tone.bg }]}>{item.state.label}</Text>
            ) : null}
          </View>
        </View>
        <Pressable
          onPress={() => onOpenMenu(item)}
          accessibilityRole="button"
          accessibilityLabel={`Ações do orçamento ${item.nome}`}
          hitSlop={6}
          style={({ pressed }) => [styles.menuBtn, pressed && { backgroundColor: tokens.track }]}
        >
          <Ionicons name="ellipsis-vertical" size={20} color={tokens.textSecondary} />
        </Pressable>
      </View>

      <View style={[styles.amounts, stacked && styles.amountsStacked]}>
        <Amount tokens={tokens} label={item.tipo === 'entrada' ? 'Meta' : 'Orçado'} value={item.orcado} />
        {!stacked ? <View style={[styles.divider, { backgroundColor: tokens.cardBorder }]} /> : null}
        <Amount
          tokens={tokens}
          label={item.tipo === 'entrada' ? 'Recebido' : 'Realizado'}
          value={item.realizado}
          color={isOver ? tokens.expense : undefined}
        />
      </View>

      <View
        style={[styles.track, { backgroundColor: tokens.track }]}
        accessibilityRole="progressbar"
        accessibilityLabel={`Uso do orçamento de ${item.nome}`}
        accessibilityValue={{ min: 0, max: 100, now: Math.round(item.bar), text: usageText }}
      >
        <View style={[styles.fill, { width: `${item.bar}%`, backgroundColor: barColor }]} />
      </View>
      <View style={styles.foot}>
        <Text style={[styles.usage, { color: isOver ? tokens.expense : tokens.textSecondary }]}>{usageText}</Text>
        <Text style={[styles.detail, { color: isOver ? tokens.expense : tokens.textTertiary }]}>{item.detail}</Text>
      </View>
    </View>
  );
}

export function BudgetList({ tokens, items, onOpenMenu }) {
  return (
    <View style={styles.list}>
      {items.map((item) => (
        <BudgetItem key={item.id} tokens={tokens} item={item} onOpenMenu={onOpenMenu} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 12 },
  card: { borderRadius: OVERVIEW_RADIUS, borderWidth: 1, padding: 16, gap: 12 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  titleWrap: { flex: 1, minWidth: 0, gap: 4 },
  title: { fontSize: 17, fontWeight: '700' },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  badge: { fontSize: 12, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, overflow: 'hidden' },
  menuBtn: {
    width: TOUCH_MIN,
    height: TOUCH_MIN,
    borderRadius: TOUCH_MIN / 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -8,
  },
  amounts: { flexDirection: 'row', alignItems: 'stretch', gap: 16 },
  amountsStacked: { flexDirection: 'column', gap: 8 },
  amount: { flex: 1, minWidth: 0, gap: 2 },
  amountLabel: { fontSize: 13 },
  amountValue: { fontSize: 17, fontWeight: '700', fontVariant: ['tabular-nums'] },
  divider: { width: 1 },
  track: { height: 8, borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
  foot: { gap: 2 },
  usage: { fontSize: 13, fontWeight: '600' },
  detail: { fontSize: 13 },
});
