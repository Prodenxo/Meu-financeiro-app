/**
 * Tokens das telas de acesso — derivados do tema (paleta do site, `web/components/auth/auth.module.css`).
 */

import { getTheme, mfRadius, mfSpacing, mfWebShadow } from '../../lib/theme'

export const AUTH_ILLUSTRATION_URL =
  'https://ik.imagekit.io/qdohqf5kl/Capa%20-%20financas%20pessoais.png?updatedAt=1749862004209'

export const AUTH_BREAKPOINT_MD = 768
export const AUTH_BREAKPOINT_LG = 1024
/** Coluna da página no canvas (não é um card único). */
export const AUTH_PAGE_MAX_WIDTH = 1120
/** Largura do formulário (igual ao `.formWrap` do site). */
export const AUTH_FORM_PANEL_MAX_WIDTH = 420
/** Formulários longos (solicitar acesso). */
export const AUTH_FORM_WIDE_PANEL_MAX_WIDTH = 720
/** Largura mínima da viewport para grid em 2 colunas. */
export const AUTH_FORM_TWO_COL_MIN_WIDTH = 560

export const AUTH_ILLUSTRATION_HEADLINE = 'Seu dinheiro organizado, mês a mês.'
export const AUTH_ILLUSTRATION_SUBHEADLINE =
  'Controle pessoal e da sua empresa, com acompanhamento da CF Contabilidade.'

export type AuthPalette = {
  bgCanvas: string
  cardBg: string
  cardBorder: string
  cardShadow: string
  titleText: string
  subtitleText: string
  labelText: string
  iconNeutral: string
  inputBorder: string
  inputBg: string
  inputText: string
  inputPlaceholder: string
  inputBorderFocus: string
  inputRingFocus: string
  primaryButton: string
  primaryButtonHover: string
  primaryButtonText: string
  linkText: string
  linkHoverText: string
  footerText: string
  dividerLine: string
  brandSoft: string
  alertErrorBg: string
  alertErrorBorder: string
  alertErrorText: string
  alertSuccessBg: string
  alertSuccessBorder: string
  alertSuccessText: string
  alertSuccessTitle: string
  eyebrowDot: string
  eyebrowText: string
}

function buildPalette (isDarkMode: boolean): AuthPalette {
  const t = getTheme(isDarkMode)
  return {
    bgCanvas: t.background,
    cardBg: t.card,
    cardBorder: t.border,
    cardShadow: mfWebShadow(isDarkMode, 'card'),
    titleText: t.text,
    subtitleText: t.textSecondary,
    labelText: t.textSecondary,
    iconNeutral: t.textSecondary,
    inputBorder: t.borderStrong,
    inputBg: t.surface,
    inputText: t.text,
    inputPlaceholder: t.textTertiary,
    inputBorderFocus: t.primary,
    inputRingFocus: t.primaryRing,
    primaryButton: t.primary,
    primaryButtonHover: t.primaryHover,
    primaryButtonText: t.textOnDark,
    linkText: t.primary,
    linkHoverText: t.primaryHover,
    footerText: t.textTertiary,
    dividerLine: t.border,
    brandSoft: t.primarySoft,
    alertErrorBg: t.errorLight,
    alertErrorBorder: isDarkMode ? 'rgba(248, 113, 113, 0.25)' : 'rgba(239, 68, 68, 0.25)',
    alertErrorText: t.error,
    alertSuccessBg: t.successLight,
    alertSuccessBorder: isDarkMode ? 'rgba(52, 211, 153, 0.25)' : 'rgba(22, 163, 74, 0.25)',
    alertSuccessText: t.success,
    alertSuccessTitle: t.success,
    eyebrowDot: t.primary,
    eyebrowText: t.primary,
  }
}

export const authSpacing = {
  outerPadding: mfSpacing.md,
  cardPaddingHDesktop: mfSpacing.lg,
  cardPaddingHMobile: mfSpacing.md,
  cardPaddingVDesktop: mfSpacing.lg,
  cardPaddingVMobile: mfSpacing.lg,
  headerMarginBottomDesktop: mfSpacing.lg,
  headerMarginBottomMobile: mfSpacing.lg,
  fieldGap: mfSpacing.md,
  labelMarginBottom: 6,
  inputPaddingH: 12,
  inputPaddingV: 11,
  buttonMarginTop: 0,
  footerMarginTop: mfSpacing.lg,
} as const

export const authRadius = {
  card: mfRadius.lg,
  input: mfRadius.md,
  button: mfRadius.md,
  alert: mfRadius.md,
} as const

/** Altura mínima de campo e botão (toque confortável no celular). */
export const AUTH_CONTROL_HEIGHT = 46

export const authTypography = {
  titleSize: 26,
  titleWeight: '700' as const,
  titleLineHeight: 31,
  subtitleSize: 14,
  subtitleWeight: '400' as const,
  subtitleLineHeight: 21,
  labelSize: 13,
  labelWeight: '600' as const,
  inputSize: 15,
  inputWeight: '400' as const,
  buttonSize: 15,
  buttonWeight: '600' as const,
  footerSize: 12,
  footerWeight: '400' as const,
  heroTitleSize: 28,
  heroSubtitleSize: 15,
} as const

export const authShadows = {
  focusRing: '0 0 0 3px',
  imageDrop: 'drop-shadow(0 20px 32px rgba(0, 0, 0, 0.28))',
} as const

export function getAuthPalette (isDarkMode: boolean): AuthPalette {
  return buildPalette(isDarkMode)
}
