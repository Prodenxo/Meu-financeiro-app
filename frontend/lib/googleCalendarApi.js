/**
 * Google Agenda pela edge function `google-calendar` (a mesma do site e do app antigo).
 * O app só envia o token do Supabase do usuário; os tokens do Google ficam no servidor.
 */
import Constants from 'expo-constants';
import { getPublicEnv } from '@/lib/runtimeEnv';
import { supabase } from '@/lib/supabase';

const REQUEST_TIMEOUT_MS = 20000;

export class GoogleCalendarError extends Error {
  /**
   * @param {string} message
   * @param {{ kind: 'network' | 'auth' | 'not_connected' | 'expired' | 'http' | 'config', status?: number }} info
   */
  constructor(message, { kind, status } = { kind: 'http' }) {
    super(message);
    this.name = 'GoogleCalendarError';
    this.kind = kind;
    this.status = status;
  }
}

const SESSION_ENDED = 'Sua sessão terminou. Entre novamente.';
const NOT_CONNECTED = 'Google Agenda não conectada.';
const EXPIRED = 'A autorização do Google Agenda expirou ou foi revogada. Reconecte para continuar.';

const supabaseUrl = () =>
  getPublicEnv('EXPO_PUBLIC_SUPABASE_URL') || Constants.expoConfig?.extra?.supabaseUrl || '';
const supabaseAnonKey = () =>
  getPublicEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY') || Constants.expoConfig?.extra?.supabaseAnonKey || '';

function functionUrl(path, query) {
  const base = supabaseUrl().replace(/\/rest\/v1$/, '').replace(/\/$/, '');
  if (!base) throw new GoogleCalendarError('Servidor do app não configurado.', { kind: 'config' });
  const qs = query ? `?${new URLSearchParams(query).toString()}` : '';
  return `${base}/functions/v1/google-calendar/${path}${qs}`;
}

/**
 * Traduz a resposta de erro da edge function no estado da conexão.
 * - 401 "Nao autenticado"/JWT: sessão do app (renova e tenta de novo).
 * - 401 "Tokens nao encontrados": Google nunca conectado (ou desconectado).
 * - 401 "Token expirado" / 500 "Erro ao renovar token": autorização vencida ou revogada.
 * - 500 com 401/403/invalid_grant do Google: acesso revogado na conta Google.
 */
export function classifyGoogleError(status, message) {
  const text = String(message || '');
  const lower = text.toLowerCase();
  if (status === 401 && (lower.includes('nao autenticado') || lower.includes('jwt'))) {
    return new GoogleCalendarError(SESSION_ENDED, { kind: 'auth', status });
  }
  if (lower.includes('tokens nao encontrados')) {
    return new GoogleCalendarError(NOT_CONNECTED, { kind: 'not_connected', status });
  }
  if (
    lower.includes('token expirado') ||
    lower.includes('erro ao renovar token') ||
    lower.includes('invalid_grant') ||
    lower.includes('unauthenticated') ||
    lower.includes('"code": 401') ||
    lower.includes('"code":401') ||
    lower.includes('insufficientpermissions')
  ) {
    return new GoogleCalendarError(EXPIRED, { kind: 'expired', status });
  }
  if (status === 401) return new GoogleCalendarError(SESSION_ENDED, { kind: 'auth', status });
  const clean = text.split(':')[0].trim();
  return new GoogleCalendarError(clean || `Erro do Google Agenda (${status}).`, { kind: 'http', status });
}

async function fetchOnce(url, method, body, signal) {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  if (!token) throw new GoogleCalendarError(SESSION_ENDED, { kind: 'auth', status: 401 });
  const anonKey = supabaseAnonKey();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const onAbort = () => controller.abort();
  signal?.addEventListener?.('abort', onAbort);
  try {
    return await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(anonKey ? { apikey: anonKey } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new GoogleCalendarError('Sem conexão com o Google Agenda. Verifique sua internet e tente de novo.', {
      kind: 'network',
    });
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener?.('abort', onAbort);
  }
}

async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function googleRequest(method, path, { query, body, signal } = {}) {
  const url = functionUrl(path, query);
  let response = await fetchOnce(url, method, body, signal);
  let payload = await readJson(response);

  if (response.status === 401 && classifyGoogleError(401, payload?.error || payload?.message).kind === 'auth') {
    const { data, error } = await supabase.auth.refreshSession();
    if (error || !data?.session) throw new GoogleCalendarError(SESSION_ENDED, { kind: 'auth', status: 401 });
    response = await fetchOnce(url, method, body, signal);
    payload = await readJson(response);
  }

  if (!response.ok) throw classifyGoogleError(response.status, payload?.error || payload?.message);
  return payload || {};
}

/** `true` quando há tokens válidos no servidor (renova o acesso se precisar). */
export async function checkGoogleConnection(opts) {
  const res = await googleRequest('GET', 'check-auth', opts);
  return Boolean(res.authenticated);
}

/** Eventos da agenda principal no intervalo (recorrências já vêm expandidas em ocorrências). */
export async function fetchGoogleEvents({ timeMin, timeMax }, opts) {
  const res = await googleRequest('GET', 'events', { ...opts, query: { timeMin, timeMax } });
  return Array.isArray(res.events) ? res.events : [];
}

export function createGoogleEvent(payload) {
  return googleRequest('POST', 'create-custom-event', { body: payload });
}

export function updateGoogleEvent(eventId, payload) {
  if (!eventId) throw new GoogleCalendarError('Compromisso inválido.', { kind: 'http' });
  return googleRequest('POST', 'update-custom-event', { body: { eventId, ...payload } });
}

export function deleteGoogleEvent(eventId) {
  if (!eventId) throw new GoogleCalendarError('Compromisso inválido.', { kind: 'http' });
  return googleRequest('POST', 'delete-custom-event', { body: { eventId } });
}

export function disconnectGoogle() {
  return googleRequest('POST', 'disconnect');
}
