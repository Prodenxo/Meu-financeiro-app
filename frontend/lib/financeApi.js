/**
 * Leitura dos dados financeiros pela API do Meu Financeiro (backend Express do `Meu-financeiro-clone`).
 * O token é o do Supabase Auth do usuário logado; o servidor filtra tudo por `req.user.id`.
 */
import { getMeiApiAuthHeaders, getMeiApiUrl } from '@/lib/apiClient';
import { supabase } from '@/lib/supabase';
import { normalizeLancamentoRow } from '@/lib/finance/normalize';
import { normalizeContaRow } from '@/lib/finance/contas';
import { normalizeRecorrenciaRow } from '@/lib/finance/recorrencias';
import { budgetDateParam } from '@/lib/finance/orcamentosScreen';
import { buildCurrencyCatalog, normalizeContaMoedaGlobalRow } from '@/lib/finance/moedas';

const REQUEST_TIMEOUT_MS = 20000;

export class FinanceApiError extends Error {
  /**
   * @param {string} message
   * @param {{ kind: 'network' | 'auth' | 'http' | 'config', status?: number, errors?: Record<string, string> | null, routeMissing?: boolean }} info
   */
  constructor(message, { kind, status, errors = null, routeMissing = false } = { kind: 'http' }) {
    super(message);
    this.name = 'FinanceApiError';
    this.kind = kind;
    this.status = status;
    /** Mensagens por campo devolvidas pelo servidor (validação). */
    this.errors = errors;
    /** 404 sem JSON: o servidor publicado ainda não tem a rota. */
    this.routeMissing = routeMissing;
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
    const errors = payload?.errors && typeof payload.errors === 'object' ? payload.errors : null;
    throw new FinanceApiError(message, {
      kind: 'http',
      status: response.status,
      errors,
      routeMissing: response.status === 404 && !payload,
    });
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

const isRouteMissing = (error) => error instanceof FinanceApiError && error.routeMissing;

const contaWriteError = () =>
  new FinanceApiError('Não foi possível salvar a conta. Tente de novo.', { kind: 'http' });

/**
 * `payload` já validado por `validateContaForm` (mesmas regras do servidor e do site).
 * Servidor sem a rota (404 sem JSON): grava com o token do usuário, como o site (RLS).
 */
export async function createConta(payload) {
  try {
    return normalizeContaRow(await financeRequest('POST', '/contas-financeiras', payload));
  } catch (error) {
    if (!isRouteMissing(error)) throw error;
  }
  const userId = await currentUserIdOrThrow();
  const { bank_mode: _mode, ...row } = payload;
  const { data, error } = await supabase
    .from('contas_financeiras')
    .insert({ ...row, user_id: userId, atualizado_em: new Date().toISOString() })
    .select('*')
    .single();
  if (error) throw contaWriteError();
  return normalizeContaRow(data);
}

export async function updateConta(id, payload) {
  const contaId = encodeURIComponent(String(id));
  try {
    return normalizeContaRow(await financeRequest('PUT', `/contas-financeiras/${contaId}`, payload));
  } catch (error) {
    if (!isRouteMissing(error)) throw error;
  }
  const userId = await currentUserIdOrThrow();
  const { bank_mode: _mode, ...row } = payload;
  const { data, error } = await supabase
    .from('contas_financeiras')
    .update({ ...row, atualizado_em: new Date().toISOString() })
    .eq('id', String(id))
    .eq('user_id', userId)
    .select('*')
    .maybeSingle();
  if (error) throw contaWriteError();
  if (!data) throw new FinanceApiError('Conta não encontrada.', { kind: 'http', status: 404 });
  return normalizeContaRow(data);
}

/** Remove a conta; os lançamentos vinculados ficam sem conta (`ON DELETE SET NULL`). */
export async function deleteConta(id) {
  const contaId = encodeURIComponent(String(id));
  try {
    await financeRequest('DELETE', `/contas-financeiras/${contaId}`);
    return;
  } catch (error) {
    if (!isRouteMissing(error)) throw error;
  }
  const userId = await currentUserIdOrThrow();
  const { error } = await supabase
    .from('contas_financeiras')
    .delete()
    .eq('id', String(id))
    .eq('user_id', userId);
  if (error) {
    throw new FinanceApiError('Não foi possível excluir a conta. Tente de novo.', { kind: 'http' });
  }
}

/** Reimporta o extrato da conta sincronizada (mesma chamada do site). */
export async function syncContaExtrato(id) {
  return financeRequest('POST', '/open-finance/pluggy/sync', { contaId: String(id), mode: 'full' });
}

/** Desliga a sincronização automática da conta; lançamentos já importados ficam. */
export async function disconnectContaSync(id) {
  return financeRequest('POST', '/open-finance/pluggy/disconnect', { contaId: String(id) });
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

/** Categorias do usuário como o servidor devolve (o servidor já copia as globais para o usuário). */
export async function fetchCategoriaRows(opts) {
  const rows = await financeGet('/categories', opts);
  return (Array.isArray(rows) ? rows : [])
    .filter((row) => row?.id != null && String(row?.nome || '').trim())
    .map((row) => ({
      id: String(row.id),
      nome: String(row.nome).trim(),
      tipo: String(row.tipo || ''),
      user_id: row.user_id ? String(row.user_id) : null,
    }));
}

/** `payload` = { nome, tipo } já validado por `validateCategoriaForm` (o servidor repete as regras). */
export async function createCategoria(payload) {
  return financeRequest('POST', '/categories', payload);
}

/**
 * Servidor anterior a esta versão não renomeia os lançamentos (resposta sem `renamed_transactions`):
 * renomeia com o token do usuário, como o site, para eles não virarem "Sem categoria".
 */
export async function updateCategoria(id, payload, { previousName } = {}) {
  const data = await financeRequest('PUT', '/categories', { id: Number(id), nome: payload.nome, tipo: payload.tipo });
  const renamed = previousName && previousName !== payload.nome;
  if (renamed && (data == null || data.renamed_transactions === undefined)) {
    const userId = await currentUserIdOrThrow();
    const { error } = await supabase
      .from('lancamentos_id')
      .update({ classificacao: payload.nome })
      .eq('user_id', userId)
      .eq('classificacao', previousName);
    if (error) {
      throw new FinanceApiError('Categoria salva, mas os lançamentos não foram renomeados. Tente de novo.', {
        kind: 'http',
      });
    }
  }
  return data;
}

/**
 * Exclui a categoria; o servidor move os lançamentos dela para a categoria padrão do tipo.
 * `movedTo` nulo = servidor anterior a esta versão (só apagou; os lançamentos aparecem em "Sem categoria").
 */
export async function deleteCategoria(id) {
  const qs = new URLSearchParams({ id: String(id) });
  const data = await financeRequest('DELETE', `/categories?${qs.toString()}`);
  return {
    movedTo: data?.moved_to ? String(data.moved_to) : null,
    moved: Number(data?.moved_transactions) || 0,
  };
}

/* ===== Conta global (contas_moeda_global) =====
 * O backend não tem rotas de leitura/gravação dessa tabela: como o site, lê e grava com o token do usuário
 * (RLS isola por usuário). Cotações e catálogo vêm do backend (`/moedas-globais`).
 */

const CONTA_GLOBAL_TABLE = 'contas_moeda_global';

function contaGlobalError(error, fallback) {
  const msg = String(error?.message || '');
  const code = String(error?.code || '');
  if (code === '42P01' || code === 'PGRST205' || /schema cache|does not exist/i.test(msg)) {
    return new FinanceApiError('A Conta global ainda não está disponível no servidor.', { kind: 'http' });
  }
  if (/network request failed|failed to fetch|network/i.test(msg)) {
    return new FinanceApiError('Sem conexão com o servidor. Verifique sua internet e tente de novo.', { kind: 'network' });
  }
  if (code === '23514') {
    return new FinanceApiError('O saldo não pode ser negativo.', { kind: 'http', errors: { valor: 'O saldo não pode ser negativo.' } });
  }
  return new FinanceApiError(fallback, { kind: 'http' });
}

/** Saldos ativos do usuário, como o site (`fetchContasMoedaGlobal`). */
export async function fetchContasMoedaGlobal() {
  const userId = await currentUserIdOrThrow();
  const { data, error } = await supabase
    .from(CONTA_GLOBAL_TABLE)
    .select('*')
    .eq('user_id', userId)
    .eq('ativo', true)
    .order('moeda', { ascending: true });
  if (error) throw contaGlobalError(error, 'Não foi possível carregar a Conta global.');
  return (data || []).map(normalizeContaMoedaGlobalRow);
}

/** `payload` = { moeda, nome, valor } já validado por `validateMoedaForm`. */
export async function saveContaMoedaGlobal(id, payload) {
  const userId = await currentUserIdOrThrow();
  const row = {
    moeda: payload.moeda,
    nome: payload.nome,
    valor: payload.valor,
    ativo: true,
    atualizado_em: new Date().toISOString(),
  };
  const query = id
    ? supabase.from(CONTA_GLOBAL_TABLE).update(row).eq('id', id).eq('user_id', userId)
    : supabase.from(CONTA_GLOBAL_TABLE).insert({ ...row, user_id: userId });
  const { data, error } = await query.select('*');
  if (error) throw contaGlobalError(error, 'Não foi possível salvar a moeda.');
  if (!data?.length) {
    throw new FinanceApiError('Este saldo não existe mais. Atualize a lista.', { kind: 'http', status: 404 });
  }
  return normalizeContaMoedaGlobalRow(data[0]);
}

/** Exclui como o site (`deleteMoedaGlobalAction`): só a linha do próprio usuário. */
export async function deleteContaMoedaGlobal(id) {
  const userId = await currentUserIdOrThrow();
  const { error } = await supabase.from(CONTA_GLOBAL_TABLE).delete().eq('id', id).eq('user_id', userId);
  if (error) throw contaGlobalError(error, 'Não foi possível excluir a moeda.');
}

/**
 * Cotações (1 unidade = X reais) pelo backend. `sources` (fonte + data informada pelo provedor) só vem do
 * servidor com esta versão; sem ela a tela não mostra data.
 */
export async function fetchCotacoesBrl(codes, opts) {
  const list = [...new Set((codes || []).map((c) => String(c).trim().toUpperCase()).filter((c) => c && c !== 'BRL'))];
  if (list.length === 0) return { rates: {}, sources: [] };
  const data = await financeGet(`/moedas-globais/cotacoes?codes=${encodeURIComponent(list.join(','))}`, opts);
  const rates = {};
  for (const [code, value] of Object.entries(data?.rates || {})) {
    const n = Number(value);
    if (Number.isFinite(n) && n > 0) rates[String(code).toUpperCase()] = n;
  }
  const sources = Array.isArray(data?.sources)
    ? data.sources.map((s) => ({
        name: s?.name ? String(s.name) : null,
        date: /^\d{4}-\d{2}-\d{2}$/.test(String(s?.date || '')) ? String(s.date) : null,
        codes: Array.isArray(s?.codes) ? s.codes.map((c) => String(c).toUpperCase()) : [],
      }))
    : [];
  return { rates, sources };
}

/**
 * Catálogo `{ CODE: nome }`: códigos do backend + nomes conhecidos; se o servidor falhar usa a lista do site
 * (`fromServer: false`).
 */
export async function fetchMoedasCatalog(opts) {
  try {
    const data = await financeGet('/moedas-globais/currencies', opts);
    return { catalog: buildCurrencyCatalog(Object.keys(data?.currencies || {})), fromServer: true };
  } catch {
    return { catalog: buildCurrencyCatalog([]), fromServer: false };
  }
}

/** `month` em 1–12. */
export async function fetchBudgetSummary({ year, month }, opts) {
  const rows = await financeGet(`/categories/budgets/summary?year=${year}&month=${month}`, opts);
  return Array.isArray(rows) ? rows : [];
}

/**
 * Cria ou altera o limite da categoria no mês. `onlyIfEmpty` (novo orçamento): o servidor recusa com 409
 * se a categoria já tiver limite no mês. `valor` nulo remove o limite (os lançamentos não mudam).
 */
export async function saveBudget({ categoriaId, valor, month, onlyIfEmpty = false }) {
  return financeRequest('POST', '/categories/budgets', {
    categorias_id: Number(categoriaId),
    valor_orcado: valor,
    date: budgetDateParam(month),
    ...(onlyIfEmpty ? { only_if_empty: true } : null),
  });
}

export async function removeBudget({ categoriaId, month }) {
  return saveBudget({ categoriaId, valor: null, month });
}

/** Copia os limites do mês anterior para `month` (o servidor substitui os que já existem no destino). */
export async function duplicateBudgets(month) {
  const data = await financeRequest('POST', '/categories/budgets/duplicate', { year: month.year, month: month.month });
  return { duplicated: Number(data?.duplicated) || 0 };
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
