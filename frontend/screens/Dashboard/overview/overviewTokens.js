import { getTheme, mfCardShadow } from '@/lib/theme';

/** Cores da Visão geral: base do tema do app + lavanda de fundo, verde de entrada e coral de saída. */
export function getOverviewTokens(isDarkMode) {
  const theme = getTheme(isDarkMode);
  return {
    theme,
    isDarkMode,
    canvas: isDarkMode ? theme.background : '#f1effb',
    card: theme.card,
    cardBorder: isDarkMode ? theme.border : 'rgba(91, 79, 233, 0.08)',
    text: theme.text,
    textSecondary: theme.textSecondary,
    textTertiary: theme.textTertiary,
    primary: theme.primary,
    primarySoft: theme.primarySoft,
    navy: isDarkMode ? theme.navy2 : theme.navy,
    onNavy: '#ffffff',
    onNavySoft: 'rgba(255, 255, 255, 0.72)',
    income: theme.success,
    incomeSoft: theme.successLight,
    expense: isDarkMode ? '#fb7185' : '#f05a5f',
    expenseSoft: isDarkMode ? 'rgba(251, 113, 133, 0.14)' : '#fdecec',
    warning: theme.warning,
    warningSoft: theme.warningLight,
    orange: '#f97316',
    orangeSoft: isDarkMode ? 'rgba(249, 115, 22, 0.16)' : '#fff1e6',
    track: isDarkMode ? theme.borderStrong : '#ecebf6',
    shadow: mfCardShadow(theme, isDarkMode),
  };
}

export const OVERVIEW_RADIUS = 18;
export const OVERVIEW_GAP = 12;
export const TOUCH_MIN = 44;

export function toneColors(tokens, tone) {
  switch (tone) {
    case 'positive':
    case 'success':
      return { fg: tokens.income, bg: tokens.incomeSoft };
    case 'negative':
    case 'danger':
      return { fg: tokens.expense, bg: tokens.expenseSoft };
    case 'warning':
      return { fg: tokens.warning, bg: tokens.warningSoft };
    case 'orange':
      return { fg: tokens.orange, bg: tokens.orangeSoft };
    case 'accent':
      return { fg: tokens.primary, bg: tokens.primarySoft };
    default:
      return { fg: tokens.textSecondary, bg: tokens.track };
  }
}
