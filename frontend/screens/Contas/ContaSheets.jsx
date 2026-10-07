import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { isSyncedConta } from '@/lib/finance/contasScreen';
import { BottomSheet, SheetAction } from '../Transactions/BottomSheet';

/** Ações de uma conta (mesmas do menu do site; as de sincronização só para conta sincronizada). */
export function ContaMenuSheet({ tokens, conta, onClose, onEdit, onViewMovements, onSync, onDisconnect, onDelete }) {
  if (!conta) return null;
  const synced = isSyncedConta(conta);
  return (
    <BottomSheet visible onClose={onClose} title={conta.nome} tokens={tokens}>
      <View style={styles.actions}>
        <SheetAction tokens={tokens} icon="create-outline" label="Editar conta" onPress={() => onEdit(conta)} />
        <SheetAction tokens={tokens} icon="list-outline" label="Ver movimentações" onPress={() => onViewMovements(conta)} />
        {synced ? (
          <>
            <SheetAction tokens={tokens} icon="refresh-outline" label="Atualizar extrato" onPress={() => onSync(conta)} />
            <SheetAction tokens={tokens} icon="unlink-outline" label="Desconectar banco" onPress={() => onDisconnect(conta)} />
          </>
        ) : null}
        <SheetAction tokens={tokens} icon="trash-outline" label="Excluir conta" tone="danger" onPress={() => onDelete(conta)} />
      </View>
    </BottomSheet>
  );
}

/** Confirmação de ação destrutiva; enquanto roda, não fecha nem repete. */
export function ContaConfirmSheet({
  tokens,
  title,
  message,
  confirmLabel,
  confirmIcon = 'trash-outline',
  busyLabel,
  busy,
  error,
  onConfirm,
  onClose,
}) {
  return (
    <BottomSheet visible onClose={busy ? () => {} : onClose} title={title} tokens={tokens}>
      <Text style={[styles.text, { color: tokens.textSecondary }]}>{message}</Text>
      {error ? (
        <Text style={[styles.text, { color: tokens.expense }]} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
      {busy ? (
        <View style={styles.busy} accessibilityRole="progressbar" accessibilityLabel={busyLabel}>
          <ActivityIndicator color={tokens.expense} />
          <Text style={[styles.text, { color: tokens.textSecondary }]}>{busyLabel}</Text>
        </View>
      ) : (
        <View style={styles.actions}>
          <SheetAction tokens={tokens} icon={confirmIcon} label={confirmLabel} tone="danger" onPress={onConfirm} />
          <SheetAction tokens={tokens} icon="close-outline" label="Cancelar" onPress={onClose} />
        </View>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  actions: { gap: 2 },
  text: { fontSize: 14, lineHeight: 20 },
  busy: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48 },
});
