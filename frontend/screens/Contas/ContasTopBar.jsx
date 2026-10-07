import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { initialsOf } from '../Dashboard/overview/OverviewHeader';
import { TOUCH_MIN } from '../Dashboard/overview/overviewTokens';

/** ☰ título · avatar. O menu só aparece onde não há navegação no topo (web largo). */
export function ContasTopBar({ tokens, displayName, showMenu, onOpenMenu, onOpenProfile, title = 'Contas' }) {
  return (
    <View style={styles.row}>
      {showMenu ? (
        <Pressable
          onPress={onOpenMenu}
          accessibilityRole="button"
          accessibilityLabel="Abrir menu"
          hitSlop={4}
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
        >
          <Ionicons name="menu" size={24} color={tokens.text} />
        </Pressable>
      ) : null}
      <Text style={[styles.title, { color: tokens.text }]} numberOfLines={1} accessibilityRole="header">
        {title}
      </Text>
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
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconBtn: { width: TOUCH_MIN, height: TOUCH_MIN, alignItems: 'center', justifyContent: 'center', marginLeft: -8 },
  title: { flex: 1, fontSize: 18, fontWeight: '700', marginLeft: 2 },
  avatar: {
    width: TOUCH_MIN,
    height: TOUCH_MIN,
    borderRadius: TOUCH_MIN / 2,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 15, fontWeight: '700' },
});
