import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { LEGAL_PRIVACY_URL, LEGAL_TERMS_URL, openLegalUrl } from '@/lib/legalUrls';
import { useThemeStore } from '@/store/themeStore';
import { getAuthPalette } from '@/components/auth/authTokens';

/** Rodapé legal no login (iOS/Android). No web use AuthLegalFooter.web.tsx. */
export function AuthLegalFooter() {
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  const palette = getAuthPalette(isDarkMode);
  const linkStyle = [styles.link, { color: palette.subtitleText }];

  return (
    <Text style={[styles.text, { color: palette.footerText }]}>
      Ao clicar em Entrar, você concorda com nossa{' '}
      <Text
        style={linkStyle}
        onPress={() => openLegalUrl(LEGAL_PRIVACY_URL)}
        accessibilityRole="link"
        suppressHighlighting
      >
        Política de Privacidade
      </Text>
      {' '}e os{' '}
      <Text
        style={linkStyle}
        onPress={() => openLegalUrl(LEGAL_TERMS_URL)}
        accessibilityRole="link"
        suppressHighlighting
      >
        Termos de Uso
      </Text>
      .
    </Text>
  );
}

const styles = StyleSheet.create({
  text: { fontSize: 12, lineHeight: 18, textAlign: 'center' },
  link: { textDecorationLine: 'underline' },
});
