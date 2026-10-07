import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { isUserActive } from '@/lib/acessos/acessos';
import { rangeLabel, userDisplayName, userEmpresaLabel, userMeiLabel, userRoleLabel } from '@/lib/acessos/acessosScreen';
import {
  Avatar,
  Chip,
  EmptyState,
  ListGroup,
  MoreButton,
  Pager,
  PrimaryButton,
  RangeLine,
  SearchToolbar,
} from './AcessosParts';

function UserRow({ tokens, user, isSelf, onOpen, onMenu }) {
  const name = userDisplayName(user);
  const active = isUserActive(user);
  const showEmail = user.email && user.email !== name;
  const mei = userMeiLabel(user);
  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => onOpen(user)}
        accessibilityRole="button"
        accessibilityLabel={`${name}${isSelf ? ' (você)' : ''}, ${active ? 'ativo' : 'bloqueado'}, ${userRoleLabel(user)}, ${userEmpresaLabel(user)}. Ver detalhes`}
        style={({ pressed }) => [styles.rowMain, pressed && { opacity: 0.7 }]}
      >
        <Avatar name={user.displayName} email={user.email} seed={user.id} />
        <View style={styles.rowText}>
          <Text style={[styles.name, { color: tokens.text }]} numberOfLines={1}>
            {name}
            {isSelf ? <Text style={{ color: tokens.textSecondary, fontWeight: '600' }}> (você)</Text> : null}
          </Text>
          {showEmail ? (
            <Text style={[styles.sub, { color: tokens.textSecondary }]} numberOfLines={1}>
              {user.email}
            </Text>
          ) : null}
          <View style={styles.chips}>
            <Chip tokens={tokens} label={active ? 'Ativo' : 'Bloqueado'} tone={active ? 'income' : 'expense'} />
            <Chip tokens={tokens} label={userRoleLabel(user)} tone="accent" />
            <Chip tokens={tokens} label={userEmpresaLabel(user)} tone="muted" icon="business-outline" />
            {mei ? <Chip tokens={tokens} label={mei} tone={user.mei ? 'warning' : 'muted'} /> : null}
          </View>
        </View>
      </Pressable>
      <MoreButton tokens={tokens} label={`Ações para ${name}`} onPress={() => onMenu(user)} />
    </View>
  );
}

export function UsersTab({
  tokens,
  page,
  query,
  onQueryChange,
  ordem,
  onToggleOrdem,
  filterCount,
  onOpenFilters,
  filterSummary,
  onClearFilters,
  onPageChange,
  onCreate,
  onOpen,
  onMenu,
  actorUserId,
  searchingServer,
  totalUsers,
}) {
  return (
    <View style={styles.stack}>
      <SearchToolbar
        tokens={tokens}
        value={query}
        onChange={onQueryChange}
        placeholder="Buscar por nome, e-mail, telefone ou empresa"
        filterCount={filterCount}
        onOpenFilters={onOpenFilters}
        ordem={ordem}
        onToggleOrdem={onToggleOrdem}
      />
      {filterSummary ? (
        <View style={styles.filterLine}>
          <Text style={[styles.filterText, { color: tokens.textSecondary }]} numberOfLines={2}>
            {filterSummary}
          </Text>
          <Pressable onPress={onClearFilters} accessibilityRole="button" hitSlop={8}>
            <Text style={[styles.link, { color: tokens.primary }]}>Limpar filtros</Text>
          </Pressable>
        </View>
      ) : null}
      <PrimaryButton tokens={tokens} icon="person-add-outline" label="Novo usuário" onPress={onCreate} />

      <View style={styles.rangeRow}>
        <RangeLine tokens={tokens} text={`${rangeLabel(page)} ${page.total === 1 ? 'usuário' : 'usuários'}`} />
        {searchingServer ? <ActivityIndicator size="small" color={tokens.primary} accessibilityLabel="Buscando no servidor" /> : null}
      </View>

      {page.total === 0 ? (
        totalUsers === 0 && !page.hasFilters ? (
          <EmptyState tokens={tokens} icon="people-outline" title="Nenhum usuário ainda" text="Crie um usuário ou gere um link de convite." />
        ) : (
          <EmptyState
            tokens={tokens}
            icon="search-outline"
            title="Nenhum usuário encontrado"
            text="Confira a busca ou os filtros."
            actionLabel="Limpar busca e filtros"
            onAction={onClearFilters}
          />
        )
      ) : (
        <ListGroup tokens={tokens}>
          {page.items.map((user) => (
            <UserRow key={user.id} tokens={tokens} user={user} isSelf={user.id === actorUserId} onOpen={onOpen} onMenu={onMenu} />
          ))}
        </ListGroup>
      )}
      <Pager tokens={tokens} page={page.page} pageCount={page.pageCount} onChange={onPageChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 12 },
  filterLine: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  filterText: { flex: 1, minWidth: 160, fontSize: 13 },
  link: { fontSize: 14, fontWeight: '700' },
  rangeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', paddingLeft: 12, paddingRight: 2, paddingVertical: 10 },
  rowMain: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  rowText: { flex: 1, minWidth: 0, gap: 3 },
  name: { fontSize: 16, fontWeight: '700' },
  sub: { fontSize: 13 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 3 },
});
