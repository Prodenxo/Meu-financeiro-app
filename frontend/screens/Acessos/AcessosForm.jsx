import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { TOUCH_MIN } from '../Dashboard/overview/overviewTokens';

/**
 * Formulário em tela cheia (área segura, teclado, rodapé fixo).
 * `picker` = { title, options, selected, onSelect, searchPlaceholder } troca o conteúdo por uma lista de escolha.
 */
export function FormShell({ tokens, title, saving, submitLabel, onSubmit, onClose, picker, onClosePicker, formError, children }) {
  const insets = useSafeAreaInsets();
  const requestClose = () => {
    if (picker) onClosePicker();
    else if (!saving) onClose();
  };
  return (
    <Modal visible animationType="slide" presentationStyle="fullScreen" onRequestClose={requestClose} statusBarTranslucent>
      <View style={[styles.root, { backgroundColor: tokens.canvas, paddingTop: insets.top }]}>
        <View style={styles.header}>
          <IconButton tokens={tokens} icon="chevron-back" label={picker ? 'Voltar ao formulário' : 'Voltar'} onPress={requestClose} disabled={saving && !picker} />
          <Text style={[styles.headerTitle, { color: tokens.text }]} accessibilityRole="header" numberOfLines={1}>
            {picker ? picker.title : title}
          </Text>
          <IconButton tokens={tokens} icon="close" label="Fechar" onPress={() => !saving && onClose()} disabled={saving} />
        </View>
        {picker ? (
          <View style={[styles.flex, { paddingBottom: insets.bottom }]}>
            <InlinePicker tokens={tokens} {...picker} />
          </View>
        ) : (
          <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
              {children}
              {formError ? (
                <Text style={[styles.formError, { color: tokens.expense, backgroundColor: tokens.expenseSoft }]} accessibilityRole="alert">
                  {formError}
                </Text>
              ) : null}
            </ScrollView>
            <View style={[styles.footer, { borderColor: tokens.cardBorder, backgroundColor: tokens.canvas, paddingBottom: Math.max(insets.bottom, 12) }]}>
              <Pressable
                onPress={onSubmit}
                disabled={saving}
                accessibilityRole="button"
                accessibilityState={{ disabled: Boolean(saving), busy: Boolean(saving) }}
                style={({ pressed }) => [styles.primaryBtn, { backgroundColor: tokens.primary }, (pressed || saving) && { opacity: 0.85 }]}
              >
                {saving ? <ActivityIndicator color="#ffffff" /> : null}
                <Text style={styles.primaryText}>{saving ? 'Salvando…' : submitLabel}</Text>
              </Pressable>
              <Pressable
                onPress={onClose}
                disabled={saving}
                accessibilityRole="button"
                style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.6 }, saving && { opacity: 0.4 }]}
              >
                <Text style={[styles.secondaryText, { color: tokens.primary }]}>Cancelar</Text>
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        )}
      </View>
    </Modal>
  );
}

function IconButton({ tokens, icon, label, onPress, disabled }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={4}
      style={({ pressed }) => [styles.iconBtn, pressed && { backgroundColor: tokens.track }, disabled && { opacity: 0.4 }]}
    >
      <Ionicons name={icon} size={24} color={tokens.text} />
    </Pressable>
  );
}

function InlinePicker({ tokens, options, selected, onSelect, searchPlaceholder }) {
  const [q, setQ] = useState('');
  const items = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return options;
    const digits = term.replace(/\D/g, '');
    return options.filter((o) => o.label.toLowerCase().includes(term) || (digits.length >= 2 && String(o.search || '').includes(digits)));
  }, [options, q]);
  return (
    <View style={styles.picker}>
      {searchPlaceholder ? (
        <View style={[styles.search, { backgroundColor: tokens.card, borderColor: tokens.cardBorder }]}>
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
      <FlatList
        data={items}
        keyExtractor={(o) => o.key}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        accessibilityRole="radiogroup"
        ListEmptyComponent={<Text style={[styles.hint, { color: tokens.textSecondary, textAlign: 'center', paddingVertical: 24 }]}>Nada encontrado.</Text>}
        renderItem={({ item }) => {
          const isSel = item.key === selected;
          return (
            <Pressable
              onPress={() => onSelect(item.key)}
              accessibilityRole="radio"
              accessibilityState={{ checked: isSel }}
              style={({ pressed }) => [styles.option, isSel && { backgroundColor: tokens.primarySoft }, pressed && { backgroundColor: tokens.track }]}
            >
              <View style={styles.optionText}>
                <Text style={[styles.optionLabel, { color: tokens.text }]} numberOfLines={2}>
                  {item.label}
                </Text>
                {item.sub ? (
                  <Text style={[styles.hint, { color: tokens.textSecondary }]} numberOfLines={2}>
                    {item.sub}
                  </Text>
                ) : null}
              </View>
              {isSel ? <Ionicons name="checkmark-circle" size={22} color={tokens.primary} /> : null}
            </Pressable>
          );
        }}
      />
    </View>
  );
}

export function FormGroup({ tokens, title, children }) {
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <View style={styles.groupWrap}>
      {title ? (
        <Text style={[styles.groupTitle, { color: tokens.textSecondary }]} accessibilityRole="header">
          {title}
        </Text>
      ) : null}
      <View style={[styles.group, { backgroundColor: tokens.card, borderColor: tokens.cardBorder }]}>
        {items.map((child, i) => (
          <React.Fragment key={child.key ?? i}>
            {i > 0 ? <View style={[styles.divider, { backgroundColor: tokens.cardBorder }]} /> : null}
            {child}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

export function TextField({ tokens, label, optional, hint, value, onChangeText, editable = true, ...inputProps }) {
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: tokens.text }]}>
        {label}
        {optional ? <Text style={{ color: tokens.textTertiary, fontWeight: '500' }}> (opcional)</Text> : null}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        editable={editable}
        placeholderTextColor={tokens.textTertiary}
        accessibilityLabel={optional ? `${label}, opcional` : label}
        style={[styles.input, { color: tokens.text, borderColor: tokens.cardBorder, backgroundColor: tokens.canvas }, !editable && { opacity: 0.6 }]}
        {...inputProps}
      />
      {hint ? <Text style={[styles.hint, { color: tokens.textSecondary }]}>{hint}</Text> : null}
    </View>
  );
}

export function SelectField({ tokens, label, value, placeholder, onPress, disabled, hint, icon = 'chevron-down' }) {
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: tokens.text }]}>{label}</Text>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityState={{ disabled: Boolean(disabled) }}
        accessibilityLabel={`${label}: ${value || placeholder}${disabled ? '' : '. Toque para escolher'}`}
        style={({ pressed }) => [
          styles.select,
          { borderColor: tokens.cardBorder, backgroundColor: tokens.canvas },
          disabled && { opacity: 0.6 },
          pressed && { opacity: 0.8 },
        ]}
      >
        <Text style={[styles.selectText, { color: value ? tokens.text : tokens.textTertiary }]} numberOfLines={1}>
          {value || placeholder}
        </Text>
        {disabled ? <Ionicons name="lock-closed-outline" size={16} color={tokens.textTertiary} /> : <Ionicons name={icon} size={18} color={tokens.textSecondary} />}
      </Pressable>
      {hint ? <Text style={[styles.hint, { color: tokens.textSecondary }]}>{hint}</Text> : null}
    </View>
  );
}

export function SwitchField({ tokens, label, hint, value, onValueChange, disabled }) {
  return (
    <View style={[styles.field, styles.switchRow]}>
      <View style={styles.switchText}>
        <Text style={[styles.label, { color: tokens.text }]}>{label}</Text>
        {hint ? <Text style={[styles.hint, { color: tokens.textSecondary }]}>{hint}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ true: tokens.primary, false: tokens.track }}
        thumbColor="#ffffff"
        accessibilityLabel={label}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, gap: 4 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '800', textAlign: 'center' },
  iconBtn: { width: TOUCH_MIN, height: TOUCH_MIN, borderRadius: TOUCH_MIN / 2, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, gap: 16, width: '100%', maxWidth: 560, alignSelf: 'center' },
  groupWrap: { gap: 6 },
  groupTitle: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginLeft: 4 },
  group: { borderRadius: 18, borderWidth: 1, paddingHorizontal: 16 },
  divider: { height: StyleSheet.hairlineWidth },
  field: { paddingVertical: 12, gap: 6 },
  label: { fontSize: 15, fontWeight: '700' },
  input: { minHeight: 50, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, fontSize: 16 },
  hint: { fontSize: 13, lineHeight: 18 },
  select: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 50, borderWidth: 1, borderRadius: 14, paddingHorizontal: 12 },
  selectText: { flex: 1, fontSize: 16, fontWeight: '600' },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  switchText: { flex: 1, gap: 2 },
  formError: { fontSize: 14, fontWeight: '600', padding: 12, borderRadius: 12, overflow: 'hidden' },
  footer: { paddingHorizontal: 16, paddingTop: 12, gap: 4, borderTopWidth: StyleSheet.hairlineWidth },
  primaryBtn: { flexDirection: 'row', gap: 8, minHeight: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  secondaryBtn: { minHeight: TOUCH_MIN, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { fontSize: 16, fontWeight: '700' },
  picker: { flex: 1, paddingHorizontal: 16, gap: 10 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 48, borderWidth: 1, borderRadius: 14, paddingHorizontal: 12 },
  searchInput: { flex: 1, fontSize: 16, paddingVertical: 10 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, paddingHorizontal: 8, borderRadius: 12 },
  optionText: { flex: 1, minWidth: 0 },
  optionLabel: { fontSize: 15, fontWeight: '700' },
});
