import React, { useMemo } from 'react';
import { Platform, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import {
  mfCardElevation,
  mfCardShadow,
  mfRadius,
  mfSpacing,
  mfWebShadow,
  type Theme,
} from '../../lib/theme';
import { useMfTheme } from './useMfTheme';
import type { MfCardProps } from './types';

const paddingMap = {
  none: 0,
  sm: mfSpacing.sm,
  md: mfSpacing.md,
  lg: 20,
} as const;

/**
 * Superfície base do app — igual ao `.card` do site:
 * fundo `card`, borda `border`, raio 16 e sombra suave.
 */
export function MfCard({
  children,
  variant = 'default',
  padding = 'md',
  title,
  subtitle,
  right,
  style,
  testID,
}: MfCardProps) {
  const { theme, isDarkMode } = useMfTheme();
  const styles = useMemo(
    () => createStyles(theme, isDarkMode, variant, padding),
    [theme, isDarkMode, variant, padding]
  );
  const hasHeader = Boolean(title || subtitle || right);

  return (
    <View style={[styles.card, style]} testID={testID} accessibilityRole="none">
      {hasHeader ? (
        <View style={styles.header}>
          <View style={styles.titles}>
            {title ? (
              <Text style={styles.title} numberOfLines={1}>
                {title}
              </Text>
            ) : null}
            {subtitle ? (
              <Text style={styles.subtitle} numberOfLines={2}>
                {subtitle}
              </Text>
            ) : null}
          </View>
          {right ? <View style={styles.right}>{right}</View> : null}
        </View>
      ) : null}
      {children}
    </View>
  );
}

function createStyles(
  theme: Theme,
  isDarkMode: boolean,
  variant: MfCardProps['variant'],
  padding: MfCardProps['padding']
) {
  const pad = paddingMap[padding ?? 'md'];
  const isWeb = Platform.OS === 'web';

  let shadow: ViewStyle = {};
  if (variant === 'default') {
    shadow = isWeb
      ? ({ boxShadow: mfWebShadow(isDarkMode, 'card') } as unknown as ViewStyle)
      : mfCardShadow(theme, isDarkMode);
  } else if (variant === 'elevated') {
    shadow = isWeb
      ? ({ boxShadow: mfWebShadow(isDarkMode, 'pop') } as unknown as ViewStyle)
      : mfCardElevation(theme, isDarkMode);
  }

  return StyleSheet.create({
    card: {
      backgroundColor: variant === 'muted' ? theme.cardMuted : theme.card,
      borderRadius: mfRadius.lg,
      borderWidth: 1,
      borderColor: theme.border,
      padding: pad,
      minWidth: 0,
      ...shadow,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      marginBottom: mfSpacing.md,
    },
    titles: {
      flex: 1,
      minWidth: 0,
    },
    title: {
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: -0.16,
      color: theme.text,
    },
    subtitle: {
      marginTop: 2,
      fontSize: 12,
      color: theme.textSecondary,
    },
    right: {
      flexShrink: 0,
      flexDirection: 'row',
      alignItems: 'center',
      gap: mfSpacing.sm,
    },
  });
}
