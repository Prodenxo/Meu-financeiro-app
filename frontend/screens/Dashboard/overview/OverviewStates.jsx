import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OVERVIEW_GAP, OVERVIEW_RADIUS, TOUCH_MIN } from './overviewTokens';

/** Esqueleto enquanto a primeira carga não chega (sem valores inventados). */
export function OverviewSkeleton({ tokens }) {
  const block = (height, key) => (
    <View
      key={key}
      style={[styles.block, { height, backgroundColor: tokens.isDarkMode ? tokens.theme.cardMuted : '#e7e4f7' }]}
    />
  );
  return (
    <View style={styles.stack} accessibilityLabel="Carregando seus dados" accessibilityRole="progressbar">
      {block(92, 'saldo')}
      {block(92, 'entradas')}
      {block(92, 'saidas')}
      {block(180, 'resumo')}
      {block(220, 'orcamento')}
    </View>
  );
}

/** Falha sem dados anteriores: explica o problema e oferece nova tentativa (nunca mostra R$ 0,00). */
export function OverviewError({ tokens, error, onRetry, onSignIn }) {
  const isAuth = error?.kind === 'auth';
  const isNetwork = error?.kind === 'network';
  return (
    <View style={[styles.errorCard, { backgroundColor: tokens.card, borderColor: tokens.cardBorder }, tokens.shadow]}>
      <View style={[styles.errorIcon, { backgroundColor: tokens.expenseSoft }]}>
        <Ionicons
          name={isAuth ? 'lock-closed-outline' : isNetwork ? 'cloud-offline-outline' : 'alert-circle-outline'}
          size={24}
          color={tokens.expense}
        />
      </View>
      <Text style={[styles.errorTitle, { color: tokens.text }]}>
        {isAuth ? 'Sua sessão terminou' : 'Não foi possível carregar seus dados'}
      </Text>
      <Text style={[styles.errorText, { color: tokens.textSecondary }]}>{error?.message}</Text>
      <Pressable
        onPress={isAuth ? onSignIn : onRetry}
        accessibilityRole="button"
        style={({ pressed }) => [styles.primaryBtn, { backgroundColor: tokens.primary }, pressed && { opacity: 0.85 }]}
      >
        <Text style={styles.primaryText}>{isAuth ? 'Entrar novamente' : 'Tentar de novo'}</Text>
      </Pressable>
    </View>
  );
}

/** Aviso quando a atualização falha mas os dados anteriores continuam na tela. */
export function StaleBanner({ tokens, error, onRetry }) {
  return (
    <View
      style={[styles.banner, { backgroundColor: tokens.warningSoft, borderColor: tokens.warning }]}
      accessibilityRole="alert"
    >
      <Ionicons name="warning-outline" size={18} color={tokens.warning} />
      <Text style={[styles.bannerText, { color: tokens.text }]}>
        Não conseguimos atualizar. Os valores mostrados podem estar desatualizados. {error?.message}
      </Text>
      <Pressable onPress={onRetry} accessibilityRole="button" hitSlop={8} style={styles.bannerBtn}>
        <Text style={[styles.bannerBtnText, { color: tokens.primary }]}>Tentar</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: OVERVIEW_GAP },
  block: { borderRadius: OVERVIEW_RADIUS },
  errorCard: {
    borderRadius: OVERVIEW_RADIUS,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },
  errorIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  errorTitle: { fontSize: 17, fontWeight: '700', textAlign: 'center' },
  errorText: { fontSize: 14, textAlign: 'center' },
  primaryBtn: {
    minHeight: TOUCH_MIN,
    borderRadius: 999,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  primaryText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  bannerText: { flex: 1, fontSize: 13 },
  bannerBtn: { minHeight: TOUCH_MIN, justifyContent: 'center', paddingHorizontal: 4 },
  bannerBtnText: { fontSize: 14, fontWeight: '700' },
});
