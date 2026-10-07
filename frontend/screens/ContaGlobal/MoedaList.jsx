import React from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatBrl } from '@/lib/finance/format';
import { formatMoedaComCodigo } from '@/lib/finance/moedas';
import { formatIsoDayBr } from '@/lib/finance/contaGlobalScreen';
import { OVERVIEW_RADIUS, TOUCH_MIN } from '../Dashboard/overview/overviewTokens';
import { MoedaFlag } from './MoedaFlag';

function rowA11y(row) {
  const brl = row.valorBrl != null ? `, aproximadamente ${formatBrl(row.valorBrl)}` : ', sem cotação';
  return `${row.nomeMoeda}${row.nome ? `, ${row.nome}` : ''}: ${formatMoedaComCodigo(row.valor, row.moeda)}${brl}`;
}

function MoedaRow({ tokens, row, stacked, ratesLoading, onOpenMenu }) {
  const converted =
    row.valorBrl != null ? `≈ ${formatBrl(row.valorBrl)}` : ratesLoading ? 'Consultando…' : 'Sem cotação';
  return (
    <View style={styles.row}>
      <View style={styles.main} accessible accessibilityLabel={rowA11y(row)}>
        <MoedaFlag moeda={row.moeda} size={40} t={tokens} />
        <View style={[styles.body, stacked && styles.bodyStacked]}>
          <View style={styles.names}>
            <Text style={[styles.code, { color: tokens.text }]} numberOfLines={1}>
              {row.moeda}
              <Text style={[styles.currencyName, { color: tokens.textSecondary }]}> · {row.nomeMoeda}</Text>
            </Text>
            {row.nome ? (
              <Text style={[styles.apelido, { color: tokens.textSecondary }]} numberOfLines={1}>
                {row.nome}
              </Text>
            ) : null}
            {row.rateLabel ? (
              <Text style={[styles.rate, { color: tokens.textTertiary }]} numberOfLines={1}>
                {row.rateLabel}
              </Text>
            ) : null}
            {row.rateIsOld ? (
              <Text style={[styles.oldBadge, { color: tokens.warning, backgroundColor: tokens.warningSoft }]}>
                Cotação de {formatIsoDayBr(row.rateDate)}
              </Text>
            ) : null}
          </View>
          <View style={[styles.amounts, stacked && styles.amountsStacked]}>
            <Text style={[styles.original, { color: tokens.text }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
              {formatMoedaComCodigo(row.valor, row.moeda)}
            </Text>
            <Text
              style={[
                styles.converted,
                { color: row.valorBrl != null ? tokens.textSecondary : ratesLoading ? tokens.textTertiary : tokens.warning },
              ]}
              numberOfLines={1}
            >
              {converted}
            </Text>
          </View>
        </View>
      </View>
      <Pressable
        onPress={() => onOpenMenu(row)}
        accessibilityRole="button"
        accessibilityLabel={`Ações do saldo ${row.label}`}
        hitSlop={4}
        style={({ pressed }) => [styles.menuBtn, pressed && { backgroundColor: tokens.track }]}
      >
        <Ionicons name="ellipsis-vertical" size={20} color={tokens.textSecondary} />
      </Pressable>
    </View>
  );
}

export function MoedaList({ tokens, rows, ratesLoading, onOpenMenu }) {
  const { width, fontScale } = useWindowDimensions();
  const stacked = width < 360 || fontScale > 1.3;
  return (
    <View style={[styles.group, { backgroundColor: tokens.card, borderColor: tokens.cardBorder }, tokens.shadow]}>
      {rows.map((row, i) => (
        <View key={row.id}>
          {i > 0 ? <View style={[styles.divider, { backgroundColor: tokens.cardBorder }]} /> : null}
          <MoedaRow tokens={tokens} row={row} stacked={stacked} ratesLoading={ratesLoading} onOpenMenu={onOpenMenu} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { borderRadius: OVERVIEW_RADIUS, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 4 },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 52 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 4 },
  main: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 12, minWidth: 0 },
  body: { flex: 1, flexDirection: 'row', gap: 10, minWidth: 0 },
  bodyStacked: { flexDirection: 'column', gap: 6 },
  names: { flex: 1, minWidth: 0, gap: 2 },
  code: { fontSize: 16, fontWeight: '800' },
  currencyName: { fontSize: 14, fontWeight: '500' },
  apelido: { fontSize: 14 },
  rate: { fontSize: 12, fontVariant: ['tabular-nums'] },
  oldBadge: {
    alignSelf: 'flex-start',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
    marginTop: 2,
  },
  amounts: { alignItems: 'flex-end', maxWidth: '48%', gap: 2 },
  amountsStacked: { alignItems: 'flex-start', maxWidth: '100%' },
  original: { fontSize: 16, fontWeight: '700', fontVariant: ['tabular-nums'] },
  converted: { fontSize: 13, fontVariant: ['tabular-nums'] },
  menuBtn: {
    width: TOUCH_MIN,
    height: TOUCH_MIN,
    borderRadius: TOUCH_MIN / 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -8,
  },
});
