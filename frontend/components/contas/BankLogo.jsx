import React, { useMemo, useState } from 'react';
import { Image, Platform, StyleSheet, Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { renderBancoSvg } from '@/lib/bancoBrasilSvg';
import { bankInitials } from '@/lib/finance/bankCatalog';

function WebSvg({ xml, size }) {
  return React.createElement('div', {
    style: { width: size, height: size, flexShrink: 0, display: 'inline-flex', lineHeight: 0 },
    dangerouslySetInnerHTML: { __html: xml },
  });
}

/**
 * Logo da instituição na mesma ordem do site: logo do banco sincronizado → ícone do catálogo
 * (biblioteca de SVGs do app) → iniciais na cor da conta.
 * `visual` = `resolveBankVisual(conta)` ou `{ slug, label, accent, logoUrl }` de um banco do catálogo.
 */
export function BankLogo({ visual, size = 40 }) {
  const [urlFailed, setUrlFailed] = useState(false);
  const xml = useMemo(
    () => (visual.slug ? renderBancoSvg({ nome: visual.slug, formato: 'circulo', tamanho: size }) : null),
    [visual.slug, size],
  );
  const round = { width: size, height: size, borderRadius: size / 2 };

  if (visual.logoUrl && !urlFailed) {
    return (
      <View style={[styles.wrap, round, styles.logoBg]}>
        <Image
          source={{ uri: visual.logoUrl }}
          style={{ width: size * 0.72, height: size * 0.72 }}
          resizeMode="contain"
          onError={() => setUrlFailed(true)}
          accessibilityIgnoresInvertColors
        />
      </View>
    );
  }
  if (xml) {
    return Platform.OS === 'web' ? <WebSvg xml={xml} size={size} /> : <SvgXml xml={xml} width={size} height={size} />;
  }
  return (
    <View style={[styles.wrap, round, { backgroundColor: visual.accent || '#64748B' }]}>
      <Text style={[styles.initials, { fontSize: Math.max(11, size * 0.34) }]} allowFontScaling={false}>
        {visual.initials || bankInitials(visual.label)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 },
  logoBg: { backgroundColor: '#ffffff', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(15,12,41,0.12)' },
  initials: { color: '#ffffff', fontWeight: '700' },
});
