import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ACCOUNT_DELETE_ITEMS, ACCOUNT_DELETE_WORD, isAccountDeleteConfirmed } from '@/lib/accountDeletion';
import { BottomSheet } from '../Transactions/BottomSheet';
import { TOUCH_MIN } from '../Dashboard/overview/overviewTokens';

/** Confirmação da exclusão da conta: o que some, campo "EXCLUIR" e botão vermelho. */
export function DeleteAccountSheet({ tokens, email, busy, error, onConfirm, onClose }) {
  const [text, setText] = useState('');
  const confirmed = isAccountDeleteConfirmed(text);
  const canSubmit = confirmed && !busy;

  const footer = (
    <>
      <Pressable
        onPress={() => onConfirm(text)}
        disabled={!canSubmit}
        accessibilityRole="button"
        accessibilityLabel="Excluir minha conta definitivamente"
        accessibilityState={{ disabled: !canSubmit, busy: Boolean(busy) }}
        style={({ pressed }) => [
          styles.dangerBtn,
          { backgroundColor: confirmed ? tokens.expense : tokens.track },
          (pressed || busy) && confirmed && { opacity: 0.85 },
        ]}
      >
        {busy ? <ActivityIndicator size="small" color="#ffffff" /> : <Ionicons name="trash-outline" size={18} color={confirmed ? '#ffffff' : tokens.textTertiary} />}
        <Text style={[styles.dangerText, { color: confirmed ? '#ffffff' : tokens.textTertiary }]}>
          {busy ? 'Excluindo…' : 'Excluir minha conta'}
        </Text>
      </Pressable>
      <Pressable
        onPress={onClose}
        disabled={busy}
        accessibilityRole="button"
        style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.6 }]}
      >
        <Text style={[styles.cancelText, { color: tokens.text }]}>Cancelar</Text>
      </Pressable>
    </>
  );

  return (
    <BottomSheet visible onClose={busy ? () => {} : onClose} title="Excluir sua conta?" tokens={tokens} footer={footer}>
      <View style={[styles.warning, { backgroundColor: tokens.isDarkMode ? 'rgba(239,68,68,0.14)' : '#fdecec' }]}>
        <Ionicons name="warning-outline" size={20} color={tokens.expense} />
        <Text style={[styles.warningText, { color: tokens.expense }]}>Isso não pode ser desfeito.</Text>
      </View>

      <Text style={[styles.body, { color: tokens.textSecondary }]}>
        {email ? `A conta ${email} e tudo o que está nela serão apagados:` : 'Sua conta e tudo o que está nela serão apagados:'}
      </Text>
      <View style={styles.list}>
        {ACCOUNT_DELETE_ITEMS.map((item) => (
          <View key={item} style={styles.listItem}>
            <Ionicons name="close-circle-outline" size={18} color={tokens.textSecondary} />
            <Text style={[styles.listText, { color: tokens.text }]}>{item}</Text>
          </View>
        ))}
      </View>

      <Text style={[styles.label, { color: tokens.text }]}>
        Para confirmar, digite <Text style={styles.word}>{ACCOUNT_DELETE_WORD}</Text>
      </Text>
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder={ACCOUNT_DELETE_WORD}
        placeholderTextColor={tokens.textTertiary}
        autoCapitalize="characters"
        autoCorrect={false}
        editable={!busy}
        accessibilityLabel={`Digite ${ACCOUNT_DELETE_WORD} para confirmar`}
        style={[styles.input, { color: tokens.text, borderColor: error ? tokens.expense : tokens.cardBorder, backgroundColor: tokens.canvas }]}
      />

      {error ? (
        <View style={styles.errorRow} accessibilityRole="alert" accessibilityLiveRegion="polite">
          <Ionicons name="alert-circle" size={16} color={tokens.expense} />
          <Text style={[styles.errorText, { color: tokens.expense }]}>{error}</Text>
        </View>
      ) : null}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  warning: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  warningText: { fontSize: 15, fontWeight: '700' },
  body: { fontSize: 14, lineHeight: 20 },
  list: { gap: 8 },
  listItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  listText: { flex: 1, fontSize: 14, lineHeight: 20 },
  label: { fontSize: 14, fontWeight: '600', marginTop: 4 },
  word: { fontWeight: '800', letterSpacing: 0.5 },
  input: { borderWidth: 1, borderRadius: 12, minHeight: TOUCH_MIN + 4, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, letterSpacing: 1 },
  errorRow: { flexDirection: 'row', gap: 6, alignItems: 'flex-start' },
  errorText: { flex: 1, fontSize: 13, lineHeight: 18, fontWeight: '600' },
  dangerBtn: { flexDirection: 'row', gap: 8, minHeight: TOUCH_MIN + 4, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  dangerText: { fontSize: 15, fontWeight: '700' },
  cancelBtn: { minHeight: TOUCH_MIN, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontSize: 15, fontWeight: '600' },
});
