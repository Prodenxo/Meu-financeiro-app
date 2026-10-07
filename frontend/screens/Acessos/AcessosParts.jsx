import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { initialsOf, avatarHue } from '@/lib/acessos/acessos';
import { OVERVIEW_RADIUS, TOUCH_MIN } from '../Dashboard/overview/overviewTokens';

export function AcessosHeader({ tokens, onBack }) {
  return (
    <View style={styles.header}>
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Voltar para Configurações"
        hitSlop={4}
        style={({ pressed }) => [styles.back, pressed && { backgroundColor: tokens.track }]}
      >
        <Ionicons name="chevron-back" size={24} color={tokens.text} />
      </Pressable>
      <Text style={[styles.headerTitle, { color: tokens.text }]} accessibilityRole="header" numberOfLines={1}>
        Gerenciar acessos
      </Text>
    </View>
  );
}

const KPI_ITEMS = [
  { key: 'usuarios', label: 'Usuários', icon: 'people-outline', tone: 'primary' },
  { key: 'empresas', label: 'Empresas', icon: 'business-outline', tone: 'primary' },
  { key: 'ativos', label: 'Ativos', icon: 'checkmark-circle-outline', tone: 'income' },
  { key: 'bloqueados', label: 'Bloqueados', icon: 'ban-outline', tone: 'expense' },
];

/** Totais do conjunto completo autorizado (nunca da página carregada). */
export function KpiGrid({ tokens, stats }) {
  return (
    <View style={styles.kpiGrid}>
      {KPI_ITEMS.map((item) => {
        const color = tokens[item.tone];
        const soft = tokens[`${item.tone}Soft`] || tokens.primarySoft;
        const value = stats?.[item.key];
        const shown = value == null ? '—' : Number(value).toLocaleString('pt-BR');
        return (
          <View
            key={item.key}
            style={[styles.kpi, { backgroundColor: tokens.card, borderColor: tokens.cardBorder }]}
            accessible
            accessibilityLabel={`${item.label}: ${shown}`}
          >
            <View style={[styles.kpiIcon, { backgroundColor: soft }]}>
              <Ionicons name={item.icon} size={18} color={color} />
            </View>
            <View style={styles.kpiText}>
              <Text style={[styles.kpiLabel, { color: tokens.textSecondary }]} numberOfLines={1}>
                {item.label}
              </Text>
              <Text style={[styles.kpiValue, { color: tokens.text }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                {shown}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

export function TabsBar({ tokens, tabs, value, onChange }) {
  return (
    <View style={[styles.tabs, { backgroundColor: tokens.card, borderColor: tokens.cardBorder }]} accessibilityRole="tablist">
      {tabs.map((tab) => {
        const selected = tab.key === value;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            style={({ pressed }) => [
              styles.tab,
              selected && { backgroundColor: tokens.primary },
              pressed && !selected && { backgroundColor: tokens.track },
            ]}
          >
            <Text style={[styles.tabText, { color: selected ? '#ffffff' : tokens.textSecondary }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Busca + botão de filtros (com contador) + botão de ordem (A–Z / Z–A). */
export function SearchToolbar({ tokens, value, onChange, placeholder, filterCount, onOpenFilters, ordem, onToggleOrdem }) {
  return (
    <View style={styles.toolbar}>
      <View style={[styles.search, { backgroundColor: tokens.card, borderColor: tokens.cardBorder }]}>
        <Ionicons name="search" size={18} color={tokens.textTertiary} />
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={tokens.textTertiary}
          style={[styles.searchInput, { color: tokens.text }]}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          accessibilityLabel={placeholder}
        />
        {value ? (
          <Pressable onPress={() => onChange('')} accessibilityRole="button" accessibilityLabel="Limpar busca" hitSlop={10}>
            <Ionicons name="close-circle" size={18} color={tokens.textTertiary} />
          </Pressable>
        ) : null}
      </View>
      {onOpenFilters ? (
        <Pressable
          onPress={onOpenFilters}
          accessibilityRole="button"
          accessibilityLabel={filterCount ? `Filtros, ${filterCount} ativos` : 'Filtros'}
          style={({ pressed }) => [
            styles.toolBtn,
            { backgroundColor: filterCount ? tokens.primarySoft : tokens.card, borderColor: tokens.cardBorder },
            pressed && { opacity: 0.75 },
          ]}
        >
          <Ionicons name="options-outline" size={20} color={filterCount ? tokens.primary : tokens.text} />
          {filterCount ? (
            <View style={[styles.badge, { backgroundColor: tokens.primary }]}>
              <Text style={styles.badgeText}>{filterCount}</Text>
            </View>
          ) : null}
        </Pressable>
      ) : null}
      <Pressable
        onPress={onToggleOrdem}
        accessibilityRole="button"
        accessibilityLabel={ordem === 'desc' ? 'Ordem: Z a A. Toque para A a Z' : 'Ordem: A a Z. Toque para Z a A'}
        style={({ pressed }) => [styles.sortBtn, { backgroundColor: tokens.card, borderColor: tokens.cardBorder }, pressed && { opacity: 0.75 }]}
      >
        <Text style={[styles.sortText, { color: tokens.text }]}>{ordem === 'desc' ? 'Z–A' : 'A–Z'}</Text>
        <Ionicons name="swap-vertical" size={16} color={tokens.textSecondary} />
      </Pressable>
    </View>
  );
}

export function Chip({ tokens, label, tone = 'neutral', icon }) {
  const palette = {
    accent: [tokens.primarySoft, tokens.primary],
    income: [tokens.incomeSoft, tokens.income],
    expense: [tokens.expenseSoft, tokens.expense],
    warning: [tokens.warningSoft, tokens.warning],
    muted: [tokens.track, tokens.textSecondary],
    neutral: [tokens.track, tokens.text],
  }[tone] || [tokens.track, tokens.text];
  return (
    <View style={[styles.chip, { backgroundColor: palette[0] }]}>
      {icon ? <Ionicons name={icon} size={12} color={palette[1]} /> : null}
      <Text style={[styles.chipText, { color: palette[1] }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export function Avatar({ name, email, seed, size = 40 }) {
  const hue = avatarHue(seed || email || name);
  return (
    <View
      style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: `hsl(${hue}, 55%, 88%)` }]}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
    >
      <Text style={[styles.avatarText, { color: `hsl(${hue}, 45%, 30%)`, fontSize: size * 0.36 }]}>{initialsOf(name, email)}</Text>
    </View>
  );
}

/** Botão ⋮ da linha (abre o menu de ações com nomes claros). */
export function MoreButton({ tokens, label, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={4}
      style={({ pressed }) => [styles.more, pressed && { backgroundColor: tokens.track }]}
    >
      <Ionicons name="ellipsis-vertical" size={20} color={tokens.textSecondary} />
    </Pressable>
  );
}

export function ListGroup({ tokens, children }) {
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <View style={[styles.group, { backgroundColor: tokens.card, borderColor: tokens.cardBorder }]}>
      {items.map((child, i) => (
        <React.Fragment key={child.key ?? i}>
          {i > 0 ? <View style={[styles.sep, { backgroundColor: tokens.cardBorder }]} /> : null}
          {child}
        </React.Fragment>
      ))}
    </View>
  );
}

export function RangeLine({ tokens, text }) {
  return (
    <Text style={[styles.range, { color: tokens.textSecondary }]} accessibilityLiveRegion="polite">
      {text}
    </Text>
  );
}

export function Pager({ tokens, page, pageCount, onChange }) {
  if (pageCount <= 1) return null;
  const btn = (label, icon, target, disabled, iconAfter) => (
    <Pressable
      onPress={() => onChange(target)}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.pageBtn,
        { borderColor: tokens.cardBorder, backgroundColor: tokens.card },
        disabled && { opacity: 0.4 },
        pressed && { opacity: 0.7 },
      ]}
    >
      {!iconAfter ? <Ionicons name={icon} size={18} color={tokens.text} /> : null}
      <Text style={[styles.pageBtnText, { color: tokens.text }]}>{label}</Text>
      {iconAfter ? <Ionicons name={icon} size={18} color={tokens.text} /> : null}
    </Pressable>
  );
  return (
    <View style={styles.pager}>
      {btn('Anterior', 'chevron-back', page - 1, page <= 1)}
      <Text style={[styles.pageLabel, { color: tokens.textSecondary }]}>
        Página {page} de {pageCount}
      </Text>
      {btn('Próxima', 'chevron-forward', page + 1, page >= pageCount, true)}
    </View>
  );
}

export function PrimaryButton({ tokens, icon, label, onPress, disabled, busy, style }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || busy}
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled || busy), busy: Boolean(busy) }}
      style={({ pressed }) => [
        styles.primaryBtn,
        { backgroundColor: tokens.primary },
        (disabled || busy) && { opacity: 0.5 },
        pressed && { opacity: 0.85 },
        style,
      ]}
    >
      {busy ? <ActivityIndicator color="#ffffff" /> : icon ? <Ionicons name={icon} size={20} color="#ffffff" /> : null}
      <Text style={styles.primaryText}>{label}</Text>
    </Pressable>
  );
}

export function SecondaryButton({ tokens, icon, label, onPress, disabled, tone }) {
  const color = tone === 'danger' ? tokens.expense : tokens.primary;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled) }}
      style={({ pressed }) => [
        styles.secondaryBtn,
        { borderColor: tokens.cardBorder, backgroundColor: tokens.card },
        disabled && { opacity: 0.45 },
        pressed && { opacity: 0.75 },
      ]}
    >
      {icon ? <Ionicons name={icon} size={18} color={color} /> : null}
      <Text style={[styles.secondaryText, { color }]}>{label}</Text>
    </Pressable>
  );
}

export function ListSkeleton({ tokens, rows = 5 }) {
  const fill = tokens.isDarkMode ? tokens.theme.cardMuted : '#e7e4f7';
  return (
    <View style={styles.skeleton} accessibilityRole="progressbar" accessibilityLabel="Carregando">
      {Array.from({ length: rows }).map((_, i) => (
        <View key={i} style={[styles.skeletonRow, { backgroundColor: fill }]} />
      ))}
    </View>
  );
}

export function EmptyState({ tokens, icon, title, text, actionLabel, onAction }) {
  return (
    <View style={[styles.empty, { backgroundColor: tokens.card, borderColor: tokens.cardBorder }]}>
      <View style={[styles.emptyIcon, { backgroundColor: tokens.primarySoft }]}>
        <Ionicons name={icon} size={26} color={tokens.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: tokens.text }]}>{title}</Text>
      {text ? <Text style={[styles.emptyText, { color: tokens.textSecondary }]}>{text}</Text> : null}
      {actionLabel ? (
        <Pressable onPress={onAction} accessibilityRole="button" hitSlop={6} style={styles.emptyAction}>
          <Text style={[styles.link, { color: tokens.primary }]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/** Erro de uma seção (ex.: convites) com tentar de novo, sem derrubar a tela inteira. */
export function InlineError({ tokens, message, onRetry }) {
  return (
    <View style={[styles.inlineError, { backgroundColor: tokens.expenseSoft }]} accessibilityRole="alert">
      <Ionicons name="cloud-offline-outline" size={20} color={tokens.expense} />
      <Text style={[styles.inlineErrorText, { color: tokens.text }]}>{message}</Text>
      {onRetry ? (
        <Pressable onPress={onRetry} accessibilityRole="button" hitSlop={8}>
          <Text style={[styles.link, { color: tokens.primary }]}>Tentar de novo</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: -8 },
  back: { width: TOUCH_MIN, height: TOUCH_MIN, borderRadius: TOUCH_MIN / 2, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  kpi: {
    flexBasis: '47%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minWidth: 0,
  },
  kpiIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  kpiText: { flex: 1, minWidth: 0 },
  kpiLabel: { fontSize: 13, fontWeight: '600' },
  kpiValue: { fontSize: 20, fontWeight: '800', fontVariant: ['tabular-nums'] },
  tabs: { flexDirection: 'row', borderWidth: 1, borderRadius: 14, padding: 4, gap: 4 },
  tab: { flex: 1, minHeight: TOUCH_MIN - 4, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  tabText: { fontSize: 15, fontWeight: '700' },
  toolbar: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  search: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 48, borderWidth: 1, borderRadius: 14, paddingHorizontal: 12 },
  searchInput: { flex: 1, minWidth: 0, fontSize: 16, paddingVertical: 10 },
  toolBtn: { width: 48, height: 48, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: 4, right: 4, minWidth: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeText: { color: '#ffffff', fontSize: 10, fontWeight: '800' },
  sortBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 48, borderRadius: 14, borderWidth: 1, paddingHorizontal: 10 },
  sortText: { fontSize: 14, fontWeight: '700' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, maxWidth: '100%' },
  chipText: { fontSize: 12, fontWeight: '700', flexShrink: 1 },
  avatar: { alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontWeight: '800' },
  more: { width: TOUCH_MIN, height: TOUCH_MIN, borderRadius: TOUCH_MIN / 2, alignItems: 'center', justifyContent: 'center' },
  group: { borderWidth: 1, borderRadius: OVERVIEW_RADIUS, overflow: 'hidden' },
  sep: { height: StyleSheet.hairlineWidth, marginLeft: 16 },
  range: { fontSize: 13, fontWeight: '600' },
  pager: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' },
  pageBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: TOUCH_MIN, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12 },
  pageBtnText: { fontSize: 14, fontWeight: '700' },
  pageLabel: { fontSize: 14, fontWeight: '600' },
  primaryBtn: { flexDirection: 'row', gap: 8, minHeight: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  primaryText: { color: '#ffffff', fontSize: 16, fontWeight: '700', flexShrink: 1, textAlign: 'center' },
  secondaryBtn: { flexDirection: 'row', gap: 6, minHeight: TOUCH_MIN, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  secondaryText: { fontSize: 14, fontWeight: '700', flexShrink: 1 },
  skeleton: { gap: 10 },
  skeletonRow: { height: 64, borderRadius: 14 },
  empty: { borderWidth: 1, borderRadius: OVERVIEW_RADIUS, padding: 24, alignItems: 'center', gap: 8 },
  emptyIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 17, fontWeight: '800', textAlign: 'center' },
  emptyText: { fontSize: 14, lineHeight: 20, textAlign: 'center' },
  emptyAction: { minHeight: TOUCH_MIN, justifyContent: 'center' },
  link: { fontSize: 15, fontWeight: '700' },
  inlineError: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, padding: 12, flexWrap: 'wrap' },
  inlineErrorText: { flex: 1, minWidth: 160, fontSize: 14, lineHeight: 19 },
});
