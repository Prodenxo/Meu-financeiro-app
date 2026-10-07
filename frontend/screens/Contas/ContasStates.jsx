import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OVERVIEW_RADIUS, TOUCH_MIN } from '../Dashboard/overview/overviewTokens';

/** Esqueleto da primeira carga (sem valores inventados). */
export function ContasSkeleton({ tokens }) {
  const fill = tokens.isDarkMode ? tokens.theme.cardMuted : '#e7e4f7';
  return (
    <View style={styles.stack} accessibilityRole="progressbar" accessibilityLabel="Carregando suas contas">
      <View style={[styles.block, { height: 132, backgroundColor: fill }]} />
      <View style={[styles.line, { backgroundColor: fill }]} />
      <View style={[styles.block, { height: 72 * 3, backgroundColor: fill }]} />
    </View>
  );
}

export function ContasEmpty({ tokens, onCreate }) {
  return (
    <View style={[styles.empty, { backgroundColor: tokens.card, borderColor: tokens.cardBorder }]}>
      <View style={[styles.emptyIcon, { backgroundColor: tokens.primarySoft }]}>
        <Ionicons name="wallet-outline" size={26} color={tokens.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: tokens.text }]}>Nenhuma conta ainda</Text>
      <Text style={[styles.emptyText, { color: tokens.textSecondary }]}>
        Cadastre suas contas para acompanhar o saldo de cada uma.
      </Text>
      <Pressable
        onPress={onCreate}
        accessibilityRole="button"
        style={({ pressed }) => [styles.emptyBtn, { backgroundColor: tokens.primary }, pressed && { opacity: 0.85 }]}
      >
        <Ionicons name="add" size={20} color="#ffffff" />
        <Text style={styles.emptyBtnText}>Cadastrar primeira conta</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 16 },
  block: { borderRadius: OVERVIEW_RADIUS },
  line: { height: 18, width: 140, borderRadius: 9 },
  empty: { borderRadius: OVERVIEW_RADIUS, borderWidth: 1, padding: 24, alignItems: 'center', gap: 10 },
  emptyIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 17, fontWeight: '700', textAlign: 'center' },
  emptyText: { fontSize: 14, lineHeight: 20, textAlign: 'center' },
  emptyBtn: {
    flexDirection: 'row',
    gap: 6,
    minHeight: TOUCH_MIN + 4,
    borderRadius: 999,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  emptyBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
});
