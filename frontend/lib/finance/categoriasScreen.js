import {
  buildCategoryRows,
  buildMonthFlow,
  mergeCategoriesByName,
  monthTransactions,
} from './categorias.js';
import { normalizarTipo, normalizarValor, normalizeCategoryKey, parseTransactionDate, toDayKey } from './normalize.js';
import { formatDayMonth } from './format.js';
import { getTransactionStatusLabel, isRealizedLancamentoStatus, normalizeTransactionStatus } from './status.js';

/**
 * Extras da tela Categorias do app (o resto vem de `categorias.js`, cópia do site — não editar lá):
 * percentuais seguros, barra de distribuição, busca sem acento, filtros, grupos com/sem movimento,
 * detalhes da categoria e validação do formulário.
 */

export const CATEGORY_NAME_MAX = 60;

export const CATEGORY_SORTS = [
  { id: 'valor', label: 'Maior valor' },
  { id: 'nome', label: 'Nome (A–Z)' },
];

export const CATEGORY_SHOWS = [
  { id: 'todas', label: 'Todas' },
  { id: 'com', label: 'Só com movimento' },
  { id: 'sem', label: 'Só sem movimento' },
];

export const DEFAULT_CATEGORY_FILTERS = { sort: 'valor', show: 'todas' };

/** Quantas categorias aparecem com cor própria na barra; o resto vira "Outras" (só na barra). */
export const DISTRIBUTION_LIMIT = 4;

export function normalizeSearch(text) {
  return String(text || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/** Participação 0–100; total zero/negativo, valor negativo (estorno) ou inválido → 0. */
export function safeShare(amount, total) {
  const a = Number(amount);
  const t = Number(total);
  if (!Number.isFinite(a) || !Number.isFinite(t) || t <= 0 || a <= 0) return 0;
  return Math.min(100, (a / t) * 100);
}

/** "68,4%"; participação positiva muito pequena vira "<0,1%" (nunca "0,0%" para quem tem valor). */
export function formatShare(pct) {
  if (!(pct > 0)) return '0%';
  if (pct < 0.05) return '<0,1%';
  return `${pct.toFixed(1).replace('.', ',')}%`;
}

/** Tem lançamento no mês (mesmo que a soma dê zero ou negativa por estorno). */
export const hasLancamentos = (row) => row.count > 0;

export function activeFilterCount(filters) {
  let n = 0;
  if (filters.sort !== DEFAULT_CATEGORY_FILTERS.sort) n += 1;
  if (filters.show !== DEFAULT_CATEGORY_FILTERS.show) n += 1;
  return n;
}

function sortRows(rows, sort) {
  if (sort !== 'nome') return rows;
  return [...rows].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }));
}

/**
 * Segmentos da barra: maiores categorias com valor positivo + "Outras" com o restante.
 * A largura usa como base o maior entre o total e a soma das categorias, para nunca passar de 100%.
 */
export function buildDistributionBar(rows, total, limit = DISTRIBUTION_LIMIT) {
  const positive = rows.filter((r) => r.amount > 0.009).sort((a, b) => b.amount - a.amount);
  const sumPositive = positive.reduce((s, r) => s + r.amount, 0);
  const base = Math.max(total > 0 ? total : 0, sumPositive);
  if (base <= 0) return [];

  const top = positive.length > limit + 1 ? positive.slice(0, limit) : positive;
  const rest = positive.slice(top.length);
  const segments = top.map((r) => ({
    id: r.id,
    nome: r.nome,
    valor: r.amount,
    pct: safeShare(r.amount, total),
    width: (r.amount / base) * 100,
    color: r.isOrphan ? null : r.color,
    isOrphan: r.isOrphan,
  }));
  if (rest.length > 0) {
    const valor = rest.reduce((s, r) => s + r.amount, 0);
    segments.push({
      id: 'outras',
      nome: `Outras (${rest.length})`,
      valor,
      pct: safeShare(valor, total),
      width: (valor / base) * 100,
      color: null,
      isOrphan: false,
      count: rest.length,
    });
  }
  return segments;
}

/**
 * Modelo da tela para o mês e o tipo escolhidos. Valores por categoria seguem a regra do site
 * (`buildCategoryRows`); a busca e os filtros só escolhem o que aparece na lista.
 */
export function buildCategoriasScreenModel({
  categories,
  transactions,
  selectedMonth,
  viewTipo = 'saida',
  search = '',
  filters = DEFAULT_CATEGORY_FILTERS,
}) {
  const merged = mergeCategoriesByName(categories);
  const monthTxs = monthTransactions(transactions, selectedMonth);
  const allRows = buildCategoryRows({ categories: merged, monthTxs, viewTipo });
  const flow = buildMonthFlow(monthTxs);
  const total = viewTipo === 'entrada' ? flow.entradas : flow.saidas;
  const withMovement = allRows.filter(hasLancamentos);

  const term = normalizeSearch(search);
  const matches = term ? allRows.filter((r) => normalizeSearch(r.nome).includes(term)) : allRows;
  const sorted = sortRows(matches, filters.sort);
  const activeRows = filters.show === 'sem' ? [] : sorted.filter(hasLancamentos);
  const idleRows = filters.show === 'com' ? [] : sorted.filter((r) => !hasLancamentos(r));

  return {
    total,
    rows: allRows,
    activeRows,
    idleRows,
    counts: {
      ofTipo: merged.filter((c) => c.tipo === viewTipo).length,
      withMovement: withMovement.length,
      idle: allRows.length - withMovement.length,
    },
    distribution: buildDistributionBar(withMovement, total),
    hasCategories: merged.length > 0,
    isSearching: Boolean(term),
    resultCount: activeRows.length + idleRows.length,
  };
}

const dayKeyOf = (t) => toDayKey(parseTransactionDate(t));

/** Lançamentos da categoria no mês (o detalhe que abre na lista), mais recentes primeiro. */
export function categoryLines(row) {
  return [...(row.transactions || [])]
    .sort(
      (a, b) =>
        dayKeyOf(b).localeCompare(dayKeyOf(a)) || String(b.criado_em || '').localeCompare(String(a.criado_em || '')),
    )
    .map((t) => {
      const day = dayKeyOf(t);
      const obs = String(t.obs || '').trim();
      return {
        id: String(t.id),
        title: obs || formatDayMonth(day) || 'Lançamento',
        dateLabel: formatDayMonth(day),
        statusLabel: getTransactionStatusLabel(t.tipo, t.status),
        realized: isRealizedLancamentoStatus(normalizeTransactionStatus(t.tipo, t.status)),
        valor: normalizarValor(t.valor),
      };
    });
}

/** Lançamentos (de qualquer mês) com o nome da categoria — os que a exclusão move para a padrão. */
export function countCategoryTransactions(transactions, nome) {
  const key = normalizeCategoryKey(nome);
  if (!key) return 0;
  return (transactions || []).filter((t) => normalizeCategoryKey(t.classificacao) === key).length;
}

export function deleteCategoriaMessage(nome, linked) {
  const base = `Excluir a categoria “${nome}”?`;
  if (linked === 0) return `${base} Nenhum lançamento usa esta categoria.`;
  const qtd = linked === 1 ? '1 lançamento passa' : `${linked} lançamentos passam`;
  return `${base} ${qtd} para a categoria padrão. Valores e datas não mudam.`;
}

/** Mesma chave de duplicidade do servidor: nome sem acento/caixa + tipo. */
const copyKey = (nome, tipo) => `${normalizeSearch(nome)}:${normalizarTipo(tipo)}`;

export function categoriaFormInitial(categoria, defaultTipo = 'saida') {
  return {
    nome: categoria?.nome || '',
    tipo: categoria ? normalizarTipo(categoria.tipo) : defaultTipo === 'entrada' ? 'entrada' : 'saida',
  };
}

/** Validação local (o servidor repete as mesmas regras). `categories` = lista atual, para duplicidade. */
export function validateCategoriaForm(form, categories, editingId = null) {
  const nome = String(form.nome || '').trim();
  const tipo = normalizarTipo(form.tipo);
  const errors = {};
  if (!nome) errors.nome = 'Informe o nome da categoria.';
  else if (nome.length > CATEGORY_NAME_MAX) errors.nome = `Use até ${CATEGORY_NAME_MAX} caracteres.`;
  else {
    const key = copyKey(nome, tipo);
    const dup = (categories || []).find(
      (c) => String(c.id) !== String(editingId ?? '') && copyKey(c.nome, c.tipo) === key,
    );
    if (dup) errors.nome = `Já existe a categoria "${dup.nome}" em ${tipo === 'entrada' ? 'entradas' : 'saídas'}.`;
  }
  if (Object.keys(errors).length > 0) return { errors, payload: null };
  return { errors: null, payload: { nome, tipo } };
}
