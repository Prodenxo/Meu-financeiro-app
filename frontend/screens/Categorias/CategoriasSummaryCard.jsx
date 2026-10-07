import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { formatBrl } from '@/lib/finance/format';
import { formatShare } from '@/lib/finance/categoriasScreen';
import { OVERVIEW_RADIUS } from '../Dashboard/overview/overviewTokens';

/** Cor neutra (sobre o azul-marinho) para "Sem categoria" e "Outras". */
const NEUTRAL_ON_NAVY = 'rgba(255, 255, 255, 0.55)';

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

/** Total do tipo no mês, quantas categorias tiveram lançamento e a distribuição entre elas. */
export function CategoriasSummaryCard({ tokens, viewTipo, total, withMovement, distribution }) {
  const isSaida = viewTipo === 'saida';
  const label = isSaida ? 'Total de saídas' : 'Total de entradas';
  const countText =
    withMovement > 0
      ? `${plural(withMovement, 'categoria', 'categorias')} com movimento`
      : isSaida
        ? 'Nenhuma saída neste mês'
        : 'Nenhuma entrada neste mês';
  const a11ySlices = distribution.map((s) => `${s.nome} ${formatShare(s.pct)}`).join(', ');

  return (
    <View
      style={[styles.card, { backgroundColor: tokens.navy }, tokens.shadow]}
      accessible
      accessibilityLabel={`${label}: ${formatBrl(total)}. ${countText}.${a11ySlices ? ` Distribuição: ${a11ySlices}.` : ''}`}
    >
      <Text style={[styles.label, { color: tokens.onNavySoft }]}>{label.toUpperCase()}</Text>
      <Text style={[styles.total, { color: tokens.onNavy }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
        {formatBrl(total)}
      </Text>
      <Text style={[styles.count, { color: tokens.onNavySoft }]}>{countText}</Text>

      <View style={styles.track}>
        {distribution.map((s, i) => (
          <View
            key={s.id}
            style={{
              width: `${s.width}%`,
              backgroundColor: s.color || NEUTRAL_ON_NAVY,
              marginLeft: i === 0 ? 0 : 2,
            }}
          />
        ))}
      </View>

      {distribution.length > 0 ? (
        <View style={styles.legend}>
          {distribution.map((s) => (
            <View key={s.id} style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: s.color || NEUTRAL_ON_NAVY }]} />
              <Text style={[styles.legendName, { color: tokens.onNavySoft }]} numberOfLines={1}>
                {s.nome}
              </Text>
              <Text style={[styles.legendPct, { color: tokens.onNavy }]}>{formatShare(s.pct)}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: OVERVIEW_RADIUS, padding: 20, gap: 6 },
  label: { fontSize: 12, fontWeight: '700', letterSpacing: 1.2 },
  total: { fontSize: 32, fontWeight: '800', letterSpacing: -0.5, fontVariant: ['tabular-nums'] },
  count: { fontSize: 14 },
  track: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    marginTop: 10,
  },
  legend: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 16, rowGap: 6, marginTop: 6 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6, maxWidth: '100%' },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendName: { fontSize: 14, flexShrink: 1 },
  legendPct: { fontSize: 14, fontWeight: '700', fontVariant: ['tabular-nums'] },
});
