/**
 * Regras da tela Transações do app que vão além do site: chips, busca por valor,
 * filtro de categoria, agrupamento por dia e textos de apresentação.
 * Os critérios de período, conta, projeções, totais e ordenação vêm de `./transactions.js`.
 */
import { normalizarTipo, normalizarValor, parseTransactionDate, toDayKey } from './normalize.js';
import { filterTransactionsByConta } from './contas.js';
import { isProjecao, projectRecurrences } from './recorrencias.js';
import { normalizeTransactionStatus } from './status.js';
import { MONTH_NAMES } from './format.js';
import {
  DEFAULT_FILTERS,
  computeMonthFlowKpis,
  isPaidStatus,
  isValidDateRange,
  matchesPeriod,
  matchesPills,
  matchesSearch,
  projectionMonthRange,
  resolvePeriod,
  sortTransactions,
} from './transactions.js';

export const SCREEN_DEFAULT_FILTERS = { ...DEFAULT_FILTERS, categoria: 'all' };

export const CHIPS = [
  { id: 'todas', label: 'Todas', typeFilter: 'all', statusFilter: 'all' },
  { id: 'entradas', label: 'Entradas', typeFilter: 'entrada', statusFilter: 'all' },
  { id: 'saidas', label: 'Saídas', typeFilter: 'saida', statusFilter: 'all' },
  { id: 'pendentes', label: 'Pendentes', typeFilter: 'all', statusFilter: 'pendente' },
];

/** Chip ativo para a combinação de tipo/situação, ou `null` quando é uma combinação do painel de filtros. */
export function chipForFilters({ typeFilter, statusFilter }) {
  return CHIPS.find((c) => c.typeFilter === typeFilter && c.statusFilter === statusFilter)?.id ?? null;
}

const DATE_SORTS = new Set(['recentes', 'antigas']);
export const isDateSort = (sort) => DATE_SORTS.has(sort);

const MONEY_QUERY = /^[\d.,\s]+$/;

/** "4000", "4.000", "4.000,00", "22,5" ou "R$ 22" encontram o lançamento pelo valor. */
export function matchesValueSearch(t, search) {
  const q = String(search || '').replace(/R\$/gi, '').trim();
  if (!q || !MONEY_QUERY.test(q) || !/\d/.test(q)) return false;
  const query = q.replace(/\s/g, '');
  const valor = Math.abs(normalizarValor(t.valor));
  const fixed = valor.toFixed(2);
  const br = valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const candidates = [fixed, fixed.replace('.', ','), br, br.replace(/\./g, '')];
  return candidates.some((c) => c.includes(query));
}

export function matchesScreenSearch(t, search) {
  return matchesSearch(t, search) || matchesValueSearch(t, search);
}

export function matchesCategoria(t, categoria) {
  if (!categoria || categoria === 'all') return true;
  return String(t.classificacao || '').trim().toLowerCase() === String(categoria).trim().toLowerCase();
}

/**
 * Mesma composição do `buildTransactionsModel` do site, com busca por valor e categoria.
 * Totais: lançamentos reais do período + busca + categoria + conta (sem tipo/situação), sobre a base inteira.
 */
export function buildTransactionsScreenModel({
  transactions,
  recorrencias = [],
  skips = [],
  filters,
  selectedMonth,
  today,
  sort = 'recentes',
}) {
  const resolved = resolvePeriod({ period: filters.period, selectedMonth, dateRange: filters.dateRange, today });
  const inScope = (t) =>
    matchesPeriod(t, resolved) && matchesScreenSearch(t, filters.search) && matchesCategoria(t, filters.categoria);

  const realFiltered = filterTransactionsByConta(transactions.filter(inScope), filters.contaFilter);
  const projections = projectRecurrences(
    recorrencias,
    transactions,
    projectionMonthRange(resolved, today),
    skips,
  ).filter(inScope);

  const combined = filterTransactionsByConta([...realFiltered, ...projections], filters.contaFilter);
  const unique = [...new Map(combined.map((t) => [t.id, t])).values()];
  const rows = sortTransactions(unique.filter((t) => matchesPills(t, filters)), sort);

  return {
    period: resolved,
    kpis: computeMonthFlowKpis(realFiltered),
    rows,
    exportRows: rows.filter((t) => !isProjecao(t)),
    totalsIgnorePills: filters.typeFilter !== 'all' || filters.statusFilter !== 'all',
  };
}

const WEEKDAYS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];

/** '2026-10-22' → '22 de outubro • quinta-feira' */
export function formatDayHeader(dayKey) {
  const [y, m, d] = String(dayKey || '').split('-').map(Number);
  if (!y || !m || !d) return '';
  const weekday = WEEKDAYS[new Date(y, m - 1, d, 12).getDay()];
  return `${d} de ${MONTH_NAMES[m - 1].toLowerCase()} • ${weekday}`;
}

/** Seções por dia (ordenação por data) ou uma seção única sem cabeçalho (ordenação por valor). */
export function groupRowsByDay(rows, sort) {
  if (!isDateSort(sort)) return rows.length ? [{ key: 'todas', title: null, data: rows }] : [];
  const sections = [];
  const byKey = new Map();
  for (const t of rows) {
    const key = toDayKey(parseTransactionDate(t));
    let section = byKey.get(key);
    if (!section) {
      section = { key, title: formatDayHeader(key), data: [] };
      byKey.set(key, section);
      sections.push(section);
    }
    section.data.push(t);
  }
  return sections;
}

export const isEntrada = (t) => normalizarTipo(t?.tipo) === 'entrada';

export function isPendingTransaction(t) {
  return !isPaidStatus(normalizeTransactionStatus(t?.tipo, t?.status));
}

/** "A pagar" / "A receber" / "Pago" / "Recebido" (como na referência da tela). */
export function transactionStatusLabel(t) {
  const entrada = isEntrada(t);
  if (isPendingTransaction(t)) return entrada ? 'A receber' : 'A pagar';
  return entrada ? 'Recebido' : 'Pago';
}

export function markPaidLabel(t) {
  return isEntrada(t) ? 'Marcar como recebido' : 'Marcar como pago';
}

/** Status realizado conforme o tipo (entrada → recebido, saída → pago). */
export function paidStatusFor(t) {
  return isEntrada(t) ? 'recebido' : 'pago';
}

/** Segunda linha da linha: observação • conta (ou "Sem conta"). */
export function rowSubtitle(t, contaNameById = {}) {
  const conta = t.conta_id ? contaNameById[t.conta_id] || 'Conta removida' : 'Sem conta';
  const obs = String(t.obs || '').trim();
  return obs ? `${obs} • ${conta}` : conta;
}

/** Texto que explica o que os totais do resumo representam. */
export function summaryCaption({ period, totalsIgnorePills }, filters) {
  const scopeParts = [];
  if (filters.search) scopeParts.push('busca');
  if (filters.categoria && filters.categoria !== 'all') scopeParts.push('categoria');
  if (filters.contaFilter && filters.contaFilter !== 'all') scopeParts.push('conta');
  const periodText =
    period.mode === 'today' ? 'hoje' : period.mode === 'week' ? 'esta semana' : period.label;
  let text = `Totais de ${periodText}`;
  if (scopeParts.length) text += `, com ${scopeParts.join(', ').replace(/, ([^,]*)$/, ' e $1')}`;
  text += '. Inclui lançamentos pendentes; previsões de recorrência não entram.';
  if (totalsIgnorePills) text += ' O filtro de tipo/situação muda só a lista, não os totais.';
  return text;
}

export function hasScreenFilters(filters) {
  return (
    filters.period !== SCREEN_DEFAULT_FILTERS.period ||
    isValidDateRange(filters.dateRange) ||
    Boolean(filters.search) ||
    filters.typeFilter !== 'all' ||
    filters.statusFilter !== 'all' ||
    filters.contaFilter !== 'all' ||
    (filters.categoria && filters.categoria !== 'all')
  );
}

/** Quantos filtros do painel estão ativos (para o selo do botão de filtros). */
export function countPanelFilters(filters, sort) {
  let n = 0;
  if (filters.period !== SCREEN_DEFAULT_FILTERS.period || isValidDateRange(filters.dateRange)) n += 1;
  if (filters.contaFilter !== 'all') n += 1;
  if (filters.categoria && filters.categoria !== 'all') n += 1;
  if (chipForFilters(filters) == null) n += 1;
  if (sort !== 'recentes') n += 1;
  return n;
}

/** Categorias do tipo escolhido no formulário (o banco usa 'saida' ou 'saída'). */
export function categoriesForTipo(list, tipo) {
  const want = normalizarTipo(tipo) === 'entrada' ? 'entrada' : 'saida';
  return (list || []).filter((c) => {
    const t = String(c.tipo || '').toLowerCase();
    return (t === 'saída' ? 'saida' : t) === want;
  });
}
