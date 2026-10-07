import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OVERVIEW_RADIUS, TOUCH_MIN } from './overviewTokens';

/** Card branco com título, ícone opcional e ação à direita (link ou componente). */
export function SectionCard({ tokens, title, icon, actionLabel, onAction, right, children, style }) {
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: tokens.card, borderColor: tokens.cardBorder },
        tokens.shadow,
        style,
      ]}
    >
      {title ? (
        <View style={styles.header}>
          <View style={styles.titleRow}>
            {icon ? (
              <View style={[styles.iconWrap, { backgroundColor: tokens.primarySoft }]}>
                <Ionicons name={icon} size={16} color={tokens.primary} />
              </View>
            ) : null}
            <Text style={[styles.title, { color: tokens.text }]} accessibilityRole="header">
              {title}
            </Text>
          </View>
          {right}
          {actionLabel && onAction ? (
            <Pressable
              onPress={onAction}
              accessibilityRole="link"
              hitSlop={8}
              style={({ pressed }) => [styles.action, pressed && styles.pressed]}
            >
              <Text style={[styles.actionText, { color: tokens.primary }]}>{actionLabel}</Text>
              <Ionicons name="chevron-forward" size={14} color={tokens.primary} />
            </Pressable>
          ) : null}
        </View>
      ) : null}
      {children}
    </View>
  );
}

export function EmptyNote({ tokens, text, hint }) {
  return (
    <View style={styles.empty}>
      <Text style={[styles.emptyText, { color: tokens.textSecondary }]}>{text}</Text>
      {hint ? <Text style={[styles.emptyHint, { color: tokens.textTertiary }]}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: OVERVIEW_RADIUS,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap',
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  iconWrap: { width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: '700', flexShrink: 1 },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minHeight: TOUCH_MIN,
    paddingHorizontal: 4,
  },
  actionText: { fontSize: 13, fontWeight: '600' },
  pressed: { opacity: 0.7 },
  empty: { paddingVertical: 12, gap: 4, alignItems: 'center' },
  emptyText: { fontSize: 14, textAlign: 'center' },
  emptyHint: { fontSize: 12, textAlign: 'center' },
});
