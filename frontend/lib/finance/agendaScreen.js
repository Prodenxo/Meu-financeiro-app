/**
 * Regras da tela Agenda do app (em cima de `agenda.js`, cópia do site): intervalo de cada vista,
 * navegação de período, eventos de vários dias e o lembrete do Google que já corresponde a um lançamento.
 */
import { APP_TIME_ZONE, nowInAppTimeZone } from '@/lib/date';
import {
  addDays,
  buildMonthGrid,
  compareItems,
  googleItem,
  monthBounds,
  monthOfKey,
  parseDayKey,
  transactionItem,
  weekDays,
} from './agenda';
import { MONTH_NAMES, MONTH_SHORT } from './format';
import { normalizarTipo, normalizarValor, pad2 } from './normalize';
import { transactionStatusLabel, isPendingTransaction } from './transactionsScreen';

export const AGENDA_VIEWS = [
  { value: 'month', label: 'Mês' },
  { value: 'week', label: 'Semana' },
  { value: 'day', label: 'Dia' },
];

const WEEKDAY_LONG = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
const WEEKDAY_STRIP = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTH_LONG = MONTH_NAMES.map((m) => m.toLowerCase());
const MAX_SPAN_DAYS = 366;

/** Hoje no fuso do produto (Brasil), não no fuso do aparelho. */
export function todayKeyInAppTimeZone(date = new Date()) {
  const { year, month, day } = nowInAppTimeZone(date);
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

/** Dias visíveis em cada vista: grade inteira do mês (com vizinhos), semana seg–dom ou o dia. */
export function viewRange(view, dayKey) {
  if (view === 'week') {
    const days = weekDays(dayKey);
    return { startKey: days[0], endKey: days[6] };
  }
  if (view === 'day') return { startKey: dayKey, endKey: dayKey };
  const grid = buildMonthGrid(monthOfKey(dayKey));
  return { startKey: grid[0].key, endKey: grid[grid.length - 1].key };
}

/** Intervalo pedido ao Google: do início do 1º dia até o início do dia seguinte ao último (fuso -03:00). */
export function googleTimeRange({ startKey, endKey }) {
  return { timeMin: `${startKey}T00:00:00-03:00`, timeMax: `${addDays(endKey, 1)}T00:00:00-03:00` };
}

/** Anterior/próximo conforme a vista. No mês, mantém o dia (limitado ao último dia do mês). */
export function shiftDay(view, dayKey, direction) {
  if (view === 'week') return addDays(dayKey, 7 * direction);
  if (view === 'day') return addDays(dayKey, direction);
  const { year, month } = monthOfKey(dayKey);
  const index = year * 12 + (month - 1) + direction;
  const target = { year: Math.floor(index / 12), month: (index % 12) + 1 };
  const day = Math.min(Number(dayKey.slice(8, 10)), monthBounds(target).days);
  return `${target.year}-${pad2(target.month)}-${pad2(day)}`;
}

/** "Outubro 2026"; semana entre dois meses: "Set – Out 2026". */
export function periodTitle(view, dayKey) {
  const { year, month } = monthOfKey(dayKey);
  if (view === 'week') {
    const days = weekDays(dayKey);
    const a = monthOfKey(days[0]);
    const b = monthOfKey(days[6]);
    if (a.month !== b.month || a.year !== b.year) {
      const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
      const left = `${cap(MONTH_SHORT[a.month - 1])}${a.year !== b.year ? ` ${a.year}` : ''}`;
      return `${left} – ${cap(MONTH_SHORT[b.month - 1])} ${b.year}`;
    }
  }
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

/** "Segunda-feira, 5 de outubro" (com o ano quando não é o ano de hoje). */
export function dayHeading(dayKey, todayKey) {
  const d = parseDayKey(dayKey);
  const base = `${WEEKDAY_LONG[d.getDay()]}, ${d.getDate()} de ${MONTH_LONG[d.getMonth()]}`;
  return todayKey && todayKey.slice(0, 4) !== dayKey.slice(0, 4) ? `${base} de ${d.getFullYear()}` : base;
}

export function weekdayStripLabel(dayKey) {
  return WEEKDAY_STRIP[parseDayKey(dayKey).getDay()];
}

/** "5 de outubro" — rótulo acessível de uma célula de dia. */
export function dayAccessibleDate(dayKey) {
  const d = parseDayKey(dayKey);
  return `${WEEKDAY_LONG[d.getDay()]}, ${d.getDate()} de ${MONTH_LONG[d.getMonth()]} de ${d.getFullYear()}`;
}

function zonedDayAndTime(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: APP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const get = (t) => parts.find((p) => p.type === t)?.value;
  return { key: `${get('year')}-${get('month')}-${get('day')}`, time: `${pad2(Number(get('hour')) % 24)}:${get('minute')}` };
}

/**
 * Dias ocupados por um evento do Google.
 * Dia inteiro: `end.date` é exclusivo. Com horário: termina no dia do fim, exceto quando acaba à 00:00.
 */
export function googleEventSpan(event) {
  let startKey;
  let lastKey;
  let endTime = null;
  if (event?.start?.date) {
    startKey = String(event.start.date).slice(0, 10);
    const endExclusive = event?.end?.date ? String(event.end.date).slice(0, 10) : null;
    lastKey = endExclusive && endExclusive > startKey ? addDays(endExclusive, -1) : startKey;
  } else {
    const start = event?.start?.dateTime ? zonedDayAndTime(event.start.dateTime) : null;
    if (!start) return [];
    startKey = start.key;
    const end = event?.end?.dateTime ? zonedDayAndTime(event.end.dateTime) : null;
    lastKey = startKey;
    if (end && end.key > startKey) {
      lastKey = end.time === '00:00' ? addDays(end.key, -1) : end.key;
      endTime = end.time;
    }
  }
  const days = [startKey];
  while (days[days.length - 1] < lastKey && days.length < MAX_SPAN_DAYS) {
    days.push(addDays(days[days.length - 1], 1));
  }
  return days.map((key) => ({ key, endTime }));
}

/* ===== Lembrete do Google que corresponde a um lançamento ===== */

const REMINDER_TITLE = /^(Pagar|Receber):\s*(R\$[\s\u00a0]*[\d.]+(?:,\d{1,2})?)(?:\s+—\s+.+)?$/;

function parseBrl(text) {
  const n = Number(String(text || '').replace(/[^\d,]/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : NaN;
}

/**
 * Evento criado pelo próprio Meu Financeiro como lembrete de um lançamento A pagar/A receber
 * (título "Pagar: R$ 25,00" ou "Receber: R$ 25,00 — Categoria" e descrição com "Categoria:" e "Valor:").
 */
export function parseTransactionReminder(event) {
  const title = REMINDER_TITLE.exec(String(event?.summary || '').trim());
  if (!title) return null;
  const desc = String(event?.description || '');
  const categoria = /(?:^|\n)Categoria:\s*(.+)/.exec(desc);
  if (!categoria || !/(?:^|\n)Valor:/.test(desc)) return null;
  const valor = parseBrl(title[2]);
  if (!Number.isFinite(valor)) return null;
  return {
    tipo: title[1] === 'Receber' ? 'entrada' : 'saida',
    valor,
    categoria: categoria[1].trim().toLowerCase(),
  };
}

const txCategoryKey = (t) => String(t?.classificacao || '').trim().toLowerCase() || 'sem categoria';

/* ===== Modelo da tela ===== */

function enrichTransaction(item, contaNameById) {
  const t = item.raw;
  const contaName = t.conta_id ? contaNameById[t.conta_id] || 'Conta removida' : 'Sem conta';
  return {
    ...item,
    contaName,
    statusLabel: transactionStatusLabel(t),
    pending: isPendingTransaction(t),
    googleEvent: null,
  };
}

function googleEntries(event, startKey, endKey) {
  const base = googleItem(event);
  if (!base) return [];
  const span = googleEventSpan(event);
  const total = span.length;
  const recurringEventId = event.recurringEventId ? String(event.recurringEventId) : null;
  const out = [];
  span.forEach(({ key, endTime }, index) => {
    if (key < startKey || key > endKey) return;
    let timeLabel = base.timeLabel;
    if (total > 1) {
      if (index === 0) timeLabel = `${base.isAllDay ? 'Dia inteiro' : `Começa ${base.time}`} · dia 1 de ${total}`;
      else if (index === total - 1 && endTime && endTime !== '00:00') timeLabel = `Até ${endTime} · dia ${total} de ${total}`;
      else timeLabel = `Dia inteiro · dia ${index + 1} de ${total}`;
    }
    out.push({
      ...base,
      id: total > 1 ? `${base.id}@${key}` : base.id,
      dayKey: key,
      time: index === 0 ? base.time : null,
      timeLabel,
      spanIndex: index,
      spanTotal: total,
      recurringEventId,
      isRecurring: Boolean(recurringEventId),
    });
  });
  return out;
}

/**
 * Junta lançamentos (qualquer status) e eventos do Google no intervalo visível.
 * Um evento do Google que é o lembrete de um lançamento do mesmo dia (tipo, valor e categoria iguais)
 * não aparece de novo: o lançamento passa a mostrar que tem lembrete no Google.
 */
export function buildAgendaModel({ transactions = [], googleEvents = [], contas = [], startKey, endKey }) {
  const contaNameById = {};
  for (const c of contas) contaNameById[c.id] = c.nome;

  const txItems = [];
  for (const t of transactions) {
    const item = transactionItem(t);
    if (item.dayKey >= startKey && item.dayKey <= endKey) txItems.push(enrichTransaction(item, contaNameById));
  }

  const items = [...txItems];
  for (const event of googleEvents) {
    const reminder = parseTransactionReminder(event);
    if (reminder) {
      const day = googleEventSpan(event)[0]?.key;
      const match = txItems.find(
        (it) =>
          !it.googleEvent &&
          it.dayKey === day &&
          normalizarTipo(it.raw.tipo) === reminder.tipo &&
          Math.abs(normalizarValor(it.raw.valor) - reminder.valor) < 0.005 &&
          reminder.categoria === txCategoryKey(it.raw),
      );
      if (match) {
        match.googleEvent = { id: String(event.id), htmlLink: event.htmlLink || null };
        continue;
      }
    }
    items.push(...googleEntries(event, startKey, endKey));
  }
  items.sort(compareItems);

  const byDay = {};
  const dots = {};
  for (const it of items) {
    (byDay[it.dayKey] ||= []).push(it);
    const d = (dots[it.dayKey] ||= { financeiro: 0, compromissos: 0 });
    if (it.source === 'transaction') d.financeiro += 1;
    else d.compromissos += 1;
  }
  return { items, byDay, dots };
}

/** Dia: primeiro o que não tem horário (lançamentos e dia inteiro), depois por horário. */
export function splitDayItems(items = []) {
  return {
    untimed: items.filter((it) => !it.time),
    timed: items.filter((it) => Boolean(it.time)),
  };
}

/** Contagem acessível dos marcadores de um dia. */
export function dotsAccessibleLabel(dot) {
  if (!dot) return 'sem eventos';
  const parts = [];
  if (dot.financeiro) parts.push(`${dot.financeiro} ${dot.financeiro === 1 ? 'lançamento' : 'lançamentos'}`);
  if (dot.compromissos) parts.push(`${dot.compromissos} ${dot.compromissos === 1 ? 'compromisso' : 'compromissos'}`);
  return parts.join(', ') || 'sem eventos';
}

const brDate = (key) => `${key.slice(8, 10)}/${key.slice(5, 7)}/${key.slice(0, 4)}`;

/** "05/10/2026 · 14:00 – 15:00", "05/10/2026 a 07/10/2026 · Dia inteiro"… a partir de `googleEventToForm`. */
export function describeEventWhen(form) {
  if (!form?.startDate) return '';
  const sameDay = !form.endDate || form.endDate === form.startDate;
  if (form.isAllDay) {
    return sameDay ? `${brDate(form.startDate)} · Dia inteiro` : `${brDate(form.startDate)} a ${brDate(form.endDate)} · Dia inteiro`;
  }
  return sameDay
    ? `${brDate(form.startDate)} · ${form.startTime} – ${form.endTime}`
    : `${brDate(form.startDate)} ${form.startTime} – ${brDate(form.endDate)} ${form.endTime}`;
}

/* ===== Formulário de compromisso ===== */

export function newEventForm(dayKey, { isAllDay = false } = {}) {
  return {
    title: '',
    description: '',
    location: '',
    isAllDay,
    startDate: dayKey,
    endDate: dayKey,
    startTime: '09:00',
    endTime: '10:00',
    colorId: '',
    recurrence: '',
    reminderMinutes: '30',
    createMeetLink: false,
  };
}

/** Término padrão 1 h depois do início (como o formulário atual do app). */
export function endAfterStart(startDate, startTime) {
  const [h, m] = String(startTime || '09:00').split(':').map(Number);
  const total = (h || 0) * 60 + (m || 0) + 60;
  const endDate = total >= 24 * 60 ? addDays(startDate, 1) : startDate;
  const minutes = total % (24 * 60);
  return { endDate, endTime: `${pad2(Math.floor(minutes / 60))}:${pad2(minutes % 60)}` };
}

export const TIME_SLOTS = Array.from({ length: 96 }, (_, i) => `${pad2(Math.floor(i / 4))}:${pad2((i % 4) * 15)}`);
