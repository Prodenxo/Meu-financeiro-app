import React, { useEffect, useState } from 'react';
import { View, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { AuthLayoutWeb } from '@/components/auth/AuthLayoutWeb';
import { AuthLayoutMobile } from '@/components/auth/AuthLayoutMobile';
import {
  AuthAlert,
  AuthBottomText,
  AuthButton,
  AuthDivider,
  AuthInput,
  AuthLink,
} from '@/components/auth/AuthFormControls';
import { getAuthPalette } from '@/components/auth/authTokens';
import { useThemeStore } from '@/store/themeStore';
import { useInviteTokenFromDeepLink } from '@/lib/registerInviteDeepLink';
import { AuthLegalFooter } from '@/components/AuthLegalFooter';

const TITLE = 'Bem-vindo de volta';
const SUBTITLE = 'Faça login para acessar sua conta.';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const signIn = useAuthStore((state) => state.signIn);
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  const palette = getAuthPalette(isDarkMode);
  const router = useRouter();
  const inviteToken = useInviteTokenFromDeepLink();
  const hasInvite = inviteToken.length > 0;

  useEffect(() => {
    if (hasInvite) {
      router.replace('/register');
    }
  }, [hasInvite, router]);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await signIn(email.trim(), password);
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
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
        returnKeyType="next"
      />
      <View>
        <AuthInput
          label="Senha"
          palette={palette}
          placeholder="Sua senha"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoComplete="current-password"
          textContentType="password"
          onSubmitEditing={handleLogin}
          returnKeyType="go"
          rightIconToggle={{
            iconWhenSecure: 'eye-off-outline',
            iconWhenVisible: 'eye-outline',
            isVisible: showPassword,
            onToggle: () => setShowPassword(!showPassword),
            accessibilityLabelShow: 'Mostrar senha',
            accessibilityLabelHide: 'Ocultar senha',
          }}
        />
        <View style={{ marginTop: 8, alignItems: 'flex-end' }}>
          <AuthLink
            label="Esqueci minha senha"
            palette={palette}
            align="right"
            onPress={() => router.push('/forgot')}
          />
        </View>
      </View>
      {error ? <AuthAlert kind="error" message={error} palette={palette} /> : null}
      <AuthButton
        label="Entrar"
        loadingLabel="Entrando…"
        loading={loading}
        onPress={handleLogin}
        palette={palette}
      />
      <AuthDivider palette={palette} />
      <AuthBottomText
        palette={palette}
        text="Ainda não tem conta?"
        linkLabel="Cadastre-se"
        onLinkPress={() => router.push('/solicitar-acesso')}
      />
      <AuthBottomText
        palette={palette}
        text="Recebeu um convite da sua empresa? Abra o link do convite para criar a conta."
      />
    </>
  );

  if (Platform.OS === 'web') {
    return (
      <AuthLayoutWeb title={TITLE} subtitle={SUBTITLE} showIllustration>
        {form}
        <AuthLegalFooter />
      </AuthLayoutWeb>
    );
  }

  return (
    <AuthLayoutMobile title={TITLE} subtitle={SUBTITLE} footer={<AuthLegalFooter />}>
      {form}
    </AuthLayoutMobile>
  );
}
