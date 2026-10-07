import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { empresaDisplayName } from '@/lib/acessos/acessos';
import { empresaLimitChips, formatCnpj, rangeLabel } from '@/lib/acessos/acessosScreen';
import { TOUCH_MIN } from '../Dashboard/overview/overviewTokens';
import { Chip, EmptyState, ListGroup, MoreButton, Pager, PrimaryButton, RangeLine, SearchToolbar } from './AcessosParts';

const MEI_OPTIONS = [
  { key: 'todos', label: 'Todos' },
  { key: 'ativos', label: 'MEI ativo' },
  { key: 'inativos', label: 'MEI inativo' },
];

function EmpresaRow({ tokens, empresa, memberCount, onOpen, onMenu }) {
  const name = empresaDisplayName(empresa);
  const chips = empresaLimitChips(empresa);
  const cnpj = empresa.cnpj ? formatCnpj(empresa.cnpj) : 'Sem CNPJ';
  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => onOpen(empresa)}
        accessibilityRole="button"
        accessibilityLabel={`${name}, ${cnpj}. ${chips.map((c) => c.description).join(' ')} Ver detalhes`}
        style={({ pressed }) => [styles.rowMain, pressed && { opacity: 0.7 }]}
      >
        <View style={[styles.icon, { backgroundColor: tokens.primarySoft }]}>
          <Ionicons name="business-outline" size={20} color={tokens.primary} />
        </View>
        <View style={styles.rowText}>
          <Text style={[styles.name, { color: tokens.text }]} numberOfLines={1}>
            {name}
          </Text>
          <Text style={[styles.sub, { color: tokens.textSecondary }]} numberOfLines={1}>
            {cnpj}
            {memberCount != null ? ` · ${memberCount} ${memberCount === 1 ? 'usuário' : 'usuários'}` : ''}
          </Text>
          <View style={styles.chips}>
            {chips.map((c) => (
              <Chip key={c.key} tokens={tokens} label={c.label} tone={c.tone} />
            ))}
          </View>
        </View>
      </Pressable>
      <MoreButton tokens={tokens} label={`Ações para ${name}`} onPress={() => onMenu(empresa)} />
    </View>
  );
}

export function EmpresasTab({ tokens, page, query, onQueryChange, ordem, onToggleOrdem, mei, onMeiChange, meiActiveCount, totalEmpresas, memberCounts, onPageChange, onCreate, onOpen, onMenu, onClearFilters }) {
  return (
    <View style={styles.stack}>
      <SearchToolbar
        tokens={tokens}
        value={query}
        onChange={onQueryChange}
        placeholder="Buscar por nome ou CNPJ"
        ordem={ordem}
        onToggleOrdem={onToggleOrdem}
      />
      <View style={styles.filters} accessibilityRole="radiogroup" accessibilityLabel="Filtrar por MEI">
        {MEI_OPTIONS.map((opt) => {
          const selected = opt.key === mei;
          return (
            <Pressable
              key={opt.key}
              onPress={() => onMeiChange(opt.key)}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              style={({ pressed }) => [
                styles.filter,
                { borderColor: selected ? tokens.primary : tokens.cardBorder, backgroundColor: selected ? tokens.primarySoft : tokens.card },
                pressed && { opacity: 0.75 },
              ]}
            >
              <Text style={[styles.filterText, { color: selected ? tokens.primary : tokens.text }]}>{opt.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={[styles.count, { color: tokens.textSecondary }]}>
        {meiActiveCount.toLocaleString('pt-BR')} de {totalEmpresas.toLocaleString('pt-BR')} com MEI ativo
      </Text>
      <PrimaryButton tokens={tokens} icon="add" label="Nova empresa" onPress={onCreate} />
      <RangeLine tokens={tokens} text={`${rangeLabel(page)} ${page.total === 1 ? 'empresa' : 'empresas'}`} />

      {page.total === 0 ? (
        totalEmpresas === 0 ? (
          <EmptyState tokens={tokens} icon="business-outline" title="Nenhuma empresa cadastrada" />
        ) : (
          <EmptyState
            tokens={tokens}
            icon="search-outline"
            title="Nenhuma empresa encontrada"
            text="Confira a busca ou o filtro de MEI."
            actionLabel="Limpar busca e filtro"
            onAction={onClearFilters}
          />
        )
      ) : (
        <ListGroup tokens={tokens}>
          {page.items.map((empresa) => (
            <EmpresaRow
              key={empresa.id}
              tokens={tokens}
              empresa={empresa}
              memberCount={memberCounts.get(empresa.id) ?? 0}
              onOpen={onOpen}
              onMenu={onMenu}
            />
          ))}
        </ListGroup>
      )}
      <Pager tokens={tokens} page={page.page} pageCount={page.pageCount} onChange={onPageChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 12 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filter: { minHeight: TOUCH_MIN - 4, borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, justifyContent: 'center' },
  filterText: { fontSize: 14, fontWeight: '700' },
  count: { fontSize: 13, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', paddingLeft: 12, paddingRight: 2, paddingVertical: 10 },
  rowMain: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1, minWidth: 0, gap: 3 },
  name: { fontSize: 16, fontWeight: '700' },
  sub: { fontSize: 13, fontVariant: ['tabular-nums'] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 3 },
});
