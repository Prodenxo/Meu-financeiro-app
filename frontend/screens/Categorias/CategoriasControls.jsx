import React from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TOUCH_MIN } from '../Dashboard/overview/overviewTokens';

function ArrowButton({ tokens, icon, label, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.arrow,
        { backgroundColor: tokens.card, borderColor: tokens.cardBorder },
        pressed && { opacity: 0.6 },
      ]}
    >
      <Ionicons name={icon} size={20} color={tokens.primary} />
    </Pressable>
  );
}

/** ‹ Outubro de 2026 › — tocar no mês volta para o mês atual (quando é outro mês). */
export function MonthSwitcher({ tokens, label, isCurrentMonth, onPrev, onNext, onToday }) {
  return (
    <View style={styles.monthRow}>
      <ArrowButton tokens={tokens} icon="chevron-back" label="Mês anterior" onPress={onPrev} />
      <Pressable
        onPress={isCurrentMonth ? undefined : onToday}
        disabled={isCurrentMonth}
        accessibilityRole="button"
        accessibilityLabel={isCurrentMonth ? `Mês: ${label}` : `Mês: ${label}. Tocar para voltar ao mês atual`}
        style={({ pressed }) => [
          styles.monthPill,
          { backgroundColor: tokens.card, borderColor: tokens.cardBorder },
          pressed && { opacity: 0.7 },
        ]}
      >
        <Text style={[styles.monthLabel, { color: tokens.text }]} numberOfLines={1} accessibilityLiveRegion="polite">
          {label}
        </Text>
        {!isCurrentMonth ? (
          <Text style={[styles.todayHint, { color: tokens.primary }]} numberOfLines={1}>
            Voltar ao mês atual
          </Text>
        ) : null}
      </Pressable>
      <ArrowButton tokens={tokens} icon="chevron-forward" label="Próximo mês" onPress={onNext} />
    </View>
  );
}

const TIPOS = [
  { id: 'saida', label: 'Saídas' },
  { id: 'entrada', label: 'Entradas' },
];

export function TipoTabs({ tokens, value, onChange }) {
  return (
    <View
      style={[styles.tabs, { backgroundColor: tokens.isDarkMode ? tokens.theme.cardMuted : tokens.primarySoft }]}
      accessibilityRole="tablist"
    >
      {TIPOS.map((t) => {
        const active = value === t.id;
        return (
          <Pressable
            key={t.id}
            onPress={() => onChange(t.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={({ pressed }) => [
              styles.tab,
              active && { backgroundColor: tokens.primary },
              pressed && !active && { opacity: 0.7 },
            ]}
          >
            <Text style={[styles.tabText, { color: active ? '#ffffff' : tokens.textSecondary }]}>{t.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function SearchRow({ tokens, value, onChange, filterCount, onOpenFilters }) {
  return (
    <View style={styles.searchRow}>
      <View style={[styles.searchBox, { backgroundColor: tokens.card, borderColor: tokens.cardBorder }]}>
        <Ionicons name="search" size={20} color={tokens.textTertiary} />
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder="Buscar categoria"
          placeholderTextColor={tokens.textTertiary}
          style={[styles.searchInput, { color: tokens.text }]}
          accessibilityLabel="Buscar categoria"
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          clearButtonMode="never"
        />
        {value ? (
          <Pressable
            onPress={() => onChange('')}
            accessibilityRole="button"
            accessibilityLabel="Limpar busca"
            hitSlop={8}
            style={styles.clearBtn}
          >
            <Ionicons name="close-circle" size={20} color={tokens.textTertiary} />
          </Pressable>
        ) : null}
      </View>
      <Pressable
        onPress={onOpenFilters}
        accessibilityRole="button"
        accessibilityLabel={filterCount > 0 ? `Filtros, ${filterCount} ativos` : 'Filtros'}
        style={({ pressed }) => [
          styles.filterBtn,
          {
            backgroundColor: filterCount > 0 ? tokens.primarySoft : tokens.card,
            borderColor: filterCount > 0 ? tokens.primary : tokens.cardBorder,
          },
          pressed && { opacity: 0.7 },
        ]}
      >
        <Ionicons name="options-outline" size={22} color={tokens.primary} />
        {filterCount > 0 ? (
          <View style={[styles.badge, { backgroundColor: tokens.primary }]}>
            <Text style={styles.badgeText}>{filterCount}</Text>
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  monthRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  arrow: {
    width: TOUCH_MIN + 4,
    height: TOUCH_MIN + 4,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthPill: {
    flex: 1,
    minHeight: TOUCH_MIN + 4,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  monthLabel: { fontSize: 17, fontWeight: '700' },
  todayHint: { fontSize: 12, fontWeight: '600' },
  tabs: { flexDirection: 'row', borderRadius: 16, padding: 4, gap: 4 },
  tab: { flex: 1, minHeight: TOUCH_MIN, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tabText: { fontSize: 16, fontWeight: '700' },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: TOUCH_MIN + 8,
    borderRadius: 14,
    borderWidth: 1,
    paddingLeft: 14,
    paddingRight: 6,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    fontSize: 16,
    paddingVertical: 10,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : null),
  },
  clearBtn: { width: TOUCH_MIN - 8, height: TOUCH_MIN - 8, alignItems: 'center', justifyContent: 'center' },
  filterBtn: {
    width: TOUCH_MIN + 8,
    height: TOUCH_MIN + 8,
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
});
