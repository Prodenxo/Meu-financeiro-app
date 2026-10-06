import React, { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { mfRadius, mfSpacing, type Theme } from '../../lib/theme';
import { useMfTheme } from './useMfTheme';
import type { MfButtonProps, MfButtonSize, MfButtonVariant } from './types';

/** Altura e raio iguais ao `.btn` / `.btnSm` do site. */
const SIZE = {
  md: { height: 40, paddingX: mfSpacing.md, fontSize: 14, radius: mfRadius.md, gap: mfSpacing.sm },
  sm: { height: 32, paddingX: 12, fontSize: 13, radius: mfRadius.sm, gap: 6 },
} as const;

type Palette = {
  bg: string;
  bgPressed: string;
  border: string;
  text: string;
};

function getPalette(theme: Theme, variant: MfButtonVariant): Palette {
  switch (variant) {
    case 'outline':
      return {
        bg: theme.card,
        bgPressed: theme.cardMuted,
        border: theme.borderStrong,
        text: theme.text,
      };
    case 'ghost':
      return {
        bg: 'transparent',
        bgPressed: theme.cardMuted,
        border: 'transparent',
        text: theme.textSecondary,
      };
    case 'danger':
      return {
        bg: theme.error,
        bgPressed: theme.error,
        border: 'transparent',
        text: theme.textOnDark,
      };
    case 'primary':
    default:
      return {
        bg: theme.primary,
        bgPressed: theme.primaryHover,
        border: 'transparent',
        text: theme.textOnDark,
      };
  }
}

/**
 * Botão padrão do app — mesma linguagem do site (`.btn`, `.btnPrimary`, `.btnOutline`, `.btnGhost`).
 * Use `variant="danger"` para ações destrutivas confirmadas.
 */
export function MfButton({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  block = false,
  disabled = false,
  loading = false,
  icon,
  iconRight,
  style,
  testID,
  accessibilityLabel,
  accessibilityHint,
}: MfButtonProps) {
  const { theme } = useMfTheme();
  const palette = useMemo(() => getPalette(theme, variant), [theme, variant]);
  const styles = useMemo(() => createStyles(palette, size, block), [palette, size, block]);
  const inactive = disabled || loading;

  return (
    <Pressable
      onPress={inactive ? undefined : onPress}
      disabled={inactive}
      style={({ pressed }) => [
        styles.base,
        pressed && !inactive && styles.pressed,
        inactive && styles.disabled,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator size="small" color={palette.text} />
      ) : icon ? (
        <View style={styles.icon}>{icon}</View>
      ) : null}
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
      {!loading && iconRight ? <View style={styles.icon}>{iconRight}</View> : null}
    </Pressable>
  );
}

function createStyles(palette: Palette, size: MfButtonSize, block: boolean) {
  const s = SIZE[size];
  return StyleSheet.create({
    base: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: s.gap,
      height: s.height,
      paddingHorizontal: s.paddingX,
      borderRadius: s.radius,
      borderWidth: 1,
      borderColor: palette.border,
      backgroundColor: palette.bg,
      alignSelf: block ? 'stretch' : 'flex-start',
      ...(block ? { width: '100%' as const } : {}),
    },
    pressed: {
      backgroundColor: palette.bgPressed,
      transform: [{ translateY: 1 }],
    },
    disabled: {
      opacity: 0.55,
    },
    icon: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: {
      fontSize: s.fontSize,
      fontWeight: '600',
      lineHeight: s.fontSize + 4,
      color: palette.text,
      flexShrink: 1,
    },
  });
}
