import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OVERVIEW_RADIUS } from '../Dashboard/overview/overviewTokens';

/** Esqueleto da primeira carga do mês (sem valores inventados). */
export function OrcamentosSkeleton({ tokens }) {
  const fill = tokens.isDarkMode ? tokens.theme.cardMuted : '#e7e4f7';
  return (
    <View style={styles.stack} accessibilityRole="progressbar" accessibilityLabel="Carregando seus orçamentos">
      <View style={styles.row}>
        <View style={[styles.block, styles.half, { backgroundColor: fill }]} />
        <View style={[styles.block, styles.half, { backgroundColor: fill }]} />
      </View>
      <View style={[styles.block, { height: 96, backgroundColor: fill }]} />
      <View style={[styles.block, { height: 52, backgroundColor: fill }]} />
      <View style={[styles.block, { height: 150, backgroundColor: fill }]} />
      <View style={[styles.block, { height: 150, backgroundColor: fill }]} />
    </View>
  );
}

/** Mês carregado sem nenhum orçamento (diferente de erro ao carregar). */
export function OrcamentosEmpty({ tokens, monthLabel, canDuplicate, onCreate, onDuplicate }) {
  return (
    <View style={[styles.card, { backgroundColor: tokens.card, borderColor: tokens.cardBorder }]}>
      <View style={[styles.icon, { backgroundColor: tokens.primarySoft }]}>
        <Ionicons name="wallet-outline" size={26} color={tokens.primary} />
      </View>
      <Text style={[styles.title, { color: tokens.text }]}>Nenhum orçamento em {monthLabel}</Text>
      <Text style={[styles.text, { color: tokens.textSecondary }]}>
        Defina limites por categoria para acompanhar quanto já foi gasto ou recebido no mês.
      </Text>
      <Pressable
        onPress={onCreate}
        accessibilityRole="button"
        style={({ pressed }) => [styles.btn, { backgroundColor: tokens.primary }, pressed && { opacity: 0.85 }]}
      >
        <Ionicons name="add" size={20} color="#ffffff" />
        <Text style={styles.btnText}>Criar primeiro orçamento</Text>
      </Pressable>
      {canDuplicate ? (
        <Pressable onPress={onDuplicate} accessibilityRole="button" hitSlop={6} style={({ pressed }) => [styles.link, pressed && { opacity: 0.6 }]}>
          <Text style={[styles.linkText, { color: tokens.primary }]}>Copiar do mês anterior</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 12 },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1, height: 104 },
  block: { borderRadius: OVERVIEW_RADIUS },
  card: { borderRadius: OVERVIEW_RADIUS, borderWidth: 1, padding: 24, alignItems: 'center', gap: 10 },
  icon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '800', textAlign: 'center' },
  text: { fontSize: 14, lineHeight: 20, textAlign: 'center' },
  btn: {
    flexDirection: 'row',
    gap: 8,
    minHeight: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginTop: 6,
  },
  btnText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  link: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 },
  linkText: { fontSize: 15, fontWeight: '700' },
});
