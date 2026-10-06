import type { TextStyle, ViewStyle } from 'react-native';

/** Raio e espaçamento — iguais em light/dark (MF Luxury). */
export const mfRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

export const mfSpacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const mfTypography = {
  caption: { fontSize: 11, fontWeight: '500' as const, lineHeight: 14 },
  body: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  bodyStrong: { fontSize: 14, fontWeight: '600' as const, lineHeight: 20 },
  subtitle: { fontSize: 16, fontWeight: '600' as const, lineHeight: 22 },
  title: { fontSize: 20, fontWeight: '700' as const, lineHeight: 26 },
  titleLarge: { fontSize: 24, fontWeight: '700' as const, lineHeight: 30 },
  money: { fontSize: 28, fontWeight: '700' as const, lineHeight: 34, letterSpacing: -0.5 },
  moneyLarge: { fontSize: 32, fontWeight: '700' as const, lineHeight: 38, letterSpacing: -0.6 },
} as const;

export type FinanceSemantic = 'open' | 'received' | 'overdue' | 'forecast';

/**
 * Paleta = tokens do site (`web/app/globals.css`).
 * Mapeamento: `background`=--mf-bg · `surface`=--mf-bg-elevated · `card`=--mf-card ·
 * `cardMuted`/`backgroundMuted`=--mf-card-muted · `primaryLight`=--mf-primary-soft ·
 * `primaryDark`=--mf-primary-hover · `error`=--mf-danger.
 */
export interface Theme {
  background: string;
  /** Áreas secundárias (listas, inputs agrupados) — igual a `cardMuted`. */
  backgroundMuted: string;
  surface: string;
  card: string;
  /** Fundo suave dentro de cards (--mf-card-muted). */
  cardMuted: string;

  text: string;
  textSecondary: string;
  textTertiary: string;
  /** Texto sobre o card escuro de saldo / botão primário. */
  textOnDark: string;
  textOnDark2: string;

  border: string;
  borderLight: string;
  /** Borda de inputs e botões outline (--mf-border-strong). */
  borderStrong: string;

  primary: string;
  /** Fundo suave da marca (--mf-primary-soft). */
  primaryLight: string;
  /** Hover/pressed do primário (--mf-primary-hover). */
  primaryDark: string;
  primaryHover: string;
  primarySoft: string;
  primarySoft2: string;
  primaryRing: string;

  /** Card escuro (saldo). */
  navy: string;
  navy2: string;

  success: string;
  successLight: string;
  error: string;
  errorLight: string;
  warning: string;
  warningLight: string;
  info: string;
  infoLight: string;

  /** Semântica financeira (referência Assessor, paleta MF). */
  financeOpen: string;
  financeOpenLight: string;
  financeReceived: string;
  financeReceivedLight: string;
  financeOverdue: string;
  financeOverdueLight: string;
  financeForecast: string;
  financeForecastLight: string;

  inputBackground: string;
  inputBorder: string;
  inputText: string;
  placeholder: string;

  calendarBackground: string;
  calendarText: string;
  calendarSelected: string;
  calendarToday: string;

  tabBarBackground: string;
  tabBarBorder: string;
  tabActive: string;
  tabInactive: string;

  /** Cor base para sombras de card (light: slate suave; dark: preto). */
  shadowColor: string;
}

/** Claro — igual ao `:root` do site: fundo lilás-claro, cards brancos, marca roxa. */
export const lightTheme: Theme = {
  background: '#f5f5fa',
  backgroundMuted: '#f7f7fb',
  surface: '#ffffff',
  card: '#ffffff',
  cardMuted: '#f7f7fb',

  text: '#16162a',
  textSecondary: '#6b6b80',
  textTertiary: '#9a9aaf',
  textOnDark: '#ffffff',
  textOnDark2: 'rgba(255, 255, 255, 0.72)',

  border: '#ececf3',
  borderLight: '#f2f2f8',
  borderStrong: '#dcdce8',

  primary: '#5b4fe9',
  primaryLight: '#eeedfb',
  primaryDark: '#4d42d6',
  primaryHover: '#4d42d6',
  primarySoft: '#eeedfb',
  primarySoft2: '#e3e1fa',
  primaryRing: 'rgba(91, 79, 233, 0.35)',

  navy: '#14142b',
  navy2: '#1e1e3f',

  success: '#16a34a',
  successLight: '#e8f7ee',
  error: '#ef4444',
  errorLight: '#fdecec',
  warning: '#f59e0b',
  warningLight: '#fff4e5',
  info: '#2563eb',
  infoLight: '#e8f0fe',

  financeOpen: '#2563eb',
  financeOpenLight: '#e8f0fe',
  financeReceived: '#16a34a',
  financeReceivedLight: '#e8f7ee',
  financeOverdue: '#ef4444',
  financeOverdueLight: '#fdecec',
  financeForecast: '#5b4fe9',
  financeForecastLight: '#eeedfb',

  inputBackground: '#ffffff',
  inputBorder: '#dcdce8',
  inputText: '#16162a',
  placeholder: '#9a9aaf',

  calendarBackground: '#ffffff',
  calendarText: '#16162a',
  calendarSelected: '#5b4fe9',
  calendarToday: '#5b4fe9',

  tabBarBackground: '#ffffff',
  tabBarBorder: '#ececf3',
  tabActive: '#5b4fe9',
  tabInactive: '#9a9aaf',

  shadowColor: '#14142b',
};

/** Escuro — igual ao `[data-theme='dark']` do site: azul-marinho profundo, marca lilás. */
export const darkTheme: Theme = {
  background: '#0f0f1c',
  backgroundMuted: '#1e1e36',
  surface: '#161628',
  card: '#181830',
  cardMuted: '#1e1e36',

  text: '#f1f1f7',
  textSecondary: '#a4a4bd',
  textTertiary: '#74748f',
  textOnDark: '#ffffff',
  textOnDark2: 'rgba(255, 255, 255, 0.72)',

  border: '#262640',
  borderLight: '#1f1f36',
  borderStrong: '#33334f',

  primary: '#8b82f2',
  primaryLight: 'rgba(139, 130, 242, 0.16)',
  primaryDark: '#a19af5',
  primaryHover: '#a19af5',
  primarySoft: 'rgba(139, 130, 242, 0.16)',
  primarySoft2: 'rgba(139, 130, 242, 0.26)',
  primaryRing: 'rgba(139, 130, 242, 0.45)',

  navy: '#23234a',
  navy2: '#2d2d5c',

  success: '#34d399',
  successLight: 'rgba(52, 211, 153, 0.14)',
  error: '#f87171',
  errorLight: 'rgba(248, 113, 113, 0.14)',
  warning: '#fbbf24',
  warningLight: 'rgba(251, 191, 36, 0.14)',
  info: '#60a5fa',
  infoLight: 'rgba(96, 165, 250, 0.14)',

  financeOpen: '#60a5fa',
  financeOpenLight: 'rgba(96, 165, 250, 0.14)',
  financeReceived: '#34d399',
  financeReceivedLight: 'rgba(52, 211, 153, 0.14)',
  financeOverdue: '#f87171',
  financeOverdueLight: 'rgba(248, 113, 113, 0.14)',
  financeForecast: '#8b82f2',
  financeForecastLight: 'rgba(139, 130, 242, 0.16)',

  inputBackground: '#161628',
  inputBorder: '#33334f',
  inputText: '#f1f1f7',
  placeholder: '#74748f',

  calendarBackground: '#181830',
  calendarText: '#f1f1f7',
  calendarSelected: '#8b82f2',
  calendarToday: '#8b82f2',

  tabBarBackground: '#161628',
  tabBarBorder: '#262640',
  tabActive: '#8b82f2',
  tabInactive: '#74748f',

  shadowColor: '#000000',
};

export const getTheme = (isDarkMode: boolean): Theme => {
  return isDarkMode ? darkTheme : lightTheme;
};

export function getFinanceSemanticColor(theme: Theme, semantic: FinanceSemantic): string {
  switch (semantic) {
    case 'open':
      return theme.financeOpen;
    case 'received':
      return theme.financeReceived;
    case 'overdue':
      return theme.financeOverdue;
    case 'forecast':
      return theme.financeForecast;
    default:
      return theme.primary;
  }
}

export function getFinanceSemanticTint(theme: Theme, semantic: FinanceSemantic): string {
  switch (semantic) {
    case 'open':
      return theme.financeOpenLight;
    case 'received':
      return theme.financeReceivedLight;
    case 'overdue':
      return theme.financeOverdueLight;
    case 'forecast':
      return theme.financeForecastLight;
    default:
      return theme.primaryLight;
  }
}

/** Sombra padrão do card (--mf-shadow do site): quase imperceptível no claro, mais presente no escuro. */
export function mfCardShadow(theme: Theme, isDarkMode: boolean): Pick<
  ViewStyle,
  'shadowColor' | 'shadowOffset' | 'shadowOpacity' | 'shadowRadius' | 'elevation'
> {
  if (isDarkMode) {
    return {
      shadowColor: theme.shadowColor,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.28,
      shadowRadius: 20,
      elevation: 3,
    };
  }
  return {
    shadowColor: theme.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 1,
  };
}

/** Sombra "pop" (--mf-shadow-pop): menus, modais e `MfCard variant="elevated"`. */
export function mfCardElevation(theme: Theme, isDarkMode: boolean): Pick<
  ViewStyle,
  'shadowColor' | 'shadowOffset' | 'shadowOpacity' | 'shadowRadius' | 'elevation'
> {
  if (isDarkMode) {
    return {
      shadowColor: theme.shadowColor,
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.55,
      shadowRadius: 48,
      elevation: 8,
    };
  }
  return {
    shadowColor: theme.shadowColor,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.14,
    shadowRadius: 40,
    elevation: 4,
  };
}

/** CSS `box-shadow` equivalente (web). */
export function mfWebShadow(isDarkMode: boolean, level: 'card' | 'pop' = 'card'): string {
  if (level === 'pop') {
    return isDarkMode ? '0 16px 48px rgba(0, 0, 0, 0.55)' : '0 12px 40px rgba(20, 20, 43, 0.14)';
  }
  return isDarkMode
    ? '0 1px 2px rgba(0, 0, 0, 0.3), 0 6px 20px rgba(0, 0, 0, 0.28)'
    : '0 1px 2px rgba(20, 20, 43, 0.04), 0 4px 16px rgba(20, 20, 43, 0.04)';
}

/** Agenda / modais — sombra visível (overflow não corta no web). */
export function mfAgendaPanelChrome(isDarkMode: boolean): ViewStyle {
  const chrome: ViewStyle = { overflow: 'visible' };
  if (typeof document !== 'undefined') {
    chrome.boxShadow = mfWebShadow(isDarkMode, 'pop');
  }
  return chrome;
}

export function mfMoneyTextStyle(theme: Theme, size: 'default' | 'large' = 'default'): TextStyle {
  return {
    ...(size === 'large' ? mfTypography.moneyLarge : mfTypography.money),
    color: theme.text,
    fontVariant: ['tabular-nums'],
  };
}
