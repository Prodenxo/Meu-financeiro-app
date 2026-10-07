import { useMemo, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { getMoedaCountryIso, normalizeMoedaCode } from '@/lib/finance/moedas';
import { getCountryFlagCompactPngUrl, getCountryFlagImageUrlBySize } from '@/lib/countryFlagImage';

/** Bandeira redonda da moeda; sem imagem (offline ou moeda sem país) mostra o código. */
export function MoedaFlag({ moeda, size = 36, t }) {
  const code = normalizeMoedaCode(moeda);
  const urls = useMemo(() => {
    const iso = getMoedaCountryIso(code);
    return iso ? [getCountryFlagImageUrlBySize(iso, size), getCountryFlagCompactPngUrl(iso)] : [];
  }, [code, size]);
  const [failed, setFailed] = useState({ code, count: 0 });
  const index = failed.code === code ? failed.count : 0;
  const onError = () => setFailed({ code, count: index + 1 });

  const frame = {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: t.primarySoft,
    borderColor: t.cardBorder,
  };

  if (index >= urls.length) {
    return (
      <View style={[styles.frame, frame]} accessible={false}>
        <Text style={[styles.code, { color: t.primary, fontSize: Math.max(9, size * 0.28) }]} numberOfLines={1}>
          {code || '?'}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.frame, frame]} accessible={false}>
      <Image
        source={{ uri: urls[index] }}
        style={{ width: size * 1.5, height: size }}
        resizeMode="cover"
        onError={onError}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  code: { fontWeight: '800', letterSpacing: 0.2 },
});
