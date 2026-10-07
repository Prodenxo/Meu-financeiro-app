/**
 * Leitura dos dados financeiros pela API do Meu Financeiro (backend Express do `Meu-financeiro-clone`).
 * O token é o do Supabase Auth do usuário logado; o servidor filtra tudo por `req.user.id`.
 */
import { getMeiApiAuthHeaders, getMeiApiUrl } from '@/lib/apiClient';
import { supabase } from '@/lib/supabase';
import { normalizeLancamentoRow } from '@/lib/finance/normalize';
import { normalizeContaRow } from '@/lib/finance/contas';
import { normalizeRecorrenciaRow } from '@/lib/finance/recorrencias';

const REQUEST_TIMEOUT_MS = 20000;

export class FinanceApiError extends Error {
  /**
   * @param {string} message
   * @param {{ kind: 'network' | 'auth' | 'http' | 'config', status?: number }} info
   */
  constructor(message, { kind, status } = { kind: 'http' }) {
    super(message);
    this.name = 'FinanceApiError';
    this.kind = kind;
    this.status = status;
  }
}

const buildUrl = (path) => {
  try {
    return getMeiApiUrl(path);
  } catch {
    throw new FinanceApiError('Servidor do app não configurado.', { kind: 'config' });
  }
};

const buildHeaders = async (extra) => {
  try {
    return await getMeiApiAuthHeaders(extra);
  } catch {
    throw new FinanceApiError('Sua sessão terminou. Entre novamente.', { kind: 'auth', status: 401 });
  }
};

async function fetchOnce(url, signal, method = 'GET', body) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const onAbort = () => controller.abort();
  signal?.addEventListener?.('abort', onAbort);
  try {
    const hasBody = body !== undefined;
    const headers = await buildHeaders(hasBody ? { 'Content-Type': 'application/json' } : undefined);
    const init = { method, headers, cache: 'no-store', signal: controller.signal };
    if (hasBody) init.body = JSON.stringify(body);
    return await fetch(url, init);
  } catch (error) {
    if (error instanceof FinanceApiError) throw error;
    if (signal?.aborted) throw error;
    throw new FinanceApiError('Sem conexão com o servidor. Verifique sua internet e tente de novo.', {
      kind: 'network',
    });
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener?.('abort', onAbort);
  }
}

async function readPayload(response) {
  const contentType = response.headers?.get?.('content-type') || '';
  if (!contentType.includes('application/json')) return null;
  try {
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * Chamada autenticada; renova a sessão e tenta de novo uma vez se o servidor responder 401
 * (o 401 vem do middleware de auth, antes de qualquer gravação).
 */
export async function financeRequest(method, path, body, { signal } = {}) {
  const url = buildUrl(path);
  let response = await fetchOnce(url, signal, method, body);

  if (response.status === 401) {
    const { data, error } = await supabase.auth.refreshSession();
    if (error || !data?.session) {
      throw new FinanceApiError('Sua sessão terminou. Entre novamente.', { kind: 'auth', status: 401 });
    }
    response = await fetchOnce(url, signal, method, body);
  }

  const payload = await readPayload(response);
  if (response.status === 401) {
    throw new FinanceApiError('Sua sessão terminou. Entre novamente.', { kind: 'auth', status: 401 });
  }
  if (!response.ok || payload?.success === false) {
    const message = String(payload?.message || '').trim() || `Erro do servidor (${response.status}).`;
    throw new FinanceApiError(message, { kind: 'http', status: response.status });
  }
  return payload ? payload.data : null;
}

export function financeGet(path, opts) {
  return financeRequest('GET', path, undefined, opts);
}

export async function fetchTransactions(opts) {
  const rows = await financeGet('/transactions', opts);
  return (Array.isArray(rows) ? rows : []).map(normalizeLancamentoRow);
}

export async function fetchRecorrencias(opts) {
  const rows = await financeGet('/recorrencias', opts);
  return (Array.isArray(rows) ? rows : []).map(normalizeRecorrenciaRow);
}

const normalizeSkip = (s) => ({ recorrencia_id: String(s.recorrencia_id), ano_mes: String(s.ano_mes) });

async function currentUserIdOrThrow() {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData?.session?.user?.id;
  if (!userId) {
    throw new FinanceApiError('Sua sessão terminou. Entre novamente.', { kind: 'auth', status: 401 });
  }
  return userId;
}

/**
 * Meses pulados das recorrências (lançamento recorrente excluído só naquele mês).
 * Servidor sem a rota (404): lê com o token do usuário, como o site (RLS isola os dados).
 */
export async function fetchRecorrenciaSkips(opts) {
  try {
    const rows = await financeGet('/recorrencias/skips', opts);
    return (Array.isArray(rows) ? rows : []).map(normalizeSkip);
  } catch (error) {
    if (!(error instanceof FinanceApiError) || error.status !== 404) throw error;
  }
  const userId = await currentUserIdOrThrow();
  const { data, error } = await supabase
    .from('recorrencia_skips')
    .select('recorrencia_id, ano_mes')
    .eq('user_id', userId);
  if (error) {
    throw new FinanceApiError('Não foi possível carregar as recorrências.', { kind: 'http' });
  }
  return (data || []).map(normalizeSkip);
}

export async function createTransaction(payload) {
  return normalizeLancamentoRow(await financeRequest('POST', '/transactions', payload));
}

export async function updateTransaction(id, patch) {
  return normalizeLancamentoRow(await financeRequest('PUT', '/transactions', { ...patch, id }));
}

/** `escopo`: 'este' | 'futuros' | 'todos' (os dois últimos só para lançamento recorrente). */
export async function deleteTransaction(id, escopo = 'este') {
  const qs = new URLSearchParams({ id: String(id), escopo });
  await financeRequest('DELETE', `/transactions?${qs.toString()}`);
}

export async function createRecorrencia(payload) {
  return financeRequest('POST', '/recorrencias', payload);
}

const sortContasByName = (contas) =>
  [...contas].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

/**
 * Contas financeiras do usuário. Se o servidor ainda não tiver a rota (404), lê a tabela
 * com o token do próprio usuário, como o site faz (RLS isola os dados).
 */
export async function fetchContas(opts) {
  try {
    const rows = await financeGet('/contas-financeiras', opts);
    return sortContasByName((Array.isArray(rows) ? rows : []).map(normalizeContaRow));
  } catch (error) {
    if (!(error instanceof FinanceApiError) || error.status !== 404) throw error;
  }

  const userId = await currentUserIdOrThrow();
  const { data, error } = await supabase
    .from('contas_financeiras')
    .select('*')
    .eq('user_id', userId)
    .order('nome');
  if (error) {
    throw new FinanceApiError('Não foi possível carregar suas contas.', { kind: 'http' });
  }
  return (data || []).map(normalizeContaRow);
}

export function toCategoryMaps(rows) {
  const categoriasMap = {};
  const categoriasTipoMap = {};
  const list = [];
  (Array.isArray(rows) ? rows : []).forEach((row) => {
    const id = Number(row?.id);
    const nome = String(row?.nome || '').trim();
    if (!id || !nome) return;
    const tipo = String(row?.tipo || '');
    categoriasMap[id] = nome;
    categoriasTipoMap[id] = tipo;
    list.push({ id, nome, tipo });
  });
  return { categoriasMap, categoriasTipoMap, list };
}

export async function fetchCategories(opts) {
  return toCategoryMaps(await financeGet('/categories', opts));
}

/** `month` em 1–12. */
export async function fetchBudgetSummary({ year, month }, opts) {
  const rows = await financeGet(`/categories/budgets/summary?year=${year}&month=${month}`, opts);
  return Array.isArray(rows) ? rows : [];
}

export async function fetchDreMatrix(year, opts) {
  const rows = await financeGet(`/categories/budgets/dre-matrix?year=${year}`, opts);
  return (Array.isArray(rows) ? rows : []).map((row) => ({
    categorias_id: Number(row.categorias_id),
    month: Number(row.month),
    valor_orcado: row.valor_orcado == null ? null : Number(row.valor_orcado),
    valor_gasto: Number(row.valor_gasto) || 0,
    valor_recebido: Number(row.valor_recebido) || 0,
  }));
}

/** Orçamentos do ano; `month` volta 0-based (janeiro = 0). */
export async function fetchBudgetsYearly(year, opts) {
  const rows = await financeGet(`/categories/budgets/yearly?year=${year}`, opts);
  return (Array.isArray(rows) ? rows : []).map((row) => ({
    categorias_id: Number(row.categorias_id),
    valor_orcado: row.valor_orcado == null ? null : Number(row.valor_orcado),
    month: Number(row.month),
  }));
}
