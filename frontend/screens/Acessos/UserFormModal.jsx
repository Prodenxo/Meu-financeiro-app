import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ROLE_DESCRIPTION, empresaDisplayName, isEmpresaMeiActive, roleLabel } from '@/lib/acessos/acessos';
import {
  buildUserPayload,
  empresaLimitChips,
  formatCnpj,
  formatDateInputBr,
  userFormInitial,
  userFormRules,
} from '@/lib/acessos/acessosScreen';
import { strongPasswordRequirementsSummary } from '@/lib/passwordPolicy';
import { FormGroup, FormShell, SelectField, SwitchField, TextField } from './AcessosForm';

/** Criar / editar usuário. O servidor revalida perfil, empresa e limites de MEI. */
export function UserFormModal({ tokens, user, actorRole, actorUserId, empresas, defaultEmpresaId, saving, formError, onSubmit, onClose }) {
  const rules = userFormRules({ user, actorRole, actorUserId });
  const [form, setForm] = useState(() => {
    const initial = userFormInitial(user);
    if (!user && defaultEmpresaId) initial.empresaId = defaultEmpresaId;
    return { ...initial, expiresAt: formatDateInputBr(initial.expiresAt) };
  });
  const [localError, setLocalError] = useState(null);
  const [picking, setPicking] = useState(null);

  const set = (patch) => {
    setForm((f) => ({ ...f, ...patch }));
    setLocalError(null);
  };

  const empresa = useMemo(() => empresas.find((e) => e.id === (form.empresaId || user?.empresaId)), [empresas, form.empresaId, user]);
  const meiAllowed = empresa ? isEmpresaMeiActive(empresa) : false;

  const submit = () => {
    if (saving) return;
    const { error, body, emailChanged } = buildUserPayload(form, { user, actorRole, actorUserId });
    if (error) {
      setLocalError(error);
      return;
    }
    onSubmit(body, { emailChanged });
  };

  const empresaOptions = useMemo(
    () =>
      empresas.map((e) => ({
        key: e.id,
        label: empresaDisplayName(e),
        sub: [e.cnpj ? formatCnpj(e.cnpj) : null, ...empresaLimitChips(e).map((c) => c.label)].filter(Boolean).join(' · '),
        search: String(e.cnpj || ''),
      })),
    [empresas],
  );

  const picker =
    picking === 'role'
      ? {
          title: 'Perfil',
          options: rules.roleOptions.map((r) => ({ key: r, label: roleLabel(r), sub: ROLE_DESCRIPTION[r] })),
          selected: form.role,
          onSelect: (role) => {
            set({ role });
            setPicking(null);
          },
        }
      : picking === 'empresa'
        ? {
            title: 'Empresa',
            options: empresaOptions,
            selected: form.empresaId,
            searchPlaceholder: 'Buscar empresa ou CNPJ',
            onSelect: (empresaId) => {
              set({ empresaId });
              setPicking(null);
            },
          }
        : null;

  const showExpiry = rules.isEdit && form.role === 'usuario';

  return (
    <FormShell
      tokens={tokens}
      title={rules.isEdit ? 'Editar usuário' : 'Novo usuário'}
      saving={saving}
      submitLabel={rules.isEdit ? 'Salvar alterações' : 'Criar usuário'}
      onSubmit={submit}
      onClose={onClose}
      picker={picker}
      onClosePicker={() => setPicking(null)}
      formError={localError || formError}
    >
      <FormGroup tokens={tokens} title="Dados da pessoa">
        <TextField
          tokens={tokens}
          label="Nome"
          optional
          value={form.displayName}
          onChangeText={(displayName) => set({ displayName })}
          placeholder="Nome completo"
          maxLength={120}
          editable={!saving}
          autoCapitalize="words"
        />
        <TextField
          tokens={tokens}
          label={rules.isEdit ? 'E-mail de login' : 'E-mail'}
          value={form.email}
          onChangeText={(email) => set({ email })}
          placeholder="pessoa@exemplo.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!saving}
          hint={rules.isEdit ? 'Trocar o e-mail muda o login da pessoa.' : null}
        />
        <TextField
          tokens={tokens}
          label="Telefone (WhatsApp)"
          optional
          value={form.phone}
          onChangeText={(phone) => set({ phone })}
          placeholder="(11) 99999-9999"
          keyboardType="phone-pad"
          maxLength={32}
          editable={!saving}
        />
        {!rules.isEdit ? (
          <TextField
            tokens={tokens}
            label="Senha inicial"
            optional
            value={form.password}
            onChangeText={(password) => set({ password })}
            placeholder="Deixe em branco para gerar"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            editable={!saving}
            hint={`Em branco: o sistema gera uma senha forte e mostra uma vez. ${strongPasswordRequirementsSummary()}`}
          />
        ) : null}
      </FormGroup>

      {rules.showRole || rules.showEmpresa ? (
        <FormGroup tokens={tokens} title="Acesso">
          {rules.showRole ? (
            <SelectField
              tokens={tokens}
              label="Perfil"
              value={roleLabel(rules.isSuperadmin || rules.isEdit ? form.role : 'usuario')}
              onPress={() => setPicking('role')}
              disabled={saving || rules.roleLocked || !rules.isSuperadmin}
              hint={
                rules.isSelf
                  ? 'Você não pode trocar o próprio perfil.'
                  : user?.role === 'superadmin'
                    ? 'Perfil de super admin não pode ser alterado por aqui.'
                    : ROLE_DESCRIPTION[form.role]
              }
            />
          ) : null}
          {rules.showEmpresa ? (
            <SelectField
              tokens={tokens}
              label="Empresa"
              value={empresa ? empresaDisplayName(empresa) : ''}
              placeholder="Escolha a empresa"
              onPress={() => setPicking('empresa')}
              disabled={saving}
            />
          ) : null}
          {showExpiry ? (
            <TextField
              tokens={tokens}
              label="Acesso válido até"
              optional
              value={form.expiresAt}
              onChangeText={(expiresAt) => set({ expiresAt })}
              placeholder="dd/mm/aaaa"
              keyboardType="numbers-and-punctuation"
              maxLength={10}
              editable={!saving}
              hint="Em branco: sem data de término. Depois da data, o acesso é bloqueado."
            />
          ) : null}
          {rules.showMei ? (
            <SwitchField
              tokens={tokens}
              label="MEI habilitado"
              value={form.mei}
              onValueChange={(mei) => set({ mei })}
              disabled={saving || (!meiAllowed && !form.mei)}
              hint={
                !empresa
                  ? 'Sem empresa vinculada.'
                  : meiAllowed
                    ? `Usa uma das vagas MEI da empresa (${empresaLimitChips(empresa)[0].label}).`
                    : 'O módulo MEI está desligado nesta empresa.'
              }
            />
          ) : null}
        </FormGroup>
      ) : null}

      {!rules.isSuperadmin && !rules.isEdit ? (
        <View style={[styles.notice, { backgroundColor: tokens.primarySoft }]}>
          <Text style={[styles.noticeText, { color: tokens.text }]}>A pessoa entra na sua empresa com perfil Usuário.</Text>
        </View>
      ) : null}
    </FormShell>
  );
}

const styles = StyleSheet.create({
  notice: { borderRadius: 12, padding: 12 },
  noticeText: { fontSize: 14, lineHeight: 19 },
});
