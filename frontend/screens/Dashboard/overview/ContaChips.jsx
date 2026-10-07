import React, { useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TOUCH_MIN } from './overviewTokens';

/** Filtro de conta: Todas · cada conta ativa · Sem conta vinculada. Rola só na horizontal. */
export function ContaChips({ tokens, contas, value, onChange }) {
  const listRef = useRef(null);
  const [offset, setOffset] = useState(0);
  const [canScrollMore, setCanScrollMore] = useState(false);
  const sizes = useRef({ content: 0, layout: 0 });

  const options = [
    { key: 'all', label: 'Todas' },
    ...contas.map((c) => ({ key: c.id, label: c.nome || 'Conta' })),
    { key: 'unassigned', label: 'Sem conta vinculada' },
  ];

  const updateCanScroll = (x) => {
    const { content, layout } = sizes.current;
    setCanScrollMore(content - layout - x > 8);
  };

  const scrollForward = () => {
    const next = offset + Math.max(120, sizes.current.layout * 0.7);
    listRef.current?.scrollToOffset({ offset: next, animated: true });
  };

  return (
    <View style={styles.row}>
      <FlatList
        ref={listRef}
        horizontal
        data={options}
        keyExtractor={(item) => item.key}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        style={styles.flex}
        onLayout={(e) => {
          sizes.current.layout = e.nativeEvent.layout.width;
          updateCanScroll(offset);
        }}
        onContentSizeChange={(w) => {
          sizes.current.content = w;
          updateCanScroll(offset);
        }}
        onScroll={(e) => {
          const x = e.nativeEvent.contentOffset.x;
          setOffset(x);
          updateCanScroll(x);
        }}
        scrollEventThrottle={32}
        accessibilityRole="tablist"
        renderItem={({ item }) => {
          const active = item.key === value;
          return (
            <Pressable
              onPress={() => onChange(item.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              style={({ pressed }) => [
                styles.chip,
                {
                  backgroundColor: active ? tokens.primarySoft : tokens.card,
                  borderColor: active ? tokens.primary : tokens.cardBorder,
                },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Text
                style={[styles.chipText, { color: active ? tokens.primary : tokens.text }]}
                numberOfLines={1}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        }}
      />
      {canScrollMore ? (
        <Pressable
          onPress={scrollForward}
          accessibilityRole="button"
          accessibilityLabel="Ver mais contas"
          style={[styles.more, { backgroundColor: tokens.card, borderColor: tokens.cardBorder }]}
        >
          <Ionicons name="chevron-forward" size={18} color={tokens.text} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flex: { flex: 1 },
  list: { gap: 8, paddingRight: 4 },
  chip: {
    minHeight: 40,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    maxWidth: 220,
  },
  chipText: { fontSize: 14, fontWeight: '600' },
  more: {
    width: TOUCH_MIN - 4,
    height: TOUCH_MIN - 4,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
