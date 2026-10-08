import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { moduleIonicon, TUTORIAL_FILTERS } from '@/lib/tutoriais/tutoriaisScreen';
import { OVERVIEW_RADIUS, TOUCH_MIN } from '../Dashboard/overview/overviewTokens';

/** Banner "Comece por aqui": o botão só aparece quando há um tutorial publicado em destaque. */
export function StartBanner({ tokens, featured, onOpen }) {
  return (
    <View style={[styles.banner, { backgroundColor: tokens.primarySoft }]}>
      <View style={styles.bannerText}>
        <Text style={[styles.kicker, { color: tokens.primary }]}>COMECE POR AQUI</Text>
        <Text style={[styles.bannerTitle, { color: tokens.text }]} accessibilityRole="header">
          Seus primeiros passos
        </Text>
        <Text style={[styles.bannerBody, { color: tokens.textSecondary }]}>
          Configure suas contas e registre sua primeira movimentação.
        </Text>
        {featured ? (
          <Pressable
            onPress={() => onOpen(featured)}
            accessibilityRole="button"
            accessibilityLabel={`Ver passo a passo: ${featured.titulo}`}
            style={({ pressed }) => [styles.bannerBtn, { backgroundColor: tokens.primary }, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.bannerBtnText}>Ver passo a passo</Text>
            <Ionicons name="chevron-forward" size={16} color="#ffffff" />
          </Pressable>
        ) : null}
      </View>
      <View style={[styles.bannerArt, { backgroundColor: tokens.card }]} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        <Ionicons name="book-outline" size={34} color={tokens.primary} />
      </View>
    </View>
  );
}

export function TutorialSearch({ tokens, value, onChange }) {
  return (
    <View style={[styles.search, { backgroundColor: tokens.card, borderColor: tokens.cardBorder }]}>
      <Ionicons name="search" size={18} color={tokens.textTertiary} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="O que você quer aprender?"
        placeholderTextColor={tokens.textTertiary}
        style={[styles.searchInput, { color: tokens.text }]}
        autoCorrect={false}
        returnKeyType="search"
        accessibilityLabel="O que você quer aprender?"
      />
      {value ? (
        <Pressable onPress={() => onChange('')} accessibilityRole="button" accessibilityLabel="Limpar busca" hitSlop={10}>
          <Ionicons name="close-circle" size={18} color={tokens.textTertiary} />
        </Pressable>
      ) : null}
    </View>
  );
}

export function ModuleChips({ tokens, value, onChange }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chips}
      accessibilityRole="radiogroup"
      accessibilityLabel="Filtrar por módulo"
    >
      {TUTORIAL_FILTERS.map((item) => {
        const selected = item.key === value;
        return (
          <Pressable
            key={item.key}
            onPress={() => onChange(item.key)}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            style={({ pressed }) => [
              styles.chip,
              { borderColor: selected ? tokens.primary : tokens.cardBorder, backgroundColor: selected ? tokens.primary : tokens.card },
              pressed && { opacity: 0.75 },
            ]}
          >
            <Text style={[styles.chipText, { color: selected ? '#ffffff' : tokens.textSecondary }]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/** Imagem https informada pelo superadmin; se não carregar, some e fica a arte do módulo. */
export function RemoteImage({ uri, style, resizeMode = 'cover', accessibilityLabel }) {
  const [failed, setFailed] = useState(false);
  if (!uri || failed) return null;
  return (
    <Image
      source={{ uri }}
      style={style}
      resizeMode={resizeMode}
      onError={() => setFailed(true)}
      accessible={Boolean(accessibilityLabel)}
      accessibilityLabel={accessibilityLabel}
    />
  );
}

export function TutorialMeta({ tokens, tutorial, children }) {
  return (
    <View style={styles.metaRow}>
      <Text style={[styles.meta, { color: tokens.textTertiary }]} numberOfLines={1}>
        {tutorial.moduloLabel.toUpperCase()} · {tutorial.tipoLabel.toUpperCase()}
      </Text>
      {children}
    </View>
  );
}

export function TutorialCard({ tokens, tutorial, onPress }) {
  return (
    <Pressable
      onPress={() => onPress(tutorial)}
      accessibilityRole="button"
      accessibilityLabel={`${tutorial.actionLabel}: ${tutorial.titulo}`}
      style={({ pressed }) => [styles.card, { backgroundColor: tokens.card, borderColor: tokens.cardBorder }, pressed && { opacity: 0.85 }]}
    >
      <View style={[styles.cover, { backgroundColor: tokens.primarySoft }]}>
        <View style={[styles.coverArt, { backgroundColor: tokens.card }]}>
          <Ionicons name={moduleIonicon(tutorial.modulo)} size={24} color={tokens.primary} />
        </View>
        <View style={styles.coverLines}>
          <View style={[styles.coverLine, { backgroundColor: tokens.card }]} />
          <View style={[styles.coverLine, styles.coverLineShort, { backgroundColor: tokens.card }]} />
        </View>
        <RemoteImage key={tutorial.capaUrl} uri={tutorial.capaUrl} style={StyleSheet.absoluteFill} />
        {tutorial.tipo === 'video' ? (
          <View style={[styles.play, { backgroundColor: tokens.primary }]}>
            <Ionicons name="play" size={14} color="#ffffff" />
          </View>
        ) : null}
      </View>
      <TutorialMeta tokens={tokens} tutorial={tutorial} />
      <Text style={[styles.cardTitle, { color: tokens.text }]} numberOfLines={2}>
        {tutorial.titulo}
      </Text>
      {tutorial.descricao ? (
        <Text style={[styles.cardText, { color: tokens.textSecondary }]} numberOfLines={3}>
          {tutorial.descricao}
        </Text>
      ) : null}
      <View style={styles.cardAction}>
        <Text style={[styles.cardActionText, { color: tokens.primary }]}>{tutorial.actionLabel}</Text>
        <Ionicons name="chevron-forward" size={16} color={tokens.primary} />
      </View>
    </Pressable>
  );
}

export function SupportCard({ tokens, onPress }) {
  return (
    <View style={[styles.support, { backgroundColor: tokens.card, borderColor: tokens.cardBorder }]}>
      <View style={styles.supportCopy}>
        <View style={[styles.supportIcon, { backgroundColor: tokens.primarySoft }]}>
          <Ionicons name="headset-outline" size={20} color={tokens.primary} />
        </View>
        <View style={styles.flex}>
          <Text style={[styles.supportTitle, { color: tokens.text }]}>Ainda precisa de ajuda?</Text>
          <Text style={[styles.cardText, { color: tokens.textSecondary }]}>Fale com nossa equipe de suporte.</Text>
        </View>
      </View>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        style={({ pressed }) => [styles.supportBtn, { borderColor: tokens.cardBorder }, pressed && { opacity: 0.7 }]}
      >
        <Text style={[styles.cardActionText, { color: tokens.primary }]}>Falar com suporte</Text>
        <Ionicons name="chevron-forward" size={16} color={tokens.primary} />
      </Pressable>
    </View>
  );
}

export function TutoriaisSkeleton({ tokens }) {
  const fill = tokens.isDarkMode ? tokens.theme?.cardMuted || tokens.track : '#e7e4f7';
  return (
    <View style={styles.skeleton} accessibilityRole="progressbar" accessibilityLabel="Carregando tutoriais">
      <View style={[styles.skeletonBanner, { backgroundColor: fill }]} />
      {[0, 1, 2].map((i) => (
        <View key={i} style={[styles.skeletonCard, { backgroundColor: fill }]} />
      ))}
    </View>
  );
}

export function InfoBox({ tokens, icon = 'information-circle-outline', text }) {
  return (
    <View style={[styles.info, { backgroundColor: tokens.primarySoft }]}>
      <Ionicons name={icon} size={20} color={tokens.primary} />
      <Text style={[styles.infoText, { color: tokens.text }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: OVERVIEW_RADIUS, padding: 18, overflow: 'hidden' },
  bannerText: { flex: 1, minWidth: 0, gap: 4 },
  kicker: { fontSize: 11, fontWeight: '800', letterSpacing: 0.9 },
  bannerTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  bannerBody: { fontSize: 14, lineHeight: 20 },
  bannerBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: TOUCH_MIN,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  bannerBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  bannerArt: { width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 48, borderWidth: 1, borderRadius: 14, paddingHorizontal: 12 },
  searchInput: { flex: 1, minWidth: 0, fontSize: 16, paddingVertical: 10 },
  chips: { gap: 8, paddingRight: 8 },
  chip: { minHeight: 40, borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, justifyContent: 'center' },
  chipText: { fontSize: 14, fontWeight: '700' },
  card: { borderWidth: 1, borderRadius: OVERVIEW_RADIUS, padding: 14, gap: 6 },
  cover: {
    height: 96,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    marginBottom: 6,
    overflow: 'hidden',
  },
  coverArt: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  coverLines: { flex: 1, gap: 8 },
  coverLine: { height: 8, borderRadius: 4, width: '80%', opacity: 0.9 },
  coverLineShort: { width: '50%' },
  play: { position: 'absolute', right: 12, bottom: 12, width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  meta: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5, flexShrink: 1 },
  cardTitle: { fontSize: 17, fontWeight: '800', lineHeight: 22 },
  cardText: { fontSize: 14, lineHeight: 20 },
  cardAction: { flexDirection: 'row', alignItems: 'center', gap: 2, minHeight: 32, marginTop: 2 },
  cardActionText: { fontSize: 15, fontWeight: '700' },
  support: { borderWidth: 1, borderRadius: OVERVIEW_RADIUS, padding: 14, gap: 10 },
  supportCopy: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  supportIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  supportTitle: { fontSize: 16, fontWeight: '800' },
  supportBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, minHeight: TOUCH_MIN, borderWidth: 1, borderRadius: 12 },
  skeleton: { gap: 12 },
  skeletonBanner: { height: 150, borderRadius: OVERVIEW_RADIUS },
  skeletonCard: { height: 220, borderRadius: OVERVIEW_RADIUS },
  info: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderRadius: 14, padding: 12 },
  infoText: { flex: 1, fontSize: 14, lineHeight: 20 },
});
