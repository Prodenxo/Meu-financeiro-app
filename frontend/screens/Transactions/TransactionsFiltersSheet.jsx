import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MfDateField } from '@/components/ui/MfDateField';
import { PERIOD_PRESETS, SORT_OPTIONS, isValidDateRange } from '@/lib/finance/transactions';
import { BottomSheet } from './BottomSheet';

function Option({ tokens, label, selected, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      style={({ pressed }) => [
        styles.option,
        selected
          ? { backgroundColor: tokens.primarySoft, borderColor: tokens.primary }
          : { backgroundColor: tokens.card, borderColor: tokens.cardBorder },
        pressed && { opacity: 0.8 },
      ]}
    >
      <Text style={[styles.optionText, { color: selected ? tokens.primary : tokens.text }]}>{label}</Text>
    </Pressable>
  );
}

function Section({ tokens, title, children }) {
  return (
    <View style={styles.section} accessibilityRole="radiogroup" accessibilityLabel={title}>
      <Text style={[styles.sectionTitle, { color: tokens.textSecondary }]}>{title}</Text>
      <View style={styles.options}>{children}</View>
    </View>
  );
}

const TYPE_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'entrada', label: 'Entradas' },
  { value: 'saida', label: 'Saídas' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todas' },
  { value: 'pago', label: 'Pagas/recebidas' },
  { value: 'pendente', label: 'Pendentes' },
];

const PERIOD_LABELS = { Hoje: 'Hoje', 'Essa semana': 'Esta semana', 'Esse mês': 'Mês' };

/** `section`: 'all' (botão de filtros), 'period' (calendário) ou 'sort' (ordenação). */
export function TransactionsFiltersSheet({
  tokens,
  section,
  filters,
  sort,
  contas,
  categories,
  onChange,
  onSort,
  onClear,
  onClose,
}) {
  const showAll = section === 'all';
  const customActive = Boolean(filters.dateRange.start || filters.dateRange.end);
  const rangeComplete = Boolean(filters.dateRange.start && filters.dateRange.end);
  const rangeInvalid = rangeComplete && !isValidDateRange(filters.dateRange);

  const categoryNames = useMemo(() => {
    const names = new Map();
    for (const c of categories || []) {
      const key = c.nome.trim().toLowerCase();
      if (!names.has(key)) names.set(key, c.nome.trim());
    }
    return [...names.values()].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [categories]);

  const title = section === 'period' ? 'Período' : section === 'sort' ? 'Ordenar por' : 'Filtros';

  return (
    <BottomSheet
      visible
      onClose={onClose}
      title={title}
      tokens={tokens}
      footer={
        <View style={styles.footerRow}>
          {showAll ? (
            <Pressable
              onPress={onClear}
              accessibilityRole="button"
              style={({ pressed }) => [styles.secondaryBtn, { borderColor: tokens.cardBorder }, pressed && { opacity: 0.7 }]}
            >
              <Text style={[styles.secondaryText, { color: tokens.text }]}>Limpar filtros</Text>
            </Pressable>
          ) : null}
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            style={({ pressed }) => [styles.primaryBtn, { backgroundColor: tokens.primary }, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.primaryText}>Ver resultados</Text>
          </Pressable>
        </View>
      }
    >
      {showAll || section === 'period' ? (
        <Section tokens={tokens} title="Período">
          {PERIOD_PRESETS.map((p) => (
            <Option
              key={p}
              tokens={tokens}
              label={PERIOD_LABELS[p] || p}
              selected={!customActive && filters.period === p}
              onPress={() => onChange({ period: p, dateRange: { start: '', end: '' } })}
            />
          ))}
          <View style={styles.rangeWrap}>
            <Text style={[styles.rangeTitle, { color: tokens.text }]}>Personalizado</Text>
            <View style={styles.rangeRow}>
              <View style={styles.rangeField}>
                <MfDateField
                  value={filters.dateRange.start}
                  onChange={(iso) => onChange({ dateRange: { ...filters.dateRange, start: iso || '' } })}
                  accessibilityLabel="Data inicial"
                  placeholder="De"
                  fullWidth
                />
              </View>
              <View style={styles.rangeField}>
                <MfDateField
                  value={filters.dateRange.end}
                  onChange={(iso) => onChange({ dateRange: { ...filters.dateRange, end: iso || '' } })}
                  accessibilityLabel="Data final"
                  placeholder="Até"
                  fullWidth
                />
              </View>
            </View>
            {rangeInvalid ? (
              <Text style={[styles.error, { color: tokens.expense }]} accessibilityRole="alert">
                A data inicial precisa ser antes da final.
              </Text>
            ) : customActive && !isValidDateRange(filters.dateRange) ? (
              <Text style={[styles.hint, { color: tokens.textTertiary }]}>Preencha as duas datas para aplicar.</Text>
            ) : null}
          </View>
        </Section>
      ) : null}

      {showAll ? (
        <>
          <Section tokens={tokens} title="Tipo">
            {TYPE_OPTIONS.map((o) => (
              <Option
                key={o.value}
                tokens={tokens}
                label={o.label}
                selected={filters.typeFilter === o.value}
                onPress={() => onChange({ typeFilter: o.value })}
              />
            ))}
          </Section>
          <Section tokens={tokens} title="Situação">
            {STATUS_OPTIONS.map((o) => (
              <Option
                key={o.value}
                tokens={tokens}
                label={o.label}
                selected={filters.statusFilter === o.value}
                onPress={() => onChange({ statusFilter: o.value })}
              />
            ))}
          </Section>
          <Section tokens={tokens} title="Conta">
            <Option tokens={tokens} label="Todas" selected={filters.contaFilter === 'all'} onPress={() => onChange({ contaFilter: 'all' })} />
            <Option
              tokens={tokens}
              label="Sem conta"
              selected={filters.contaFilter === 'unassigned'}
              onPress={() => onChange({ contaFilter: 'unassigned' })}
            />
            {contas.map((c) => (
              <Option
                key={c.id}
                tokens={tokens}
                label={c.nome}
                selected={filters.contaFilter === c.id}
                onPress={() => onChange({ contaFilter: c.id })}
              />
            ))}
          </Section>
          {categoryNames.length ? (
            <Section tokens={tokens} title="Categoria">
              <Option
                tokens={tokens}
                label="Todas"
                selected={!filters.categoria || filters.categoria === 'all'}
                onPress={() => onChange({ categoria: 'all' })}
              />
              {categoryNames.map((nome) => (
                <Option
                  key={nome}
                  tokens={tokens}
                  label={nome}
                  selected={String(filters.categoria).toLowerCase() === nome.toLowerCase()}
                  onPress={() => onChange({ categoria: nome })}
                />
              ))}
            </Section>
          ) : null}
        </>
      ) : null}

      {showAll || section === 'sort' ? (
        <Section tokens={tokens} title="Ordenar por">
          {SORT_OPTIONS.map((o) => (
            <Option key={o.value} tokens={tokens} label={o.label} selected={sort === o.value} onPress={() => onSort(o.value)} />
          ))}
        </Section>
      ) : null}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  section: { gap: 8 },
  sectionTitle: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: { fontSize: 14, fontWeight: '600' },
  rangeWrap: { width: '100%', gap: 6, marginTop: 4 },
  rangeTitle: { fontSize: 14, fontWeight: '600' },
  rangeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  rangeField: { flexGrow: 1, flexBasis: 140 },
  error: { fontSize: 13 },
  hint: { fontSize: 13 },
  footerRow: { flexDirection: 'row', gap: 10 },
  secondaryBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: { fontSize: 15, fontWeight: '700' },
  primaryBtn: { flex: 1, minHeight: 48, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
});
