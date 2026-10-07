import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  REGIMES,
  applyCnpjLookup,
  buildEmpresaPayload,
  empresaFormInitial,
  formatCnpj,
} from '@/lib/acessos/acessosScreen';
import { fetchEmpresaDetail, lookupEmpresaCnpj } from '@/lib/acessosApi';
import { FormGroup, FormShell, SelectField, SwitchField, TextField } from './AcessosForm';

/** Criar / editar empresa (só superadmin; o servidor recusa os demais). */
export function EmpresaFormModal({ tokens, empresa, saving, formError, onSubmit, onClose }) {
  const isEdit = Boolean(empresa?.id);
  const [form, setForm] = useState(() => empresaFormInitial(isEdit ? empresa : null));
  const [loadState, setLoadState] = useState(isEdit ? 'loading' : 'ready');
  const [attempt, setAttempt] = useState(0);
  const [localError, setLocalError] = useState(null);
  const [lookup, setLookup] = useState({ status: 'idle', message: null });
  const [picking, setPicking] = useState(false);

  useEffect(() => {
    if (!isEdit) return undefined;
    let alive = true;
    fetchEmpresaDetail(empresa.id)
      .then((full) => {
        if (!alive) return;
        setForm(empresaFormInitial({ ...empresa, ...(full || {}) }));
        setLoadState('ready');
      })
      .catch(() => alive && setLoadState('error'));
    return () => {
      alive = false;
    };
  }, [isEdit, empresa, attempt]);

  const set = (patch) => {
    setForm((f) => ({ ...f, ...patch }));
    setLocalError(null);
  };

  const runLookup = async () => {
    const digits = String(form.cnpj || '').replace(/\D/g, '');
    if (digits.length !== 14 || lookup.status === 'loading') return;
    setLookup({ status: 'loading', message: null });
    try {
      const data = await lookupEmpresaCnpj(digits);
      setForm((f) => applyCnpjLookup(f, data));
      setLookup({ status: 'done', message: 'Dados preenchidos pelo CNPJ. Confira antes de salvar.' });
    } catch (error) {
      setLookup({ status: 'error', message: error?.message || 'Não foi possível consultar o CNPJ. Preencha manualmente.' });
    }
  };

  const submit = () => {
    if (saving || loadState !== 'ready') return;
    const { error, body } = buildEmpresaPayload(form, { isEdit });
    if (error) {
      setLocalError(error);
      return;
    }
    onSubmit(body);
  };

  const field = (key, label, extra = {}) => (
    <TextField key={key} tokens={tokens} label={label} value={form[key]} onChangeText={(v) => set({ [key]: v })} editable={!saving} {...extra} />
  );

  const picker = picking
    ? {
        title: 'Regime tributário',
        options: [{ key: '', label: 'Não informado' }, ...REGIMES.map((r) => ({ key: r, label: r }))],
        selected: form.regime_tributario,
        onSelect: (regime_tributario) => {
          set({ regime_tributario });
          setPicking(false);
        },
      }
    : null;

  return (
    <FormShell
      tokens={tokens}
      title={isEdit ? 'Editar empresa' : 'Nova empresa'}
      saving={saving}
      submitLabel={isEdit ? 'Salvar alterações' : 'Criar empresa'}
      onSubmit={submit}
      onClose={onClose}
      picker={picker}
      onClosePicker={() => setPicking(false)}
      formError={localError || formError}
    >
      {loadState === 'loading' ? (
        <View style={styles.center} accessibilityLabel="Carregando empresa">
          <ActivityIndicator color={tokens.primary} />
        </View>
      ) : loadState === 'error' ? (
        <View style={[styles.notice, { backgroundColor: tokens.expenseSoft }]} accessibilityRole="alert">
          <Text style={[styles.noticeText, { color: tokens.text }]}>Não foi possível carregar o cadastro completo.</Text>
          <Pressable
            onPress={() => {
              setLoadState('loading');
              setAttempt((n) => n + 1);
            }}
            accessibilityRole="button"
            hitSlop={8}
          >
            <Text style={[styles.link, { color: tokens.primary }]}>Tentar de novo</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <FormGroup tokens={tokens} title="Identificação">
            <TextField
              tokens={tokens}
              label="CNPJ"
              optional
              value={form.cnpj}
              onChangeText={(v) => set({ cnpj: formatCnpj(v) })}
              onBlur={runLookup}
              placeholder="00.000.000/0000-00"
              keyboardType="number-pad"
              maxLength={18}
              editable={!saving}
              hint={lookup.status === 'loading' ? 'Consultando CNPJ…' : lookup.message || 'Ao sair do campo, buscamos os dados públicos da empresa.'}
            />
            {field('nome_fantasia', 'Nome fantasia', { placeholder: 'Como a empresa é conhecida', autoCapitalize: 'words' })}
            {field('empresa', 'Nome da empresa', { placeholder: 'Nome usado nas listas', autoCapitalize: 'words' })}
            {field('razao_social', 'Razão social', { optional: true, autoCapitalize: 'characters' })}
            {field('inscricao_estadual', 'Inscrição estadual', { optional: true })}
            <SelectField
              tokens={tokens}
              label="Regime tributário"
              value={form.regime_tributario}
              placeholder="Não informado"
              onPress={() => setPicking(true)}
              disabled={saving}
            />
          </FormGroup>

          <FormGroup tokens={tokens} title="Limites de usuários">
            <SwitchField
              tokens={tokens}
              label="Módulo MEI"
              value={form.meiEnabled}
              onValueChange={(meiEnabled) => set({ meiEnabled })}
              disabled={saving}
              hint={form.meiEnabled ? 'Pessoas desta empresa podem ter o MEI habilitado.' : 'Desligado: ninguém desta empresa usa o MEI.'}
            />
            {form.meiEnabled
              ? field('meiSlots', 'Vagas MEI', {
                  keyboardType: 'number-pad',
                  maxLength: 5,
                  hint: 'Quantos usuários ativos podem ter o MEI habilitado ao mesmo tempo.',
                })
              : null}
            <SwitchField
              tokens={tokens}
              label="Usuários sem MEI ilimitados"
              value={form.naoMeiUnlimited}
              onValueChange={(naoMeiUnlimited) => set({ naoMeiUnlimited })}
              disabled={saving}
              hint="Usuários sem MEI usam só o app financeiro."
            />
            {!form.naoMeiUnlimited
              ? field('maxNaoMei', 'Máximo de usuários sem MEI', { keyboardType: 'number-pad', maxLength: 6 })
              : null}
          </FormGroup>

          <FormGroup tokens={tokens} title="Endereço e contato">
            {field('cep', 'CEP', { optional: true, keyboardType: 'number-pad', maxLength: 9 })}
            {field('logradouro', 'Logradouro', { optional: true })}
            {field('numero', 'Número', { optional: true })}
            {field('complemento', 'Complemento', { optional: true })}
            {field('bairro', 'Bairro', { optional: true })}
            {field('cidade', 'Cidade', { optional: true })}
            {field('estado', 'Estado (UF)', { optional: true, autoCapitalize: 'characters', maxLength: 2 })}
            {field('telefone', 'Telefone', { optional: true, keyboardType: 'phone-pad' })}
            {field('email', 'E-mail', { optional: true, keyboardType: 'email-address', autoCapitalize: 'none', autoCorrect: false })}
          </FormGroup>
        </>
      )}
    </FormShell>
  );
}

const styles = StyleSheet.create({
  center: { paddingVertical: 40, alignItems: 'center' },
  notice: { borderRadius: 12, padding: 12, gap: 8 },
  noticeText: { fontSize: 14, lineHeight: 19 },
  link: { fontSize: 15, fontWeight: '700' },
});
