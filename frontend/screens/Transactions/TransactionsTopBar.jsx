import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { initialsOf } from '../Dashboard/overview/OverviewHeader';
import { TOUCH_MIN } from '../Dashboard/overview/overviewTokens';

function IconButton({ tokens, icon, label, onPress, busy, disabled }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || busy}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: Boolean(disabled || busy), busy: Boolean(busy) }}
      hitSlop={4}
      style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }, disabled && { opacity: 0.4 }]}
    >
      {busy ? <ActivityIndicator color={tokens.text} /> : <Ionicons name={icon} size={22} color={tokens.text} />}
    </Pressable>
  );
}

/** ← Transações · exportar · avatar. */
export function TransactionsTopBar({ tokens, displayName, onBack, onExport, exporting, exportDisabled, onOpenProfile }) {
  return (
    <View style={styles.row}>
      <IconButton tokens={tokens} icon="arrow-back" label="Voltar para a visão geral" onPress={onBack} />
      <Text style={[styles.title, { color: tokens.text }]} accessibilityRole="header" numberOfLines={1}>
        Transações
      </Text>
      <IconButton
        tokens={tokens}
        icon="share-outline"
        label="Exportar e compartilhar planilha"
        onPress={onExport}
        busy={exporting}
        disabled={exportDisabled}
      />
      <Pressable
        onPress={onOpenProfile}
        accessibilityRole="button"
        accessibilityLabel="Abrir perfil e configurações"
        hitSlop={4}
        style={({ pressed }) => [
          styles.avatar,
          { backgroundColor: tokens.primarySoft, borderColor: tokens.cardBorder },
          pressed && { opacity: 0.8 },
        ]}
      >
        <Text style={[styles.avatarText, { color: tokens.primary }]}>{initialsOf(displayName || 'Usuário')}</Text>
      </Pressable>
    </View>
  );
}

/** ‹ Outubro 2026 📅 › — setas só no modo mês; o calendário abre os filtros de período. */
export function PeriodBar({ tokens, label, isMonth, onPrev, onNext, onOpenPeriod }) {
  return (
    <View style={[styles.periodPill, { backgroundColor: tokens.card, borderColor: tokens.cardBorder }]}>
      {isMonth ? (
        <Pressable
          onPress={onPrev}
          accessibilityRole="button"
          accessibilityLabel="Mês anterior"
          style={({ pressed }) => [styles.arrow, pressed && { opacity: 0.6 }]}
        >
          <Ionicons name="chevron-back" size={18} color={tokens.text} />
        </Pressable>
      ) : (
        <View style={styles.arrow} />
      )}
      <Pressable
        onPress={onOpenPeriod}
        accessibilityRole="button"
        accessibilityLabel={`Período: ${label}. Alterar período`}
        style={({ pressed }) => [styles.periodCenter, pressed && { opacity: 0.7 }]}
      >
        <Text style={[styles.periodLabel, { color: tokens.text }]} numberOfLines={1} accessibilityLiveRegion="polite">
          {label}
        </Text>
        <Ionicons name="calendar-outline" size={17} color={tokens.primary} />
      </Pressable>
      {isMonth ? (
        <Pressable
          onPress={onNext}
          accessibilityRole="button"
          accessibilityLabel="Próximo mês"
          style={({ pressed }) => [styles.arrow, pressed && { opacity: 0.6 }]}
        >
          <Ionicons name="chevron-forward" size={18} color={tokens.text} />
        </Pressable>
      ) : (
        <View style={styles.arrow} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  title: { flex: 1, fontSize: 22, fontWeight: '800', letterSpacing: -0.3, marginLeft: 2 },
  iconBtn: { width: TOUCH_MIN, height: TOUCH_MIN, alignItems: 'center', justifyContent: 'center' },
  avatar: {
    width: TOUCH_MIN,
    height: TOUCH_MIN,
    borderRadius: TOUCH_MIN / 2,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  avatarText: { fontSize: 15, fontWeight: '700' },
  periodPill: { flexDirection: 'row', alignItems: 'center', borderRadius: 999, borderWidth: 1, minHeight: TOUCH_MIN },
  arrow: { width: TOUCH_MIN, height: TOUCH_MIN, alignItems: 'center', justifyContent: 'center' },
  periodCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: TOUCH_MIN,
  },
  periodLabel: { fontSize: 15, fontWeight: '600', flexShrink: 1 },
});
