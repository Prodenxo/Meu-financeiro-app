import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { initialsOf } from '../Dashboard/overview/OverviewHeader';
import { TOUCH_MIN } from '../Dashboard/overview/overviewTokens';

/** ☰ · título e subtítulo · avatar. O menu só aparece onde não há navegação no topo (web largo). */
export function CategoriasHeader({
  tokens,
  displayName,
  showMenu,
  onOpenMenu,
  onOpenProfile,
  title = 'Categorias',
  subtitle = 'Entenda para onde vai seu dinheiro',
}) {
  return (
    <View style={styles.row}>
      {showMenu ? (
        <Pressable
          onPress={onOpenMenu}
          accessibilityRole="button"
          accessibilityLabel="Abrir menu"
          hitSlop={4}
          style={({ pressed }) => [
            styles.menuBtn,
            { backgroundColor: tokens.card, borderColor: tokens.cardBorder },
            pressed && { opacity: 0.7 },
          ]}
        >
          <Ionicons name="menu" size={24} color={tokens.text} />
        </Pressable>
      ) : null}
      <View style={styles.texts}>
        <Text style={[styles.title, { color: tokens.text }]} numberOfLines={1} accessibilityRole="header">
          {title}
        </Text>
        <Text style={[styles.subtitle, { color: tokens.textSecondary }]} numberOfLines={2}>
          {subtitle}
        </Text>
      </View>
      <Pressable
        onPress={onOpenProfile}
        accessibilityRole="button"
        accessibilityLabel="Abrir perfil e configurações"
        hitSlop={4}
        style={({ pressed }) => [
          styles.avatar,
          { backgroundColor: tokens.primarySoft, borderColor: tokens.cardBorder },
          pressed && { opacity: 0.8 },
        ]}
      >
        <Text style={[styles.avatarText, { color: tokens.primary }]} allowFontScaling={false}>
          {initialsOf(displayName || 'Usuário')}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuBtn: {
    width: TOUCH_MIN + 4,
    height: TOUCH_MIN + 4,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: { flex: 1, minWidth: 0 },
  title: { fontSize: 24, fontWeight: '800', letterSpacing: -0.4 },
  subtitle: { fontSize: 14, marginTop: 1 },
  avatar: {
    width: TOUCH_MIN + 4,
    height: TOUCH_MIN + 4,
    borderRadius: (TOUCH_MIN + 4) / 2,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 16, fontWeight: '700' },
});
