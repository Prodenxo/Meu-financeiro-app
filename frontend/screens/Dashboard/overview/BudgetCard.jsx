import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MfSegmented } from '@/components/ui/MfSegmented';
import { getCategoryIconName } from '@/lib/categoryIcons';
import { budgetTone } from '@/lib/finance/dashboard';
import { formatBrl } from '@/lib/finance/format';
import { EmptyNote, SectionCard } from './SectionCard';
import { TOUCH_MIN, toneColors } from './overviewTokens';

const LABELS = {
  saida: { success: 'Dentro do orçamento', warning: 'Atenção', orange: 'Cuidado', danger: 'Alerta' },
  entrada: { success: 'OK', warning: 'Atenção', orange: 'Cuidado', danger: 'Alerta' },
};

const MAX_ITEMS = 6;

/** Orçamento por categoria com alternância Entrada/Saída e faixas OK · Atenção · Cuidado · Alerta. */
export function BudgetCard({ tokens, budgets, status, error, onRetry, onOpenBudgets }) {
  const [tab, setTab] = useState('saida');

  const items = useMemo(() => {
    const list = budgets.filter((b) => b.tipo === tab);
    return list.sort((a, b) => (tab === 'entrada' ? a.percentual - b.percentual : b.percentual - a.percentual));
  }, [budgets, tab]);

  const visible = items.slice(0, MAX_ITEMS);

  return (
    <SectionCard
      tokens={tokens}
      title="Orçamento por categoria"
      icon="bar-chart-outline"
      actionLabel={items.length > 0 ? 'Ver todos' : undefined}
      onAction={onOpenBudgets}
    >
      <MfSegmented
        options={[
          { key: 'entrada', label: 'Entrada', tone: 'income' },
          { key: 'saida', label: 'Saída', tone: 'expense' },
        ]}
        value={tab}
        onChange={setTab}
      />

      {status === 'loading' && budgets.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator color={tokens.primary} />
        </View>
      ) : status === 'error' ? (
        <View style={styles.center}>
          <Text style={[styles.errorText, { color: tokens.textSecondary }]}>
            {error?.message || 'Não foi possível carregar os orçamentos.'}
          </Text>
          <Pressable onPress={onRetry} accessibilityRole="button" style={styles.retry}>
            <Text style={[styles.retryText, { color: tokens.primary }]}>Tentar de novo</Text>
          </Pressable>
        </View>
      ) : visible.length === 0 ? (
        <View>
          <EmptyNote
            tokens={tokens}
            text={`Nenhum orçamento de ${tab === 'entrada' ? 'entrada' : 'saída'} neste mês`}
            hint="Defina valores em Orçamentos para ver OK, Atenção e Alerta aqui."
          />
          <Pressable onPress={onOpenBudgets} accessibilityRole="button" style={styles.retry}>
            <Text style={[styles.retryText, { color: tokens.primary }]}>Ir para Orçamentos</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.list}>
          {visible.map((item) => {
            const tone = budgetTone(item);
            const { fg, bg } = toneColors(tokens, tone);
            const pct = Math.max(0, Math.min(100, item.percentual));
            const label = LABELS[tab][tone];
            return (
              <View
                key={String(item.categorias_id)}
                style={styles.item}
                accessible
                accessibilityLabel={`${item.nome}: ${formatBrl(item.realizado)} de ${formatBrl(item.orcado)}. ${label}`}
              >
                <View style={[styles.catIcon, { backgroundColor: tokens.primarySoft }]}>
                  <Ionicons name={getCategoryIconName(item.nome)} size={18} color={tokens.primary} />
                </View>
                <View style={styles.itemBody}>
                  <View style={styles.itemTop}>
                    <Text style={[styles.itemName, { color: tokens.text }]} numberOfLines={1}>
                      {item.nome}
                    </Text>
                    <View style={[styles.pill, { backgroundColor: bg }]}>
                      <Text style={[styles.pillText, { color: fg }]}>{label}</Text>
                    </View>
                  </View>
                  <Text style={[styles.itemValues, { color: tokens.textSecondary }]}>
                    {formatBrl(item.realizado)} / {formatBrl(item.orcado)}
                  </Text>
                  <View style={[styles.track, { backgroundColor: tokens.track }]}>
                    <View style={[styles.fill, { width: `${pct}%`, backgroundColor: fg }]} />
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
  center: { paddingVertical: 16, alignItems: 'center', gap: 8 },
  errorText: { fontSize: 14, textAlign: 'center' },
  retry: { minHeight: TOUCH_MIN, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  retryText: { fontSize: 14, fontWeight: '700' },
  list: { gap: 14 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  catIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  itemBody: { flex: 1, minWidth: 0, gap: 4 },
  itemTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  itemName: { flex: 1, fontSize: 14, fontWeight: '700' },
  pill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  pillText: { fontSize: 11, fontWeight: '700' },
  itemValues: { fontSize: 13 },
  track: { height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3 },
});
