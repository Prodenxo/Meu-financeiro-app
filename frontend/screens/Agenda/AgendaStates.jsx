import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OVERVIEW_RADIUS, TOUCH_MIN } from '../Dashboard/overview/overviewTokens';

/**
 * Situação da Google Agenda quando ela não está trazendo compromissos.
 * Nunca é confundida com "nenhum compromisso": cada caso diz o que aconteceu e o que fazer.
 */
export function AgendaGoogleBanner({ tokens, google, busy, onConnect, onRetry, onSignIn }) {
  let icon;
  let title;
  let text;
  let action;
  let onAction;
  if (google.status === 'error') {
    const isAuth = google.error?.kind === 'auth';
    icon = isAuth ? 'lock-closed-outline' : google.error?.kind === 'network' ? 'cloud-offline-outline' : 'alert-circle-outline';
    title = isAuth ? 'Sua sessão terminou' : 'Não foi possível carregar seus compromissos';
    text = google.error?.message;
    action = isAuth ? 'Entrar novamente' : 'Tentar de novo';
    onAction = isAuth ? onSignIn : onRetry;
  } else if (google.connection === 'not_connected') {
    icon = 'calendar-outline';
    title = 'Veja seus compromissos aqui';
    text = 'Conecte sua Google Agenda para ver e criar compromissos junto com seus lançamentos.';
    action = 'Conectar Google Agenda';
    onAction = onConnect;
  } else if (google.connection === 'expired') {
    icon = 'refresh-circle-outline';
    title = 'Reconecte sua Google Agenda';
    text = 'A autorização expirou ou foi revogada na sua conta Google. Seus compromissos não estão sendo mostrados.';
    action = 'Reconectar';
    onAction = onConnect;
  } else {
    return null;
  }
  const warn = google.status === 'error' || google.connection === 'expired';
  return (
    <View
      style={[styles.banner, { backgroundColor: warn ? tokens.warningSoft : tokens.primarySoft, borderColor: warn ? tokens.warning : tokens.cardBorder }]}
      accessibilityRole="alert"
    >
      <View style={styles.bannerTop}>
        <Ionicons name={icon} size={22} color={warn ? tokens.warning : tokens.primary} />
        <View style={styles.bannerText}>
          <Text style={[styles.bannerTitle, { color: tokens.text }]}>{title}</Text>
          {text ? <Text style={[styles.bannerBody, { color: tokens.textSecondary }]}>{text}</Text> : null}
        </View>
      </View>
      <Pressable
        onPress={onAction}
        disabled={busy}
        accessibilityRole="button"
        accessibilityState={{ disabled: Boolean(busy), busy: Boolean(busy) }}
        style={({ pressed }) => [styles.bannerBtn, { backgroundColor: tokens.primary }, (pressed || busy) && { opacity: 0.8 }]}
      >
        {busy ? <ActivityIndicator size="small" color="#ffffff" /> : null}
        <Text style={styles.bannerBtnText}>{action}</Text>
      </Pressable>
    </View>
  );
}

/** Dia sem itens. Só diz "nenhum compromisso" quando a Google Agenda respondeu de verdade. */
export function AgendaEmptyDay({ tokens, google, onNew }) {
  const googleOk = google.status === 'ready' && google.connection === 'connected';
  const title = googleOk ? 'Nada para este dia' : 'Nenhum lançamento neste dia';
  const text = googleOk
    ? 'Nenhum lançamento nem compromisso. Que tal agendar algo?'
    : google.status === 'loading'
      ? 'Carregando seus compromissos do Google…'
      : 'Os compromissos da Google Agenda aparecem aqui quando ela estiver disponível.';
  return (
    <View style={[styles.empty, { backgroundColor: tokens.card, borderColor: tokens.cardBorder }, tokens.shadow]}>
      <View style={[styles.emptyIcon, { backgroundColor: tokens.primarySoft }]}>
        <Ionicons name="calendar-clear-outline" size={24} color={tokens.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: tokens.text }]}>{title}</Text>
      <Text style={[styles.emptyText, { color: tokens.textSecondary }]}>{text}</Text>
      <Pressable
        onPress={onNew}
        accessibilityRole="button"
        style={({ pressed }) => [styles.emptyBtn, { borderColor: tokens.primary }, pressed && { backgroundColor: tokens.primarySoft }]}
      >
        <Ionicons name="add" size={18} color={tokens.primary} />
        <Text style={[styles.emptyBtnText, { color: tokens.primary }]}>Novo compromisso</Text>
      </Pressable>
    </View>
  );
}

/** Linha "Google Agenda conectada" com acesso a sincronizar/desconectar. */
export function AgendaGoogleStatusRow({ tokens, google, onManage }) {
  if (google.connection !== 'connected') return null;
  const loading = google.status === 'loading';
  return (
    <Pressable
      onPress={onManage}
      accessibilityRole="button"
      accessibilityLabel={`Google Agenda conectada${loading ? ', atualizando' : ''}. Gerenciar`}
      style={({ pressed }) => [styles.statusRow, { borderColor: tokens.cardBorder, backgroundColor: tokens.card }, pressed && { opacity: 0.8 }]}
    >
      <Ionicons name="checkmark-circle" size={18} color={tokens.income} />
      <Text style={[styles.statusText, { color: tokens.text }]} numberOfLines={2}>
        Google Agenda conectada
      </Text>
      {loading ? <ActivityIndicator size="small" color={tokens.primary} /> : null}
      <Text style={[styles.statusAction, { color: tokens.primary }]}>Gerenciar</Text>
    </Pressable>
  );
}

export function AgendaListSkeleton({ tokens }) {
  const bg = tokens.isDarkMode ? tokens.theme.cardMuted : '#e7e4f7';
  return (
    <View style={styles.skeleton} accessibilityRole="progressbar" accessibilityLabel="Carregando a agenda">
      {[0, 1, 2].map((i) => (
        <View key={i} style={[styles.skeletonRow, { backgroundColor: bg }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { borderRadius: OVERVIEW_RADIUS, borderWidth: 1, padding: 14, gap: 12 },
  bannerTop: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  bannerText: { flex: 1, gap: 2 },
  bannerTitle: { fontSize: 15, fontWeight: '700' },
  bannerBody: { fontSize: 13 },
  bannerBtn: {
    flexDirection: 'row',
    gap: 8,
    alignSelf: 'flex-start',
    minHeight: TOUCH_MIN,
    paddingHorizontal: 18,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  empty: { borderRadius: OVERVIEW_RADIUS, borderWidth: 1, padding: 20, alignItems: 'center', gap: 8 },
  emptyIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '700', textAlign: 'center' },
  emptyText: { fontSize: 13, textAlign: 'center' },
  emptyBtn: {
    flexDirection: 'row',
    gap: 6,
    minHeight: TOUCH_MIN,
    paddingHorizontal: 18,
    borderRadius: 999,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  emptyBtnText: { fontSize: 14, fontWeight: '700' },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: TOUCH_MIN + 4,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  statusText: { flex: 1, fontSize: 14, fontWeight: '600' },
  statusAction: { fontSize: 14, fontWeight: '700' },
  skeleton: { gap: 8 },
  skeletonRow: { height: 64, borderRadius: 14 },
});
