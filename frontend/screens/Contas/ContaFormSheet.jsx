import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BankLogo } from '@/components/contas/BankLogo';
import { filterBanksByQuery, findBankById } from '@/lib/finance/bankCatalog';
import { CONTA_COR_PRESETS, CONTA_TIPO_OPTIONS, DEFAULT_CONTA_NOME } from '@/lib/finance/contasPage';
import {
  applyBankToForm,
  applyCustomToForm,
  contaFormInitial,
  validateContaForm,
} from '@/lib/finance/contasScreen';
import { BottomSheet } from '../Transactions/BottomSheet';
import { TOUCH_MIN } from '../Dashboard/overview/overviewTokens';

const MONEY_KEYBOARD = Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'numeric';

const catalogVisual = (bank) => ({ slug: bank.libraryNome, label: bank.nome, accent: bank.cor, logoUrl: null });

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

function BankPicker({ tokens, selectedId, customActive, onSelect, onCustom }) {
  const [query, setQuery] = useState('');
  const banks = useMemo(() => filterBanksByQuery(query), [query]);
  return (
    <View style={styles.field}>
      <FieldLabel tokens={tokens}>Banco ou instituição</FieldLabel>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Buscar banco…"
        placeholderTextColor={tokens.textTertiary}
        style={[styles.input, { borderColor: tokens.cardBorder, color: tokens.text, backgroundColor: tokens.card }]}
        accessibilityLabel="Buscar banco"
        autoCorrect={false}
        returnKeyType="search"
      />
      <View style={styles.bankGrid} accessibilityRole="radiogroup" accessibilityLabel="Bancos">
        {banks.map((bank) => {
          const active = selectedId === bank.id;
          return (
            <Pressable
              key={bank.id}
              onPress={() => onSelect(bank)}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
              accessibilityLabel={bank.nome}
              style={({ pressed }) => [
                styles.bankTile,
                { borderColor: active ? tokens.primary : tokens.cardBorder, backgroundColor: active ? tokens.primarySoft : tokens.card },
                pressed && { opacity: 0.8 },
              ]}
            >
              <BankLogo visual={catalogVisual(bank)} size={32} />
              <Text style={[styles.bankTileText, { color: tokens.text }]} numberOfLines={2}>
                {bank.nome}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {banks.length === 0 ? (
        <Text style={[styles.hint, { color: tokens.textSecondary }]}>Nenhum banco encontrado. Use “Outra conta”.</Text>
      ) : null}
      <Pressable
        onPress={onCustom}
        accessibilityRole="radio"
        accessibilityState={{ checked: customActive }}
        style={({ pressed }) => [
          styles.customTile,
          { borderColor: customActive ? tokens.primary : tokens.cardBorder, backgroundColor: customActive ? tokens.primarySoft : tokens.card },
          pressed && { opacity: 0.8 },
        ]}
      >
        <Ionicons name="wallet-outline" size={20} color={tokens.primary} />
        <View style={styles.customText}>
          <Text style={[styles.customTitle, { color: tokens.text }]}>Outra conta</Text>
          <Text style={[styles.hint, { color: tokens.textSecondary }]}>Nome personalizado, carteira, cofre…</Text>
        </View>
        {customActive ? <Ionicons name="checkmark" size={18} color={tokens.primary} /> : null}
      </Pressable>
    </View>
  );
}

/**
 * Cadastro/edição de conta. `serverErrors` (por campo) e `formError` vêm da última tentativa;
 * os campos continuam preenchidos quando a gravação falha.
 */
export function ContaFormSheet({ tokens, conta, saving, serverErrors, formError, onSubmit, onClose }) {
  const [form, setForm] = useState(() => contaFormInitial(conta));
  const [pickingBank, setPickingBank] = useState(() => !conta);
  const [localErrors, setLocalErrors] = useState({});
  const isEdit = Boolean(conta);
  const isCartao = form.tipo === 'cartao_credito';
  const selectedBank = form.mode === 'catalog' ? findBankById(form.bankId) : null;
  const errors = { ...(serverErrors || {}), ...localErrors };
  const patch = (p) => setForm((f) => ({ ...f, ...p }));

  const submit = () => {
    if (saving) return;
    const { errors: nextErrors, payload } = validateContaForm(form);
    setLocalErrors(nextErrors || {});
    if (nextErrors) return;
    onSubmit(payload);
  };

  const fieldBorder = (key) => (errors[key] ? tokens.expense : tokens.cardBorder);
  const inputStyle = (key) => [styles.input, { borderColor: fieldBorder(key), color: tokens.text, backgroundColor: tokens.card }];

  return (
    <BottomSheet
      visible
      onClose={saving ? () => {} : onClose}
      title={isEdit ? 'Editar conta' : 'Nova conta'}
      tokens={tokens}
      maxHeight="94%"
      footer={
        <Pressable
          onPress={submit}
          disabled={saving || !form.mode}
          accessibilityRole="button"
          accessibilityState={{ disabled: Boolean(saving || !form.mode), busy: Boolean(saving) }}
          style={({ pressed }) => [
            styles.primaryBtn,
            { backgroundColor: tokens.primary },
            (pressed || saving) && { opacity: 0.85 },
            !form.mode && { opacity: 0.5 },
          ]}
        >
          {saving ? <ActivityIndicator color="#ffffff" /> : null}
          <Text style={styles.primaryText}>{saving ? 'Salvando…' : 'Salvar conta'}</Text>
        </Pressable>
      }
    >
      {form.mode && !pickingBank ? (
        <Pressable
          onPress={() => setPickingBank(true)}
          accessibilityRole="button"
          accessibilityLabel="Trocar banco"
          style={({ pressed }) => [styles.selectedBank, { borderColor: tokens.cardBorder }, pressed && { opacity: 0.8 }]}
        >
          {selectedBank ? (
            <BankLogo visual={catalogVisual(selectedBank)} size={40} />
          ) : (
            <View style={[styles.customIcon, { backgroundColor: tokens.primarySoft }]}>
              <Ionicons name="wallet-outline" size={20} color={tokens.primary} />
            </View>
          )}
          <View style={styles.customText}>
            <Text style={[styles.customTitle, { color: tokens.text }]} numberOfLines={2}>
              {selectedBank ? selectedBank.nome : 'Outra conta'}
            </Text>
            <Text style={[styles.hint, { color: tokens.textSecondary }]}>Toque para trocar</Text>
          </View>
          <Ionicons name="swap-horizontal" size={18} color={tokens.primary} />
        </Pressable>
      ) : (
        <BankPicker
          tokens={tokens}
          selectedId={selectedBank?.id}
          customActive={form.mode === 'custom'}
          onSelect={(bank) => {
            setForm((f) => applyBankToForm(f, bank));
            setPickingBank(false);
          }}
          onCustom={() => {
            setForm((f) => applyCustomToForm(f, DEFAULT_CONTA_NOME));
            setPickingBank(false);
          }}
        />
      )}
      <FieldError tokens={tokens} message={errors.bank} />

      {form.mode === 'custom' ? (
        <View style={styles.field}>
          <FieldLabel tokens={tokens}>Nome</FieldLabel>
          <TextInput
            value={form.nome}
            onChangeText={(nome) => patch({ nome })}
            maxLength={60}
            placeholder="Ex.: Carteira, Cofre, Visa empresa"
            placeholderTextColor={tokens.textTertiary}
            style={inputStyle('nome')}
            accessibilityLabel="Nome da conta"
          />
          <FieldError tokens={tokens} message={errors.nome} />
        </View>
      ) : (
        <FieldError tokens={tokens} message={errors.nome} />
      )}

      {form.mode ? (
        <>
          <View style={styles.field}>
            <FieldLabel tokens={tokens}>Tipo</FieldLabel>
            <View style={styles.options} accessibilityRole="radiogroup" accessibilityLabel="Tipo da conta">
              {CONTA_TIPO_OPTIONS.map((opt) => {
                const active = form.tipo === opt.key;
                return (
                  <Pressable
                    key={opt.key}
                    onPress={() => patch({ tipo: opt.key })}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: active }}
                    style={[
                      styles.option,
                      { borderColor: active ? tokens.primary : tokens.cardBorder, backgroundColor: active ? tokens.primarySoft : tokens.card },
                    ]}
                  >
                    <Text style={[styles.optionText, { color: active ? tokens.primary : tokens.text }]}>{opt.label}</Text>
                  </Pressable>
                );
              })}
            </View>
            <FieldError tokens={tokens} message={errors.tipo} />
          </View>

          <View style={styles.field}>
            <FieldLabel tokens={tokens}>{isCartao ? 'Fatura atual / saldo (R$)' : 'Saldo inicial (R$)'}</FieldLabel>
            <TextInput
              value={form.saldo}
              onChangeText={(saldo) => patch({ saldo })}
              keyboardType={MONEY_KEYBOARD}
              placeholder="0,00"
              placeholderTextColor={tokens.textTertiary}
              style={inputStyle('saldo_inicial')}
              accessibilityLabel={isCartao ? 'Fatura atual ou saldo em reais' : 'Saldo inicial em reais'}
            />
            <Text style={[styles.hint, { color: tokens.textSecondary }]}>
              {isCartao ? 'Use valor negativo se a fatura estiver em aberto.' : 'Valor no dia em que você passou a usar o app.'}
            </Text>
            <FieldError tokens={tokens} message={errors.saldo_inicial} />
          </View>

          {isCartao ? (
            <>
              <View style={styles.field}>
                <FieldLabel tokens={tokens}>Limite (opcional)</FieldLabel>
                <TextInput
                  value={form.limite}
                  onChangeText={(limite) => patch({ limite })}
                  keyboardType="decimal-pad"
                  placeholder="0,00"
                  placeholderTextColor={tokens.textTertiary}
                  style={inputStyle('limite_credito')}
                  accessibilityLabel="Limite do cartão em reais"
                />
                <FieldError tokens={tokens} message={errors.limite_credito} />
              </View>
              <View style={styles.row2}>
                <View style={[styles.field, styles.flex1]}>
                  <FieldLabel tokens={tokens}>Fechamento (dia)</FieldLabel>
                  <TextInput
                    value={form.fechamento}
                    onChangeText={(fechamento) => patch({ fechamento: fechamento.replace(/\D/g, '') })}
                    keyboardType="number-pad"
                    maxLength={2}
                    placeholder="Ex.: 5"
                    placeholderTextColor={tokens.textTertiary}
                    style={inputStyle('dia_fechamento')}
                    accessibilityLabel="Dia de fechamento da fatura"
                  />
                  <FieldError tokens={tokens} message={errors.dia_fechamento} />
                </View>
                <View style={[styles.field, styles.flex1]}>
                  <FieldLabel tokens={tokens}>Vencimento (dia)</FieldLabel>
                  <TextInput
                    value={form.vencimento}
                    onChangeText={(vencimento) => patch({ vencimento: vencimento.replace(/\D/g, '') })}
                    keyboardType="number-pad"
                    maxLength={2}
                    placeholder="Ex.: 12"
                    placeholderTextColor={tokens.textTertiary}
                    style={inputStyle('dia_vencimento')}
                    accessibilityLabel="Dia de vencimento da fatura"
                  />
                  <FieldError tokens={tokens} message={errors.dia_vencimento} />
                </View>
              </View>
            </>
          ) : null}

          <View style={styles.field}>
            <FieldLabel tokens={tokens}>Cor</FieldLabel>
            <View style={styles.colors} accessibilityRole="radiogroup" accessibilityLabel="Cor da conta">
              {[...new Set([form.cor, ...CONTA_COR_PRESETS].filter(Boolean))].map((cor) => {
                const active = form.cor === cor;
                return (
                  <Pressable
                    key={cor}
                    onPress={() => patch({ cor })}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: active }}
                    accessibilityLabel={`Cor ${cor}`}
                    style={[styles.colorHit]}
                  >
                    <View
                      style={[
                        styles.colorDot,
                        { backgroundColor: cor, borderColor: active ? tokens.text : 'transparent' },
                      ]}
                    >
                      {active ? <Ionicons name="checkmark" size={16} color="#ffffff" /> : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
            <FieldError tokens={tokens} message={errors.cor} />
          </View>
        </>
      ) : null}

      {formError ? (
        <View style={[styles.formError, { backgroundColor: tokens.expenseSoft }]} accessibilityRole="alert">
          <Ionicons name="alert-circle-outline" size={18} color={tokens.expense} />
          <Text style={[styles.formErrorText, { color: tokens.text }]}>{formError}</Text>
        </View>
      ) : null}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600' },
  error: { fontSize: 13 },
  hint: { fontSize: 13, lineHeight: 18 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, minHeight: TOUCH_MIN + 4, fontSize: 15 },
  bankGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  bankTile: {
    flexBasis: '30%',
    flexGrow: 1,
    minHeight: 84,
    borderWidth: 1,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 8,
  },
  bankTileText: { fontSize: 12, fontWeight: '600', textAlign: 'center' },
  customTile: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 14, padding: 12, minHeight: TOUCH_MIN + 8 },
  customText: { flex: 1, gap: 2 },
  customTitle: { fontSize: 15, fontWeight: '700' },
  customIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  selectedBank: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 14, padding: 12, minHeight: TOUCH_MIN + 16 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: { minHeight: 40, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  optionText: { fontSize: 14, fontWeight: '600' },
  row2: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  flex1: { flex: 1, minWidth: 130 },
  colors: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  colorHit: { width: TOUCH_MIN, height: TOUCH_MIN, alignItems: 'center', justifyContent: 'center' },
  colorDot: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  formError: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', borderRadius: 12, padding: 12 },
  formErrorText: { flex: 1, fontSize: 14, lineHeight: 20 },
  primaryBtn: { flexDirection: 'row', gap: 8, minHeight: 50, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
});
