import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheet, SheetAction } from '../Transactions/BottomSheet';
import { TOUCH_MIN } from '../Dashboard/overview/overviewTokens';

/** Status da linha "Google Agenda" (texto + ícone, nunca só cor). */
export function googleStatusAppearance(tokens, status) {
  switch (status) {
    case 'connected':
      return { label: 'Conectado', icon: 'checkmark-circle', color: tokens.income };
    case 'not_connected':
      return { label: 'Não conectado', icon: 'ellipse-outline', color: tokens.textSecondary };
    case 'expired':
      return { label: 'Reconexão necessária', icon: 'alert-circle', color: tokens.warning };
    case 'error':
      return { label: 'Não foi possível verificar', icon: 'cloud-offline-outline', color: tokens.warning };
    default:
      return { label: 'Verificando…', icon: 'time-outline', color: tokens.textSecondary };
  }
}

const COPY = {
  connected: 'Seus compromissos da agenda principal aparecem na Agenda do app. Lançamentos só viram lembrete no Google quando você escolhe isso ao salvar.',
  not_connected: 'Conecte para ver e criar compromissos na Agenda do app. Nenhum lançamento é enviado ao Google automaticamente.',
  expired: 'A autorização expirou ou foi revogada na sua conta Google. Reconecte para voltar a ver seus compromissos.',
  loading: 'Verificando a conexão…',
};

export function GoogleAgendaSheet({ tokens, connection, busy, confirming, error, onConnect, onRecheck, onAskDisconnect, onCancelDisconnect, onDisconnect, onClose }) {
  const { status } = connection;
  const appearance = googleStatusAppearance(tokens, status);
  const body = confirming
    ? 'Seus compromissos deixam de aparecer no app e não será possível criar novos lembretes no Google. Nada é apagado da sua Google Agenda.'
    : status === 'error'
      ? connection.error?.message
      : COPY[status];

  return (
    <BottomSheet visible onClose={busy ? () => {} : onClose} title={confirming ? 'Desconectar Google Agenda?' : 'Google Agenda'} tokens={tokens}>
      {!confirming ? (
        <View style={styles.statusRow} accessibilityLabel={`Situação: ${appearance.label}`}>
          <Ionicons name={appearance.icon} size={18} color={appearance.color} />
          <Text style={[styles.statusText, { color: appearance.color }]}>{appearance.label}</Text>
        </View>
      ) : null}
      {body ? <Text style={[styles.body, { color: tokens.textSecondary }]}>{body}</Text> : null}
      {error ? (
        <Text style={[styles.error, { color: tokens.expense }]} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}

      {confirming ? (
        <View style={styles.actions}>
          <SheetAction tokens={tokens} icon="unlink-outline" label={busy ? 'Desconectando…' : 'Desconectar'} tone="danger" disabled={busy} onPress={onDisconnect} />
          <SheetAction tokens={tokens} icon="close-outline" label="Cancelar" disabled={busy} onPress={onCancelDisconnect} />
        </View>
      ) : status === 'connected' ? (
        <View style={styles.actions}>
          <SheetAction tokens={tokens} icon="refresh" label="Verificar conexão" tone="accent" disabled={busy} onPress={onRecheck} />
          <SheetAction tokens={tokens} icon="unlink-outline" label="Desconectar" tone="danger" disabled={busy} onPress={onAskDisconnect} />
        </View>
      ) : status === 'not_connected' || status === 'expired' ? (
        <Pressable
          onPress={onConnect}
          disabled={busy}
          accessibilityRole="button"
          accessibilityState={{ disabled: Boolean(busy), busy: Boolean(busy) }}
          style={({ pressed }) => [styles.primaryBtn, { backgroundColor: tokens.primary }, (pressed || busy) && { opacity: 0.85 }]}
        >
          {busy ? <ActivityIndicator size="small" color="#ffffff" /> : <Ionicons name="link-outline" size={18} color="#ffffff" />}
          <Text style={styles.primaryText}>{status === 'expired' ? 'Reconectar' : 'Conectar Google Agenda'}</Text>
        </Pressable>
      ) : status === 'error' ? (
        <View style={styles.actions}>
          <SheetAction tokens={tokens} icon="refresh" label="Tentar de novo" tone="accent" disabled={busy} onPress={onRecheck} />
        </View>
      ) : (
        <ActivityIndicator color={tokens.primary} />
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusText: { fontSize: 15, fontWeight: '700' },
  body: { fontSize: 14, lineHeight: 20 },
  error: { fontSize: 14, fontWeight: '600' },
  actions: { gap: 2 },
  primaryBtn: { flexDirection: 'row', gap: 8, minHeight: TOUCH_MIN + 4, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
});
