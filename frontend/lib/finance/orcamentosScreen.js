/**
 * Regras da tela Orçamentos do app. Os valores vêm de `GET /categories/budgets/summary` (backend):
 * - uma linha por categoria (duplicadas de mesmo nome+tipo já unificadas pelo servidor);
 * - `valor_orcado` nulo = categoria sem orçamento no mês (excluir um orçamento grava nulo);
 * - realizado de saída = todas as saídas do mês pela data do lançamento (qualquer status);
 *   realizado de entrada = entradas recebidas do mês;
 * - totais só somam categorias com orçamento (como a tela anterior).
 * Funções puras, sem UI.
 */
import { normalizarTipo } from './normalize.js';
import { parseMoney, toMoneyInput } from './money.js';
import { formatBrl, formatMonthLabel } from './format.js';
import { prevMonth } from './dashboard.js';

export const BUDGET_VALUE_MAX = 999_999_999.99;
/** A partir daqui a despesa aparece como "perto do limite" (mesma faixa vermelha da Visão geral). */
export const BUDGET_WARNING_PCT = 75;

const pad2 = (n) => String(n).padStart(2, '0');

export const monthKey = ({ year, month }) => `${year}-${pad2(month)}`;

/** "Outubro de 2026". */
export const monthTitle = (month) => formatMonthLabel(month).replace(' ', ' de ');

/**
 * Data enviada ao servidor. Meio-dia sem fuso: o servidor anterior faz `new Date(date)` e, com "AAAA-MM-01",
 * gravava no mês anterior quando roda no fuso do Brasil.
 */
export const budgetDateParam = (month) => `${monthKey(month)}-01T12:00:00`;

const toNumberOrNull = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

export function normalizeBudgetSummaryRow(row) {
  return {
    categorias_id: String(row?.categorias_id ?? ''),
    valor_orcado: toNumberOrNull(row?.valor_orcado),
    valor_gasto: toNumber(row?.valor_gasto),
    valor_recebido: toNumber(row?.valor_recebido),
  };
}

/**
 * % usado. Nulo quando o limite é zero (não há divisão possível). Realizado negativo (estornos maiores
 * que os gastos) conta como 0% de uso; o valor negativo continua visível no item.
 */
export function usagePercent(orcado, realizado) {
  if (!(orcado > 0)) return null;
  const pct = (Math.max(0, realizado) / orcado) * 100;
  return Number.isFinite(pct) ? pct : null;
}

/** Largura da barra (0–100). Acima de 100% a barra fica cheia; o texto mostra o % real. */
export function barWidth(percent, { orcado = 1, realizado = 0 } = {}) {
  if (percent === null) return orcado <= 0 && realizado > 0 ? 100 : 0;
  return Math.min(100, Math.max(0, percent));
}

/** "0%", "45%", "112,5%", "<0,1%"; nulo → "—". */
export function formatUsage(percent) {
  if (percent === null || !Number.isFinite(percent)) return '—';
  if (percent > 0 && percent < 0.1) return '<0,1%';
  const rounded = Math.round(percent * 10) / 10;
  return `${String(rounded).replace('.', ',')}%`;
}

/**
 * Estado de consumo. Despesa: sem gasto (neutro), dentro, perto (≥75%), no limite, acima (vermelho).
 * Receita: sem recebimento (neutro), em andamento, meta atingida. Realizado zero nunca aparece como "bom".
 */
export function budgetState({ tipo, orcado, realizado }) {
  const percent = usagePercent(orcado, realizado);
  if (tipo === 'entrada') {
    if (realizado <= 0) return { key: 'idle', label: 'Nada recebido ainda', tone: 'neutral' };
    if (orcado <= 0 || percent >= 100) return { key: 'reached', label: 'Meta atingida', tone: 'success' };
    return { key: 'progress', label: 'Em andamento', tone: 'accent' };
  }
  if (realizado <= 0) return { key: 'idle', label: 'Nada gasto ainda', tone: 'neutral' };
  if (realizado > orcado) return { key: 'over', label: 'Acima do limite', tone: 'danger' };
  if (percent >= 100) return { key: 'limit', label: 'No limite', tone: 'warning' };
  if (percent >= BUDGET_WARNING_PCT) return { key: 'near', label: 'Perto do limite', tone: 'warning' };
  return { key: 'ok', label: 'Dentro do limite', tone: 'accent' };
}

/** Frase curta sob a barra do item. */
export function budgetDetail(item) {
  const { tipo, orcado, realizado, state } = item;
  if (realizado < 0) return `Estornos de ${formatBrl(Math.abs(realizado))} no mês`;
  if (tipo === 'entrada') {
    if (state.key === 'reached') return realizado > orcado ? `${formatBrl(realizado - orcado)} acima da meta` : 'Meta do mês atingida';
    if (state.key === 'idle') return 'Nenhuma entrada recebida neste mês';
    return `Faltam ${formatBrl(orcado - realizado)} para a meta`;
  }
  if (state.key === 'over') return `${formatBrl(realizado - orcado)} acima do limite`;
  if (state.key === 'idle') return 'Nenhuma saída neste mês';
  if (state.key === 'limit') return 'Limite do mês atingido';
  return `Restam ${formatBrl(orcado - realizado)}`;
}

const byName = (a, b) => a.nome.localeCompare(b.nome, 'pt-BR');

/** Categorias do resumo que pertencem ao usuário, com nome e tipo. */
function summaryCategories(summary, categories, userId) {
  const catById = new Map((categories || []).map((c) => [String(c.id), c]));
  const out = [];
  for (const row of summary || []) {
    const cat = catById.get(row.categorias_id);
    if (!cat || !String(cat.nome || '').trim()) continue;
    if (userId && cat.user_id && cat.user_id !== userId) continue;
    out.push({ row, cat });
  }
  return out;
}

export function buildBudgetItems(summary, categories, userId) {
  const items = [];
  for (const { row, cat } of summaryCategories(summary, categories, userId)) {
    if (row.valor_orcado === null) continue;
    const tipo = normalizarTipo(cat.tipo);
    const orcado = row.valor_orcado;
    const realizado = tipo === 'entrada' ? row.valor_recebido : row.valor_gasto;
    const percent = usagePercent(orcado, realizado);
    const item = {
      id: row.categorias_id,
      nome: String(cat.nome).trim(),
      tipo,
      orcado,
      realizado,
      percent,
      bar: barWidth(percent, { orcado, realizado }),
      state: budgetState({ tipo, orcado, realizado }),
    };
    item.detail = budgetDetail(item);
    items.push(item);
  }
  return items.sort(byName);
}

export function buildBudgetTotals(items) {
  const orcado = items.reduce((s, i) => s + i.orcado, 0);
  const realizado = items.reduce((s, i) => s + i.realizado, 0);
  const percent = usagePercent(orcado, realizado);
  const overCount = items.filter((i) => i.state.key === 'over').length;
  let tone = 'accent';
  if (realizado <= 0) tone = 'neutral';
  else if (percent !== null && percent > 100) tone = 'danger';
  else if (percent !== null && percent >= BUDGET_WARNING_PCT) tone = 'warning';
  return {
    orcado,
    realizado,
    percent,
    bar: barWidth(percent, { orcado, realizado }),
    tone,
    count: items.length,
    overCount,
    hasIncomeGoals: items.some((i) => i.tipo === 'entrada'),
  };
}

/** Categorias do usuário ainda sem orçamento no mês — opções de "Novo orçamento". */
export function availableCategories(summary, categories, userId) {
  return summaryCategories(summary, categories, userId)
    .filter(({ row }) => row.valor_orcado === null)
    .map(({ cat, row }) => ({ id: row.categorias_id, nome: String(cat.nome).trim(), tipo: normalizarTipo(cat.tipo) }))
    .sort(byName);
}

export function buildOrcamentosModel({ summary, categories, userId }) {
  const items = buildBudgetItems(summary, categories, userId);
  return {
    items,
    totals: buildBudgetTotals(items),
    available: availableCategories(summary, categories, userId),
  };
}

/**
 * Plano de "Duplicar mês": o servidor copia os limites do mês anterior para o mês escolhido e substitui os
 * que já existem no destino. `changed` = limites do destino que mudariam de valor (o usuário decide).
 */
export function buildDuplicatePlan({ sourceSummary, targetSummary, categories, userId, targetMonth }) {
  const sourceItems = buildBudgetItems(sourceSummary, categories, userId);
  const targetById = new Map(buildBudgetItems(targetSummary, categories, userId).map((i) => [i.id, i]));
  const fresh = [];
  const same = [];
  const changed = [];
  for (const s of sourceItems) {
    const t = targetById.get(s.id);
    if (!t) fresh.push({ id: s.id, nome: s.nome, valor: s.orcado });
    else if (Math.abs(t.orcado - s.orcado) < 0.005) same.push({ id: s.id, nome: s.nome, valor: s.orcado });
    else changed.push({ id: s.id, nome: s.nome, atual: t.orcado, novo: s.orcado });
  }
  const source = prevMonth(targetMonth);
  return {
    sourceMonth: source,
    targetMonth,
    sourceLabel: monthTitle(source),
    targetLabel: monthTitle(targetMonth),
    sourceCount: sourceItems.length,
    fresh,
    same,
    changed,
  };
}

/** Texto do resultado depois de duplicar. */
export function duplicateResultMessage(plan, mode) {
  const copied = plan.fresh.length + (mode === 'replace' ? plan.changed.length : 0);
  const kept = mode === 'keep' ? plan.changed.length : 0;
  const parts = [];
  if (copied > 0) parts.push(`${copied} ${copied === 1 ? 'limite copiado' : 'limites copiados'} de ${plan.sourceLabel}`);
  else parts.push('Nenhum limite novo para copiar');
  if (mode === 'replace' && plan.changed.length > 0) {
    parts.push(`${plan.changed.length} ${plan.changed.length === 1 ? 'substituído' : 'substituídos'}`);
  }
  if (kept > 0) parts.push(`${kept} ${kept === 1 ? 'mantido' : 'mantidos'} como estava`);
  return `${parts.join(' · ')}.`;
}

export function budgetFormInitial(item, month) {
  return {
    categoriaId: item ? item.id : '',
    valor: item ? toMoneyInput(item.orcado) : '',
    month: { year: month.year, month: month.month },
  };
}

/**
 * Valida o formulário. `available` = categorias livres no mês escolhido (nulo quando o mês do formulário
 * não é o da tela: aí o servidor recusa a duplicidade).
 */
export function validateBudgetForm(form, { isEdit, available }) {
  const errors = {};
  const categoriaId = String(form.categoriaId || '');
  if (!categoriaId) errors.categorias_id = 'Escolha uma categoria.';
  else if (!isEdit && available && !available.some((c) => c.id === categoriaId)) {
    errors.categorias_id = 'Esta categoria já tem orçamento neste mês.';
  }

  const raw = String(form.valor || '').trim();
  const valor = parseMoney(raw);
  if (!raw) errors.valor_orcado = 'Informe o valor orçado.';
  else if (!Number.isFinite(valor)) errors.valor_orcado = 'Valor inválido. Use o formato 1.500,00.';
  else if (valor < 0) errors.valor_orcado = 'O valor orçado não pode ser negativo.';
  else if (valor > BUDGET_VALUE_MAX) errors.valor_orcado = 'Valor alto demais.';

  if (Object.keys(errors).length) return { errors, payload: null };
  return {
    errors: null,
    payload: { categoriaId, valor: Math.round(valor * 100) / 100, month: form.month },
  };
}

export const deleteBudgetMessage = (item, monthLabel) =>
  `Remover o limite de “${item.nome}” em ${monthLabel}? A categoria e os lançamentos dela continuam como estão; só o planejamento deste mês é apagado.`;
