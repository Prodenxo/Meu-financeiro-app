import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppBrandLogo } from '@/components/shell/AppBrandLogo';
import { TOUCH_MIN } from './overviewTokens';

export function initialsOf(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0][0] || '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return `${first}${last}`.toUpperCase();
}

/** Logo + avatar (abre Configurações) + título e saudação. */
export function OverviewHeader({ tokens, displayName, showBrand, onOpenProfile }) {
  const name = displayName || 'Usuário';
  return (
    <View style={styles.wrap}>
      {showBrand ? (
        <View style={styles.brandRow}>
          <AppBrandLogo variant="wordmark" titleColor={tokens.text} />
          <Pressable
            onPress={onOpenProfile}
            accessibilityRole="button"
            accessibilityLabel="Abrir perfil e configurações"
            hitSlop={6}
            style={({ pressed }) => [
              styles.avatar,
              { backgroundColor: tokens.primarySoft, borderColor: tokens.cardBorder },
              pressed && { opacity: 0.8 },
            ]}
          >
            <Text style={[styles.avatarText, { color: tokens.primary }]}>{initialsOf(name)}</Text>
          </Pressable>
        </View>
      ) : null}
      <View>
        <Text style={[styles.title, { color: tokens.text }]} accessibilityRole="header">
          Visão geral
        </Text>
        <Text style={[styles.greeting, { color: tokens.textSecondary }]} numberOfLines={1}>
          Olá, {name}
        </Text>
      </View>
    </View>
  );
}

/** Seletor de mês (‹ Outubro 2026 ›) e botão da Visão BPO. */
export function MonthBar({ tokens, label, onPrev, onNext, bpoActive, onToggleBpo }) {
  return (
    <View style={styles.monthRow}>
      <View style={[styles.monthPill, { backgroundColor: tokens.card, borderColor: tokens.cardBorder }]}>
        <Pressable
          onPress={onPrev}
          accessibilityRole="button"
          accessibilityLabel="Mês anterior"
          style={({ pressed }) => [styles.monthArrow, pressed && { opacity: 0.6 }]}
        >
          <Ionicons name="chevron-back" size={18} color={tokens.text} />
        </Pressable>
        <Text style={[styles.monthLabel, { color: tokens.text }]} numberOfLines={1} accessibilityLiveRegion="polite">
          {label}
        </Text>
        <Pressable
          onPress={onNext}
          accessibilityRole="button"
          accessibilityLabel="Próximo mês"
          style={({ pressed }) => [styles.monthArrow, pressed && { opacity: 0.6 }]}
        >
          <Ionicons name="chevron-forward" size={18} color={tokens.text} />
        </Pressable>
      </View>
      <Pressable
        onPress={onToggleBpo}
        accessibilityRole="button"
        accessibilityState={{ selected: bpoActive }}
        accessibilityLabel={bpoActive ? 'Voltar para a visão geral' : 'Abrir Visão BPO'}
        style={({ pressed }) => [
          styles.bpoBtn,
          {
            borderColor: tokens.primary,
            backgroundColor: bpoActive ? tokens.primary : 'transparent',
          },
          pressed && { opacity: 0.8 },
        ]}
      >
        <Ionicons name="bar-chart-outline" size={16} color={bpoActive ? '#ffffff' : tokens.primary} />
        <Text style={[styles.bpoText, { color: bpoActive ? '#ffffff' : tokens.primary }]}>Visão BPO</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  avatar: {
    width: TOUCH_MIN,
    height: TOUCH_MIN,
    borderRadius: TOUCH_MIN / 2,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 15, fontWeight: '700' },
  title: { fontSize: 26, fontWeight: '800', letterSpacing: -0.4 },
  greeting: { fontSize: 15, marginTop: 2 },
  monthRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  monthPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    minHeight: TOUCH_MIN,
  },
  monthArrow: { width: TOUCH_MIN, height: TOUCH_MIN, alignItems: 'center', justifyContent: 'center' },
  monthLabel: { flex: 1, textAlign: 'center', fontSize: 15, fontWeight: '600' },
  bpoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: TOUCH_MIN,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  bpoText: { fontSize: 14, fontWeight: '600' },
});
