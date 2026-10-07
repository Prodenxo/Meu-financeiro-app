import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';
import { formatAxisBrl, formatBrl } from '@/lib/finance/format';
import { EmptyNote, SectionCard } from './SectionCard';

const HEIGHT = 160;
const PAD = { top: 12, bottom: 12, left: 4, right: 4 };

function buildPaths(series, width) {
  const values = series.map((p) => p.saldo);
  const min = Math.min(0, ...values);
  const max = Math.max(0, ...values);
  const span = max - min || 1;
  const innerW = width - PAD.left - PAD.right;
  const innerH = HEIGHT - PAD.top - PAD.bottom;
  const x = (i) => PAD.left + (series.length === 1 ? innerW / 2 : (i / (series.length - 1)) * innerW);
  const y = (v) => PAD.top + (1 - (v - min) / span) * innerH;
  const points = series.map((p, i) => [x(i), y(p.saldo)]);
  const line = points.map(([px, py], i) => `${i === 0 ? 'M' : 'L'}${px.toFixed(1)},${py.toFixed(1)}`).join(' ');
  const zeroY = y(0);
  const area = `${line} L${points[points.length - 1][0].toFixed(1)},${zeroY.toFixed(1)} L${points[0][0].toFixed(1)},${zeroY.toFixed(1)} Z`;
  return { line, area, zeroY, last: points[points.length - 1] };
}

/** Evolução do saldo no mês (acumulado dos lançamentos pagos/recebidos, 1 ponto por dia). */
export function SaldoChartCard({ tokens, series }) {
  const [width, setWidth] = useState(0);
  const paths = useMemo(
    () => (width > 0 && series.length > 1 ? buildPaths(series, width) : null),
    [series, width],
  );
  const values = series.map((p) => p.saldo);
  const final = values.length ? values[values.length - 1] : 0;
  const stroke = final >= 0 ? tokens.primary : tokens.expense;

  return (
    <SectionCard tokens={tokens} title="Saldo no mês" icon="trending-up-outline">
      {series.length < 2 ? (
        <EmptyNote tokens={tokens} text="Ainda não há movimentação suficiente para o gráfico deste mês." />
      ) : (
        <>
          <Text style={[styles.final, { color: final >= 0 ? tokens.text : tokens.expense }]}>{formatBrl(final)}</Text>
          <View
            style={styles.chart}
            onLayout={(e) => setWidth(Math.floor(e.nativeEvent.layout.width))}
            accessible
            accessibilityLabel={`Gráfico do saldo no mês: de ${formatBrl(values[0])} em ${series[0].label} até ${formatBrl(final)} em ${series[series.length - 1].label}`}
          >
            {paths ? (
              <Svg width={width} height={HEIGHT}>
                <Defs>
                  <LinearGradient id="saldoArea" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor={stroke} stopOpacity={0.22} />
                    <Stop offset="1" stopColor={stroke} stopOpacity={0} />
                  </LinearGradient>
                </Defs>
                <Line
                  x1={PAD.left}
                  x2={width - PAD.right}
                  y1={paths.zeroY}
                  y2={paths.zeroY}
                  stroke={tokens.track}
                  strokeDasharray="4 6"
                />
                <Path d={paths.area} fill="url(#saldoArea)" />
                <Path d={paths.line} stroke={stroke} strokeWidth={2.5} fill="none" strokeLinejoin="round" />
                <Circle cx={paths.last[0]} cy={paths.last[1]} r={4} fill={stroke} />
              </Svg>
            ) : null}
          </View>
          <View style={styles.axis}>
            <Text style={[styles.axisText, { color: tokens.textTertiary }]}>{series[0].label}</Text>
            <Text style={[styles.axisText, { color: tokens.textTertiary }]}>{series[series.length - 1].label}</Text>
          </View>
          <View style={styles.stats}>
            <Stat tokens={tokens} label="Menor" value={formatAxisBrl(Math.min(...values))} />
            <Stat tokens={tokens} label="Maior" value={formatAxisBrl(Math.max(...values))} />
            <Stat tokens={tokens} label="Dias com movimento" value={String(series.length)} />
          </View>
        </>
      )}
    </SectionCard>
  );
}

function Stat({ tokens, label, value }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statLabel, { color: tokens.textTertiary }]}>{label}</Text>
      <Text style={[styles.statValue, { color: tokens.text }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  final: { fontSize: 22, fontWeight: '800', marginTop: -4 },
  chart: { height: HEIGHT, width: '100%' },
  axis: { flexDirection: 'row', justifyContent: 'space-between' },
  axisText: { fontSize: 11 },
  stats: { flexDirection: 'row', gap: 8 },
  stat: { flex: 1, gap: 2 },
  statLabel: { fontSize: 11 },
  statValue: { fontSize: 14, fontWeight: '700' },
});
