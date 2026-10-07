import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OVERVIEW_RADIUS } from '../Dashboard/overview/overviewTokens';

/** Esqueleto da primeira carga (sem valores inventados). */
export function ContaGlobalSkeleton({ tokens }) {
  const fill = tokens.isDarkMode ? tokens.theme.cardMuted : '#e7e4f7';
  return (
    <View style={styles.stack} accessibilityRole="progressbar" accessibilityLabel="Carregando sua Conta global">
      <View style={[styles.block, { height: 132, backgroundColor: fill }]} />
      <View style={[styles.block, { height: 44, backgroundColor: fill }]} />
      <View style={[styles.block, { height: 220, backgroundColor: fill }]} />
    </View>
  );
}

export function ContaGlobalEmpty({ tokens, onCreate }) {
  return (
    <View style={[styles.card, { backgroundColor: tokens.card, borderColor: tokens.cardBorder }]}>
      <View style={[styles.icon, { backgroundColor: tokens.primarySoft }]}>
        <Ionicons name="globe-outline" size={28} color={tokens.primary} />
      </View>
      <Text style={[styles.title, { color: tokens.text }]}>Nenhuma moeda cadastrada</Text>
      <Text style={[styles.text, { color: tokens.textSecondary }]}>
        Anote quanto você tem em dólar, euro ou outra moeda e veja o equivalente aproximado em reais.
      </Text>
      <Pressable
        onPress={onCreate}
        accessibilityRole="button"
        style={({ pressed }) => [styles.btn, { backgroundColor: tokens.primary }, pressed && { opacity: 0.85 }]}
      >
        <Ionicons name="add" size={20} color="#ffffff" />
        <Text style={styles.btnText}>Adicionar moeda</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 12 },
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
});
