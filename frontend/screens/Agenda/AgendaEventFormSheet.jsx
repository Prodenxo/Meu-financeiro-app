import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MfDateField } from '@/components/ui/MfDateField';
import { GOOGLE_CALENDAR_COLORS, RECURRENCE_OPTIONS, REMINDER_OPTIONS, validateGoogleForm } from '@/lib/finance/agenda';
import { endAfterStart, TIME_SLOTS } from '@/lib/finance/agendaScreen';
import { BottomSheet } from '../Transactions/BottomSheet';
import { TOUCH_MIN } from '../Dashboard/overview/overviewTokens';

const TITLE_MAX = 200;
const CHIP_W = 68;
const CHIP_GAP = 8;

function Label({ tokens, children }) {
  return <Text style={[styles.label, { color: tokens.textSecondary }]}>{children}</Text>;
}

function FieldError({ tokens, message }) {
  if (!message) return null;
  return (
    <Text style={[styles.fieldError, { color: tokens.expense }]} accessibilityRole="alert">
      {message}
    </Text>
  );
}

function Chip({ tokens, label, selected, onPress, disabled }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled: Boolean(disabled) }}
      style={({ pressed }) => [
        styles.chip,
        { borderColor: selected ? tokens.primary : tokens.cardBorder, backgroundColor: selected ? tokens.primarySoft : tokens.card },
        pressed && { opacity: 0.75 },
      ]}
    >
      {selected ? <Ionicons name="checkmark" size={14} color={tokens.primary} /> : null}
      <Text style={[styles.chipText, { color: selected ? tokens.primary : tokens.text }]}>{label}</Text>
    </Pressable>
  );
}

/** Campo de horário: abre uma faixa de horários de 15 em 15 minutos (como o formulário atual). */
function TimeField({ tokens, label, value, onChange, open, onToggle }) {
  const scrollRef = useRef(null);
  useEffect(() => {
    if (!open) return;
    const index = Math.max(0, TIME_SLOTS.indexOf(value));
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ x: Math.max(0, index * (CHIP_W + CHIP_GAP) - 80), animated: false }));
  }, [open, value]);
  return (
    <View style={styles.timeWrap}>
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value}. Alterar horário`}
        accessibilityState={{ expanded: open }}
        style={({ pressed }) => [styles.input, styles.timeBtn, { borderColor: open ? tokens.primary : tokens.cardBorder, backgroundColor: tokens.card }, pressed && { opacity: 0.8 }]}
      >
        <Ionicons name="time-outline" size={16} color={tokens.textSecondary} />
        <Text style={[styles.timeText, { color: tokens.text }]}>{value}</Text>
      </Pressable>
      {open ? (
        <ScrollView ref={scrollRef} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.slots}>
          {TIME_SLOTS.map((slot) => {
            const selected = slot === value;
            return (
              <Pressable
                key={slot}
                onPress={() => onChange(slot)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                style={[styles.slot, { borderColor: selected ? tokens.primary : tokens.cardBorder, backgroundColor: selected ? tokens.primary : tokens.card }]}
              >
                <Text style={[styles.slotText, { color: selected ? '#ffffff' : tokens.text }]} maxFontSizeMultiplier={1.3}>
                  {slot}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}
    </View>
  );
}

/**
 * Formulário de compromisso (Google Agenda), adaptado para celular.
 * `isOccurrence`: edição de uma ocorrência de série — a repetição não se aplica a ela.
 */
export function AgendaEventFormSheet({ tokens, initialForm, isEdit, isOccurrence, saving, error, onSubmit, onClose }) {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [openTime, setOpenTime] = useState(null);
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const setStartDate = (iso) => {
    if (!iso) return;
    setForm((f) => ({ ...f, startDate: iso, endDate: !f.endDate || f.endDate < iso ? iso : f.endDate }));
  };
  const setStartTime = (slot) => setForm((f) => ({ ...f, startTime: slot, ...endAfterStart(f.startDate, slot) }));

  const submit = () => {
    const found = validateGoogleForm(form);
    setErrors(found);
    if (Object.keys(found).length) return;
    onSubmit(isOccurrence ? { ...form, recurrence: '' } : form);
  };

  const footer = (
    <>
      {error ? (
        <Text style={[styles.formError, { color: tokens.expense }]} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
      <Pressable
        onPress={submit}
        disabled={saving}
        accessibilityRole="button"
        accessibilityState={{ disabled: Boolean(saving), busy: Boolean(saving) }}
        style={({ pressed }) => [styles.saveBtn, { backgroundColor: tokens.primary }, (pressed || saving) && { opacity: 0.85 }]}
      >
        {saving ? <ActivityIndicator size="small" color="#ffffff" /> : null}
        <Text style={styles.saveText}>{saving ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Salvar compromisso'}</Text>
      </Pressable>
    </>
  );

  return (
    <BottomSheet
      visible
      onClose={saving ? () => {} : onClose}
      title={isEdit ? (isOccurrence ? 'Editar esta ocorrência' : 'Editar compromisso') : 'Novo compromisso'}
      tokens={tokens}
      footer={footer}
      maxHeight="94%"
    >
      <View style={styles.field}>
        <Label tokens={tokens}>Descrição</Label>
        <TextInput
          value={form.title}
          onChangeText={(title) => set({ title })}
          placeholder="Ex.: Reunião com o contador"
          placeholderTextColor={tokens.textTertiary}
          maxLength={TITLE_MAX}
          accessibilityLabel="Descrição do compromisso"
          style={[styles.input, { borderColor: errors.title ? tokens.expense : tokens.cardBorder, color: tokens.text, backgroundColor: tokens.card }]}
        />
        <FieldError tokens={tokens} message={errors.title} />
      </View>

      <View style={styles.switchRow}>
        <Text style={[styles.switchLabel, { color: tokens.text }]}>Dia inteiro</Text>
        <Switch
          value={form.isAllDay}
          onValueChange={(isAllDay) => {
            setOpenTime(null);
            set({ isAllDay, ...(isAllDay ? { createMeetLink: false } : null) });
          }}
          accessibilityLabel="Dia inteiro"
          trackColor={{ true: tokens.primary, false: tokens.track }}
          thumbColor="#ffffff"
        />
      </View>

      <View style={styles.field}>
        <Label tokens={tokens}>Início</Label>
        <MfDateField value={form.startDate} onChange={setStartDate} accessibilityLabel="Data de início" fullWidth />
        <FieldError tokens={tokens} message={errors.startDate} />
        {!form.isAllDay ? (
          <TimeField
            tokens={tokens}
            label="Hora de início"
            value={form.startTime}
            onChange={setStartTime}
            open={openTime === 'start'}
            onToggle={() => setOpenTime((v) => (v === 'start' ? null : 'start'))}
          />
        ) : null}
      </View>

      <View style={styles.field}>
        <Label tokens={tokens}>Término</Label>
        <MfDateField value={form.endDate} onChange={(iso) => iso && set({ endDate: iso })} accessibilityLabel="Data de término" fullWidth />
        <FieldError tokens={tokens} message={errors.endDate} />
        {!form.isAllDay ? (
          <TimeField
            tokens={tokens}
            label="Hora de término"
            value={form.endTime}
            onChange={(endTime) => set({ endTime })}
            open={openTime === 'end'}
            onToggle={() => setOpenTime((v) => (v === 'end' ? null : 'end'))}
          />
        ) : null}
        <FieldError tokens={tokens} message={errors.endTime} />
      </View>

      {isOccurrence ? (
        <Text style={[styles.note, { color: tokens.textSecondary }]}>
          Esta é uma ocorrência de uma série. As mudanças valem só para ela.
        </Text>
      ) : (
        <View style={styles.field}>
          <Label tokens={tokens}>Repetir</Label>
          <View style={styles.chips} accessibilityRole="radiogroup">
            {RECURRENCE_OPTIONS.map((opt) => (
              <Chip key={opt.value || 'none'} tokens={tokens} label={opt.label} selected={form.recurrence === opt.value} onPress={() => set({ recurrence: opt.value })} />
            ))}
          </View>
        </View>
      )}

      <View style={styles.field}>
        <Label tokens={tokens}>Lembrete</Label>
        <View style={styles.chips} accessibilityRole="radiogroup">
          {REMINDER_OPTIONS.map((opt) => (
            <Chip
              key={opt.value || 'none'}
              tokens={tokens}
              label={opt.label}
              selected={String(form.reminderMinutes ?? '') === opt.value}
              onPress={() => set({ reminderMinutes: opt.value })}
            />
          ))}
        </View>
      </View>

      <View style={styles.field}>
        <Label tokens={tokens}>Local</Label>
        <TextInput
          value={form.location}
          onChangeText={(location) => set({ location })}
          placeholder="Endereço ou sala (opcional)"
          placeholderTextColor={tokens.textTertiary}
          accessibilityLabel="Local"
          style={[styles.input, { borderColor: tokens.cardBorder, color: tokens.text, backgroundColor: tokens.card }]}
        />
      </View>

      <View style={styles.field}>
        <Label tokens={tokens}>Cor</Label>
        <View style={styles.colors} accessibilityRole="radiogroup">
          <Pressable
            onPress={() => set({ colorId: '' })}
            accessibilityRole="radio"
            accessibilityLabel="Cor padrão da agenda"
            accessibilityState={{ selected: !form.colorId }}
            style={[styles.swatch, { backgroundColor: tokens.card, borderColor: !form.colorId ? tokens.primary : tokens.cardBorder }]}
          >
            <Text style={[styles.swatchDefault, { color: tokens.textSecondary }]}>Padrão</Text>
          </Pressable>
          {GOOGLE_CALENDAR_COLORS.map((c) => {
            const selected = form.colorId === c.id;
            return (
              <Pressable
                key={c.id}
                onPress={() => set({ colorId: c.id })}
                accessibilityRole="radio"
                accessibilityLabel={`Cor ${c.name}`}
                accessibilityState={{ selected }}
                style={[styles.swatchRound, { borderColor: selected ? tokens.text : 'transparent' }]}
              >
                <View style={[styles.swatchInner, { backgroundColor: c.hex }]}>
                  {selected ? <Ionicons name="checkmark" size={16} color="#ffffff" /> : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.switchRow}>
        <View style={styles.switchText}>
          <Text style={[styles.switchLabel, { color: tokens.text }]}>Gerar link do Google Meet</Text>
          {form.isAllDay ? (
            <Text style={[styles.note, { color: tokens.textTertiary }]}>Disponível só para compromissos com horário.</Text>
          ) : null}
        </View>
        <Switch
          value={Boolean(form.createMeetLink) && !form.isAllDay}
          disabled={form.isAllDay}
          onValueChange={(createMeetLink) => set({ createMeetLink })}
          accessibilityLabel="Gerar link do Google Meet"
          trackColor={{ true: tokens.primary, false: tokens.track }}
          thumbColor="#ffffff"
        />
      </View>

      <View style={styles.field}>
        <Label tokens={tokens}>Detalhes</Label>
        <TextInput
          value={form.description}
          onChangeText={(description) => set({ description })}
          placeholder="Anotações (opcional)"
          placeholderTextColor={tokens.textTertiary}
          accessibilityLabel="Detalhes"
          multiline
          textAlignVertical="top"
          style={[styles.input, styles.textarea, { borderColor: tokens.cardBorder, color: tokens.text, backgroundColor: tokens.card }]}
        />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '700' },
  input: { minHeight: TOUCH_MIN + 4, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, fontSize: 15 },
  textarea: { minHeight: 96, paddingTop: 10 },
  fieldError: { fontSize: 13, fontWeight: '600' },
  formError: { fontSize: 14, fontWeight: '600' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: TOUCH_MIN, gap: 12 },
  switchText: { flex: 1, gap: 2 },
  switchLabel: { fontSize: 15, fontWeight: '600', flexShrink: 1 },
  timeWrap: { gap: 8 },
  timeBtn: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timeText: { fontSize: 15, fontWeight: '600', fontVariant: ['tabular-nums'] },
  slots: { gap: CHIP_GAP, paddingVertical: 2 },
  slot: { width: CHIP_W, minHeight: TOUCH_MIN, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  slotText: { fontSize: 14, fontWeight: '700', fontVariant: ['tabular-nums'] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 38, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1 },
  chipText: { fontSize: 13, fontWeight: '600' },
  colors: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  swatch: { minHeight: TOUCH_MIN, paddingHorizontal: 12, borderRadius: 999, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  swatchDefault: { fontSize: 13, fontWeight: '600' },
  swatchRound: { width: TOUCH_MIN, height: TOUCH_MIN, borderRadius: TOUCH_MIN / 2, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  swatchInner: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  note: { fontSize: 13 },
  saveBtn: { flexDirection: 'row', gap: 8, minHeight: TOUCH_MIN + 8, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  saveText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
});
