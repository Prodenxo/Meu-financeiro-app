import React, { useMemo } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { mfRadius, mfWebShadow, type Theme } from '@/lib/theme';
import { getBottomNavItems, isBottomNavMenuActive } from '@/lib/appNavConfig';
import type { AppScreenName } from '@/lib/navigationContext';
import { useMfTheme } from '../ui/useMfTheme';
import { SHELL_BOTTOM_NAV_HEIGHT } from './shellTokens';

export type BottomNavAction = AppScreenName | 'Menu';

type Props = {
  current: AppScreenName;
  onSelect: (action: BottomNavAction) => void;
};

type TabProps = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  active: boolean;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
  theme: Theme;
  accessibilityLabel: string;
};

function Tab({ label, icon, active, onPress, styles, theme, accessibilityLabel }: TabProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.tab, pressed && styles.pressed]}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={accessibilityLabel}
    >
      <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
        <Ionicons name={icon} size={22} color={active ? theme.primary : theme.tabInactive} />
      </View>
      <Text style={[styles.label, active && styles.labelActive]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * Menu inferior do app (celular e web estreito).
 * Item ativo: ícone sobre fundo `primarySoft` + rótulo na cor da marca — igual ao item ativo da sidebar do site.
 */
export default function AppBottomNav({ current, onSelect }: Props) {
  const insets = useSafeAreaInsets();
  const { theme, isDarkMode } = useMfTheme();
  const styles = useMemo(
    () => createStyles(theme, isDarkMode, insets.bottom),
    [theme, isDarkMode, insets.bottom]
  );
  const items = useMemo(() => getBottomNavItems(), []);
  const menuActive = isBottomNavMenuActive(current);

  return (
    <View style={styles.bar} accessibilityRole="tablist" testID="app-bottom-nav">
      {items.map((item) => {
        const active = current === item.screen;
        return (
          <Tab
            key={item.screen}
            label={item.shortLabel}
            icon={(active ? item.activeIcon : item.icon) as keyof typeof Ionicons.glyphMap}
            active={active}
            onPress={() => onSelect(item.screen)}
            styles={styles}
            theme={theme}
            accessibilityLabel={item.label}
          />
        );
      })}
      <Tab
        label="Mais"
        icon={menuActive ? 'grid' : 'grid-outline'}
        active={menuActive}
        onPress={() => onSelect('Menu')}
        styles={styles}
        theme={theme}
        accessibilityLabel="Mais opções"
      />
    </View>
  );
}

function createStyles(theme: Theme, isDarkMode: boolean, bottomInset: number) {
  return StyleSheet.create({
    bar: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-around',
      minHeight: SHELL_BOTTOM_NAV_HEIGHT + bottomInset,
      paddingBottom: Math.max(bottomInset, 6),
      paddingTop: 6,
      paddingHorizontal: 4,
      backgroundColor: theme.tabBarBackground,
      borderTopWidth: 1,
      borderTopColor: theme.tabBarBorder,
      ...(Platform.OS === 'web'
        ? ({ boxShadow: mfWebShadow(isDarkMode, 'card') } as Record<string, unknown>)
        : {}),
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
      paddingVertical: 2,
      minWidth: 0,
    },
    iconWrap: {
      width: 48,
      height: 28,
      borderRadius: mfRadius.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconWrapActive: {
      backgroundColor: theme.primarySoft,
    },
    label: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.tabInactive,
      maxWidth: '100%',
    },
    labelActive: {
      color: theme.primary,
    },
    pressed: {
      opacity: 0.7,
    },
  });
}
