import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  ROLE_DESCRIPTION,
  empresaDisplayName,
  formatPhoneDisplay,
  formatPtDate,
  isUserActive,
} from '@/lib/acessos/acessos';
import {
  empresaLimitChips,
  formatCnpj,
  userDisplayName,
  userEmpresaLabel,
  userMeiLabel,
  userRoleLabel,
} from '@/lib/acessos/acessosScreen';
import { fetchEmpresaDetail } from '@/lib/acessosApi';
import { strongPasswordRequirementsSummary } from '@/lib/passwordPolicy';
import { BottomSheet, SheetAction } from '../Transactions/BottomSheet';
import { TOUCH_MIN } from '../Dashboard/overview/overviewTokens';
import { Avatar, Chip, PrimaryButton } from './AcessosParts';

/** Confirmação com tom (perigo ou neutro) e estado de envio. */
export function ConfirmSheet({ tokens, title, message, confirmLabel, confirmIcon = 'checkmark', tone = 'danger', busy, busyLabel, error, onConfirm, onClose }) {
  return (
    <BottomSheet visible onClose={busy ? () => {} : onClose} title={title} tokens={tokens}>
      <Text style={[styles.text, { color: tokens.textSecondary }]}>{message}</Text>
      {error ? (
        <Text style={[styles.text, { color: tokens.expense }]} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
      {busy ? (
        <View style={styles.busy} accessibilityRole="progressbar" accessibilityLabel={busyLabel}>
          <ActivityIndicator color={tone === 'danger' ? tokens.expense : tokens.primary} />
          <Text style={[styles.text, { color: tokens.textSecondary }]}>{busyLabel}</Text>
        </View>
      ) : (
        <View style={styles.actions}>
          <SheetAction tokens={tokens} icon={confirmIcon} label={confirmLabel} tone={tone} onPress={onConfirm} />
          <SheetAction tokens={tokens} icon="close-outline" label="Cancelar" onPress={onClose} />
        </View>
      )}
    </BottomSheet>
  );
}

export function UserMenuSheet({ tokens, user, actions, onClose, onDetails, onImpersonate, onEdit, onResetPassword, onToggleBlock, onDelete, onViewTeam }) {
  const active = isUserActive(user);
  return (
    <BottomSheet visible onClose={onClose} title={userDisplayName(user)} tokens={tokens}>
      <View style={styles.actions}>
        <SheetAction tokens={tokens} icon="person-circle-outline" label="Ver detalhes" onPress={() => onDetails(user)} />
        {actions.canImpersonate && !actions.isSelf ? (
          <SheetAction tokens={tokens} icon="log-in-outline" label="Acessar como este usuário" tone="accent" onPress={() => onImpersonate(user)} />
        ) : null}
        {actions.canEdit ? <SheetAction tokens={tokens} icon="create-outline" label="Editar dados" onPress={() => onEdit(user)} /> : null}
        {actions.canResetPassword ? (
          <SheetAction tokens={tokens} icon="key-outline" label="Redefinir senha" onPress={() => onResetPassword(user)} />
        ) : null}
        {actions.canViewCompanyMembers ? (
          <SheetAction tokens={tokens} icon="people-outline" label="Ver equipe da empresa" onPress={() => onViewTeam(user)} />
        ) : null}
        {actions.canBan ? (
          <SheetAction
            tokens={tokens}
            icon={active ? 'ban-outline' : 'lock-open-outline'}
            label={active ? 'Bloquear acesso' : 'Liberar acesso'}
            tone={active ? 'danger' : 'accent'}
            onPress={() => onToggleBlock(user)}
          />
        ) : null}
        {actions.canDelete ? (
          <SheetAction tokens={tokens} icon="trash-outline" label="Excluir usuário" tone="danger" onPress={() => onDelete(user)} />
        ) : null}
      </View>
      {actions.isSelf ? (
        <Text style={[styles.note, { color: tokens.textTertiary }]}>
          Esta é a sua conta: bloquear, excluir ou trocar o próprio perfil não é permitido por aqui.
        </Text>
      ) : null}
    </BottomSheet>
  );
}

function InfoRow({ tokens, label, value, selectable }) {
  return (
    <View style={styles.info}>
      <Text style={[styles.infoLabel, { color: tokens.textSecondary }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: tokens.text }]} selectable={selectable}>
        {value || '—'}
      </Text>
    </View>
  );
}

export function UserDetailsSheet({ tokens, user, actions, onClose, onOpenMenu }) {
  const active = isUserActive(user);
  const mei = userMeiLabel(user);
  return (
    <BottomSheet
      visible
      onClose={onClose}
      title="Detalhes do usuário"
      tokens={tokens}
      footer={<PrimaryButton tokens={tokens} icon="ellipsis-horizontal" label="Ações" onPress={() => onOpenMenu(user)} />}
    >
      <View style={styles.identity}>
        <Avatar name={user.displayName} email={user.email} seed={user.id} size={52} />
        <View style={styles.identityText}>
          <Text style={[styles.identityName, { color: tokens.text }]}>{userDisplayName(user)}</Text>
          <View style={styles.chips}>
            <Chip tokens={tokens} label={active ? 'Ativo' : 'Bloqueado'} tone={active ? 'income' : 'expense'} />
            <Chip tokens={tokens} label={userRoleLabel(user)} tone="accent" />
            {actions.isSelf ? <Chip tokens={tokens} label="Você" tone="muted" /> : null}
          </View>
        </View>
      </View>
      <InfoRow tokens={tokens} label="Nome" value={user.displayName} />
      <InfoRow tokens={tokens} label="E-mail" value={user.email} selectable />
      <InfoRow tokens={tokens} label="Telefone" value={formatPhoneDisplay(user.phone)} selectable />
      <InfoRow tokens={tokens} label="Perfil" value={`${userRoleLabel(user)}${ROLE_DESCRIPTION[user.role] ? ` — ${ROLE_DESCRIPTION[user.role]}` : ''}`} />
      <InfoRow tokens={tokens} label="Empresa" value={userEmpresaLabel(user)} />
      <InfoRow tokens={tokens} label="MEI" value={mei || 'Sem informação'} />
      {user.role === 'usuario' ? (
        <InfoRow tokens={tokens} label="Acesso válido até" value={user.expiresAt ? formatPtDate(user.expiresAt) : 'Sem data de término'} />
      ) : null}
      <InfoRow tokens={tokens} label="Identificador" value={user.id} selectable />
    </BottomSheet>
  );
}

const STATUS_OPTIONS = [
  { key: 'todos', label: 'Todos' },
  { key: 'ativos', label: 'Ativos' },
  { key: 'bloqueados', label: 'Bloqueados' },
];

function OptionGroup({ tokens, label, options, value, onChange }) {
  return (
    <View style={styles.optGroup}>
      <Text style={[styles.optLabel, { color: tokens.text }]}>{label}</Text>
      <View style={styles.optRow} accessibilityRole="radiogroup" accessibilityLabel={label}>
        {options.map((opt) => {
          const selected = opt.key === value;
          return (
            <Pressable
              key={opt.key}
              onPress={() => onChange(opt.key)}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              style={({ pressed }) => [
                styles.opt,
                { borderColor: selected ? tokens.primary : tokens.cardBorder, backgroundColor: selected ? tokens.primarySoft : tokens.card },
                pressed && { opacity: 0.75 },
              ]}
            >
              <Text style={[styles.optText, { color: selected ? tokens.primary : tokens.text }]}>{opt.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** Filtros da lista de usuários (aplicados sobre a lista inteira). */
export function UserFiltersSheet({ tokens, value: draft, onChange, perfilOptions, empresaLabel, onPickEmpresa, showEmpresa, onApply, onClose }) {
  const setDraft = (update) => onChange(update(draft));
  return (
    <BottomSheet
      visible
      onClose={onClose}
      title="Filtrar usuários"
      tokens={tokens}
      footer={
        <>
          <PrimaryButton tokens={tokens} label="Aplicar filtros" onPress={() => onApply(draft)} />
          <Pressable
            onPress={() => onApply({ status: 'todos', perfil: 'todos', empresa: '' })}
            accessibilityRole="button"
            style={({ pressed }) => [styles.textBtn, pressed && { opacity: 0.6 }]}
          >
            <Text style={[styles.textBtnLabel, { color: tokens.primary }]}>Limpar filtros</Text>
          </Pressable>
        </>
      }
    >
      <OptionGroup tokens={tokens} label="Situação" options={STATUS_OPTIONS} value={draft.status} onChange={(status) => setDraft((d) => ({ ...d, status }))} />
      <OptionGroup tokens={tokens} label="Perfil" options={perfilOptions} value={draft.perfil} onChange={(perfil) => setDraft((d) => ({ ...d, perfil }))} />
      {showEmpresa ? (
        <View style={styles.optGroup}>
          <Text style={[styles.optLabel, { color: tokens.text }]}>Empresa</Text>
          <Pressable
            onPress={onPickEmpresa}
            accessibilityRole="button"
            accessibilityLabel={draft.empresa ? `Empresa: ${empresaLabel}. Toque para trocar` : 'Todas as empresas. Toque para escolher'}
            style={({ pressed }) => [styles.select, { borderColor: tokens.cardBorder, backgroundColor: tokens.canvas }, pressed && { opacity: 0.8 }]}
          >
            <Ionicons name="business-outline" size={20} color={tokens.textSecondary} />
            <Text style={[styles.selectText, { color: tokens.text }]} numberOfLines={1}>
              {draft.empresa ? empresaLabel : 'Todas as empresas'}
            </Text>
            {draft.empresa ? (
              <Pressable onPress={() => setDraft((d) => ({ ...d, empresa: '' }))} accessibilityRole="button" accessibilityLabel="Remover filtro de empresa" hitSlop={10}>
                <Ionicons name="close-circle" size={20} color={tokens.textTertiary} />
              </Pressable>
            ) : (
              <Ionicons name="chevron-down" size={18} color={tokens.textSecondary} />
            )}
          </Pressable>
        </View>
      ) : null}
    </BottomSheet>
  );
}

/** Lista de escolha com busca (empresas, perfis). */
export function PickerSheet({ tokens, title, options, selected, onSelect, onClose, searchPlaceholder }) {
  const [q, setQ] = useState('');
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return options;
    const digits = term.replace(/\D/g, '');
    return options.filter(
      (o) => o.label.toLowerCase().includes(term) || (digits.length >= 2 && String(o.search || '').includes(digits)),
    );
  }, [options, q]);
  return (
    <BottomSheet visible onClose={onClose} title={title} tokens={tokens}>
      {searchPlaceholder ? (
        <View style={[styles.search, { backgroundColor: tokens.canvas, borderColor: tokens.cardBorder }]}>
          <Ionicons name="search" size={18} color={tokens.textTertiary} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder={searchPlaceholder}
            placeholderTextColor={tokens.textTertiary}
            style={[styles.searchInput, { color: tokens.text }]}
            autoCorrect={false}
            accessibilityLabel={searchPlaceholder}
          />
        </View>
      ) : null}
      <View accessibilityRole="radiogroup">
        {filtered.length === 0 ? (
          <Text style={[styles.text, { color: tokens.textSecondary, textAlign: 'center', paddingVertical: 16 }]}>Nada encontrado.</Text>
        ) : (
          filtered.map((opt) => {
            const isSel = opt.key === selected;
            return (
              <Pressable
                key={opt.key}
                onPress={() => onSelect(opt.key)}
                accessibilityRole="radio"
                accessibilityState={{ checked: isSel }}
                style={({ pressed }) => [styles.pickRow, isSel && { backgroundColor: tokens.primarySoft }, pressed && { backgroundColor: tokens.track }]}
              >
                <View style={styles.pickText}>
                  <Text style={[styles.pickLabel, { color: tokens.text }]} numberOfLines={2}>
                    {opt.label}
                  </Text>
                  {opt.sub ? (
                    <Text style={[styles.pickSub, { color: tokens.textSecondary }]} numberOfLines={2}>
                      {opt.sub}
                    </Text>
                  ) : null}
                </View>
                {isSel ? <Ionicons name="checkmark-circle" size={22} color={tokens.primary} /> : null}
              </Pressable>
            );
          })
        )}
      </View>
    </BottomSheet>
  );
}

/**
 * Redefinir senha: link por e-mail (nada aparece na tela) ou senha provisória
 * (gerada pelo servidor ou digitada), mostrada uma única vez.
 */
export function ResetPasswordSheet({ tokens, user, busy, error, onSendEmail, onSetPassword, onClose }) {
  const [custom, setCustom] = useState('');
  const [mode, setMode] = useState(user.email ? 'email' : 'temp');
  return (
    <BottomSheet visible onClose={busy ? () => {} : onClose} title="Redefinir senha" tokens={tokens}>
      <Text style={[styles.text, { color: tokens.textSecondary }]}>
        Para {userDisplayName(user)}. A senha atual deixa de funcionar quando a nova for criada.
      </Text>
      {user.email ? (
        <OptionGroup
          tokens={tokens}
          label="Como redefinir"
          options={[
            { key: 'email', label: 'Enviar link por e-mail' },
            { key: 'temp', label: 'Criar senha provisória' },
          ]}
          value={mode}
          onChange={setMode}
        />
      ) : null}
      {mode === 'email' ? (
        <Text style={[styles.text, { color: tokens.textSecondary }]}>
          A pessoa recebe em {user.email} um link para criar a própria senha. Ninguém mais vê a senha.
        </Text>
      ) : (
        <View style={styles.optGroup}>
          <Text style={[styles.text, { color: tokens.textSecondary }]}>
            Deixe em branco para o sistema gerar uma senha forte. Ela aparece uma única vez para você repassar.
          </Text>
          <TextInput
            value={custom}
            onChangeText={setCustom}
            placeholder="Senha provisória (opcional)"
            placeholderTextColor={tokens.textTertiary}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            editable={!busy}
            accessibilityLabel="Senha provisória, opcional"
            style={[styles.input, { color: tokens.text, borderColor: tokens.cardBorder, backgroundColor: tokens.canvas }]}
          />
          <Text style={[styles.note, { color: tokens.textTertiary }]}>
            {strongPasswordRequirementsSummary()}
          </Text>
        </View>
      )}
      {error ? (
        <Text style={[styles.text, { color: tokens.expense }]} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
      <PrimaryButton
        tokens={tokens}
        icon={mode === 'email' ? 'mail-outline' : 'key-outline'}
        label={busy ? 'Enviando…' : mode === 'email' ? 'Enviar link' : 'Criar senha provisória'}
        busy={busy}
        onPress={() => (mode === 'email' ? onSendEmail() : onSetPassword(custom))}
      />
    </BottomSheet>
  );
}

/** Mostra uma senha provisória uma vez, com copiar. */
export function SecretResultSheet({ tokens, title, message, value, onCopy, onClose }) {
  return (
    <BottomSheet visible onClose={onClose} title={title} tokens={tokens} footer={<PrimaryButton tokens={tokens} icon="copy-outline" label="Copiar senha" onPress={onCopy} />}>
      <Text style={[styles.text, { color: tokens.textSecondary }]}>{message}</Text>
      <Text style={[styles.secret, { color: tokens.text, backgroundColor: tokens.canvas, borderColor: tokens.cardBorder }]} selectable>
        {value}
      </Text>
      <Text style={[styles.note, { color: tokens.textTertiary }]}>
        Ela não fica guardada no app. Depois de fechar, só gerando outra.
      </Text>
    </BottomSheet>
  );
}

export function EmpresaMenuSheet({ tokens, empresa, onClose, onDetails, onEdit, onViewUsers, onDelete }) {
  return (
    <BottomSheet visible onClose={onClose} title={empresaDisplayName(empresa)} tokens={tokens}>
      <View style={styles.actions}>
        <SheetAction tokens={tokens} icon="information-circle-outline" label="Ver detalhes" onPress={() => onDetails(empresa)} />
        <SheetAction tokens={tokens} icon="create-outline" label="Editar empresa" onPress={() => onEdit(empresa)} />
        <SheetAction tokens={tokens} icon="people-outline" label="Ver usuários da empresa" onPress={() => onViewUsers(empresa)} />
        <SheetAction tokens={tokens} icon="trash-outline" label="Excluir empresa" tone="danger" onPress={() => onDelete(empresa)} />
      </View>
    </BottomSheet>
  );
}

/** Detalhes completos (busca o cadastro inteiro) + usuários vinculados com acesso às ações de cada um. */
export function EmpresaDetailsSheet({ tokens, empresa, members, onOpenUser, onEdit, onClose }) {
  const [state, setState] = useState({ status: 'loading', data: null, error: null });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let alive = true;
    fetchEmpresaDetail(empresa.id)
      .then((data) => alive && setState({ status: 'ready', data, error: null }))
      .catch((error) => alive && setState({ status: 'error', data: null, error: error?.message || 'Não foi possível carregar a empresa.' }));
    return () => {
      alive = false;
    };
  }, [empresa.id, attempt]);

  const d = state.data || empresa;
  const chips = empresaLimitChips(empresa);
  const endereco = [d.logradouro, d.numero, d.complemento, d.bairro, d.cidade && `${d.cidade}${d.estado ? `/${d.estado}` : ''}`, d.cep]
    .filter(Boolean)
    .join(', ');

  return (
    <BottomSheet
      visible
      onClose={onClose}
      title={empresaDisplayName(empresa)}
      tokens={tokens}
      footer={<PrimaryButton tokens={tokens} icon="create-outline" label="Editar empresa" onPress={() => onEdit(empresa)} />}
    >
      {state.status === 'loading' ? <ActivityIndicator color={tokens.primary} accessibilityLabel="Carregando detalhes" /> : null}
      {state.status === 'error' ? (
        <View style={styles.inlineErr}>
          <Text style={[styles.text, { color: tokens.expense, flex: 1 }]}>{state.error}</Text>
          <Pressable
            onPress={() => {
              setState({ status: 'loading', data: null, error: null });
              setAttempt((n) => n + 1);
            }}
            accessibilityRole="button"
            hitSlop={8}
          >
            <Text style={[styles.textBtnLabel, { color: tokens.primary }]}>Tentar de novo</Text>
          </Pressable>
        </View>
      ) : null}
      <View style={styles.chips}>
        {chips.map((c) => (
          <Chip key={c.key} tokens={tokens} label={c.label} tone={c.tone} />
        ))}
      </View>
      {chips.map((c) => (
        <Text key={c.key} style={[styles.note, { color: tokens.textSecondary }]}>
          {c.description}
        </Text>
      ))}
      <InfoRow tokens={tokens} label="Nome fantasia" value={d.nome_fantasia} />
      <InfoRow tokens={tokens} label="Razão social" value={d.razao_social || d.empresa} />
      <InfoRow tokens={tokens} label="CNPJ" value={d.cnpj ? formatCnpj(d.cnpj) : 'Sem CNPJ'} selectable />
      {state.status === 'ready' ? (
        <>
          <InfoRow tokens={tokens} label="Inscrição estadual" value={d.inscricao_estadual} />
          <InfoRow tokens={tokens} label="Regime tributário" value={d.regime_tributario} />
          <InfoRow tokens={tokens} label="Endereço" value={endereco} />
          <InfoRow tokens={tokens} label="Telefone" value={d.telefone} selectable />
          <InfoRow tokens={tokens} label="E-mail" value={d.email} selectable />
        </>
      ) : null}

      <Text style={[styles.optLabel, { color: tokens.text, marginTop: 4 }]} accessibilityRole="header">
        Usuários vinculados ({members.length})
      </Text>
      {members.length === 0 ? (
        <Text style={[styles.text, { color: tokens.textSecondary }]}>Nenhum usuário vinculado a esta empresa.</Text>
      ) : (
        members.map((u) => (
          <Pressable
            key={u.id}
            onPress={() => onOpenUser(u)}
            accessibilityRole="button"
            accessibilityLabel={`${userDisplayName(u)}, ${userRoleLabel(u)}. Abrir ações`}
            style={({ pressed }) => [styles.member, pressed && { backgroundColor: tokens.track }]}
          >
            <Avatar name={u.displayName} email={u.email} seed={u.id} size={34} />
            <View style={styles.pickText}>
              <Text style={[styles.pickLabel, { color: tokens.text }]} numberOfLines={1}>
                {userDisplayName(u)}
              </Text>
              <Text style={[styles.pickSub, { color: tokens.textSecondary }]} numberOfLines={1}>
                {userRoleLabel(u)} · {isUserActive(u) ? 'Ativo' : 'Bloqueado'}
              </Text>
            </View>
            <Ionicons name="ellipsis-vertical" size={18} color={tokens.textSecondary} />
          </Pressable>
        ))
      )}
    </BottomSheet>
  );
}

export function InviteMenuSheet({ tokens, invite, canCopy, onCopy, onRevoke, onClose }) {
  return (
    <BottomSheet visible onClose={onClose} title={invite.is_reusable ? 'Convite reutilizável' : 'Convite de uso único'} tokens={tokens}>
      <View style={styles.actions}>
        <SheetAction tokens={tokens} icon="copy-outline" label="Copiar link" disabled={!canCopy} onPress={onCopy} />
        <SheetAction tokens={tokens} icon="close-circle-outline" label="Revogar convite" tone="danger" onPress={onRevoke} />
      </View>
      {!canCopy ? (
        <Text style={[styles.note, { color: tokens.textTertiary }]}>
          Links de uso único só podem ser copiados logo depois de gerados. Se perdeu o link, revogue e gere outro.
        </Text>
      ) : null}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  actions: { gap: 2 },
  text: { fontSize: 14, lineHeight: 20 },
  note: { fontSize: 13, lineHeight: 18 },
  busy: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  identityText: { flex: 1, minWidth: 0, gap: 6 },
  identityName: { fontSize: 18, fontWeight: '800' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  info: { gap: 2 },
  infoLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  infoValue: { fontSize: 15, lineHeight: 21 },
  optGroup: { gap: 8 },
  optLabel: { fontSize: 15, fontWeight: '700' },
  optRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  opt: { minHeight: TOUCH_MIN - 4, borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, justifyContent: 'center' },
  optText: { fontSize: 14, fontWeight: '700' },
  select: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 50, borderWidth: 1, borderRadius: 14, paddingHorizontal: 12 },
  selectText: { flex: 1, fontSize: 16, fontWeight: '600' },
  textBtn: { minHeight: TOUCH_MIN, alignItems: 'center', justifyContent: 'center' },
  textBtnLabel: { fontSize: 15, fontWeight: '700' },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 46, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12 },
  searchInput: { flex: 1, fontSize: 16, paddingVertical: 8 },
  pickRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: TOUCH_MIN + 4, paddingHorizontal: 8, borderRadius: 12 },
  pickText: { flex: 1, minWidth: 0 },
  pickLabel: { fontSize: 15, fontWeight: '600' },
  pickSub: { fontSize: 13 },
  input: { minHeight: 50, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, fontSize: 16 },
  secret: { fontSize: 18, fontWeight: '700', padding: 14, borderRadius: 12, borderWidth: 1, textAlign: 'center', letterSpacing: 0.5 },
  inlineErr: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  member: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: TOUCH_MIN + 4, paddingHorizontal: 4, borderRadius: 12 },
});
