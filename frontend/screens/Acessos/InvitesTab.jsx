import React from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatPtDate, formatPtDateTime } from '@/lib/acessos/acessos';
import { OVERVIEW_RADIUS } from '../Dashboard/overview/overviewTokens';
import { Chip, EmptyState, InlineError, ListGroup, ListSkeleton, MoreButton, PrimaryButton, SecondaryButton } from './AcessosParts';

/** Formulário "Gerar link" + resultado com copiar (nada é enviado automaticamente). */
function InviteGenerator({ tokens, isSuperadmin, empresaLabel, onPickEmpresa, reusable, onToggleReusable, canGenerate, busy, onGenerate, result, onCopyResult, onDismissResult }) {
  return (
    <View style={[styles.card, { backgroundColor: tokens.card, borderColor: tokens.cardBorder }]}>
      <Text style={[styles.cardTitle, { color: tokens.text }]} accessibilityRole="header">
        Convidar por link
      </Text>
      <Text style={[styles.hint, { color: tokens.textSecondary }]}>
        Quem se cadastrar pelo link entra na empresa como Usuário. O link vale por 7 dias.
      </Text>

      {isSuperadmin ? (
        <View style={styles.field}>
          <Text style={[styles.label, { color: tokens.text }]}>Empresa</Text>
          <Pressable
            onPress={onPickEmpresa}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel={empresaLabel ? `Empresa: ${empresaLabel}. Toque para trocar` : 'Escolher empresa (obrigatório)'}
            style={({ pressed }) => [styles.select, { borderColor: tokens.cardBorder, backgroundColor: tokens.canvas }, pressed && { opacity: 0.8 }]}
          >
            <Ionicons name="business-outline" size={20} color={empresaLabel ? tokens.primary : tokens.textTertiary} />
            <Text style={[styles.selectText, { color: empresaLabel ? tokens.text : tokens.textTertiary }]} numberOfLines={1}>
              {empresaLabel || 'Escolha a empresa'}
            </Text>
            <Ionicons name="chevron-down" size={18} color={tokens.textSecondary} />
          </Pressable>
        </View>
      ) : empresaLabel ? (
        <Text style={[styles.hint, { color: tokens.textSecondary }]}>
          Empresa: <Text style={{ color: tokens.text, fontWeight: '700' }}>{empresaLabel}</Text>
        </Text>
      ) : null}

      <View style={styles.switchRow}>
        <View style={styles.switchText}>
          <Text style={[styles.label, { color: tokens.text }]}>Link reutilizável</Text>
          <Text style={[styles.hint, { color: tokens.textSecondary }]}>
            {reusable ? 'Várias pessoas podem usar o mesmo link enquanto ele valer.' : 'O link serve para uma única pessoa.'}
          </Text>
        </View>
        <Switch
          value={reusable}
          onValueChange={onToggleReusable}
          disabled={busy}
          trackColor={{ true: tokens.primary, false: tokens.track }}
          thumbColor="#ffffff"
          accessibilityLabel="Link reutilizável"
        />
      </View>

      <PrimaryButton tokens={tokens} icon="link-outline" label={busy ? 'Gerando…' : 'Gerar link'} onPress={onGenerate} disabled={!canGenerate} busy={busy} />
      {isSuperadmin && !empresaLabel ? (
        <Text style={[styles.hint, { color: tokens.textTertiary }]}>Escolha a empresa para gerar o link.</Text>
      ) : null}

      {result ? (
        <View style={[styles.result, { backgroundColor: tokens.primarySoft }]} accessibilityLiveRegion="polite">
          <View style={styles.resultHead}>
            <Ionicons name="checkmark-circle" size={20} color={tokens.income} />
            <Text style={[styles.resultTitle, { color: tokens.text }]}>Link gerado</Text>
            <Pressable onPress={onDismissResult} accessibilityRole="button" accessibilityLabel="Fechar link gerado" hitSlop={10}>
              <Ionicons name="close" size={20} color={tokens.textSecondary} />
            </Pressable>
          </View>
          <Text style={[styles.url, { color: tokens.text, backgroundColor: tokens.card }]} selectable numberOfLines={3}>
            {result.url}
          </Text>
          <Text style={[styles.hint, { color: tokens.textSecondary }]}>
            {result.reusable
              ? 'Reutilizável. Você pode copiar de novo na lista abaixo.'
              : 'Uso único. Copie agora: por segurança, este link não fica disponível para copiar depois.'}
          </Text>
          <PrimaryButton tokens={tokens} icon="copy-outline" label="Copiar link" onPress={onCopyResult} />
        </View>
      ) : null}
    </View>
  );
}

function InviteRow({ tokens, invite, empresaName, showEmpresa, onMenu }) {
  const uses = Number(invite.uses_count || 0);
  const usesLabel = invite.is_reusable ? `${uses} ${uses === 1 ? 'uso' : 'usos'}` : uses > 0 ? 'Usado' : 'Ainda não usado';
  return (
    <View style={styles.row}>
      <View style={[styles.rowIcon, { backgroundColor: tokens.primarySoft }]}>
        <Ionicons name="link-outline" size={18} color={tokens.primary} />
      </View>
      <View style={styles.rowText}>
        <View style={styles.chips}>
          <Chip tokens={tokens} label="Pendente" tone="warning" />
          <Chip tokens={tokens} label={invite.is_reusable ? 'Reutilizável' : 'Uso único'} tone="accent" />
          <Chip tokens={tokens} label={usesLabel} tone="muted" />
        </View>
        {showEmpresa ? (
          <Text style={[styles.rowTitle, { color: tokens.text }]} numberOfLines={1}>
            {empresaName || 'Empresa'}
          </Text>
        ) : null}
        <Text style={[styles.meta, { color: tokens.textSecondary }]} numberOfLines={2}>
          Criado por {invite.created_by_name || 'alguém da equipe'} em {formatPtDateTime(invite.created_at)}
        </Text>
        <Text style={[styles.meta, { color: tokens.textSecondary }]}>Vale até {formatPtDate(invite.expires_at)}</Text>
      </View>
      <MoreButton tokens={tokens} label="Ações do convite" onPress={() => onMenu(invite)} />
    </View>
  );
}

export function InvitesTab({ tokens, generator, invites, invitesStatus, invitesError, onRetry, onRefresh, refreshing, empresaNameOf, isSuperadmin, onMenu }) {
  let list;
  if (invitesStatus === 'loading') list = <ListSkeleton tokens={tokens} rows={3} />;
  else if (invitesStatus === 'error') list = <InlineError tokens={tokens} message={invitesError?.message || 'Não foi possível carregar os convites.'} onRetry={onRetry} />;
  else if (!invites.length) {
    list = <EmptyState tokens={tokens} icon="mail-open-outline" title="Nenhum convite pendente" text="Gere um link acima para convidar alguém." />;
  } else {
    list = (
      <ListGroup tokens={tokens}>
        {invites.map((invite) => (
          <InviteRow
            key={invite.id}
            tokens={tokens}
            invite={invite}
            showEmpresa={isSuperadmin}
            empresaName={empresaNameOf(invite.empresas_id)}
            onMenu={onMenu}
          />
        ))}
      </ListGroup>
    );
  }

  return (
    <View style={styles.stack}>
      <InviteGenerator tokens={tokens} isSuperadmin={isSuperadmin} {...generator} />
      <View style={styles.sectionHead}>
        <Text style={[styles.sectionTitle, { color: tokens.text }]} accessibilityRole="header">
          Convites pendentes{invitesStatus === 'ready' ? ` (${invites.length})` : ''}
        </Text>
        <SecondaryButton tokens={tokens} icon="refresh" label={refreshing ? 'Atualizando…' : 'Atualizar'} onPress={onRefresh} disabled={refreshing} />
      </View>
      {list}
      <Text style={[styles.foot, { color: tokens.textTertiary }]}>
        Aqui ficam só os convites por link. Pedidos de acesso feitos pelo site são outra coisa e não aparecem nesta lista.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 12 },
  card: { borderWidth: 1, borderRadius: OVERVIEW_RADIUS, padding: 16, gap: 12 },
  cardTitle: { fontSize: 17, fontWeight: '800' },
  field: { gap: 6 },
  label: { fontSize: 15, fontWeight: '700' },
  hint: { fontSize: 13, lineHeight: 18 },
  select: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 50, borderWidth: 1, borderRadius: 14, paddingHorizontal: 12 },
  selectText: { flex: 1, fontSize: 16, fontWeight: '600' },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  switchText: { flex: 1, gap: 2 },
  result: { borderRadius: 14, padding: 12, gap: 10 },
  resultHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  resultTitle: { flex: 1, fontSize: 15, fontWeight: '800' },
  url: { fontSize: 13, padding: 10, borderRadius: 10, overflow: 'hidden' },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' },
  sectionTitle: { fontSize: 18, fontWeight: '800', flexShrink: 1 },
  row: { flexDirection: 'row', alignItems: 'flex-start', paddingLeft: 12, paddingRight: 2, paddingVertical: 10, gap: 12 },
  rowIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  rowText: { flex: 1, minWidth: 0, gap: 4 },
  rowTitle: { fontSize: 15, fontWeight: '700' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  meta: { fontSize: 13, lineHeight: 18 },
  foot: { fontSize: 12, lineHeight: 17 },
});
