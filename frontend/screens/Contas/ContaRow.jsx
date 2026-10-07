import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BankLogo } from '@/components/contas/BankLogo';
import { resolveBankVisual } from '@/lib/finance/bankCatalog';
import { formatBrl } from '@/lib/finance/format';
import { formatSaldo, HIDDEN_VALUE, isSyncedConta, saldoAccessibilityLabel } from '@/lib/finance/contasScreen';
import { TOUCH_MIN } from '../Dashboard/overview/overviewTokens';

function Pill({ label, color, background }) {
  return (
    <View style={[styles.pill, { backgroundColor: background }]}>
      <Text style={[styles.pillText, { color }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

/**
 * Linha da lista agrupada: logo · nome + "Padrão" · tipo · saldo · ⋮.
 * `stacked`: tela estreita ou fonte grande — o saldo desce para a linha de baixo e nunca é cortado.
 */
export const ContaRow = memo(function ContaRow({ row, tokens, hidden, stacked, onOpenMenu }) {
  const { conta, isDefault, saldo, tipoLabel } = row;
  const negative = saldo < 0;
  const synced = isSyncedConta(conta);
  const saldoText = hidden ? HIDDEN_VALUE : formatSaldo(saldo);
  const limite =
    conta.tipo === 'cartao_credito' && conta.limite_credito != null && !hidden
      ? ` · Limite ${formatBrl(conta.limite_credito)}`
      : '';
  const a11y = [
    conta.nome,
    isDefault ? 'conta padrão' : null,
    synced ? 'sincronizada' : null,
    tipoLabel,
    saldoAccessibilityLabel(saldo, hidden),
  ]
    .filter(Boolean)
    .join(', ');

  const saldoNode = (
    <Text
      style={[styles.saldo, stacked && styles.saldoStacked, { color: negative && !hidden ? tokens.expense : tokens.text }]}
      numberOfLines={1}
    >
      {saldoText}
    </Text>
  );

  return (
    <View style={styles.row}>
      <View style={styles.main} accessible accessibilityLabel={a11y}>
        <BankLogo visual={resolveBankVisual(conta)} size={40} />
        <View style={styles.texts}>
          <View style={styles.nameLine}>
            <Text style={[styles.name, { color: tokens.text }]} numberOfLines={2}>
              {conta.nome}
            </Text>
            {isDefault ? <Pill label="Padrão" color={tokens.primary} background={tokens.primarySoft} /> : null}
            {synced ? <Pill label="Sincronizada" color={tokens.income} background={tokens.incomeSoft} /> : null}
          </View>
          <Text style={[styles.tipo, { color: tokens.textSecondary }]} numberOfLines={2}>
            {tipoLabel}
            {limite}
          </Text>
          {stacked ? saldoNode : null}
        </View>
        {stacked ? null : saldoNode}
      </View>
      <Pressable
        onPress={() => onOpenMenu(row)}
        accessibilityRole="button"
        accessibilityLabel={`Ações da conta ${conta.nome}`}
        hitSlop={4}
        style={({ pressed }) => [styles.menuBtn, pressed && { backgroundColor: tokens.track }]}
      >
        <Ionicons name="ellipsis-vertical" size={18} color={tokens.textSecondary} />
      </Pressable>
    </View>
  );
});

/** Lista branca única com divisórias discretas (sem cartões grandes por conta). */
export function ContasList({ rows, tokens, hidden, stacked, onOpenMenu }) {
  return (
    <View style={[styles.group, { backgroundColor: tokens.card, borderColor: tokens.cardBorder }, tokens.shadow]}>
      {rows.map((row, index) => (
        <View key={row.conta.id}>
          {index > 0 ? <View style={[styles.divider, { backgroundColor: tokens.cardBorder }]} /> : null}
          <ContaRow row={row} tokens={tokens} hidden={hidden} stacked={stacked} onOpenMenu={onOpenMenu} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 68 },
  row: { flexDirection: 'row', alignItems: 'center', paddingLeft: 14, paddingRight: 4, minHeight: 72 },
  main: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12 },
  texts: { flex: 1, gap: 3 },
  nameLine: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  name: { fontSize: 15, fontWeight: '700', flexShrink: 1 },
  pill: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  pillText: { fontSize: 11, fontWeight: '700' },
  tipo: { fontSize: 13 },
  saldo: { fontSize: 15, fontWeight: '700', flexShrink: 0, textAlign: 'right', fontVariant: ['tabular-nums'] },
  saldoStacked: { textAlign: 'left', marginTop: 2 },
  menuBtn: { width: TOUCH_MIN, height: TOUCH_MIN, borderRadius: TOUCH_MIN / 2, alignItems: 'center', justifyContent: 'center' },
});
