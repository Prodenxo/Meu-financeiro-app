import React, { useState } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { AuthLayoutWeb } from '@/components/auth/AuthLayoutWeb';
import { AuthLayoutMobile } from '@/components/auth/AuthLayoutMobile';
import {
  AuthAlert,
  AuthButton,
  AuthInput,
  AuthLink,
} from '@/components/auth/AuthFormControls';
import { getAuthPalette } from '@/components/auth/authTokens';
import { useThemeStore } from '@/store/themeStore';

const TITLE = 'Recuperar senha';
const SUBTITLE = 'Digite seu e-mail para receber o link de recuperação.';

export default function ForgotScreen() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const resetPassword = useAuthStore((state) => state.resetPassword);
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  const palette = getAuthPalette(isDarkMode);
  const router = useRouter();

  const handleResetPassword = async () => {
    if (!email) {
      setError('Por favor, informe seu e-mail.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      await resetPassword(email.trim());
      setSuccessMessage(
        'Se este e-mail estiver cadastrado, enviamos um link de recuperação. ' +
          'Verifique a caixa de entrada e o spam. E-mails @hotmail/@outlook podem demorar ou ir para lixo eletrônico. ' +
          'Aguarde 1 minuto entre tentativas. O link expira em cerca de 1 hora.',
      );
      setEmail('');
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar link de recuperação.');
    } finally {
      setLoading(false);
    }
  };

  const goToLogin = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/login');
  };

  const form = (
    <>
      <AuthInput
        label="E-mail"
        palette={palette}
        placeholder="seu@email.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        onSubmitEditing={handleResetPassword}
        returnKeyType="go"
      />
      {error ? <AuthAlert kind="error" message={error} palette={palette} /> : null}
      {successMessage ? <AuthAlert kind="success" message={successMessage} palette={palette} /> : null}
      <AuthButton
        label="Enviar link de recuperação"
        loadingLabel="Enviando…"
        loading={loading}
        onPress={handleResetPassword}
        palette={palette}
      />
      <AuthLink label="Voltar ao login" align="center" palette={palette} onPress={goToLogin} />
    </>
  );

  if (Platform.OS === 'web') {
    return (
      <AuthLayoutWeb title={TITLE} subtitle={SUBTITLE} showIllustration>
        {form}
      </AuthLayoutWeb>
    );
  }

  return (
    <AuthLayoutMobile title={TITLE} subtitle={SUBTITLE} eyebrowLabel="Recuperação">
      {form}
    </AuthLayoutMobile>
  );
}
