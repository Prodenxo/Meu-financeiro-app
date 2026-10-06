import React from 'react';
import Svg, { Path } from 'react-native-svg';

type Props = {
  size?: number;
  color: string;
};

/** Marca "M" do Meu Financeiro (traço duplo) — mesmo desenho do `BrandMark` do site. */
export function BrandMark({ size = 20, color }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" accessibilityElementsHidden>
      <Path
        d="M4 19V6.5L9.5 14 12 10.5 14.5 14 20 6.5V19"
        stroke={color}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
