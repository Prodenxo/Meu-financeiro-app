import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  activeCountLabel,
  formatSaldo,
  HIDDEN_VALUE,
  inactiveCountLabel,
  saldoAccessibilityLabel,
} from '@/lib/finance/contasScreen';
import { OVERVIEW_RADIUS, TOUCH_MIN } from '../Dashboard/overview/overviewTokens';

/** Total das contas ativas, quantidade e botão de mostrar/ocultar valores. */
export function ContasSummaryCard({ tokens, total, activeCount, inactiveCount, hidden, onToggleHidden }) {
  const inactiveHint = inactiveCountLabel(inactiveCount);
  return (
    <View style={[styles.card, { backgroundColor: tokens.navy }, tokens.shadow]}>
      <View style={styles.topRow}>
        <View style={styles.valueCol}>
          <Text style={[styles.label, { color: tokens.onNavySoft }]}>TOTAL NAS CONTAS</Text>
          <Text
            style={[styles.value, { color: tokens.onNavy }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.5}
            accessibilityLabel={`Total nas contas. ${saldoAccessibilityLabel(total, hidden)}`}
            accessibilityLiveRegion="polite"
          >
            {hidden ? HIDDEN_VALUE : formatSaldo(total)}
          </Text>
        </View>
        <Pressable
          onPress={onToggleHidden}
          accessibilityRole="button"
          accessibilityLabel={hidden ? 'Mostrar valores' : 'Ocultar valores'}
          hitSlop={4}
          style={({ pressed }) => [styles.eyeBtn, pressed && { opacity: 0.6 }]}
        >
          <Ionicons name={hidden ? 'eye-off-outline' : 'eye-outline'} size={22} color={tokens.onNavy} />
        </Pressable>
      </View>
      <View style={[styles.divider, { backgroundColor: 'rgba(255,255,255,0.12)' }]} />
      <View style={styles.countRow}>
        <View style={styles.countIcon}>
          <Ionicons name="wallet-outline" size={16} color={tokens.onNavy} />
        </View>
        <Text style={[styles.countText, { color: tokens.onNavy }]}>{activeCountLabel(activeCount)}</Text>
      </View>
      {inactiveHint ? <Text style={[styles.hint, { color: tokens.onNavySoft }]}>{inactiveHint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: OVERVIEW_RADIUS + 2, paddingHorizontal: 20, paddingTop: 18, paddingBottom: 16, gap: 12 },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  valueCol: { flex: 1, gap: 6 },
  label: { fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  value: { fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
  eyeBtn: { width: TOUCH_MIN, height: TOUCH_MIN, alignItems: 'center', justifyContent: 'center', marginRight: -10, marginTop: -6 },
  divider: { height: StyleSheet.hairlineWidth },
  countRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  countIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  countText: { fontSize: 14, fontWeight: '600', flexShrink: 1 },
  hint: { fontSize: 12, lineHeight: 16 },
});
