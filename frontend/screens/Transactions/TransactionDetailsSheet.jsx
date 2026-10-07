import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { formatBrl, formatSignedBrl } from '@/lib/finance/format';
import { normalizarTipo, normalizarValor } from '@/lib/finance/normalize';
import { formatDayKeyBr } from '@/lib/finance/transactions';
import { isProjecao } from '@/lib/finance/recorrencias';
import {
  formatDayHeader,
  isEntrada,
  isPendingTransaction,
  markPaidLabel,
  transactionStatusLabel,
} from '@/lib/finance/transactionsScreen';
import { BottomSheet, SheetAction } from './BottomSheet';

function DetailRow({ tokens, label, value }) {
  return (
    <View style={[styles.detailRow, { borderBottomColor: tokens.cardBorder }]}>
      <Text style={[styles.detailLabel, { color: tokens.textSecondary }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: tokens.text }]}>{value}</Text>
    </View>
  );
}

/**
 * Detalhes do lançamento com as ações disponíveis. `mode='menu'` mostra só as ações (botão ⋯).
 */
export function TransactionDetailsSheet({
  tokens,
  item,
  mode,
  contaNameById,
  onClose,
  onEdit,
  onDuplicate,
  onMarkPaid,
  onLaunch,
  onDelete,
}) {
  if (!item) return null;
  const projection = isProjecao(item);
  const pending = isPendingTransaction(item);
  const entrada = isEntrada(item);
  const dayKey = String(item.data || item.criado_em || '').slice(0, 10);
  const conta = item.conta_id ? contaNameById[item.conta_id] || 'Conta removida' : 'Sem conta';
  const title = item.classificacao || 'Sem categoria';
  const showDetails = mode !== 'menu';

  return (
    <BottomSheet visible onClose={onClose} title={title} tokens={tokens}>
      {showDetails ? (
        <>
          <Text
            style={[styles.value, { color: entrada ? tokens.income : tokens.expense }]}
            accessibilityLabel={`Valor ${formatBrl(normalizarValor(item.valor))}`}
          >
            {formatSignedBrl(normalizarValor(item.valor), normalizarTipo(item.tipo))}
          </Text>
          <View>
            <DetailRow tokens={tokens} label="Tipo" value={entrada ? 'Entrada' : 'Saída'} />
            <DetailRow tokens={tokens} label="Situação" value={projection ? 'Prevista (recorrência)' : transactionStatusLabel(item)} />
            <DetailRow
              tokens={tokens}
              label="Data"
              value={dayKey ? `${formatDayKeyBr(dayKey)} · ${formatDayHeader(dayKey).split(' • ')[1] || ''}` : '—'}
            />
            <DetailRow tokens={tokens} label="Categoria" value={title} />
            <DetailRow tokens={tokens} label="Conta" value={conta} />
            {item.recorrencia_id ? <DetailRow tokens={tokens} label="Recorrência" value="Repete todo mês" /> : null}
            <DetailRow tokens={tokens} label="Observação" value={item.obs ? String(item.obs) : '—'} />
          </View>
          {projection ? (
            <Text style={[styles.note, { color: tokens.textTertiary }]}>
              Esta é uma previsão da recorrência: ainda não entra nos totais. Lance agora para registrar.
            </Text>
          ) : null}
        </>
      ) : null}

      <View style={styles.actions}>
        {projection ? (
          <SheetAction tokens={tokens} icon="add-circle-outline" label="Lançar agora" tone="accent" onPress={() => onLaunch(item)} />
        ) : (
          <>
            {pending ? (
              <SheetAction
                tokens={tokens}
                icon="checkmark-circle-outline"
                label={markPaidLabel(item)}
                tone="accent"
                onPress={() => onMarkPaid(item)}
              />
            ) : null}
            <SheetAction tokens={tokens} icon="create-outline" label="Editar" onPress={() => onEdit(item)} />
            <SheetAction tokens={tokens} icon="copy-outline" label="Duplicar" onPress={() => onDuplicate(item)} />
            <SheetAction tokens={tokens} icon="trash-outline" label="Excluir" tone="danger" onPress={() => onDelete(item)} />
          </>
        )}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  value: { fontSize: 28, fontWeight: '800', letterSpacing: -0.4 },
  detailRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  detailLabel: { fontSize: 14 },
  detailValue: { fontSize: 14, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  note: { fontSize: 13, lineHeight: 18 },
  actions: { gap: 2, marginTop: 4 },
});
