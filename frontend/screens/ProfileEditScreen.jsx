import React, { useMemo, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { supabase } from '@/lib/supabase';
import { goBackToSettings } from '@/lib/settingsRoutes';
import { phoneSaveErrorMessage, validateDisplayName, validateEmailChange, validatePhone } from '@/lib/settingsProfile';
import { PhoneField } from '@/components/settings/PhoneField';
import { getOverviewTokens, TOUCH_MIN } from './Dashboard/overview/overviewTokens';
import { SettingsTopBar } from './Settings/SettingsRows';

const CONTENT_MAX = 720;

/** Estado de envio de um campo: idle | saving | success | error. */
function useFieldSave() {
  const [state, setState] = useState({ status: 'idle', message: '' });
  return {
    ...state,
    saving: state.status === 'saving',
    start: () => setState({ status: 'saving', message: '' }),
    fail: (message) => setState({ status: 'error', message }),
    succeed: (message) => setState({ status: 'success', message }),
    reset: () => setState((s) => (s.status === 'idle' ? s : { status: 'idle', message: '' })),
  };
}

function FieldCard({ tokens, label, hint, children, feedback, saving, canSave, onSave, saveLabel = 'Salvar' }) {
  const isError = feedback.status === 'error';
  return (
    <View style={[styles.card, { backgroundColor: tokens.card, borderColor: tokens.cardBorder, shadowColor: tokens.shadow }]}>
      <Text style={[styles.label, { color: tokens.textSecondary }]}>{label}</Text>
      {children}
      {hint ? <Text style={[styles.hint, { color: tokens.textSecondary }]}>{hint}</Text> : null}
      {feedback.message ? (
        <View style={styles.feedback} accessibilityLiveRegion="polite" accessibilityRole={isError ? 'alert' : undefined}>
          <Ionicons name={isError ? 'alert-circle' : 'checkmark-circle'} size={16} color={isError ? tokens.expense : tokens.income} />
          <Text style={[styles.feedbackText, { color: isError ? tokens.expense : tokens.income }]}>{feedback.message}</Text>
        </View>
      ) : null}
      <Pressable
        onPress={onSave}
        disabled={!canSave || saving}
        accessibilityRole="button"
        accessibilityLabel={`${saveLabel}: ${label}`}
        accessibilityState={{ disabled: !canSave || saving, busy: saving }}
        style={({ pressed }) => [
          styles.saveBtn,
          { backgroundColor: canSave ? tokens.primary : tokens.track },
          (pressed || saving) && { opacity: 0.85 },
        ]}
      >
        {saving ? <ActivityIndicator size="small" color="#ffffff" /> : null}
        <Text style={[styles.saveText, { color: canSave ? '#ffffff' : tokens.textTertiary }]}>{saving ? 'Salvando…' : saveLabel}</Text>
      </Pressable>
    </View>
  );
}

export default function ProfileEditScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const phone = useAuthStore((s) => s.phone);
  const displayName = useAuthStore((s) => s.displayName);
  const updateDisplayName = useAuthStore((s) => s.updateDisplayName);
  const updatePhone = useAuthStore((s) => s.updatePhone);
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  const tokens = useMemo(() => getOverviewTokens(isDarkMode), [isDarkMode]);

  const currentEmail = user?.email || '';
  const pendingEmail = user?.new_email || '';

  const [name, setName] = useState(displayName || '');
  const [phoneValue, setPhoneValue] = useState(phone || '');
  const [email, setEmail] = useState(currentEmail);
  const nameSave = useFieldSave();
  const phoneSave = useFieldSave();
  const emailSave = useFieldSave();

  const nameDirty = name.trim() !== (displayName || '').trim() && name.trim().length > 0;
  const phoneDirty = phoneValue.replace(/\D/g, '') !== (phone || '').replace(/\D/g, '');
  const emailTrimmed = email.trim();
  const emailDirty = emailTrimmed.length > 0 && emailTrimmed.toLowerCase() !== currentEmail.toLowerCase();

  const saveName = async () => {
    const error = validateDisplayName(name, displayName);
    if (error) return nameSave.fail(error);
    nameSave.start();
    try {
      await updateDisplayName(name.trim());
      nameSave.succeed('Nome atualizado.');
    } catch (e) {
      nameSave.fail(e?.message || 'Erro ao salvar nome. Por favor, tente novamente.');
    }
  };

  const savePhone = async () => {
    const result = validatePhone(phoneValue, phone);
    if (result.error) return phoneSave.fail(result.error);
    phoneSave.start();
    try {
      await updatePhone(result.digits);
      phoneSave.succeed('Telefone atualizado.');
    } catch (e) {
      phoneSave.fail(phoneSaveErrorMessage(e));
    }
  };

  const saveEmail = async () => {
    const error = validateEmailChange(email, currentEmail);
    if (error) return emailSave.fail(error);
    emailSave.start();
    try {
      const { data, error: updateError } = await supabase.auth.updateUser({ email: emailTrimmed });
      if (updateError) throw updateError;
      if (data?.user) useAuthStore.setState({ user: data.user });
      emailSave.succeed(`Enviamos um link de confirmação para ${emailTrimmed}. O e-mail só passa a valer após você clicar no link.`);
    } catch (e) {
      emailSave.fail(e?.message || 'Erro ao alterar e-mail. Por favor, tente novamente.');
    }
  };

  const inputStyle = (hasError) => [
    styles.input,
    { color: tokens.text, borderColor: hasError ? tokens.expense : tokens.cardBorder, backgroundColor: tokens.canvas },
  ];

  const emailHint = emailDirty && emailSave.status !== 'success'
    ? `Ao salvar, enviaremos um link de confirmação para ${emailTrimmed}. O e-mail só passa a valer após você clicar no link.`
    : pendingEmail && pendingEmail.toLowerCase() !== currentEmail.toLowerCase()
      ? `Aguardando confirmação de ${pendingEmail}. Abra o link enviado para concluir a troca.`
      : null;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: tokens.canvas }]} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.root} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <SettingsTopBar
            tokens={tokens}
            title="Dados pessoais"
            subtitle="Nome, telefone e e-mail de acesso"
            displayName={displayName || currentEmail}
            onBack={() => goBackToSettings(router)}
          />

          <FieldCard tokens={tokens} label="Nome" feedback={nameSave} saving={nameSave.saving} canSave={nameDirty} onSave={() => void saveName()}>
            <TextInput
              value={name}
              onChangeText={(v) => {
                setName(v);
                nameSave.reset();
              }}
              placeholder="Seu nome"
              placeholderTextColor={tokens.textTertiary}
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
              editable={!nameSave.saving}
              accessibilityLabel="Nome"
              style={inputStyle(nameSave.status === 'error')}
            />
          </FieldCard>

          <FieldCard
            tokens={tokens}
            label="Telefone (WhatsApp)"
            hint="Usado para falar com o agente no WhatsApp."
            feedback={phoneSave}
            saving={phoneSave.saving}
            canSave={phoneDirty}
            onSave={() => void savePhone()}
          >
            <PhoneField
              tokens={tokens}
              value={phoneValue}
              editable={!phoneSave.saving}
              error={phoneSave.status === 'error'}
              onChange={(v) => {
                setPhoneValue(v);
                phoneSave.reset();
              }}
            />
          </FieldCard>

          <FieldCard
            tokens={tokens}
            label="E-mail de acesso"
            hint={emailHint}
            feedback={emailSave}
            saving={emailSave.saving}
            canSave={emailDirty && emailSave.status !== 'success'}
            onSave={() => void saveEmail()}
            saveLabel="Alterar e-mail"
          >
            <TextInput
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                emailSave.reset();
              }}
              placeholder="seu@email.com"
              placeholderTextColor={tokens.textTertiary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              editable={!emailSave.saving}
              accessibilityLabel="E-mail de acesso"
              style={inputStyle(emailSave.status === 'error')}
            />
          </FieldCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32, gap: 16, width: '100%', maxWidth: CONTENT_MAX, alignSelf: 'center' },
  card: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    gap: 10,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 1,
  },
  label: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  input: { borderWidth: 1, borderRadius: 12, minHeight: TOUCH_MIN + 4, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16 },
  hint: { fontSize: 13, lineHeight: 18 },
  feedback: { flexDirection: 'row', gap: 6, alignItems: 'flex-start' },
  feedbackText: { flex: 1, fontSize: 13, lineHeight: 18, fontWeight: '600' },
  saveBtn: { flexDirection: 'row', gap: 8, alignSelf: 'flex-end', minHeight: TOUCH_MIN, paddingHorizontal: 18, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  saveText: { fontSize: 15, fontWeight: '700' },
});
