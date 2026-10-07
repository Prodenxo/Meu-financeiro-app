import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CHIPS } from '@/lib/finance/transactionsScreen';
import { SORT_OPTIONS } from '@/lib/finance/transactions';
import { TOUCH_MIN } from '../Dashboard/overview/overviewTokens';

/** Busca (nome, observação ou valor) + botão de filtros com selo. */
export function TransactionsSearchBar({ tokens, value, onChange, onOpenFilters, activeFilterCount }) {
  return (
    <View style={styles.searchRow}>
      <View style={[styles.searchBox, { backgroundColor: tokens.card, borderColor: tokens.cardBorder }]}>
        <Ionicons name="search" size={18} color={tokens.textTertiary} />
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder="Buscar transações"
          placeholderTextColor={tokens.textTertiary}
          style={[styles.searchInput, { color: tokens.text }]}
          returnKeyType="search"
          autoCorrect={false}
          accessibilityLabel="Buscar transações por nome, observação ou valor"
        />
        {value ? (
          <Pressable
            onPress={() => onChange('')}
            accessibilityRole="button"
            accessibilityLabel="Limpar busca"
            hitSlop={8}
            style={styles.clearBtn}
          >
            <Ionicons name="close-circle" size={18} color={tokens.textTertiary} />
          </Pressable>
        ) : null}
      </View>
      <Pressable
        onPress={onOpenFilters}
        accessibilityRole="button"
        accessibilityLabel={
          activeFilterCount > 0 ? `Filtros, ${activeFilterCount} ativos` : 'Abrir filtros e ordenação'
        }
        style={({ pressed }) => [
          styles.filterBtn,
          { backgroundColor: tokens.card, borderColor: activeFilterCount > 0 ? tokens.primary : tokens.cardBorder },
          pressed && { opacity: 0.7 },
        ]}
      >
        <Ionicons name="options-outline" size={20} color={activeFilterCount > 0 ? tokens.primary : tokens.text} />
        {activeFilterCount > 0 ? (
          <View style={[styles.badge, { backgroundColor: tokens.primary }]}>
            <Text style={styles.badgeText}>{activeFilterCount}</Text>
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}

/** Todas · Entradas · Saídas · Pendentes (filtros reais de tipo/situação). */
export function TransactionsChips({ tokens, activeChip, onSelect }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chips}
      keyboardShouldPersistTaps="handled"
    >
      {CHIPS.map((chip) => {
        const active = chip.id === activeChip;
        return (
          <Pressable
            key={chip.id}
            onPress={() => onSelect(chip)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={({ pressed }) => [
              styles.chip,
              active
                ? { backgroundColor: tokens.primary, borderColor: tokens.primary }
                : { backgroundColor: tokens.card, borderColor: tokens.cardBorder },
              pressed && { opacity: 0.8 },
            ]}
          >
            <Text style={[styles.chipText, { color: active ? '#ffffff' : tokens.text }]}>{chip.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/** "29 movimentações" · "Mais recentes ⌄". */
export function TransactionsCountRow({ tokens, count, sort, onOpenSort }) {
  const sortLabel = SORT_OPTIONS.find((o) => o.value === sort)?.label || 'Mais recentes';
  return (
    <View style={styles.countRow}>
      <Text style={[styles.countText, { color: tokens.textSecondary }]} accessibilityLiveRegion="polite">
        {count} {count === 1 ? 'movimentação' : 'movimentações'}
      </Text>
      <Pressable
        onPress={onOpenSort}
        accessibilityRole="button"
        accessibilityLabel={`Ordenação: ${sortLabel}. Alterar`}
        hitSlop={6}
        style={({ pressed }) => [styles.sortBtn, pressed && { opacity: 0.6 }]}
      >
        <Text style={[styles.sortText, { color: tokens.text }]}>{sortLabel}</Text>
        <Ionicons name="chevron-down" size={16} color={tokens.text} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    minHeight: TOUCH_MIN + 4,
  },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 10 },
  clearBtn: { minHeight: TOUCH_MIN, justifyContent: 'center' },
  filterBtn: {
    width: TOUCH_MIN + 4,
    height: TOUCH_MIN + 4,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#ffffff', fontSize: 11, fontWeight: '700' },
  chips: { gap: 8, paddingVertical: 2 },
  chip: {
    minHeight: 40,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: { fontSize: 14, fontWeight: '600' },
  countRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 },
  countText: { fontSize: 14, fontWeight: '600' },
  sortBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: TOUCH_MIN },
  sortText: { fontSize: 14, fontWeight: '600' },
});
