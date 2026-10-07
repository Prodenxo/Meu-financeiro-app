import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { formatBrl } from '@/lib/finance/format';
import { normalizarValor } from '@/lib/finance/normalize';
import { BottomSheet, SheetAction } from './BottomSheet';

/** Confirmação de exclusão; lançamento recorrente escolhe o alcance (como no site). */
export function DeleteTransactionSheet({ tokens, item, deleting, onConfirm, onClose }) {
  if (!item) return null;
  const recurring = Boolean(item.recorrencia_id);
  const name = item.classificacao || 'Sem categoria';
  return (
    <BottomSheet
      visible
      onClose={deleting ? () => {} : onClose}
      title={recurring ? 'Excluir lançamento recorrente' : 'Excluir transação'}
      tokens={tokens}
    >
      <Text style={[styles.text, { color: tokens.textSecondary }]}>
        {name} · {formatBrl(normalizarValor(item.valor))}. Essa ação não pode ser desfeita.
      </Text>
      {deleting ? (
        <View style={styles.busy} accessibilityRole="progressbar" accessibilityLabel="Excluindo">
          <ActivityIndicator color={tokens.expense} />
          <Text style={[styles.text, { color: tokens.textSecondary }]}>Excluindo…</Text>
        </View>
      ) : recurring ? (
        <View style={styles.actions}>
          <SheetAction tokens={tokens} icon="remove-circle-outline" label="Apenas este lançamento" tone="danger" onPress={() => onConfirm('este')} />
          <SheetAction tokens={tokens} icon="play-skip-forward-outline" label="Este e os futuros" tone="danger" onPress={() => onConfirm('futuros')} />
          <SheetAction tokens={tokens} icon="trash-outline" label="Toda a recorrência" tone="danger" onPress={() => onConfirm('todos')} />
          <SheetAction tokens={tokens} icon="close-outline" label="Cancelar" onPress={onClose} />
        </View>
      ) : (
        <View style={styles.actions}>
          <SheetAction tokens={tokens} icon="trash-outline" label="Excluir" tone="danger" onPress={() => onConfirm('este')} />
          <SheetAction tokens={tokens} icon="close-outline" label="Cancelar" onPress={onClose} />
        </View>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  text: { fontSize: 14, lineHeight: 20 },
  actions: { gap: 2 },
  busy: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48 },
});
