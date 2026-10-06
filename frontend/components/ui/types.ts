import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { FinanceSemantic } from '../../lib/theme';

export type { FinanceSemantic };

export interface MfBaseProps {
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface MfCardProps extends MfBaseProps {
  children: ReactNode;
  /** default = card + borda + sombra suave; elevated = sombra "pop"; outline = só borda; muted = fundo suave sem sombra */
  variant?: 'default' | 'elevated' | 'outline' | 'muted';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Cabeçalho opcional (igual ao `.cardHeader` do site). */
  title?: string;
  subtitle?: string;
  /** Ação à direita do título (botão, pill…). */
  right?: ReactNode;
}

export type MfButtonVariant = 'primary' | 'outline' | 'ghost' | 'danger';
export type MfButtonSize = 'md' | 'sm';

export interface MfButtonProps extends MfBaseProps {
  label: string;
  onPress?: () => void;
  variant?: MfButtonVariant;
  size?: MfButtonSize;
  /** Ocupa toda a largura. */
  block?: boolean;
  disabled?: boolean;
  /** Mostra spinner no lugar do ícone e bloqueia o toque. */
  loading?: boolean;
  /** Ícone à esquerda do texto. */
  icon?: ReactNode;
  /** Ícone à direita do texto. */
  iconRight?: ReactNode;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export interface MfMetricTileProps extends MfBaseProps {
  label: string;
  value: string;
  semantic?: FinanceSemantic;
  icon?: ReactNode;
  hint?: string;
  /** Reduz fonte em telas estreitas para valores longos (ex.: saldo). */
  shrinkValue?: boolean;
  /** KPI estilo painel técnico (mono, borda acento). */
  variant?: 'default' | 'tech';
  /** Destaque no grid (saldo principal). */
  featured?: boolean;
}

export interface MfPeriodNavProps extends MfBaseProps {
  label: string;
  onPrevious?: () => void;
  onNext?: () => void;
  disablePrevious?: boolean;
  disableNext?: boolean;
  variant?: 'default' | 'tech';
  size?: 'default' | 'large';
}

export interface MfSegmentOption<T extends string = string> {
  key: T;
  label: string;
  /** Destaque semântico quando o segmento está ativo. */
  tone?: 'income' | 'expense' | 'pending' | 'neutral';
}

export interface MfSegmentedProps<T extends string = string> extends MfBaseProps {
  options: MfSegmentOption<T>[];
  value: T;
  onChange: (key: T) => void;
}

export interface MfDonutSegment {
  ratio: number;
  color: string;
}

export interface MfDonutChartProps extends MfBaseProps {
  size?: number;
  segments: MfDonutSegment[];
  strokeWidth?: number;
  centerLabel?: string;
  centerSubLabel?: string;
}

export interface MfAppHeaderProps extends MfBaseProps {
  title?: string;
  subtitle?: string;
  onMenuPress?: () => void;
  right?: ReactNode;
}

export interface MfPageProps extends MfBaseProps {
  children: ReactNode;
  scroll?: boolean;
  maxWidth?: number;
  contentPadding?: number;
}
