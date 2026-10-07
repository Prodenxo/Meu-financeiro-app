import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { AppScreenName } from './navigationContext';

export type IoniconName = ComponentProps<typeof Ionicons>['name'];

export type AppNavItem = {
  screen: AppScreenName;
  label: string;
  icon: IoniconName;
  activeIcon: IoniconName;
  /** Exibido na barra superior (web) */
  showInTopNav?: boolean;
  /** Exibido na tab bar inferior (native) */
  showInBottomNav?: boolean;
};

export const APP_NAV_ITEMS: AppNavItem[] = [
  {
    screen: 'Dashboard',
    label: 'Visão Geral',
    icon: 'home-outline',
    activeIcon: 'home',
    showInTopNav: true,
    showInBottomNav: true,
  },
  {
    screen: 'Transacoes',
    label: 'Transações',
    icon: 'swap-horizontal-outline',
    activeIcon: 'swap-horizontal',
    showInTopNav: true,
    showInBottomNav: true,
  },
  {
    screen: 'Contas',
    label: 'Contas',
    icon: 'card-outline',
    activeIcon: 'card',
    showInTopNav: true,
  },
  {
    screen: 'ContaGlobal',
    label: 'Conta global',
    icon: 'globe-outline',
    activeIcon: 'globe',
    showInTopNav: true,
  },
  {
    screen: 'Categorias',
    label: 'Categorias',
    icon: 'apps-outline',
    activeIcon: 'apps',
    showInTopNav: true,
  },
  {
    screen: 'Orcamentos',
    label: 'Orçamentos',
    icon: 'wallet-outline',
    activeIcon: 'wallet',
    showInTopNav: true,
  },
  {
    screen: 'Agenda',
    label: 'Agenda',
    icon: 'calendar-outline',
    activeIcon: 'calendar',
    showInTopNav: true,
    showInBottomNav: true,
  },
  {
    screen: 'Configuracoes',
    label: 'Configurações',
    icon: 'settings-outline',
    activeIcon: 'settings',
  },
];

export const SCREEN_TO_HREF: Record<AppScreenName, string> = {
  Dashboard: '/(app)/',
  Transacoes: '/(app)/transacoes',
  Contas: '/(app)/contas',
  ContaGlobal: '/(app)/conta-global',
  Categorias: '/(app)/categorias',
  Orcamentos: '/(app)/orcamentos',
  Agenda: '/(app)/agenda',
  Configuracoes: '/(app)/configuracoes',
};

const PATH_SUFFIX_TO_SCREEN: Record<string, AppScreenName> = {
  '': 'Dashboard',
  '/': 'Dashboard',
  '/index': 'Dashboard',
  '/transacoes': 'Transacoes',
  '/contas': 'Contas',
  '/conta-global': 'ContaGlobal',
  '/categorias': 'Categorias',
  '/orcamentos': 'Orcamentos',
  '/agenda': 'Agenda',
  '/configuracoes': 'Configuracoes',
};

/** Normaliza pathname do Expo Router para `AppScreenName`. */
export function resolveAppScreenFromPath(pathname?: string | null): AppScreenName {
  const stripped = String(pathname ?? '/')
    .replace(/^\/?\(app\)/, '')
    .replace(/\/$/, '')
    .split('?')[0];
  const suffix = stripped === '' ? '/' : stripped.startsWith('/') ? stripped : `/${stripped}`;

  if (suffix === '/configuracoes' || suffix.startsWith('/configuracoes/')) {
    return 'Configuracoes';
  }
  if (suffix === '/solicitacoes') {
    return 'Configuracoes';
  }

  return PATH_SUFFIX_TO_SCREEN[suffix] ?? 'Dashboard';
}

/** Abas fixas do menu inferior (celular). */
export const BOTTOM_NAV_SCREENS: AppScreenName[] = ['Dashboard', 'Transacoes', 'Contas', 'Agenda'];

/** Rótulo curto para caber na aba. */
export const BOTTOM_NAV_SHORT_LABEL: Partial<Record<AppScreenName, string>> = {
  Dashboard: 'Início',
};

export type BottomNavItem = AppNavItem & { shortLabel: string };

/** Itens do menu inferior, na ordem das abas, com rótulo curto. */
export function getBottomNavItems(items: AppNavItem[] = APP_NAV_ITEMS): BottomNavItem[] {
  return BOTTOM_NAV_SCREENS.map((screen) => items.find((i) => i.screen === screen))
    .filter((item): item is AppNavItem => Boolean(item))
    .map((item) => ({ ...item, shortLabel: BOTTOM_NAV_SHORT_LABEL[item.screen] ?? item.label }));
}

/** Telas que não têm aba própria ficam sob "Mais" (menu lateral). */
export function isBottomNavMenuActive(current: AppScreenName): boolean {
  return !BOTTOM_NAV_SCREENS.includes(current);
}
