import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OVERVIEW_RADIUS, TOUCH_MIN } from '../Dashboard/overview/overviewTokens';

/** Esqueleto da primeira carga (sem valores inventados). */
export function CategoriasSkeleton({ tokens }) {
  const fill = tokens.isDarkMode ? tokens.theme.cardMuted : '#e7e4f7';
  return (
    <View style={styles.stack} accessibilityRole="progressbar" accessibilityLabel="Carregando suas categorias">
      <View style={[styles.block, { height: 168, backgroundColor: fill }]} />
      <View style={[styles.block, { height: 52, backgroundColor: fill }]} />
      <View style={[styles.line, { backgroundColor: fill }]} />
      <View style={[styles.block, { height: 72 * 3, backgroundColor: fill }]} />
    </View>
  );
}

function StateCard({ tokens, icon, title, text, actionLabel, actionIcon, onAction }) {
  return (
    <View style={[styles.card, { backgroundColor: tokens.card, borderColor: tokens.cardBorder }]}>
      <View style={[styles.icon, { backgroundColor: tokens.primarySoft }]}>
        <Ionicons name={icon} size={26} color={tokens.primary} />
      </View>
      <Text style={[styles.title, { color: tokens.text }]}>{title}</Text>
      {text ? <Text style={[styles.text, { color: tokens.textSecondary }]}>{text}</Text> : null}
      {onAction ? (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          style={({ pressed }) => [styles.btn, { backgroundColor: tokens.primary }, pressed && { opacity: 0.85 }]}
        >
          {actionIcon ? <Ionicons name={actionIcon} size={20} color="#ffffff" /> : null}
          <Text style={styles.btnText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function CategoriasEmpty({ tokens, onCreate }) {
  return (
    <StateCard
      tokens={tokens}
      icon="pricetags-outline"
      title="Nenhuma categoria ainda"
      text="Crie categorias para organizar seus lançamentos e ver para onde vai seu dinheiro."
      actionLabel="Criar primeira categoria"
      actionIcon="add"
      onAction={onCreate}
    />
  );
}

export function CategoriasNoResults({ tokens, search, onClear }) {
  return (
    <StateCard
      tokens={tokens}
      icon="search-outline"
      title={search ? `Nada encontrado para “${search.trim()}”` : 'Nenhuma categoria com esses filtros'}
      text={search ? 'Confira a grafia ou procure por parte do nome.' : 'Mude os filtros para ver as outras categorias.'}
      actionLabel={search ? 'Limpar busca' : 'Limpar filtros'}
      onAction={onClear}
    />
  );
}

/** Nenhuma categoria com lançamento no mês (as zeradas continuam em "Sem movimento"). */
export function NoMovementNotice({ tokens, viewTipo, monthLabel }) {
  return (
    <View style={[styles.notice, { backgroundColor: tokens.card, borderColor: tokens.cardBorder }]}>
      <Ionicons name="calendar-clear-outline" size={20} color={tokens.textSecondary} />
      <Text style={[styles.noticeText, { color: tokens.textSecondary }]}>
        Nenhuma {viewTipo === 'entrada' ? 'entrada' : 'saída'} lançada em {monthLabel.toLowerCase()}.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 16 },
  block: { borderRadius: OVERVIEW_RADIUS },
  line: { height: 18, width: 160, borderRadius: 9 },
  card: { borderRadius: OVERVIEW_RADIUS, borderWidth: 1, padding: 24, alignItems: 'center', gap: 10 },
  icon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 17, fontWeight: '700', textAlign: 'center' },
  text: { fontSize: 14, lineHeight: 20, textAlign: 'center' },
  btn: {
    flexDirection: 'row',
    gap: 6,
    minHeight: TOUCH_MIN + 4,
    borderRadius: 999,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  btnText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, borderWidth: 1, padding: 14 },
  noticeText: { flex: 1, fontSize: 14 },
});
