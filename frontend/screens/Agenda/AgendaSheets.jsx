import React from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatSignedBrl } from '@/lib/finance/format';
import { googleCalendarDayUrl, googleEventToForm } from '@/lib/finance/agenda';
import { describeEventWhen } from '@/lib/finance/agendaScreen';
import { BottomSheet, SheetAction } from '../Transactions/BottomSheet';
import { TOUCH_MIN } from '../Dashboard/overview/overviewTokens';
import { statusAppearance } from './AgendaItemRow';

const openUrl = (url) => {
  if (url) void Linking.openURL(url).catch(() => {});
};

function InfoRow({ tokens, icon, label, value }) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={18} color={tokens.textTertiary} style={styles.infoIcon} />
      <View style={styles.infoText}>
        <Text style={[styles.infoLabel, { color: tokens.textTertiary }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: tokens.text }]}>{value}</Text>
      </View>
    </View>
  );
}

const googleLink = (item) =>
  item.htmlLink && !String(item.htmlLink).includes('msg=') ? item.htmlLink : googleCalendarDayUrl(item.dayKey);

/** Detalhes do item. Lançamento: só consulta (pagar/editar continua em Transações). Compromisso: Meet, Google, editar, excluir. */
export function AgendaDetailsSheet({ tokens, item, canEditGoogle, onClose, onOpenTransactions, onEdit, onDelete }) {
  if (item.source === 'transaction') {
    const status = statusAppearance(tokens, item);
    const value = formatSignedBrl(item.amount, item.isIncome ? 'entrada' : 'saida');
    return (
      <BottomSheet visible onClose={onClose} title={item.title} tokens={tokens}>
        <Text style={[styles.amount, { color: item.isIncome ? tokens.income : tokens.expense }]}>{value}</Text>
        <View style={[styles.pill, { backgroundColor: status.bg }]}>
          <Ionicons name={status.icon} size={14} color={status.fg} />
          <Text style={[styles.pillText, { color: status.fg }]}>{item.statusLabel}</Text>
        </View>
        <InfoRow tokens={tokens} icon={item.isIncome ? 'arrow-down' : 'arrow-up'} label="Tipo" value={item.isIncome ? 'Entrada' : 'Saída'} />
        <InfoRow tokens={tokens} icon="calendar-outline" label="Data" value={`${item.dayKey.slice(8, 10)}/${item.dayKey.slice(5, 7)}/${item.dayKey.slice(0, 4)}`} />
        <InfoRow tokens={tokens} icon="wallet-outline" label="Conta" value={item.contaName} />
        <InfoRow tokens={tokens} icon="document-text-outline" label="Observação" value={item.subtitle} />
        <InfoRow
          tokens={tokens}
          icon="notifications-outline"
          label="Google Agenda"
          value={item.googleEvent ? 'Tem lembrete na sua Google Agenda' : null}
        />
        <View style={styles.actions}>
          <SheetAction tokens={tokens} icon="swap-vertical-outline" label="Ver em Transações" tone="accent" onPress={() => onOpenTransactions(item)} />
          {item.googleEvent ? (
            <SheetAction
              tokens={tokens}
              icon="open-outline"
              label="Abrir lembrete no Google Agenda"
              onPress={() => openUrl(item.googleEvent.htmlLink || googleCalendarDayUrl(item.dayKey))}
            />
          ) : null}
        </View>
      </BottomSheet>
    );
  }

  const form = googleEventToForm(item.raw);
  return (
    <BottomSheet visible onClose={onClose} title={item.title} tokens={tokens}>
      <InfoRow tokens={tokens} icon="time-outline" label="Quando" value={describeEventWhen(form)} />
      <InfoRow
        tokens={tokens}
        icon="repeat"
        label="Repetição"
        value={item.isRecurring ? 'Faz parte de uma série que se repete' : null}
      />
      <InfoRow tokens={tokens} icon="location-outline" label="Local" value={item.location} />
      <InfoRow tokens={tokens} icon="document-text-outline" label="Detalhes" value={item.subtitle} />
      <View style={styles.actions}>
        {item.meetLink ? (
          <SheetAction tokens={tokens} icon="videocam-outline" label="Entrar no Google Meet" tone="accent" onPress={() => openUrl(item.meetLink)} />
        ) : null}
        <SheetAction tokens={tokens} icon="open-outline" label="Abrir no Google Agenda" onPress={() => openUrl(googleLink(item))} />
        {canEditGoogle ? (
          <>
            <SheetAction
              tokens={tokens}
              icon="create-outline"
              label={item.isRecurring ? 'Editar esta ocorrência' : 'Editar compromisso'}
              onPress={() => onEdit(item)}
            />
            <SheetAction tokens={tokens} icon="trash-outline" label="Excluir compromisso" tone="danger" onPress={() => onDelete(item)} />
          </>
        ) : null}
      </View>
      {item.isRecurring && canEditGoogle ? (
        <Text style={[styles.note, { color: tokens.textSecondary }]}>
          Para mudar a série inteira (datas ou repetição), use “Abrir no Google Agenda”.
        </Text>
      ) : null}
    </BottomSheet>
  );
}

/** Excluir: compromisso simples pede confirmação; ocorrência de série pergunta "só esta" ou "toda a série". */
export function AgendaDeleteSheet({ tokens, item, busy, error, onConfirm, onClose }) {
  const recurring = item.isRecurring;
  return (
    <BottomSheet visible onClose={onClose} title="Excluir compromisso" tokens={tokens}>
      <Text style={[styles.body, { color: tokens.textSecondary }]}>
        {recurring
          ? `“${item.title}” se repete. Escolha o que excluir da sua Google Agenda.`
          : `“${item.title}” será excluído da sua Google Agenda.`}
      </Text>
      {error ? (
        <Text style={[styles.error, { color: tokens.expense }]} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
      {busy ? (
        <View style={styles.busyRow} accessibilityRole="progressbar">
          <ActivityIndicator color={tokens.primary} />
          <Text style={{ color: tokens.textSecondary }}>Excluindo…</Text>
        </View>
      ) : (
        <View style={styles.actions}>
          {recurring ? (
            <>
              <SheetAction tokens={tokens} icon="remove-circle-outline" label="Só esta ocorrência" tone="danger" onPress={() => onConfirm('occurrence')} />
              <SheetAction tokens={tokens} icon="trash-outline" label="Toda a série" tone="danger" onPress={() => onConfirm('series')} />
            </>
          ) : (
            <SheetAction tokens={tokens} icon="trash-outline" label="Excluir compromisso" tone="danger" onPress={() => onConfirm('occurrence')} />
          )}
          <SheetAction tokens={tokens} icon="close-outline" label="Cancelar" onPress={onClose} />
        </View>
      )}
    </BottomSheet>
  );
}

/** Gerenciar a Google Agenda: sincronizar agora e desconectar (com confirmação). */
export function AgendaGoogleManageSheet({ tokens, busy, confirming, error, onSync, onAskDisconnect, onDisconnect, onCancelDisconnect, onClose }) {
  return (
    <BottomSheet visible onClose={onClose} title="Google Agenda" tokens={tokens}>
      <Text style={[styles.body, { color: tokens.textSecondary }]}>
        {confirming
          ? 'Seus compromissos deixam de aparecer no app. Nada é apagado da sua Google Agenda.'
          : 'Seus compromissos da agenda principal aparecem junto com os lançamentos.'}
      </Text>
      {error ? (
        <Text style={[styles.error, { color: tokens.expense }]} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
      <View style={styles.actions}>
        {confirming ? (
          <>
            <SheetAction tokens={tokens} icon="unlink-outline" label={busy ? 'Desconectando…' : 'Desconectar'} tone="danger" disabled={busy} onPress={onDisconnect} />
            <SheetAction tokens={tokens} icon="close-outline" label="Cancelar" disabled={busy} onPress={onCancelDisconnect} />
          </>
        ) : (
          <>
            <SheetAction tokens={tokens} icon="refresh" label="Sincronizar agora" tone="accent" disabled={busy} onPress={onSync} />
            <SheetAction tokens={tokens} icon="unlink-outline" label="Desconectar Google Agenda" tone="danger" disabled={busy} onPress={onAskDisconnect} />
          </>
        )}
      </View>
    </BottomSheet>
  );
}

/** Pedido para conectar antes de criar um compromisso (compromissos vivem na Google Agenda). */
export function AgendaConnectSheet({ tokens, expired, busy, onConnect, onClose }) {
  return (
    <BottomSheet visible onClose={onClose} title={expired ? 'Reconecte sua Google Agenda' : 'Conecte sua Google Agenda'} tokens={tokens}>
      <Text style={[styles.body, { color: tokens.textSecondary }]}>
        {expired
          ? 'A autorização expirou ou foi revogada. Reconecte para criar e editar compromissos.'
          : 'Os compromissos ficam na sua Google Agenda. Conecte para criar o primeiro direto pelo app.'}
      </Text>
      <Pressable
        onPress={onConnect}
        disabled={busy}
        accessibilityRole="button"
        accessibilityState={{ disabled: Boolean(busy), busy: Boolean(busy) }}
        style={({ pressed }) => [styles.primaryBtn, { backgroundColor: tokens.primary }, (pressed || busy) && { opacity: 0.85 }]}
      >
        {busy ? <ActivityIndicator size="small" color="#ffffff" /> : <Ionicons name="link-outline" size={18} color="#ffffff" />}
        <Text style={styles.primaryText}>{expired ? 'Reconectar' : 'Conectar Google Agenda'}</Text>
      </Pressable>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  amount: { fontSize: 26, fontWeight: '800', fontVariant: ['tabular-nums'] },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  pillText: { fontSize: 13, fontWeight: '700' },
  infoRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  infoIcon: { marginTop: 2 },
  infoText: { flex: 1, gap: 1 },
  infoLabel: { fontSize: 12, fontWeight: '600' },
  infoValue: { fontSize: 15 },
  actions: { gap: 2, marginTop: 4 },
  note: { fontSize: 13 },
  body: { fontSize: 14, lineHeight: 20 },
  error: { fontSize: 14, fontWeight: '600' },
  busyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: TOUCH_MIN },
  primaryBtn: {
    flexDirection: 'row',
    gap: 8,
    minHeight: TOUCH_MIN + 4,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  primaryText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
});
