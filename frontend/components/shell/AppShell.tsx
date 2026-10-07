import React, { useMemo } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Slot } from 'expo-router';
import { SafeAreaInsetsContext, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '@/store/themeStore';
import type { AppScreenName } from '@/lib/navigationContext';
import AppTopNav from './AppTopNav';
import AppBottomNav, { type BottomNavAction } from './AppBottomNav';
import ImpersonationBanner from '../ImpersonationBanner';
import { getDashboardCanvasStyle } from '@/lib/glassStyles';
import { getWebScrollbarStyle } from '@/lib/webScrollbar';
import { useShellLayout } from './useShellLayout';

type Props = {
  currentScreen: AppScreenName;
  navigateTo: (screen: AppScreenName) => void;
  /** Abre o menu lateral (aba "Mais" do menu inferior). */
  openDrawer?: () => void;
  /** Navegação global (navbar web / menu inferior). Desligado em onboarding bloqueado. */
  showTopNav?: boolean;
};

export default function AppShell({
  navigateTo,
  openDrawer,
  currentScreen,
  showTopNav = true,
}: Props) {
  const { isDarkMode } = useThemeStore();
  const { isWebDesktop, usesDrawerNav } = useShellLayout();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(isDarkMode), [isDarkMode]);

  const showBottomNav = usesDrawerNav && showTopNav;
  /** Com menu inferior, o conteúdo não precisa do inset de baixo (o menu já o ocupa). */
  const contentInsets = useMemo(
    () => (showBottomNav ? { ...insets, bottom: 0 } : insets),
    [insets, showBottomNav]
  );

  const onBottomNavSelect = (action: BottomNavAction) => {
    if (action === 'Menu') {
      openDrawer?.();
      return;
    }
    navigateTo(action);
  };

  return (
    <View style={styles.root}>
      <ImpersonationBanner />
      {isWebDesktop && showTopNav ? (
        <AppTopNav
          current={currentScreen}
          compact={false}
          onOpenSettings={() => navigateTo('Configuracoes')}
        />
      ) : null}
      <View style={styles.canvas}>
        <SafeAreaInsetsContext.Provider value={contentInsets}>
          <Slot />
        </SafeAreaInsetsContext.Provider>
      </View>
      {showBottomNav ? <AppBottomNav current={currentScreen} onSelect={onBottomNavSelect} /> : null}
    </View>
  );
}

function createStyles(isDarkMode: boolean) {
  const canvas = getDashboardCanvasStyle(isDarkMode);
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: canvas.backgroundColor,
    },
    canvas: {
      flex: 1,
      minHeight: 0,
      ...canvas,
      ...(Platform.OS === 'web'
        ? ({
            overflow: 'hidden',
            ...getWebScrollbarStyle(isDarkMode),
          } as Record<string, unknown>)
        : {}),
    },
  });
}
