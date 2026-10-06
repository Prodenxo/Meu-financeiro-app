import { darkTheme, lightTheme } from '@/lib/theme';

/** Fundo da área de conteúdo — igual ao `--mf-bg` do site (liso, sem grade). */
export const SHELL_CANVAS_LIGHT = lightTheme.background;
export const SHELL_CANVAS_DARK = darkTheme.background;

/** Alinhado ao AUTH_BREAKPOINT_MD — web estreito usa shell mobile. */
export const SHELL_BREAKPOINT_MD = 768;

export const SHELL_NAV_MAX_WIDTH = 1280;
export const SHELL_NAV_FLOAT_RADIUS = 16;
export const SHELL_NAV_FLOAT_SHADOW_LIGHT = '0 4px 24px rgba(20, 20, 43, 0.06)';

export const SHELL_NAV_HEIGHT_WEB = 64;
export const SHELL_NAV_HEIGHT_WEB_COMPACT = 52;
export const SHELL_NAV_HEIGHT_NATIVE = 56;

/** Altura do menu inferior (sem o inset do aparelho). */
export const SHELL_BOTTOM_NAV_HEIGHT = 60;
