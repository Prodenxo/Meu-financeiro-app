import React from 'react'
import { View, Text, StyleSheet, Platform, KeyboardAvoidingView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { mfSpacing } from '../../lib/theme'
import { MfScrollView } from '../ui/MfScrollView'
import { BrandMark } from '../shell/BrandMark'
import {
  AUTH_FORM_PANEL_MAX_WIDTH,
  AUTH_FORM_WIDE_PANEL_MAX_WIDTH,
  authSpacing,
  authTypography,
  getAuthPalette,
} from './authTokens'
import { AuthEyebrow } from './AuthEyebrow'
import { AuthThemeToggle } from './AuthThemeToggle'
import { useThemeStore } from '../../store/themeStore'

export type AuthLayoutMobileProps = {
  title: string
  subtitle?: string
  eyebrowLabel?: string
  /** Formulários longos (solicitar acesso). */
  wide?: boolean
  /** Conteúdo abaixo do formulário (ex.: aviso de termos). */
  footer?: React.ReactNode
  children: React.ReactNode
}

/**
 * Layout das telas de acesso no celular — igual à versão mobile do `AuthShell` do site:
 * marca no topo, seletor de tema à direita e formulário direto sobre o fundo.
 */
export function AuthLayoutMobile ({
  title,
  subtitle,
  eyebrowLabel = 'Meu Financeiro',
  wide = false,
  footer,
  children,
}: AuthLayoutMobileProps) {
  const isDarkMode = useThemeStore((s) => s.isDarkMode)
  const palette = getAuthPalette(isDarkMode)
  const maxWidth = wide ? AUTH_FORM_WIDE_PANEL_MAX_WIDTH : AUTH_FORM_PANEL_MAX_WIDTH

  return (
    <View style={[styles.root, { backgroundColor: palette.bgCanvas }]}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.topBar}>
          <View style={styles.brand} accessibilityRole="header" accessibilityLabel="Meu Financeiro">
            <View style={[styles.brandMark, { backgroundColor: palette.brandSoft }]}>
              <BrandMark size={16} color={palette.linkText} />
            </View>
            <Text style={[styles.brandName, { color: palette.titleText }]}>Meu Financeiro</Text>
          </View>
          <AuthThemeToggle variant="inline" />
        </View>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
          <MfScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
          >
            <View style={[styles.formWrap, { maxWidth }]}>
              {eyebrowLabel ? (
                <AuthEyebrow label={eyebrowLabel} textColor={palette.eyebrowText} />
              ) : null}
              <Text style={[styles.title, { color: palette.titleText }]} accessibilityRole="header">
                {title}
              </Text>
              {subtitle ? (
                <Text style={[styles.subtitle, { color: palette.subtitleText }]}>{subtitle}</Text>
              ) : (
                <View style={styles.subtitleSpacer} />
              )}
              <View style={styles.content}>{children}</View>
              {footer ? <View style={styles.footer}>{footer}</View> : null}
            </View>
          </MfScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: mfSpacing.sm,
    paddingHorizontal: mfSpacing.md,
    paddingTop: mfSpacing.sm,
    paddingBottom: mfSpacing.sm,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  brandMark: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: authSpacing.cardPaddingHMobile,
    paddingTop: mfSpacing.lg,
    paddingBottom: mfSpacing.xl,
  },
  formWrap: {
    width: '100%',
    alignSelf: 'center',
  },
  title: {
    fontSize: authTypography.titleSize,
    fontWeight: authTypography.titleWeight,
    lineHeight: authTypography.titleLineHeight,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: authTypography.subtitleSize,
    fontWeight: authTypography.subtitleWeight,
    lineHeight: authTypography.subtitleLineHeight,
    marginTop: 8,
    marginBottom: authSpacing.headerMarginBottomMobile,
  },
  subtitleSpacer: {
    height: authSpacing.headerMarginBottomMobile,
  },
  content: {
    width: '100%',
    gap: authSpacing.fieldGap,
  },
  footer: {
    marginTop: authSpacing.footerMarginTop,
  },
})
