import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { initialsOf } from '../Dashboard/overview/OverviewHeader';
import { OVERVIEW_RADIUS, TOUCH_MIN } from '../Dashboard/overview/overviewTokens';

/** ☰ · Configurações / subtítulo · avatar. O menu só aparece onde não há navegação no topo. */
export function SettingsTopBar({ tokens, title, subtitle, displayName, showMenu, onOpenMenu, onBack, onOpenProfile }) {
  return (
    <View style={styles.topRow}>
      {onBack ? (
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          style={({ pressed }) => [styles.menuBtn, { backgroundColor: tokens.card, borderColor: tokens.cardBorder }, pressed && { opacity: 0.7 }]}
        >
          <Ionicons name="chevron-back" size={22} color={tokens.text} />
        </Pressable>
      ) : showMenu ? (
        <Pressable
          onPress={onOpenMenu}
          accessibilityRole="button"
          accessibilityLabel="Abrir menu"
          style={({ pressed }) => [styles.menuBtn, { backgroundColor: tokens.card, borderColor: tokens.cardBorder }, pressed && { opacity: 0.7 }]}
        >
          <Ionicons name="menu" size={22} color={tokens.text} />
        </Pressable>
      ) : null}
      <View style={styles.titleWrap}>
        <Text style={[styles.title, { color: tokens.text }]} accessibilityRole="header" numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: tokens.textSecondary }]} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {onOpenProfile ? (
        <Pressable
          onPress={onOpenProfile}
          accessibilityRole="button"
          accessibilityLabel="Editar perfil"
          style={({ pressed }) => [styles.avatar, { backgroundColor: tokens.primarySoft }, pressed && { opacity: 0.8 }]}
        >
          <Text style={[styles.avatarText, { color: tokens.primary }]} allowFontScaling={false}>
            {initialsOf(displayName || 'Usuário')}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function SettingsSection({ tokens, title, children }) {
  return (
    <View style={styles.section}>
      {title ? (
        <Text style={[styles.sectionTitle, { color: tokens.textSecondary }]} accessibilityRole="header">
          {title.toUpperCase()}
        </Text>
      ) : null}
      <View style={[styles.card, { backgroundColor: tokens.card, borderColor: tokens.cardBorder }, tokens.shadow]}>{children}</View>
    </View>
  );
}

/** Linha tocável: ícone, título, subtítulo (ou status com ponto) e ›. */
export function SettingsRow({
  tokens,
  icon,
  iconNode,
  title,
  subtitle,
  status,
  onPress,
  last,
  tone = 'default',
  busy,
  accessibilityLabel,
}) {
  const color = tone === 'danger' ? tokens.expense : tokens.primary;
  const titleColor = tone === 'danger' ? tokens.expense : tokens.text;
  const label = accessibilityLabel || [title, status?.label || subtitle].filter(Boolean).join(', ');
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.row,
        !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: tokens.cardBorder },
        pressed && { backgroundColor: tokens.track },
      ]}
    >
      <View style={styles.iconBox}>{iconNode || <Ionicons name={icon} size={24} color={color} />}</View>
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, { color: titleColor }]}>{title}</Text>
        {status ? (
          <View style={styles.statusRow}>
            <Ionicons name={status.icon} size={13} color={status.color} />
            <Text style={[styles.rowSubtitle, { color: status.color }]}>{status.label}</Text>
          </View>
        ) : subtitle ? (
          <Text style={[styles.rowSubtitle, { color: tokens.textSecondary }]}>{subtitle}</Text>
        ) : null}
      </View>
      {busy ? <ActivityIndicator size="small" color={tokens.primary} /> : null}
      <Ionicons name="chevron-forward" size={20} color={tone === 'danger' ? tokens.expense : tokens.textTertiary} />
    </Pressable>
  );
}

/** Ícone da Google Agenda (calendário em azul Google sobre fundo claro). */
export function GoogleCalendarIcon({ tokens }) {
  return (
    <View style={[styles.gIcon, { backgroundColor: tokens.isDarkMode ? 'rgba(66,133,244,0.18)' : '#e8f0fe' }]}>
      <Ionicons name="calendar" size={20} color="#4285F4" />
    </View>
  );
}

/** Claro · Automático · Escuro */
export function AppearanceSelector({ tokens, value, onChange, compact }) {
  const options = [
    { value: 'light', label: 'Claro', icon: 'sunny-outline' },
    { value: 'system', label: 'Automático', icon: 'phone-portrait-outline' },
    { value: 'dark', label: 'Escuro', icon: 'moon-outline' },
  ];
  return (
    <View style={styles.appearance}>
      <Text style={[styles.appearanceTitle, { color: tokens.text }]} accessibilityRole="header">
        Aparência
      </Text>
      <View style={[styles.segment, { backgroundColor: tokens.canvas, borderColor: tokens.cardBorder }, compact && styles.segmentStacked]} accessibilityRole="radiogroup">
        {options.map((opt) => {
          const selected = opt.value === value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => onChange(opt.value)}
              accessibilityRole="radio"
              accessibilityLabel={opt.value === 'system' ? 'Automático, segue o tema do aparelho' : opt.label}
              accessibilityState={{ selected }}
              style={({ pressed }) => [
                styles.segmentItem,
                compact && styles.segmentItemStacked,
                selected && { backgroundColor: tokens.primarySoft },
                pressed && !selected && { opacity: 0.7 },
              ]}
            >
              <Ionicons name={opt.icon} size={20} color={selected ? tokens.primary : tokens.text} />
              <Text style={[styles.segmentText, { color: selected ? tokens.primary : tokens.text }, selected && styles.segmentTextOn]}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuBtn: { width: TOUCH_MIN + 4, height: TOUCH_MIN + 4, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  titleWrap: { flex: 1, minWidth: 0 },
  title: { fontSize: 24, fontWeight: '800', letterSpacing: -0.4 },
  subtitle: { fontSize: 14, marginTop: 1 },
  avatar: { width: TOUCH_MIN + 4, height: TOUCH_MIN + 4, borderRadius: (TOUCH_MIN + 4) / 2, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: '700' },
  section: { gap: 8 },
  sectionTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 1, marginLeft: 4 },
  card: { borderRadius: OVERVIEW_RADIUS, borderWidth: 1, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: TOUCH_MIN + 24, paddingVertical: 10, paddingLeft: 16, paddingRight: 12 },
  iconBox: { minWidth: 36, alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1, minWidth: 0, gap: 2 },
  rowTitle: { fontSize: 16, fontWeight: '600' },
  rowSubtitle: { fontSize: 13 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  gIcon: { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  appearance: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14, gap: 10 },
  appearanceTitle: { fontSize: 16, fontWeight: '600' },
  segment: { flexDirection: 'row', borderRadius: 14, borderWidth: 1, padding: 4, gap: 4 },
  segmentStacked: { flexDirection: 'column' },
  segmentItem: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    minHeight: TOUCH_MIN,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  segmentItemStacked: { flex: 0, justifyContent: 'flex-start', paddingHorizontal: 12 },
  segmentText: { fontSize: 14, fontWeight: '500' },
  segmentTextOn: { fontWeight: '700' },
});
