import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCategoryIconName } from '@/lib/categoryIcons';
import { formatBrl } from '@/lib/finance/format';
import { categoryLines, formatShare, safeShare } from '@/lib/finance/categoriasScreen';
import { OVERVIEW_RADIUS, TOUCH_MIN } from '../Dashboard/overview/overviewTokens';

/** Quantos lançamentos aparecem dentro da categoria aberta; o resto fica em Transações. */
const LINES_PREVIEW = 6;

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

function shareText(row, total, viewTipo) {
  if (row.count === 0) return 'Sem lançamentos no mês';
  if (row.amount < 0) return 'Estornos superam os valores do mês';
  const pct = safeShare(row.amount, total);
  if (pct > 0) return `${formatShare(pct)} das ${viewTipo === 'entrada' ? 'entradas' : 'saídas'}`;
  return `${plural(row.count, 'lançamento', 'lançamentos')} sem valor no mês`;
}

function CategoryLines({ tokens, row, onSeeAll }) {
  const lines = categoryLines(row);
  const shown = lines.slice(0, LINES_PREVIEW);
  const rest = lines.length - shown.length;
  return (
    <View style={styles.lines}>
      <View style={[styles.treeLine, { backgroundColor: tokens.track }]} />
      <View style={styles.linesBody}>
        {shown.map((l, i) => (
          <View
            key={l.id}
            style={[styles.line, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: tokens.cardBorder }]}
            accessible
            accessibilityLabel={`${l.title}, ${l.dateLabel}, ${l.statusLabel}, ${formatBrl(l.valor)}`}
          >
            <View style={styles.lineTexts}>
              <Text style={[styles.lineTitle, { color: tokens.text }]} numberOfLines={1}>
                {l.title}
              </Text>
              <Text style={[styles.lineMeta, { color: l.realized ? tokens.textTertiary : tokens.warning }]} numberOfLines={1}>
                {l.dateLabel} · {l.statusLabel}
              </Text>
            </View>
            <Text style={[styles.lineValue, { color: tokens.text }]} numberOfLines={1}>
              {formatBrl(l.valor)}
            </Text>
          </View>
        ))}
        {rest > 0 && onSeeAll ? (
          <Pressable
            onPress={onSeeAll}
            accessibilityRole="link"
            style={({ pressed }) => [styles.seeAll, pressed && { opacity: 0.6 }]}
          >
            <Text style={[styles.seeAllText, { color: tokens.primary }]}>
              Ver os {lines.length} lançamentos em Transações
            </Text>
            <Ionicons name="chevron-forward" size={16} color={tokens.primary} />
          </Pressable>
        ) : null}
        {rest > 0 && !onSeeAll ? (
          <Text style={[styles.lineMeta, styles.moreText, { color: tokens.textTertiary }]}>
            + {plural(rest, 'lançamento', 'lançamentos')} neste mês
          </Text>
        ) : null}
      </View>
    </View>
  );
}

/** Linha da categoria: ícone, nome, participação e valor; ⋮ abre as ações; seta abre os lançamentos. */
export function CategoryRow({ tokens, row, total, viewTipo, expanded, onToggle, onOpenMenu, onSeeAll, first }) {
  const expandable = row.count > 0;
  const iconBg = row.isOrphan ? tokens.track : tokens.primarySoft;
  const iconFg = row.isOrphan ? tokens.textSecondary : tokens.primary;
  const valueColor = row.count === 0 ? tokens.textTertiary : tokens.text;
  const share = shareText(row, total, viewTipo);

  return (
    <View style={!first && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: tokens.cardBorder }}>
      <View style={styles.row}>
        <Pressable
          onPress={expandable ? onToggle : undefined}
          disabled={!expandable}
          accessibilityRole={expandable ? 'button' : undefined}
          accessibilityState={expandable ? { expanded } : undefined}
          accessibilityLabel={`${row.nome}, ${formatBrl(row.amount)}, ${share}${
            expandable ? (expanded ? '. Ocultar lançamentos' : '. Ver lançamentos') : ''
          }`}
          style={({ pressed }) => [styles.main, pressed && { opacity: 0.7 }]}
        >
          <View style={[styles.icon, { backgroundColor: iconBg }]}>
            <Ionicons name={row.isOrphan ? 'pricetag-outline' : getCategoryIconName(row.nome)} size={22} color={iconFg} />
          </View>
          <View style={styles.texts}>
            <View style={styles.nameRow}>
              {!row.isOrphan && row.count > 0 ? <View style={[styles.dot, { backgroundColor: row.color }]} /> : null}
              <Text style={[styles.name, { color: tokens.text }]} numberOfLines={2}>
                {row.nome}
              </Text>
            </View>
            <Text style={[styles.share, { color: tokens.textSecondary }]} numberOfLines={2}>
              {share}
            </Text>
          </View>
          <Text style={[styles.amount, { color: valueColor }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
            {formatBrl(row.amount)}
          </Text>
        </Pressable>
        {onOpenMenu ? (
          <Pressable
            onPress={onOpenMenu}
            accessibilityRole="button"
            accessibilityLabel={`Ações da categoria ${row.nome}`}
            style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
          >
            <Ionicons name="ellipsis-vertical" size={20} color={tokens.textSecondary} />
          </Pressable>
        ) : null}
        {expandable ? (
          <Pressable
            onPress={onToggle}
            accessibilityRole="button"
            accessibilityState={{ expanded }}
            accessibilityLabel={expanded ? `Ocultar lançamentos de ${row.nome}` : `Ver lançamentos de ${row.nome}`}
            style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
          >
            <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color={tokens.primary} />
          </Pressable>
        ) : null}
      </View>
      {expanded && expandable ? <CategoryLines tokens={tokens} row={row} onSeeAll={onSeeAll} /> : null}
    </View>
  );
}

/** Grupo branco com as linhas (com movimento, ou as zeradas dentro de "Sem movimento"). */
export function CategoryGroup({ tokens, rows, renderRowProps }) {
  return (
    <View style={[styles.group, { backgroundColor: tokens.card, borderColor: tokens.cardBorder }, tokens.shadow]}>
      {rows.map((row, i) => (
        <CategoryRow key={row.id} tokens={tokens} row={row} first={i === 0} {...renderRowProps(row)} />
      ))}
    </View>
  );
}

/** "Sem movimento" recolhido por padrão; aberto, lista as categorias zeradas com as mesmas ações. */
export function IdleGroup({ tokens, rows, open, onToggle, renderRowProps }) {
  return (
    <View style={[styles.group, { backgroundColor: tokens.card, borderColor: tokens.cardBorder }, tokens.shadow]}>
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`Sem movimento, ${plural(rows.length, 'categoria', 'categorias')}. ${open ? 'Ocultar' : 'Mostrar'}`}
        style={({ pressed }) => [styles.row, styles.idleHead, pressed && { opacity: 0.7 }]}
      >
        <View style={[styles.icon, { backgroundColor: tokens.track }]}>
          <Ionicons name="folder-outline" size={22} color={tokens.textSecondary} />
        </View>
        <View style={styles.texts}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: tokens.text }]}>Sem movimento</Text>
            <View style={[styles.countBadge, { backgroundColor: tokens.primarySoft }]}>
              <Text style={[styles.countText, { color: tokens.primary }]}>{rows.length}</Text>
            </View>
          </View>
          <Text style={[styles.share, { color: tokens.textSecondary }]}>
            {open ? 'Categorias sem lançamentos no mês' : 'Ver categorias sem lançamentos'}
          </Text>
        </View>
        <View style={styles.iconBtn}>
          <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={20} color={tokens.primary} />
        </View>
      </Pressable>
      {open
        ? rows.map((row) => <CategoryRow key={row.id} tokens={tokens} row={row} first={false} {...renderRowProps(row)} />)
        : null}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { borderRadius: OVERVIEW_RADIUS, borderWidth: 1, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', paddingRight: 4, minHeight: 72 },
  idleHead: { paddingLeft: 16, gap: 12 },
  main: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 16, paddingVertical: 12 },
  icon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  texts: { flex: 1, minWidth: 0, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  name: { fontSize: 16, fontWeight: '700', flexShrink: 1 },
  share: { fontSize: 13 },
  amount: { fontSize: 16, fontWeight: '800', maxWidth: '42%', fontVariant: ['tabular-nums'] },
  iconBtn: { width: TOUCH_MIN, height: TOUCH_MIN, alignItems: 'center', justifyContent: 'center' },
  countBadge: { minWidth: 26, height: 22, borderRadius: 8, paddingHorizontal: 7, alignItems: 'center', justifyContent: 'center' },
  countText: { fontSize: 12, fontWeight: '700' },
  lines: { flexDirection: 'row', paddingLeft: 36, paddingRight: 16, paddingBottom: 8 },
  treeLine: { width: 2, borderRadius: 1, marginRight: 14, marginBottom: 14 },
  linesBody: { flex: 1, minWidth: 0 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48, paddingVertical: 6 },
  lineTexts: { flex: 1, minWidth: 0 },
  lineTitle: { fontSize: 15 },
  lineMeta: { fontSize: 12, marginTop: 1 },
  lineValue: { fontSize: 15, fontWeight: '600', fontVariant: ['tabular-nums'] },
  seeAll: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: TOUCH_MIN },
  seeAllText: { fontSize: 14, fontWeight: '700' },
  moreText: { paddingVertical: 10 },
});
