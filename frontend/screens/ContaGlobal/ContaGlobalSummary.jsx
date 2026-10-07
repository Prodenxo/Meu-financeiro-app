import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatBrl } from '@/lib/finance/format';
import { OVERVIEW_RADIUS, TOUCH_MIN } from '../Dashboard/overview/overviewTokens';
import { MoedaFlag } from './MoedaFlag';

/** Total em reais: só aparece como completo quando todas as moedas têm cotação. */
function TotalValue({ tokens, screen, onRetryRates }) {
  if (screen.totalStatus === 'loading') {
    return (
      <View style={styles.loadingRow} accessibilityLabel="Calculando o equivalente em reais">
        <ActivityIndicator color={tokens.onNavy} />
        <Text style={[styles.loadingText, { color: tokens.onNavySoft }]}>Consultando cotações…</Text>
      </View>
    );
  }
  if (screen.totalStatus === 'none') {
    return (
      <View style={styles.unavailable}>
        <Text style={[styles.unavailableTitle, { color: tokens.onNavy }]}>Conversão indisponível</Text>
        <Text style={[styles.note, { color: tokens.onNavySoft }]}>
          Não conseguimos as cotações agora. Seus saldos originais continuam abaixo.
        </Text>
        {onRetryRates ? (
          <Pressable
            onPress={onRetryRates}
            accessibilityRole="button"
            style={({ pressed }) => [styles.retry, { borderColor: tokens.onNavySoft }, pressed && { opacity: 0.7 }]}
          >
            <Ionicons name="refresh" size={16} color={tokens.onNavy} />
            <Text style={[styles.retryText, { color: tokens.onNavy }]}>Tentar de novo</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }
  const partial = screen.totalStatus === 'partial';
  return (
    <View style={styles.valueWrap}>
      <Text
        style={[styles.value, { color: tokens.onNavy }]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.6}
        accessibilityLabel={`${partial ? 'Parcial: ' : ''}aproximadamente ${formatBrl(screen.total)}`}
      >
        ≈ {formatBrl(screen.total)}
      </Text>
      {partial ? (
        <View style={[styles.partial, { backgroundColor: 'rgba(255,255,255,0.14)' }]}>
          <Ionicons name="alert-circle-outline" size={16} color={tokens.onNavy} />
          <Text style={[styles.partialText, { color: tokens.onNavy }]}>
            Parcial: sem cotação para {screen.missingNames.join(', ')}.
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export function ContaGlobalSummary({ tokens, screen, onRetryRates }) {
  return (
    <View style={[styles.card, { backgroundColor: tokens.navy }, tokens.shadow]}>
      <View style={styles.head}>
        <MoedaFlag moeda="BRL" size={28} t={tokens} />
        <Text style={[styles.label, { color: tokens.onNavySoft }]}>Equivalente em reais</Text>
      </View>
      <TotalValue tokens={tokens} screen={screen} onRetryRates={onRetryRates} />
      <Text style={[styles.count, { color: tokens.onNavySoft }]}>{screen.countLabel}</Text>
    </View>
  );
}

export function ReferenceNotice({ tokens }) {
  return (
    <View style={[styles.notice, { backgroundColor: tokens.primarySoft }]} accessibilityRole="text">
      <Ionicons name="information-circle-outline" size={20} color={tokens.primary} />
      <Text style={[styles.noticeText, { color: tokens.text }]}>
        Valor de referência. Não compõe o saldo da Visão geral.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: OVERVIEW_RADIUS, padding: 20, gap: 8 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  label: { fontSize: 15, fontWeight: '600' },
  valueWrap: { gap: 8 },
  value: { fontSize: 32, fontWeight: '800', letterSpacing: -0.5, fontVariant: ['tabular-nums'] },
  partial: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, borderRadius: 10, padding: 8 },
  partialText: { flex: 1, fontSize: 13, fontWeight: '600', lineHeight: 18 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 40 },
  loadingText: { fontSize: 15 },
  unavailable: { gap: 6 },
  unavailableTitle: { fontSize: 22, fontWeight: '800' },
  note: { fontSize: 14, lineHeight: 20 },
  retry: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: TOUCH_MIN,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
  },
  retryText: { fontSize: 14, fontWeight: '700' },
  count: { fontSize: 14 },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 },
  noticeText: { flex: 1, fontSize: 14, lineHeight: 20 },
});
