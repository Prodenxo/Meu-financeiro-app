import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SectionCard } from './SectionCard';
import { OVERVIEW_RADIUS, toneColors } from './overviewTokens';

const ICONS = {
  analytics: 'stats-chart',
  wallet: 'pie-chart',
  time: 'time-outline',
  alert: 'alert-circle-outline',
  receipt: 'receipt-outline',
  swap: 'swap-horizontal',
};

/** Resumo do mês em 2 colunas, com o título completo de cada indicador. */
export function InsightGrid({ tokens, insights }) {
  return (
    <SectionCard tokens={tokens} title="Resumo do mês" icon="sparkles-outline">
      <View style={styles.grid}>
        {insights.map((item) => {
          const { fg, bg } = toneColors(tokens, item.tone);
          return (
            <View
              key={item.id}
              style={[styles.tile, { backgroundColor: tokens.isDarkMode ? tokens.theme.cardMuted : '#f8f7fe' }]}
              accessible
              accessibilityLabel={`${item.label}: ${item.value}. ${item.hint}`}
            >
              <View style={styles.tileHead}>
                <View style={[styles.icon, { backgroundColor: bg }]}>
                  <Ionicons name={ICONS[item.icon] || 'ellipse-outline'} size={14} color={fg} />
                </View>
                <Text style={[styles.label, { color: tokens.textSecondary }]}>{item.label}</Text>
              </View>
              <Text style={[styles.value, { color: fg === tokens.textSecondary ? tokens.text : fg }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                {item.value}
              </Text>
              <Text style={[styles.hint, { color: tokens.textTertiary }]}>{item.hint}</Text>
            </View>
          );
        })}
      </View>
    </SectionCard>
  );
}

/** Atalho para a Conta global (mesma tela do menu). */
export function ContaGlobalCard({ tokens, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Conta global: conheça sua conta internacional"
      style={({ pressed }) => [
        styles.globalCard,
        { backgroundColor: tokens.card, borderColor: tokens.cardBorder },
        tokens.shadow,
        pressed && { opacity: 0.9 },
      ]}
    >
      <View style={[styles.globalIcon, { backgroundColor: tokens.primarySoft }]}>
        <Ionicons name="globe-outline" size={22} color={tokens.primary} />
      </View>
      <View style={styles.globalBody}>
        <Text style={[styles.globalTitle, { color: tokens.text }]}>Conta global</Text>
        <Text style={[styles.globalHint, { color: tokens.textSecondary }]}>Conheça sua conta internacional</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={tokens.textTertiary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: {
    flexGrow: 1,
    flexBasis: '46%',
    minWidth: 140,
    borderRadius: 14,
    padding: 12,
    gap: 6,
  },
  tileHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  icon: { width: 24, height: 24, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  label: { flex: 1, fontSize: 12, fontWeight: '600' },
  value: { fontSize: 18, fontWeight: '800' },
  hint: { fontSize: 12, lineHeight: 16 },
  globalCard: {
    borderRadius: OVERVIEW_RADIUS,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  globalIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  globalBody: { flex: 1, gap: 2 },
  globalTitle: { fontSize: 15, fontWeight: '700' },
  globalHint: { fontSize: 13 },
});
