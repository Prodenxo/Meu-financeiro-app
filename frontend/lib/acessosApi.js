/**
 * Chamadas de "Gerenciar acessos" no backend compartilhado com o site.
 * Quem pode o quê é decidido no servidor (403 fora do escopo); a tela só esconde o que não se aplica.
 */
import { financeGet, financeRequest } from '@/lib/financeApi';
import { dedupeUsers } from '@/lib/acessos/acessosScreen';

const enc = encodeURIComponent;

export async function fetchManagedUsers(opts) {
  const data = await financeGet('/users', opts);
  return dedupeUsers(data?.users);
}

/** Busca no servidor (superadmin também recebe contas sem empresa, que não vêm na lista normal). */
export async function searchManagedUsers(term, opts) {
  const q = String(term || '').trim();
  if (!q) return [];
  const data = await financeGet(`/users?search=${enc(q)}`, opts);
  return dedupeUsers(data?.users);
}

export function createManagedUser(body) {
  return financeRequest('POST', '/users', body);
}

export function updateManagedUser(userId, body) {
  return financeRequest('PUT', `/users/${enc(userId)}`, body);
}

export function setManagedUserBlocked(userId, blocked) {
  return blocked
    ? financeRequest('POST', `/users/${enc(userId)}/ban`, { status: false })
    : financeRequest('POST', `/users/${enc(userId)}/unban`, {});
}

export function deleteManagedUser(userId) {
  return financeRequest('DELETE', `/users/${enc(userId)}`);
}

/** Gera (ou aplica) senha provisória; o servidor devolve `{ userId, password }`. */
export function resetManagedUserPassword(userId, password) {
  return financeRequest('POST', `/users/${enc(userId)}/reset-password`, password ? { password } : {});
}

export function sendManagedUserResetEmail(userId) {
  return financeRequest('POST', `/users/${enc(userId)}/send-password-reset-email`, {});
}

export async function fetchEmpresas(opts) {
  const data = await financeGet('/users/empresas', opts);
  return Array.isArray(data?.empresas) ? data.empresas : [];
}

export async function fetchEmpresaDetail(empresaId, opts) {
  const data = await financeGet(`/users/empresas/${enc(empresaId)}`, opts);
  return data?.empresa ?? null;
}

export async function saveEmpresa(empresaId, body) {
  const data = empresaId
    ? await financeRequest('PUT', `/users/empresas/${enc(empresaId)}`, body)
    : await financeRequest('POST', '/users/empresas', body);
  return data?.empresa ?? null;
}

export function deleteEmpresa(empresaId) {
  return financeRequest('DELETE', `/users/empresas/${enc(empresaId)}`);
}

export function lookupEmpresaCnpj(cnpjDigits) {
  return financeGet(`/users/empresas/cnpj-lookup/${enc(cnpjDigits)}`);
}

export async function fetchInvites(opts) {
  const data = await financeGet('/invites', opts);
  return Array.isArray(data?.invites) ? data.invites : [];
}

/** Admin não envia empresa (o servidor usa a dele); superadmin precisa escolher. */
export function createInvite({ empresaId, isReusable, isSuperadmin }) {
  const body = { is_reusable: Boolean(isReusable) };
  if (isSuperadmin) body.empresas_id = empresaId;
  return financeRequest('POST', '/invites', body);
}

export function revokeInvite(inviteId) {
  return financeRequest('POST', `/invites/${enc(inviteId)}/revoke`, {});
}
