import { Platform, StyleSheet, type ViewStyle } from 'react-native';
import type { Theme } from './theme';
import { darkTheme, lightTheme, mfRadius, mfSpacing, mfWebShadow } from './theme';

export type TechTokens = {
  accent: string;
  accentMuted: string;
  accentSoft: string;
  accentGlow: string;
  panelFill: string;
  panelBorder: string;
  insetFill: string;
  insetBorder: string;
  divider: string;
  canvasBase: string;
  gridCss: string;
  canvasGradientCss: string;
  panelShadow: string;
  /** Sombra dos KPIs internos (saldo hero, entrada, saída) */
  kpiFeaturedShadow: string;
  kpiMetricShadow: string;
  heroWashCss: string;
};

/**
 * Tokens das telas antigas ("tech"), agora na paleta do site:
 * acento = `primary`, painéis = `card`, fundo liso (sem grade nem gradiente).
 * Mantido para as telas que ainda não foram migradas (etapas 2–7).
 */
export function getTechTokens(isDarkMode: boolean): TechTokens {
  const t = isDarkMode ? darkTheme : lightTheme;
  if (isDarkMode) {
    return {
      accent: t.primary,
      accentMuted: 'rgba(139, 130, 242, 0.45)',
      accentSoft: t.primarySoft,
      accentGlow: t.primarySoft2,
      panelFill: t.card,
      panelBorder: t.border,
      insetFill: t.cardMuted,
      insetBorder: t.border,
      divider: t.border,
      canvasBase: t.background,
      gridCss: 'none',
      canvasGradientCss: 'none',
      panelShadow: mfWebShadow(true, 'card'),
      kpiFeaturedShadow: mfWebShadow(true, 'card'),
      kpiMetricShadow: mfWebShadow(true, 'card'),
      heroWashCss:
        'linear-gradient(90deg, rgba(139, 130, 242, 0.16) 0%, rgba(139, 130, 242, 0.05) 14%, transparent 28%)',
    };
  }

  return {
    accent: t.primary,
    accentMuted: 'rgba(91, 79, 233, 0.45)',
    accentSoft: t.primarySoft,
    accentGlow: t.primarySoft2,
    panelFill: t.card,
    panelBorder: t.border,
    insetFill: t.cardMuted,
    insetBorder: t.border,
    divider: t.border,
    canvasBase: t.background,
    gridCss: 'none',
    canvasGradientCss: 'none',
    panelShadow: mfWebShadow(false, 'card'),
    kpiFeaturedShadow: mfWebShadow(false, 'card'),
    kpiMetricShadow: mfWebShadow(false, 'card'),
    heroWashCss:
      'linear-gradient(90deg, rgba(91, 79, 233, 0.12) 0%, rgba(91, 79, 233, 0.04) 12%, transparent 26%)',
  };
}

/** @deprecated use getTechTokens */
export function getTechAccent(isDarkMode: boolean): string {
  return getTechTokens(isDarkMode).accent;
}

export function getTechAccentMuted(isDarkMode: boolean): string {
  return getTechTokens(isDarkMode).accentMuted;
}

export function getTechGlassBorder(isDarkMode: boolean): string {
  return getTechTokens(isDarkMode).panelBorder;
}

/** Fundo da área de conteúdo — liso, igual ao site (`--mf-bg`). */
export function getDashboardCanvasStyle(isDarkMode: boolean): ViewStyle {
  const t = getTechTokens(isDarkMode);
  return { backgroundColor: t.canvasBase };
}

export type TechPanelVariant = 'accent' | 'surface' | 'inset' | 'chart';

export function mfTechPanelChrome(
  isDarkMode: boolean,
  variant: TechPanelVariant = 'surface',
): ViewStyle {
  const t = getTechTokens(isDarkMode);
  const isAccent = variant === 'accent';
  const isInset = variant === 'inset' || variant === 'chart';
  const isChart = variant === 'chart';

  const base: ViewStyle = {
    borderRadius: isChart ? mfRadius.sm : mfRadius.md,
    borderWidth: 1,
    borderColor: isInset ? t.insetBorder : isAccent ? t.panelBorder : t.insetBorder,
    backgroundColor: isChart || isInset ? t.insetFill : t.panelFill,
    overflow: isAccent ? 'visible' : 'hidden',
    ...(isAccent
      ? { borderTopWidth: 2, borderTopColor: t.accent }
      : { borderTopWidth: 1 }),
  };

  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    return {
      ...base,
      boxShadow: isInset ? 'none' : t.panelShadow,
    };
  }
  return base;
}

/** Fundo sólido para modais full-screen. */
export function mfTechOpaqueShell(isDarkMode: boolean): ViewStyle {
  const t = getTechTokens(isDarkMode);
  const fill = t.panelFill;
  return {
    flex: 1,
    width: '100%',
    backgroundColor: fill,
    borderWidth: 1,
    borderColor: t.panelBorder,
    overflow: 'hidden',
    ...(Platform.OS === 'web'
      ? {
          boxShadow: t.panelShadow,
        }
      : {}),
  };
}

/** Véu sobre o grid do canvas (modais / overlays). */
export function mfTechCanvasScrim(isDarkMode: boolean): ViewStyle {
  return {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: isDarkMode ? 'rgba(5, 5, 14, 0.72)' : 'rgba(20, 20, 43, 0.45)',
  };
}

export function mfTechNavChrome(isDarkMode: boolean): ViewStyle {
  return mfTechPanelChrome(isDarkMode);
}

export function mfTechInsetSurface(isDarkMode: boolean, featured = false): ViewStyle {
  const t = getTechTokens(isDarkMode);
  return {
    borderRadius: mfRadius.sm,
    borderWidth: 1,
    borderColor: featured ? t.accent : t.insetBorder,
    backgroundColor: t.insetFill,
    ...(featured
      ? {
          borderLeftWidth: 3,
          borderLeftColor: t.accent,
        }
      : {}),
  };
}

export type TechKpiElevation = 'featured' | 'metric';

/** Sombra única para saldo, entradas e saídas (mesmo lift). */
export function getTechKpiShadow(isDarkMode: boolean): string {
  return getTechTokens(isDarkMode).kpiFeaturedShadow;
}

/** Fundo dos KPIs — mesma elevação visual em todos os cards. */
export function mfTechKpiSurfaceFill(isDarkMode: boolean): string {
  return getTechTokens(isDarkMode).panelFill;
}

/** Estilo do invólucro (fundo + borda). Sombra: `MfTechKpiCard` ou `getTechKpiShadow` no web. */
export function mfTechKpiCardStyle(
  isDarkMode: boolean,
  level: TechKpiElevation = 'metric',
): ViewStyle {
  const t = getTechTokens(isDarkMode);
  const featured = level === 'featured';
  const borderColor = t.panelBorder;

  const base: ViewStyle = {
    backgroundColor: mfTechKpiSurfaceFill(isDarkMode),
    borderWidth: 1,
    borderColor,
    borderRadius: mfRadius.sm,
    overflow: 'visible',
    ...(level === 'metric'
      ? {
          flex: 1,
          minWidth: 0,
          alignSelf: 'stretch',
        }
      : {}),
    ...(featured
      ? {
          borderLeftWidth: 3,
          borderLeftColor: t.accent,
          transform: [{ translateY: -1 }],
        }
      : {}),
  };

  if (Platform.OS === 'web') {
    const shadow = getTechKpiShadow(isDarkMode);
    return {
      ...base,
      boxShadow: shadow,
      // @ts-expect-error web-only
      WebkitBoxShadow: shadow,
    };
  }

  // Métricas em listas (categorias, contas, orçamentos): borda só — sem glow cyan no Android.
  if (level === 'metric') {
    return {
      ...base,
      overflow: 'hidden',
      elevation: 0,
      shadowColor: 'transparent',
      shadowOpacity: 0,
      shadowRadius: 0,
      shadowOffset: { width: 0, height: 0 },
    };
  }

  return {
    ...base,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDarkMode ? 0.32 : 0.1,
    shadowRadius: 8,
    elevation: 4,
  };
}

/** Conteúdo interno do KPI — padding sem sobrescrever sombra do shell. */
export function mfTechKpiCardInnerStyle(level: TechKpiElevation = 'metric'): ViewStyle {
  if (level === 'featured') {
    return {
      paddingTop: mfSpacing.md,
      paddingBottom: mfSpacing.md,
      paddingRight: mfSpacing.md,
      paddingLeft: mfSpacing.lg,
      gap: mfSpacing.sm,
    };
  }
  return {
    padding: mfSpacing.sm,
    gap: 4,
  };
}

/** Faixa de acento à esquerda do saldo — não cobre o card inteiro. */
export function mfTechHeroWashOverlay(isDarkMode: boolean): ViewStyle {
  const t = getTechTokens(isDarkMode);
  if (Platform.OS === 'web') {
    return {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: '32%',
      maxWidth: 140,
      borderTopLeftRadius: mfRadius.sm,
      borderBottomLeftRadius: mfRadius.sm,
      // @ts-expect-error web-only
      backgroundImage: t.heroWashCss,
      pointerEvents: 'none',
    };
  }
  return {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '32%',
    maxWidth: 140,
    borderTopLeftRadius: mfRadius.sm,
    borderBottomLeftRadius: mfRadius.sm,
    backgroundColor: t.accentSoft,
    pointerEvents: 'none',
  };
}

/** @deprecated use mfTechKpiCardStyle */
export function mfTechKpiElevation(
  isDarkMode: boolean,
  level: TechKpiElevation = 'metric',
): ViewStyle {
  const t = getTechTokens(isDarkMode);
  const featured = level === 'featured';
  if (Platform.OS === 'web') {
    return {
      boxShadow: featured ? t.kpiFeaturedShadow : t.kpiMetricShadow,
    };
  }
  return mfTechKpiCardStyle(isDarkMode, level);
}

/** @deprecated use mfTechHeroWashOverlay dentro do card */
export function mfTechHeroPrimaryWash(isDarkMode: boolean): ViewStyle {
  return mfTechHeroWashOverlay(isDarkMode);
}

export type GlassIntensity = 'subtle' | 'medium' | 'strong';

export function getGlassFill(
  _theme: Theme,
  isDarkMode: boolean,
  intensity: GlassIntensity = 'medium',
): string {
  const t = getTechTokens(isDarkMode);
  // Sem vidro translúcido no design novo: superfícies sólidas (card / card-muted).
  return intensity === 'subtle' ? t.insetFill : t.panelFill;
}

export function getGlassBorder(_theme: Theme, isDarkMode: boolean): string {
  return getTechTokens(isDarkMode).insetBorder;
}

export function getGlassBlurIntensity(isDarkMode: boolean): number {
  if (Platform.OS === 'ios') return isDarkMode ? 52 : 44;
  if (Platform.OS === 'android') return isDarkMode ? 48 : 40;
  return isDarkMode ? 36 : 28;
}

export function mfGlassChrome(
  theme: Theme,
  isDarkMode: boolean,
  intensity: GlassIntensity = 'medium',
  tech: boolean | TechPanelVariant = false,
): ViewStyle {
  if (tech) {
    const variant = tech === true ? 'surface' : tech;
    return mfTechPanelChrome(isDarkMode, variant);
  }
  const t = getTechTokens(isDarkMode);
  const base: ViewStyle = {
    borderRadius: mfRadius.lg,
    borderWidth: 1,
    borderColor: t.insetBorder,
    overflow: 'hidden',
    backgroundColor: getGlassFill(theme, isDarkMode, intensity),
  };
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    return {
      ...base,
      boxShadow: t.panelShadow,
    };
  }
  return base;
}

export function mfTechKpiSurface(isDarkMode: boolean, featured = false): ViewStyle {
  return {
    flex: featured ? 1.35 : 1,
    minWidth: 0,
    padding: featured ? 22 : 16,
    ...mfTechInsetSurface(isDarkMode, featured),
  };
}
