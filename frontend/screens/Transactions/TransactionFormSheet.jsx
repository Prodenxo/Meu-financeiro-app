import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { ContaPickerField } from '@/components/contas/ContaPickerField';
import { MfDateField } from '@/components/ui/MfDateField';
import { formatCurrencyInput } from '@/lib/numberFormat';
import { parseMoney, toMoneyInput } from '@/lib/finance/money';
import { normalizarTipo, toDayKey } from '@/lib/finance/normalize';
import { isPaidStatus } from '@/lib/finance/transactions';
import {
  RECURRENCE_PRESETS,
  parseRecurrenceQuantity,
  recurrenceTotalLabel,
} from '@/lib/finance/transactionModal';
import { categoriesForTipo } from '@/lib/finance/transactionsScreen';
import { BottomSheet } from './BottomSheet';
import { TOUCH_MIN } from '../Dashboard/overview/overviewTokens';

const OBS_MAX = 500;

/** Estado inicial do formulário a partir do rascunho (`create` | `edit` | `duplicate` | `launch`). */
function initialValues(draft) {
  const tx = draft?.tx || {};
  const tipo = draft?.mode === 'create' && !tx.tipo ? 'saida' : normalizarTipo(tx.tipo);
  return {
    tipo,
    valor: tx.valor != null ? toMoneyInput(tx.valor) : '',
    classificacao: tx.classificacao || '',
    conta_id: tx.conta_id || null,
    data: String(tx.data || '').slice(0, 10) || toDayKey(new Date()),
    realizado: tx.status ? isPaidStatus(tx.status) : true,
    obs: tx.obs || '',
    recorrente: false,
    quantidade: '',
    quantidadeModo: 'sem_limite',
    google: false,
  };
}

/** Mesmas validações e mensagens do site (`saveTransactionAction`). */
export function validateTransactionForm(values, { allowRecurrence }) {
  const errors = {};
  const valor = parseMoney(values.valor);
  if (values.tipo !== 'entrada' && values.tipo !== 'saida') errors.tipo = 'Escolha entrada ou saída.';
  if (!Number.isFinite(valor) || valor <= 0) errors.valor = 'Informe um valor maior que zero.';
  if (!values.classificacao.trim()) errors.classificacao = 'Escolha uma categoria.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(values.data)) errors.data = 'Informe uma data válida.';
  if (allowRecurrence && values.recorrente && values.quantidadeModo === 'personalizado') {
    if (Number.isNaN(parseRecurrenceQuantity(values.quantidade)) || !values.quantidade) {
      errors.quantidade = 'Informe entre 1 e 1200 repetições ou deixe em branco para sem limite.';
    }
  }
  return errors;
}

function FieldLabel({ tokens, children }) {
  return <Text style={[styles.label, { color: tokens.textSecondary }]}>{children}</Text>;
}

function FieldError({ tokens, message }) {
  if (!message) return null;
  return (
    <Text style={[styles.error, { color: tokens.expense }]} accessibilityRole="alert">
      {message}
    </Text>
  );
}

function Segmented({ tokens, options, value, onChange, label }) {
  return (
    <View style={[styles.segmented, { backgroundColor: tokens.track }]} accessibilityRole="radiogroup" accessibilityLabel={label}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="radio"
            accessibilityState={{ checked: active }}
            style={[styles.segment, active && { backgroundColor: tokens.card }, active && tokens.shadow]}
          >
            <Text style={[styles.segmentText, { color: active ? o.color || tokens.text : tokens.textSecondary }]}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function SwitchRow({ tokens, label, hint, value, onChange }) {
  return (
    <View style={styles.switchRow}>
      <View style={styles.switchText}>
        <Text style={[styles.switchLabel, { color: tokens.text }]}>{label}</Text>
        {hint ? <Text style={[styles.hint, { color: tokens.textTertiary }]}>{hint}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        accessibilityLabel={label}
        trackColor={{ true: tokens.primary, false: tokens.track }}
        thumbColor="#ffffff"
      />
    </View>
  );
}

export function TransactionFormSheet({ tokens, draft, contas, categories, saving, onSubmit, onClose }) {
  const [values, setValues] = useState(() => initialValues(draft));
  const [errors, setErrors] = useState({});
  const mode = draft?.mode || 'create';
  const allowRecurrence = mode === 'create' || mode === 'duplicate';
  const set = (patch) => setValues((v) => ({ ...v, ...patch }));

  const options = useMemo(() => {
    const list = categoriesForTipo(categories, values.tipo).map((c) => c.nome.trim());
    const unique = [...new Set(list)];
    if (values.classificacao && !unique.includes(values.classificacao)) unique.unshift(values.classificacao);
    return unique;
  }, [categories, values.tipo, values.classificacao]);

  const entrada = values.tipo === 'entrada';
  const title =
    mode === 'edit' ? 'Editar transação' : mode === 'launch' ? 'Lançar recorrência' : 'Nova transação';

  const submit = () => {
    const nextErrors = validateTransactionForm(values, { allowRecurrence });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    const quantity =
      values.quantidadeModo === 'personalizado'
        ? parseRecurrenceQuantity(values.quantidade)
        : values.quantidadeModo === 'sem_limite'
          ? null
          : Number(values.quantidadeModo);
    onSubmit({
      ...values,
      valorNumber: parseMoney(values.valor),
      recorrente: allowRecurrence && values.recorrente,
      maxOcorrencias: quantity,
      google: !values.realizado && values.google,
    });
  };

  return (
    <BottomSheet
      visible
      onClose={saving ? () => {} : onClose}
      title={title}
      tokens={tokens}
      maxHeight="94%"
      footer={
        <Pressable
          onPress={submit}
          disabled={saving}
          accessibilityRole="button"
          accessibilityState={{ disabled: Boolean(saving), busy: Boolean(saving) }}
          style={({ pressed }) => [styles.primaryBtn, { backgroundColor: tokens.primary }, (pressed || saving) && { opacity: 0.85 }]}
        >
          {saving ? <ActivityIndicator color="#ffffff" /> : null}
          <Text style={styles.primaryText}>{saving ? 'Salvando…' : mode === 'edit' ? 'Salvar alterações' : 'Salvar'}</Text>
        </Pressable>
      }
    >
      <Segmented
        tokens={tokens}
        label="Tipo"
        value={values.tipo}
        onChange={(tipo) => set({ tipo, classificacao: tipo === values.tipo ? values.classificacao : '' })}
        options={[
          { value: 'saida', label: 'Saída', color: tokens.expense },
          { value: 'entrada', label: 'Entrada', color: tokens.income },
        ]}
      />
      <FieldError tokens={tokens} message={errors.tipo} />

      <View style={styles.field}>
        <FieldLabel tokens={tokens}>Valor</FieldLabel>
        <View style={[styles.input, styles.moneyInput, { borderColor: errors.valor ? tokens.expense : tokens.cardBorder, backgroundColor: tokens.card }]}>
          <Text style={[styles.currency, { color: tokens.textSecondary }]}>R$</Text>
          <TextInput
            value={values.valor}
            onChangeText={(t) => set({ valor: formatCurrencyInput(t) })}
            keyboardType="decimal-pad"
            placeholder="0,00"
            placeholderTextColor={tokens.textTertiary}
            style={[styles.moneyText, { color: tokens.text }]}
            accessibilityLabel="Valor"
          />
        </View>
        <FieldError tokens={tokens} message={errors.valor} />
      </View>

      <View style={styles.field}>
        <FieldLabel tokens={tokens}>Categoria</FieldLabel>
        {options.length ? (
          <View style={styles.options} accessibilityRole="radiogroup" accessibilityLabel="Categoria">
            {options.map((nome) => {
              const active = nome === values.classificacao;
              return (
                <Pressable
                  key={nome}
                  onPress={() => set({ classificacao: nome })}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: active }}
                  style={[
                    styles.option,
                    active
                      ? { backgroundColor: tokens.primarySoft, borderColor: tokens.primary }
                      : { backgroundColor: tokens.card, borderColor: tokens.cardBorder },
                  ]}
                >
                  <Text style={[styles.optionText, { color: active ? tokens.primary : tokens.text }]}>{nome}</Text>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <Text style={[styles.hint, { color: tokens.textTertiary }]}>
            Nenhuma categoria de {entrada ? 'entrada' : 'saída'} cadastrada. Crie uma em Categorias.
          </Text>
        )}
        <FieldError tokens={tokens} message={errors.classificacao} />
      </View>

      {contas.length ? (
        <ContaPickerField
          theme={tokens.theme}
          contas={contas}
          value={values.conta_id}
          onChange={(conta_id) => set({ conta_id })}
          optional
        />
      ) : null}

      <View style={styles.field}>
        <FieldLabel tokens={tokens}>Data</FieldLabel>
        <MfDateField value={values.data} onChange={(iso) => set({ data: iso || '' })} accessibilityLabel="Data" fullWidth />
        <FieldError tokens={tokens} message={errors.data} />
      </View>

      <SwitchRow
        tokens={tokens}
        label={entrada ? 'Já foi recebido' : 'Já foi pago'}
        hint={values.realizado ? null : entrada ? 'Fica como "A receber".' : 'Fica como "A pagar".'}
        value={values.realizado}
        onChange={(realizado) => set({ realizado })}
      />

      <View style={styles.field}>
        <FieldLabel tokens={tokens}>Observação (opcional)</FieldLabel>
        <TextInput
          value={values.obs}
          onChangeText={(obs) => set({ obs: obs.slice(0, OBS_MAX) })}
          placeholder="Ex.: mercado"
          placeholderTextColor={tokens.textTertiary}
          style={[styles.input, styles.obs, { borderColor: tokens.cardBorder, color: tokens.text, backgroundColor: tokens.card }]}
          multiline
          maxLength={OBS_MAX}
          accessibilityLabel="Observação"
        />
        <Text style={[styles.counter, { color: tokens.textTertiary }]}>
          {values.obs.length}/{OBS_MAX}
        </Text>
      </View>

      {allowRecurrence ? (
        <View style={[styles.box, { borderColor: tokens.cardBorder }]}>
          <SwitchRow
            tokens={tokens}
            label="Repetir todo mês"
            value={values.recorrente}
            onChange={(recorrente) => set({ recorrente })}
          />
          {values.recorrente ? (
            <>
              <View style={styles.options} accessibilityRole="radiogroup" accessibilityLabel="Quantidade de repetições">
                {[{ label: 'Sem limite', value: 'sem_limite' }, ...RECURRENCE_PRESETS, { label: 'Personalizar', value: 'personalizado' }].map(
                  (o) => {
                    const active = String(values.quantidadeModo) === String(o.value);
                    return (
                      <Pressable
                        key={String(o.value)}
                        onPress={() => set({ quantidadeModo: o.value })}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: active }}
                        style={[
                          styles.option,
                          active
                            ? { backgroundColor: tokens.primarySoft, borderColor: tokens.primary }
                            : { backgroundColor: tokens.card, borderColor: tokens.cardBorder },
                        ]}
                      >
                        <Text style={[styles.optionText, { color: active ? tokens.primary : tokens.text }]}>{o.label}</Text>
                      </Pressable>
                    );
                  },
                )}
              </View>
              {values.quantidadeModo === 'personalizado' ? (
                <TextInput
                  value={values.quantidade}
                  onChangeText={(t) => set({ quantidade: t.replace(/\D/g, '').slice(0, 4) })}
                  keyboardType="number-pad"
                  placeholder="Quantidade (1 a 1200)"
                  placeholderTextColor={tokens.textTertiary}
                  style={[styles.input, { borderColor: errors.quantidade ? tokens.expense : tokens.cardBorder, color: tokens.text, backgroundColor: tokens.card }]}
                  accessibilityLabel="Quantidade de repetições"
                />
              ) : null}
              <FieldError tokens={tokens} message={errors.quantidade} />
              <Text style={[styles.hint, { color: tokens.textTertiary }]}>
                {recurrenceTotalLabel(
                  values.quantidadeModo === 'sem_limite'
                    ? null
                    : values.quantidadeModo === 'personalizado'
                      ? parseRecurrenceQuantity(values.quantidade) || null
                      : Number(values.quantidadeModo),
                )}
              </Text>
            </>
          ) : null}
        </View>
      ) : null}

      {!values.realizado ? (
        <SwitchRow
          tokens={tokens}
          label="Lembrar no Google Agenda"
          hint="Cria um lembrete na sua agenda do Google para esta data."
          value={values.google}
          onChange={(google) => set({ google })}
        />
      ) : null}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600' },
  error: { fontSize: 13 },
  hint: { fontSize: 13, lineHeight: 18 },
  segmented: { flexDirection: 'row', borderRadius: 14, padding: 4, gap: 4 },
  segment: { flex: 1, minHeight: TOUCH_MIN, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  segmentText: { fontSize: 15, fontWeight: '700' },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, minHeight: TOUCH_MIN + 4, fontSize: 15 },
  moneyInput: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  currency: { fontSize: 16, fontWeight: '600' },
  moneyText: { flex: 1, fontSize: 20, fontWeight: '700', paddingVertical: 10 },
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
  obs: { minHeight: 72, paddingTop: 12, textAlignVertical: 'top' },
  counter: { fontSize: 12, alignSelf: 'flex-end' },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: TOUCH_MIN },
  switchText: { flex: 1, gap: 2 },
  switchLabel: { fontSize: 15, fontWeight: '600' },
  box: { borderWidth: 1, borderRadius: 14, padding: 12, gap: 10 },
  primaryBtn: {
    flexDirection: 'row',
    gap: 8,
    minHeight: 50,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
});
