import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { buildMonthGrid, monthOfKey, WEEKDAY_HEADERS, weekDays } from '@/lib/finance/agenda';
import {
  AGENDA_VIEWS,
  dayAccessibleDate,
  dayHeading,
  dotsAccessibleLabel,
  weekdayStripLabel,
} from '@/lib/finance/agendaScreen';
import { OVERVIEW_RADIUS, TOUCH_MIN } from '../Dashboard/overview/overviewTokens';

/** ‹ Outubro 2026 › · Hoje */
const STEP_LABELS = {
  month: ['Mês anterior', 'Próximo mês'],
  week: ['Semana anterior', 'Próxima semana'],
  day: ['Dia anterior', 'Próximo dia'],
};

export function AgendaPeriodBar({ tokens, title, view, onPrev, onNext, onToday, isToday }) {
  const [prevLabel, nextLabel] = STEP_LABELS[view] || STEP_LABELS.month;
  return (
    <View style={styles.periodRow}>
      <Pressable
        onPress={onPrev}
        accessibilityRole="button"
        accessibilityLabel={prevLabel}
        hitSlop={4}
        style={({ pressed }) => [styles.arrow, pressed && { opacity: 0.6 }]}
      >
        <Ionicons name="chevron-back" size={22} color={tokens.text} />
      </Pressable>
      <Text style={[styles.periodTitle, { color: tokens.text }]} numberOfLines={1} accessibilityRole="header">
        {title}
      </Text>
      <Pressable
        onPress={onNext}
        accessibilityRole="button"
        accessibilityLabel={nextLabel}
        hitSlop={4}
        style={({ pressed }) => [styles.arrow, pressed && { opacity: 0.6 }]}
      >
        <Ionicons name="chevron-forward" size={22} color={tokens.text} />
      </Pressable>
      <Pressable
        onPress={onToday}
        accessibilityRole="button"
        accessibilityLabel="Ir para hoje"
        accessibilityState={{ selected: isToday }}
        style={({ pressed }) => [
          styles.todayBtn,
          { borderColor: tokens.cardBorder, backgroundColor: tokens.card },
          pressed && { opacity: 0.7 },
        ]}
      >
        <Ionicons name="calendar-outline" size={16} color={tokens.primary} />
        <Text style={[styles.todayText, { color: tokens.primary }]}>Hoje</Text>
      </Pressable>
    </View>
  );
}

/** Mês · Semana · Dia */
export function AgendaViewTabs({ tokens, value, onChange }) {
  return (
    <View style={[styles.tabs, { backgroundColor: tokens.card, borderColor: tokens.cardBorder }]} accessibilityRole="tablist">
      {AGENDA_VIEWS.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`Ver por ${opt.label.toLowerCase()}`}
            style={({ pressed }) => [
              styles.tab,
              active && { backgroundColor: tokens.primary },
              pressed && !active && { backgroundColor: tokens.track },
            ]}
          >
            <Text style={[styles.tabText, { color: active ? '#ffffff' : tokens.textSecondary }]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Dots({ tokens, dot, light }) {
  if (!dot) return <View style={styles.dotsRow} />;
  return (
    <View style={styles.dotsRow}>
      {dot.financeiro ? <View style={[styles.dot, { backgroundColor: light ? '#ffffff' : tokens.income }]} /> : null}
      {dot.compromissos ? (
        <View style={[styles.dot, { backgroundColor: light ? 'rgba(255,255,255,0.75)' : tokens.primary }]} />
      ) : null}
    </View>
  );
}

const DayCell = memo(function DayCell({ tokens, dayKey, label, topLabel, selected, today, muted, dot, onPress, tall }) {
  const color = selected ? '#ffffff' : today ? tokens.primary : muted ? tokens.textTertiary : tokens.text;
  const a11y = [dayAccessibleDate(dayKey), today ? 'hoje' : null, selected ? 'selecionado' : null, dotsAccessibleLabel(dot)]
    .filter(Boolean)
    .join(', ');
  return (
    <Pressable
      onPress={() => onPress(dayKey)}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      accessibilityState={{ selected }}
      style={({ pressed }) => [styles.cellWrap, pressed && !selected && { opacity: 0.7 }]}
    >
      {topLabel ? (
        <Text style={[styles.stripWeekday, { color: selected ? tokens.primary : tokens.textSecondary }]} maxFontSizeMultiplier={1.3}>
          {topLabel}
        </Text>
      ) : null}
      <View
        style={[
          styles.cell,
          tall && styles.cellTall,
          selected && { backgroundColor: tokens.primary },
          !selected && today && { borderColor: tokens.primary, borderWidth: 1.5 },
        ]}
      >
        <Text
          style={[styles.cellText, { color }, (selected || today) && styles.cellTextStrong, muted && !selected && { opacity: 0.55 }]}
          maxFontSizeMultiplier={1.4}
        >
          {label}
        </Text>
        <Dots tokens={tokens} dot={dot} light={selected} />
      </View>
    </Pressable>
  );
});

/** Grade do mês (segunda a domingo). Dias de outros meses aparecem esmaecidos e também são tocáveis. */
export function AgendaMonthGrid({ tokens, selectedDay, todayKey, dots, onSelect }) {
  const month = monthOfKey(selectedDay);
  const cells = buildMonthGrid(month);
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return (
    <View style={[styles.card, { backgroundColor: tokens.card, borderColor: tokens.cardBorder }, tokens.shadow]}>
      <View style={styles.weekHeader} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        {WEEKDAY_HEADERS.map((h) => (
          <Text key={h} style={[styles.weekHeaderText, { color: tokens.textTertiary }]} maxFontSizeMultiplier={1.2}>
            {h.charAt(0) + h.slice(1).toLowerCase()}
          </Text>
        ))}
      </View>
      {weeks.map((week) => (
        <View key={week[0].key} style={styles.weekRow}>
          {week.map((c) => (
            <DayCell
              key={c.key}
              tokens={tokens}
              dayKey={c.key}
              label={String(c.day)}
              selected={c.key === selectedDay}
              today={c.key === todayKey}
              muted={!c.inMonth}
              dot={dots[c.key]}
              onPress={onSelect}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

/** Faixa de 7 dias (seg–dom) da semana do dia escolhido. */
export function AgendaWeekStrip({ tokens, selectedDay, todayKey, dots, onSelect }) {
  const days = weekDays(selectedDay);
  return (
    <View style={[styles.card, { backgroundColor: tokens.card, borderColor: tokens.cardBorder }, tokens.shadow]}>
      <View style={styles.weekRow}>
        {days.map((key) => (
          <DayCell
            key={key}
            tokens={tokens}
            dayKey={key}
            label={String(Number(key.slice(8, 10)))}
            topLabel={weekdayStripLabel(key)}
            selected={key === selectedDay}
            today={key === todayKey}
            dot={dots[key]}
            onPress={onSelect}
            tall
          />
        ))}
      </View>
    </View>
  );
}

/** "Segunda-feira, 5 de outubro" · Lançamentos e compromissos · legenda */
export function AgendaDayHeading({ tokens, selectedDay, todayKey, stacked }) {
  const isToday = selectedDay === todayKey;
  return (
    <View style={[styles.headingRow, stacked && styles.headingStacked]}>
      <View style={styles.headingText}>
        <Text style={[styles.heading, { color: tokens.text }]} accessibilityRole="header">
          {dayHeading(selectedDay, todayKey)}
          {isToday ? <Text style={{ color: tokens.primary }}> · Hoje</Text> : null}
        </Text>
        <Text style={[styles.subheading, { color: tokens.textSecondary }]}>Lançamentos e compromissos</Text>
      </View>
      <View style={[styles.legend, stacked && styles.legendStacked]}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: tokens.income }]} />
          <Text style={[styles.legendText, { color: tokens.textSecondary }]}>Financeiro</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: tokens.primary }]} />
          <Text style={[styles.legendText, { color: tokens.textSecondary }]}>Compromissos</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  periodRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  arrow: { width: TOUCH_MIN, height: TOUCH_MIN, alignItems: 'center', justifyContent: 'center' },
  periodTitle: { flexShrink: 1, fontSize: 18, fontWeight: '800', textAlign: 'center', paddingHorizontal: 2 },
  todayBtn: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: TOUCH_MIN - 4,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  todayText: { fontSize: 14, fontWeight: '700' },
  tabs: { flexDirection: 'row', borderRadius: 14, borderWidth: 1, padding: 4, gap: 4 },
  tab: { flex: 1, minHeight: TOUCH_MIN - 4, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  tabText: { fontSize: 14, fontWeight: '700' },
  card: { borderRadius: OVERVIEW_RADIUS, borderWidth: 1, paddingVertical: 8, paddingHorizontal: 4 },
  weekHeader: { flexDirection: 'row', paddingBottom: 4 },
  weekHeaderText: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '700' },
  weekRow: { flexDirection: 'row' },
  cellWrap: { flex: 1, alignItems: 'center', paddingVertical: 2, minHeight: TOUCH_MIN },
  stripWeekday: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  cell: {
    width: '86%',
    maxWidth: 48,
    minHeight: TOUCH_MIN,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  cellTall: { minHeight: TOUCH_MIN + 8 },
  cellText: { fontSize: 15, fontWeight: '600', fontVariant: ['tabular-nums'] },
  cellTextStrong: { fontWeight: '800' },
  dotsRow: { flexDirection: 'row', gap: 3, height: 6, marginTop: 3 },
  dot: { width: 5, height: 5, borderRadius: 3 },
  headingRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  headingStacked: { flexDirection: 'column', gap: 6 },
  headingText: { flex: 1, minWidth: 0, gap: 2 },
  heading: { fontSize: 17, fontWeight: '800' },
  subheading: { fontSize: 13 },
  legend: { gap: 4, alignItems: 'flex-start', paddingTop: 2 },
  legendStacked: { flexDirection: 'row', gap: 14 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, fontWeight: '600' },
});
