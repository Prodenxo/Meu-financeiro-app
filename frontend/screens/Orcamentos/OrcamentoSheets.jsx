import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCategoryIconName } from '@/lib/categoryIcons';
import { formatBrl } from '@/lib/finance/format';
import { nextMonth, prevMonth } from '@/lib/finance/dashboard';
import { budgetFormInitial, monthKey, monthTitle, validateBudgetForm } from '@/lib/finance/orcamentosScreen';
import { BottomSheet, SheetAction } from '../Transactions/BottomSheet';
import { TOUCH_MIN } from '../Dashboard/overview/overviewTokens';

function FieldError({ tokens, message }) {
  if (!message) return null;
  return (
    <Text style={[styles.error, { color: tokens.expense }]} accessibilityRole="alert">
      {message}
    </Text>
  );
}

function PrimaryButton({ tokens, label, busyLabel, busy, disabled, onPress }) {
  const off = busy || disabled;
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(off), busy: Boolean(busy) }}
      style={({ pressed }) => [
        styles.primaryBtn,
        { backgroundColor: tokens.primary },
        (pressed || busy) && { opacity: 0.85 },
        disabled && !busy && { opacity: 0.5 },
      ]}
    >
      {busy ? <ActivityIndicator color="#ffffff" /> : null}
      <Text style={styles.primaryText}>{busy ? busyLabel : label}</Text>
    </Pressable>
  );
}

function CategoryOption({ tokens, cat, selected, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      style={({ pressed }) => [
        styles.option,
        { borderColor: selected ? tokens.primary : tokens.cardBorder, backgroundColor: selected ? tokens.primarySoft : tokens.card },
        pressed && { opacity: 0.8 },
      ]}
    >
      <Ionicons name={getCategoryIconName(cat.nome)} size={20} color={cat.tipo === 'entrada' ? tokens.income : tokens.primary} />
      <Text style={[styles.optionText, { color: tokens.text }]} numberOfLines={2}>
        {cat.nome}
      </Text>
      {selected ? <Ionicons name="checkmark-circle" size={20} color={tokens.primary} /> : null}
    </Pressable>
  );
}

function CategoryPicker({ tokens, options, value, onChange }) {
  const groups = useMemo(
    () => [
      { id: 'saida', label: 'Despesas', list: options.filter((c) => c.tipo !== 'entrada') },
      { id: 'entrada', label: 'Receitas (meta)', list: options.filter((c) => c.tipo === 'entrada') },
    ],
    [options],
  );
  return (
    <View style={styles.pickerGroups} accessibilityRole="radiogroup" accessibilityLabel="Categoria">
      {groups.map((g) =>
        g.list.length ? (
          <View key={g.id} style={styles.pickerGroup}>
            <Text style={[styles.groupLabel, { color: tokens.textTertiary }]}>{g.label}</Text>
            {g.list.map((cat) => (
              <CategoryOption key={cat.id} tokens={tokens} cat={cat} selected={value === cat.id} onPress={() => onChange(cat.id)} />
            ))}
          </View>
        ) : null,
      )}
    </View>
  );
}

function PeriodPicker({ tokens, month, editable, onChange }) {
  const label = monthTitle(month);
  if (!editable) {
    return (
      <View style={[styles.period, { borderColor: tokens.cardBorder, backgroundColor: tokens.card }]}>
        <Ionicons name="calendar-outline" size={18} color={tokens.textSecondary} />
        <Text style={[styles.periodText, { color: tokens.text }]}>{label}</Text>
      </View>
    );
  }
  const arrow = (icon, a11y, target) => (
    <Pressable
      onPress={() => onChange(target)}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      hitSlop={4}
      style={({ pressed }) => [styles.periodArrow, pressed && { backgroundColor: tokens.track }]}
    >
      <Ionicons name={icon} size={20} color={tokens.primary} />
    </Pressable>
  );
  return (
    <View style={[styles.period, { borderColor: tokens.cardBorder, backgroundColor: tokens.card }]}>
      {arrow('chevron-back', 'Mês anterior', prevMonth(month))}
      <Text style={[styles.periodText, styles.periodCenter, { color: tokens.text }]} accessibilityLiveRegion="polite">
        {label}
      </Text>
      {arrow('chevron-forward', 'Próximo mês', nextMonth(month))}
    </View>
  );
}

/**
 * Novo / editar orçamento: categoria, mês e valor (os campos da tabela `orçamentos`).
 * Na edição categoria e mês ficam fixos (é o limite daquele mês). `allCategories` = categorias do usuário
 * para quando o mês escolhido não é o da tela (aí o servidor recusa categoria já orçada).
 */
export function BudgetFormSheet({ tokens, item, screenMonth, available, allCategories, saving, serverErrors, formError, onSubmit, onClose }) {
  const isEdit = Boolean(item);
  const [form, setForm] = useState(() => budgetFormInitial(item, screenMonth));
  const [localErrors, setLocalErrors] = useState({});
  const errors = { ...(serverErrors || {}), ...localErrors };
  const sameMonth = monthKey(form.month) === monthKey(screenMonth);
  const options = sameMonth ? available : allCategories;

  const patch = (next) => {
    setForm((f) => ({ ...f, ...next }));
    setLocalErrors({});
  };

  const submit = () => {
    if (saving) return;
    const { errors: nextErrors, payload } = validateBudgetForm(form, { isEdit, available: sameMonth ? available : null });
    setLocalErrors(nextErrors || {});
    if (!nextErrors) onSubmit(payload);
  };

  const noOptions = !isEdit && options.length === 0;

  return (
    <BottomSheet
      visible
      onClose={saving ? () => {} : onClose}
      title={isEdit ? 'Editar orçamento' : 'Novo orçamento'}
      tokens={tokens}
      footer={
        <PrimaryButton
          tokens={tokens}
          label={isEdit ? 'Salvar alterações' : 'Criar orçamento'}
          busyLabel="Salvando…"
          busy={saving}
          disabled={noOptions}
          onPress={submit}
        />
      }
    >
      <View style={styles.field}>
        <Text style={[styles.label, { color: tokens.textSecondary }]}>Mês</Text>
        <PeriodPicker tokens={tokens} month={form.month} editable={!isEdit && !saving} onChange={(month) => patch({ month, categoriaId: '' })} />
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: tokens.textSecondary }]}>Categoria</Text>
        {isEdit ? (
          <View style={[styles.option, { borderColor: tokens.cardBorder, backgroundColor: tokens.card }]}>
            <Ionicons name={getCategoryIconName(item.nome)} size={20} color={item.tipo === 'entrada' ? tokens.income : tokens.primary} />
            <Text style={[styles.optionText, { color: tokens.text }]}>{item.nome}</Text>
          </View>
        ) : noOptions ? (
          <Text style={[styles.hint, { color: tokens.textSecondary }]}>
            {allCategories.length === 0
              ? 'Você ainda não tem categorias. Crie uma em Categorias.'
              : `Todas as suas categorias já têm orçamento em ${monthTitle(form.month)}. Para mudar um limite, use o menu ⋮ do orçamento.`}
          </Text>
        ) : (
          <>
            {!sameMonth ? (
              <Text style={[styles.hint, { color: tokens.textSecondary }]}>
                Se a categoria já tiver orçamento em {monthTitle(form.month)}, o app avisa antes de gravar.
              </Text>
            ) : null}
            <CategoryPicker tokens={tokens} options={options} value={form.categoriaId} onChange={(categoriaId) => patch({ categoriaId })} />
          </>
        )}
        <FieldError tokens={tokens} message={errors.categorias_id} />
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: tokens.textSecondary }]}>
          {(isEdit ? item.tipo : options.find((c) => c.id === form.categoriaId)?.tipo) === 'entrada' ? 'Meta do mês (R$)' : 'Limite do mês (R$)'}
        </Text>
        <TextInput
          value={form.valor}
          onChangeText={(valor) => patch({ valor })}
          keyboardType="decimal-pad"
          placeholder="0,00"
          placeholderTextColor={tokens.textTertiary}
          editable={!saving}
          autoFocus={isEdit}
          returnKeyType="done"
          onSubmitEditing={submit}
          accessibilityLabel="Valor orçado em reais"
          style={[
            styles.input,
            { borderColor: errors.valor_orcado ? tokens.expense : tokens.cardBorder, color: tokens.text, backgroundColor: tokens.card },
          ]}
        />
        <FieldError tokens={tokens} message={errors.valor_orcado} />
      </View>

      <FieldError tokens={tokens} message={formError} />
    </BottomSheet>
  );
}

export function BudgetMenuSheet({ tokens, item, onClose, onEdit, onSeeTransactions, onDelete }) {
  if (!item) return null;
  return (
    <BottomSheet visible onClose={onClose} title={item.nome} tokens={tokens}>
      <View style={styles.actions}>
        <SheetAction tokens={tokens} icon="create-outline" label="Editar orçamento" onPress={() => onEdit(item)} />
        <SheetAction tokens={tokens} icon="list-outline" label="Ver lançamentos em Transações" onPress={() => onSeeTransactions(item)} />
        <SheetAction tokens={tokens} icon="trash-outline" label="Excluir orçamento" tone="danger" onPress={() => onDelete(item)} />
      </View>
    </BottomSheet>
  );
}

function PlanList({ tokens, title, rows, render }) {
  if (!rows.length) return null;
  return (
    <View style={styles.planGroup}>
      <Text style={[styles.groupLabel, { color: tokens.textTertiary }]}>{title}</Text>
      {rows.map((r) => (
        <View key={r.id} style={[styles.planRow, { borderColor: tokens.cardBorder }]}>
          <Text style={[styles.planName, { color: tokens.text }]} numberOfLines={2}>
            {r.nome}
          </Text>
          <Text style={[styles.planValue, { color: tokens.textSecondary }]}>{render(r)}</Text>
        </View>
      ))}
    </View>
  );
}

/**
 * Duplicar mês: origem (mês anterior) → destino (mês da tela). Mostra o que entra e o que mudaria antes de gravar.
 * Com limites diferentes no destino, a pessoa escolhe substituir ou manter os atuais.
 */
export function DuplicateSheet({ tokens, plan, loading, loadError, busy, error, onRetry, onConfirm, onClose }) {
  let content;
  let footer = null;
  if (loading) {
    content = (
      <View style={styles.busyRow} accessibilityRole="progressbar" accessibilityLabel="Carregando o mês anterior">
        <ActivityIndicator color={tokens.primary} />
        <Text style={[styles.hint, { color: tokens.textSecondary }]}>Carregando o mês anterior…</Text>
      </View>
    );
  } else if (loadError || !plan) {
    content = (
      <>
        <Text style={[styles.error, { color: tokens.expense }]} accessibilityRole="alert">
          {loadError?.message || 'Não foi possível carregar o mês anterior.'}
        </Text>
        <SheetAction tokens={tokens} icon="refresh" label="Tentar de novo" tone="accent" onPress={onRetry} />
      </>
    );
  } else {
    const nothing = plan.sourceCount === 0;
    const allSame = !nothing && plan.fresh.length === 0 && plan.changed.length === 0;
    content = (
      <>
        <View style={[styles.route, { backgroundColor: tokens.primarySoft }]}>
          <View style={styles.routeSide}>
            <Text style={[styles.routeLabel, { color: tokens.textSecondary }]}>De</Text>
            <Text style={[styles.routeMonth, { color: tokens.text }]}>{plan.sourceLabel}</Text>
          </View>
          <Ionicons name="arrow-forward" size={20} color={tokens.primary} />
          <View style={styles.routeSide}>
            <Text style={[styles.routeLabel, { color: tokens.textSecondary }]}>Para</Text>
            <Text style={[styles.routeMonth, { color: tokens.text }]}>{plan.targetLabel}</Text>
          </View>
        </View>
        {nothing ? (
          <Text style={[styles.hint, { color: tokens.textSecondary }]}>
            {plan.sourceLabel} não tem orçamentos para copiar.
          </Text>
        ) : allSame ? (
          <Text style={[styles.hint, { color: tokens.textSecondary }]}>
            {plan.targetLabel} já tem os mesmos limites de {plan.sourceLabel}. Nada a copiar.
          </Text>
        ) : (
          <>
            <Text style={[styles.hint, { color: tokens.textSecondary }]}>
              Só os limites são copiados. Lançamentos e valores realizados não mudam.
            </Text>
            <PlanList tokens={tokens} title="Serão criados" rows={plan.fresh} render={(r) => formatBrl(r.valor)} />
            <PlanList
              tokens={tokens}
              title={`Já têm outro limite em ${plan.targetLabel}`}
              rows={plan.changed}
              render={(r) => `${formatBrl(r.atual)} → ${formatBrl(r.novo)}`}
            />
            <PlanList tokens={tokens} title="Já iguais (sem mudança)" rows={plan.same} render={(r) => formatBrl(r.valor)} />
          </>
        )}
        <FieldError tokens={tokens} message={error} />
      </>
    );
    if (!nothing && !allSame) {
      footer = plan.changed.length ? (
        <View style={styles.footerCol}>
          <PrimaryButton
            tokens={tokens}
            label={`Substituir ${plan.changed.length === 1 ? 'o limite' : `${plan.changed.length} limites`} e copiar`}
            busyLabel="Copiando…"
            busy={busy === 'replace'}
            disabled={Boolean(busy)}
            onPress={() => onConfirm('replace')}
          />
          <Pressable
            onPress={() => onConfirm('keep')}
            disabled={Boolean(busy) || plan.fresh.length === 0}
            accessibilityRole="button"
            accessibilityState={{ disabled: Boolean(busy) || plan.fresh.length === 0, busy: busy === 'keep' }}
            style={({ pressed }) => [
              styles.secondaryBtn,
              { borderColor: tokens.primary },
              pressed && { opacity: 0.7 },
              (Boolean(busy) || plan.fresh.length === 0) && { opacity: 0.5 },
            ]}
          >
            {busy === 'keep' ? <ActivityIndicator color={tokens.primary} /> : null}
            <Text style={[styles.secondaryText, { color: tokens.primary }]}>
              {plan.fresh.length === 0 ? 'Nada novo para copiar' : 'Manter os atuais e copiar só os novos'}
            </Text>
          </Pressable>
        </View>
      ) : (
        <PrimaryButton
          tokens={tokens}
          label={`Copiar ${plan.fresh.length === 1 ? '1 limite' : `${plan.fresh.length} limites`}`}
          busyLabel="Copiando…"
          busy={busy === 'replace'}
          onPress={() => onConfirm('replace')}
        />
      );
    }
  }

  return (
    <BottomSheet visible onClose={busy ? () => {} : onClose} title="Duplicar mês" tokens={tokens} footer={footer}>
      {content}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  field: { gap: 8 },
  label: { fontSize: 13, fontWeight: '700' },
  hint: { fontSize: 14, lineHeight: 20, flexShrink: 1 },
  error: { fontSize: 13, lineHeight: 18 },
  input: {
    minHeight: TOUCH_MIN + 4,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 18,
    fontWeight: '600',
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : null),
  },
  pickerGroups: { gap: 12 },
  pickerGroup: { gap: 6 },
  groupLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: TOUCH_MIN + 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  optionText: { flex: 1, fontSize: 15, fontWeight: '600' },
  period: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: TOUCH_MIN + 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  periodArrow: { width: TOUCH_MIN, height: TOUCH_MIN, borderRadius: TOUCH_MIN / 2, alignItems: 'center', justifyContent: 'center' },
  periodText: { fontSize: 16, fontWeight: '700' },
  periodCenter: { flex: 1, textAlign: 'center' },
  actions: { gap: 2 },
  primaryBtn: {
    flexDirection: 'row',
    gap: 8,
    minHeight: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  primaryText: { color: '#ffffff', fontSize: 16, fontWeight: '700', textAlign: 'center', flexShrink: 1 },
  secondaryBtn: {
    flexDirection: 'row',
    gap: 8,
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  secondaryText: { fontSize: 15, fontWeight: '700', textAlign: 'center', flexShrink: 1 },
  footerCol: { gap: 10 },
  busyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48 },
  route: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, padding: 14 },
  routeSide: { flex: 1, minWidth: 0 },
  routeLabel: { fontSize: 12, fontWeight: '600' },
  routeMonth: { fontSize: 16, fontWeight: '800' },
  planGroup: { gap: 6 },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  planName: { flex: 1, fontSize: 15, fontWeight: '600' },
  planValue: { fontSize: 14, fontVariant: ['tabular-nums'], flexShrink: 0 },
});
