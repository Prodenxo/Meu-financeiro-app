import React from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { TOUCH_MIN } from '../Dashboard/overview/overviewTokens';

/** Painel que sobe de baixo, com título, fechar, rolagem e teclado tratados. */
export function BottomSheet({ visible, onClose, title, tokens, children, footer, maxHeight = '88%' }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Fechar" accessibilityRole="button" />
        <View
          style={[
            styles.sheet,
            { backgroundColor: tokens.card, maxHeight, paddingBottom: Math.max(insets.bottom, 12) },
          ]}
          accessibilityViewIsModal
        >
          <View style={[styles.handle, { backgroundColor: tokens.track }]} />
          <View style={styles.header}>
            <Text style={[styles.title, { color: tokens.text }]} accessibilityRole="header" numberOfLines={2}>
              {title}
            </Text>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Fechar"
              hitSlop={6}
              style={({ pressed }) => [styles.close, pressed && { opacity: 0.6 }]}
            >
              <Ionicons name="close" size={22} color={tokens.textSecondary} />
            </Pressable>
          </View>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
          {footer ? <View style={[styles.footer, { borderTopColor: tokens.cardBorder }]}>{footer}</View> : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/** Linha de ação de menu (ícone + texto), com área de toque mínima. */
export function SheetAction({ tokens, icon, label, onPress, tone = 'default', disabled }) {
  const color = tone === 'danger' ? tokens.expense : tone === 'accent' ? tokens.primary : tokens.text;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled) }}
      style={({ pressed }) => [styles.action, pressed && { backgroundColor: tokens.track }, disabled && { opacity: 0.5 }]}
    >
      <Ionicons name={icon} size={20} color={color} />
      <Text style={[styles.actionText, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15, 12, 41, 0.45)' },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 8 },
  header: { flexDirection: 'row', alignItems: 'center', paddingLeft: 20, paddingRight: 8, paddingTop: 4 },
  title: { flex: 1, fontSize: 18, fontWeight: '700' },
  close: { width: TOUCH_MIN, height: TOUCH_MIN, alignItems: 'center', justifyContent: 'center' },
  scroll: { flexGrow: 0 },
  content: { paddingHorizontal: 20, paddingBottom: 12, gap: 12 },
  footer: { paddingHorizontal: 20, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, gap: 8 },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: TOUCH_MIN + 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  actionText: { fontSize: 16, fontWeight: '600', flexShrink: 1 },
});
