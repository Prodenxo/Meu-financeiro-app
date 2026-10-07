import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MfSegmented } from '@/components/ui/MfSegmented';
import { getCategoryIconName } from '@/lib/categoryIcons';
import { formatBrl } from '@/lib/finance/format';
import { EmptyNote, SectionCard } from './SectionCard';

const MAX_ITEMS = 6;

/** Despesas do mês por categoria, separadas em Pagos e A pagar. */
export function ExpensesCard({ tokens, expenses }) {
  const [tab, setTab] = useState('pagos');
  const list = tab === 'pagos' ? expenses.pagos : expenses.aPagar;
  const total = tab === 'pagos' ? expenses.totalPagos : expenses.totalAPagar;

  return (
    <SectionCard tokens={tokens} title="Movimentações do mês" icon="pie-chart-outline">
      <MfSegmented
        options={[
          { key: 'pagos', label: 'Pagos', tone: 'expense' },
          { key: 'a_pagar', label: 'A pagar', tone: 'pending' },
        ]}
        value={tab}
        onChange={setTab}
      />
      <Text style={[styles.total, { color: tokens.textSecondary }]}>
        Total {tab === 'pagos' ? 'pago' : 'a pagar'}: {formatBrl(total)}
      </Text>
      {list.length === 0 ? (
        <EmptyNote
          tokens={tokens}
          text={tab === 'pagos' ? 'Nenhuma despesa paga neste mês.' : 'Nenhuma despesa a pagar neste mês.'}
        />
      ) : (
        <View style={styles.list}>
          {list.slice(0, MAX_ITEMS).map((item) => {
            const share = total > 0 ? (item.total / total) * 100 : 0;
            const color = tab === 'pagos' ? tokens.expense : tokens.warning;
            return (
              <View
                key={item.key}
                style={styles.item}
                accessible
                accessibilityLabel={`${item.nome}: ${formatBrl(item.total)}, ${Math.round(share)}% do total`}
              >
                <View style={[styles.icon, { backgroundColor: tokens.primarySoft }]}>
                  <Ionicons name={getCategoryIconName(item.nome)} size={16} color={tokens.primary} />
                </View>
                <View style={styles.body}>
                  <View style={styles.top}>
                    <Text style={[styles.name, { color: tokens.text }]} numberOfLines={1}>
                      {item.nome}
                    </Text>
                    <Text style={[styles.value, { color: tokens.text }]}>{formatBrl(item.total)}</Text>
                  </View>
                  <View style={[styles.track, { backgroundColor: tokens.track }]}>
                    <View style={[styles.fill, { width: `${Math.min(100, share)}%`, backgroundColor: color }]} />
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  total: { fontSize: 13, fontWeight: '600' },
  list: { gap: 12 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, minWidth: 0, gap: 6 },
  top: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  name: { flex: 1, fontSize: 14, fontWeight: '600' },
  value: { fontSize: 14, fontWeight: '700' },
  track: { height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3 },
});
