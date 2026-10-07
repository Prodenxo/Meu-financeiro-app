import React, { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCategoryIconName } from '@/lib/categoryIcons';
import {
  CATEGORY_NAME_MAX,
  CATEGORY_SHOWS,
  CATEGORY_SORTS,
  DEFAULT_CATEGORY_FILTERS,
  categoriaFormInitial,
  validateCategoriaForm,
} from '@/lib/finance/categoriasScreen';
import { BottomSheet, SheetAction } from '../Transactions/BottomSheet';
import { TOUCH_MIN } from '../Dashboard/overview/overviewTokens';

const TIPO_OPTIONS = [
  { id: 'saida', label: 'Saída' },
  { id: 'entrada', label: 'Entrada' },
];

function OptionChips({ tokens, options, value, onChange, label }) {
  return (
    <View style={styles.chips} accessibilityRole="radiogroup" accessibilityLabel={label}>
      {options.map((o) => {
        const active = value === o.id;
        return (
          <Pressable
            key={o.id}
            onPress={() => onChange(o.id)}
            accessibilityRole="radio"
            accessibilityState={{ checked: active }}
            style={({ pressed }) => [
              styles.chip,
              {
                borderColor: active ? tokens.primary : tokens.cardBorder,
                backgroundColor: active ? tokens.primarySoft : tokens.card,
              },
              pressed && { opacity: 0.8 },
            ]}
          >
            {active ? <Ionicons name="checkmark" size={16} color={tokens.primary} /> : null}
            <Text style={[styles.chipText, { color: active ? tokens.primary : tokens.text }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/**
 * Nova/editar categoria (nome + tipo, os campos que existem no banco). Ícone e cor não são gravados:
 * o app escolhe pelo nome e pelo id, como o site. Erros do servidor chegam em `serverErrors`/`formError`.
 */
export function CategoriaFormSheet({ tokens, categoria, defaultTipo, categories, saving, serverErrors, formError, onSubmit, onClose }) {
  const [form, setForm] = useState(() => categoriaFormInitial(categoria, defaultTipo));
  const [localErrors, setLocalErrors] = useState({});
  const isEdit = Boolean(categoria);
  const errors = { ...(serverErrors || {}), ...localErrors };

  const submit = () => {
    if (saving) return;
    const { errors: nextErrors, payload } = validateCategoriaForm(form, categories, categoria?.id);
    setLocalErrors(nextErrors || {});
    if (nextErrors) return;
    onSubmit(payload);
  };

  const previewName = form.nome.trim();

  return (
    <BottomSheet
      visible
      onClose={saving ? () => {} : onClose}
      title={isEdit ? 'Editar categoria' : 'Nova categoria'}
      tokens={tokens}
      footer={
        <Pressable
          onPress={submit}
          disabled={saving}
          accessibilityRole="button"
          accessibilityState={{ disabled: Boolean(saving), busy: Boolean(saving) }}
          style={({ pressed }) => [styles.primaryBtn, { backgroundColor: tokens.primary }, (pressed || saving) && { opacity: 0.85 }]}
        >
          {saving ? <ActivityIndicator color="#ffffff" /> : null}
          <Text style={styles.primaryText}>
            {saving ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Criar categoria'}
          </Text>
        </Pressable>
      }
    >
      <View style={styles.preview}>
        <View style={[styles.previewIcon, { backgroundColor: tokens.primarySoft }]}>
          <Ionicons name={getCategoryIconName(previewName || 'categoria')} size={24} color={tokens.primary} />
        </View>
        <Text style={[styles.hint, { color: tokens.textSecondary }]}>
          O ícone é escolhido automaticamente pelo nome.
        </Text>
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: tokens.textSecondary }]}>Nome</Text>
        <TextInput
          value={form.nome}
          onChangeText={(nome) => {
            setForm((f) => ({ ...f, nome }));
            if (localErrors.nome) setLocalErrors({});
          }}
          placeholder="Ex.: Mercado, Academia, Salário"
          placeholderTextColor={tokens.textTertiary}
          maxLength={CATEGORY_NAME_MAX}
          autoFocus={!isEdit}
          autoCapitalize="sentences"
          returnKeyType="done"
          onSubmitEditing={submit}
          editable={!saving}
          accessibilityLabel="Nome da categoria"
          style={[
            styles.input,
            { borderColor: errors.nome ? tokens.expense : tokens.cardBorder, color: tokens.text, backgroundColor: tokens.card },
          ]}
        />
        <View style={styles.fieldFoot}>
          {errors.nome ? (
            <Text style={[styles.error, { color: tokens.expense }]} accessibilityRole="alert">
              {errors.nome}
            </Text>
          ) : (
            <View />
          )}
          <Text style={[styles.counter, { color: tokens.textTertiary }]}>
            {form.nome.length}/{CATEGORY_NAME_MAX}
          </Text>
        </View>
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: tokens.textSecondary }]}>Tipo</Text>
        <OptionChips
          tokens={tokens}
          options={TIPO_OPTIONS}
          value={form.tipo}
          onChange={(tipo) => setForm((f) => ({ ...f, tipo }))}
          label="Tipo da categoria"
        />
        {errors.tipo ? (
          <Text style={[styles.error, { color: tokens.expense }]} accessibilityRole="alert">
            {errors.tipo}
          </Text>
        ) : null}
        {isEdit && form.tipo !== categoriaFormInitial(categoria).tipo ? (
          <Text style={[styles.hint, { color: tokens.warning }]}>
            Os lançamentos já feitos continuam com o tipo deles e podem aparecer em “Sem categoria”.
          </Text>
        ) : null}
      </View>

      {formError ? (
        <Text style={[styles.error, { color: tokens.expense }]} accessibilityRole="alert">
          {formError}
        </Text>
      ) : null}
    </BottomSheet>
  );
}

/** Ações de uma categoria; editar/excluir só para categorias do próprio usuário. */
export function CategoriaMenuSheet({ tokens, row, canManage, onClose, onEdit, onSeeTransactions, onDelete }) {
  if (!row) return null;
  return (
    <BottomSheet visible onClose={onClose} title={row.nome} tokens={tokens}>
      <View style={styles.actions}>
        {canManage ? (
          <SheetAction tokens={tokens} icon="create-outline" label="Editar categoria" onPress={() => onEdit(row)} />
        ) : null}
        <SheetAction tokens={tokens} icon="list-outline" label="Ver lançamentos em Transações" onPress={() => onSeeTransactions(row)} />
        {canManage ? (
          <SheetAction tokens={tokens} icon="trash-outline" label="Excluir categoria" tone="danger" onPress={() => onDelete(row)} />
        ) : (
          <Text style={[styles.hint, { color: tokens.textSecondary }]}>Esta categoria não pode ser alterada por você.</Text>
        )}
      </View>
    </BottomSheet>
  );
}

/** Ordenação e quais grupos aparecem; muda na hora. */
export function CategoriasFiltersSheet({ tokens, filters, onChange, onClose }) {
  const isDefault = filters.sort === DEFAULT_CATEGORY_FILTERS.sort && filters.show === DEFAULT_CATEGORY_FILTERS.show;
  return (
    <BottomSheet
      visible
      onClose={onClose}
      title="Filtros"
      tokens={tokens}
      footer={
        <View style={styles.footerRow}>
          <Pressable
            onPress={() => onChange(DEFAULT_CATEGORY_FILTERS)}
            disabled={isDefault}
            accessibilityRole="button"
            accessibilityState={{ disabled: isDefault }}
            style={({ pressed }) => [
              styles.secondaryBtn,
              { borderColor: tokens.cardBorder },
              (pressed || isDefault) && { opacity: isDefault ? 0.5 : 0.7 },
            ]}
          >
            <Text style={[styles.secondaryText, { color: tokens.text }]}>Limpar</Text>
          </Pressable>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            style={({ pressed }) => [styles.primaryBtn, styles.flex1, { backgroundColor: tokens.primary }, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.primaryText}>Pronto</Text>
          </Pressable>
        </View>
      }
    >
      <View style={styles.field}>
        <Text style={[styles.label, { color: tokens.textSecondary }]}>Ordenar por</Text>
        <OptionChips
          tokens={tokens}
          options={CATEGORY_SORTS}
          value={filters.sort}
          onChange={(sort) => onChange({ ...filters, sort })}
          label="Ordenar por"
        />
      </View>
      <View style={styles.field}>
        <Text style={[styles.label, { color: tokens.textSecondary }]}>Mostrar</Text>
        <OptionChips
          tokens={tokens}
          options={CATEGORY_SHOWS}
          value={filters.show}
          onChange={(show) => onChange({ ...filters, show })}
          label="Mostrar"
        />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  actions: { gap: 2 },
  preview: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  previewIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  field: { gap: 8 },
  label: { fontSize: 13, fontWeight: '700' },
  input: {
    minHeight: TOUCH_MIN + 4,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : null),
  },
  fieldFoot: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  counter: { fontSize: 12 },
  error: { fontSize: 13, flexShrink: 1 },
  hint: { fontSize: 13, lineHeight: 18, flexShrink: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: TOUCH_MIN,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: { fontSize: 15, fontWeight: '600' },
  primaryBtn: {
    flexDirection: 'row',
    gap: 8,
    minHeight: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  primaryText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  footerRow: { flexDirection: 'row', gap: 10 },
  flex1: { flex: 1 },
  secondaryBtn: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  secondaryText: { fontSize: 16, fontWeight: '700' },
});
