import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { formatIsoDayBr } from '@/lib/finance/contaGlobalScreen';
import { BottomSheet, SheetAction } from '../Transactions/BottomSheet';

export function MoedaMenuSheet({ tokens, row, onClose, onUpdateBalance, onEdit, onDelete }) {
  if (!row) return null;
  return (
    <BottomSheet visible onClose={onClose} title={row.label} tokens={tokens}>
      <View style={styles.actions}>
        <SheetAction tokens={tokens} icon="cash-outline" label="Atualizar saldo" onPress={() => onUpdateBalance(row)} />
        <SheetAction tokens={tokens} icon="create-outline" label="Editar moeda e apelido" onPress={() => onEdit(row)} />
        <SheetAction tokens={tokens} icon="trash-outline" label="Excluir" tone="danger" onPress={() => onDelete(row)} />
      </View>
    </BottomSheet>
  );
}

function Paragraph({ tokens, children }) {
  return <Text style={[styles.text, { color: tokens.textSecondary }]}>{children}</Text>;
}

/** Explica a conversão; datas só quando o servidor informa a data da cotação. */
export function AboutConversionSheet({ tokens, sources, onClose }) {
  const dated = (sources || []).filter((s) => s.date && s.codes?.length);
  return (
    <BottomSheet visible onClose={onClose} title="Sobre a conversão" tokens={tokens}>
      <View style={styles.about}>
        <Paragraph tokens={tokens}>
          O valor em reais é uma referência: cada saldo é multiplicado pela cotação consultada pelo servidor do Meu
          Financeiro (Frankfurter, com dados do Banco Central Europeu, e ExchangeRate-API como reserva).
        </Paragraph>
        <Paragraph tokens={tokens}>
          O saldo original na moeda não muda. O cálculo usa a cotação completa e só arredonda na hora de mostrar.
        </Paragraph>
        <Paragraph tokens={tokens}>
          Esses valores não entram no saldo da Visão geral. A Conta global não compra moeda nem se conecta a Wise,
          PayPal ou outros serviços: você mesmo atualiza os saldos.
        </Paragraph>
        {dated.length ? (
          <View style={[styles.sources, { borderColor: tokens.cardBorder }]}>
            {dated.map((s) => (
              <Text key={`${s.name}-${s.date}`} style={[styles.source, { color: tokens.text }]}>
                {s.name || 'Cotação'} — {formatIsoDayBr(s.date)} ({s.codes.join(', ')})
              </Text>
            ))}
          </View>
        ) : null}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  actions: { paddingHorizontal: 12, paddingBottom: 8 },
  about: { paddingHorizontal: 20, paddingBottom: 12, gap: 12 },
  text: { fontSize: 15, lineHeight: 22 },
  sources: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 12, gap: 6 },
  source: { fontSize: 14, fontWeight: '600' },
});
