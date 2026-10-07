/**
 * Extras da tela "Gerenciar acessos" do app (as regras comuns vêm de `acessos.js`, cópia do site).
 * Limites da empresa (backend `users.service.js`):
 * - `max_mei`: 0 = módulo MEI desligado; N ≥ 1 = até N usuários ativos com MEI habilitado.
 * - `max_usuarios_nao_mei`: null (ou 0) = sem limite; N = até N usuários ativos sem MEI.
 */
import { validateStrongPassword } from '@/lib/passwordPolicy';
import {
  DEFAULT_PAGE_SIZE,
  ROLE_OPTIONS_SUPERADMIN,
  empresaDisplayName,
  isEmpresaMeiActive,
  roleLabel,
  toDateInputValue,
} from './acessos';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUIDISH_RE = /^[0-9a-f-]{20,64}$/i;

export const PAGE_SIZE = DEFAULT_PAGE_SIZE;

const fmtInt = (n) => Number(n || 0).toLocaleString('pt-BR');

/** "1 – 25 de 1.129" (contagem real do conjunto filtrado). */
export function rangeLabel({ from, to, total }) {
  if (!total) return '0 de 0';
  return `${fmtInt(from)} – ${fmtInt(to)} de ${fmtInt(total)}`;
}

/** Nome para a lista: nome, senão e-mail, senão telefone, senão parte do id. */
export function userDisplayName(user) {
  const name = String(user?.displayName || '').trim();
  if (name) return name;
  const email = String(user?.email || '').trim();
  if (email) return email;
  const phone = String(user?.phone || '').trim();
  if (phone) return phone;
  return `Usuário ${String(user?.id || '').slice(0, 8) || 'sem identificação'}`;
}

/** O backend pode devolver mais de um vínculo do mesmo usuário; a tela mostra um por id. */
export function dedupeUsers(users) {
  const seen = new Set();
  const out = [];
  for (const u of Array.isArray(users) ? users : []) {
    if (!u?.id || seen.has(u.id)) continue;
    seen.add(u.id);
    out.push(u);
  }
  return out;
}

/** Junta a lista completa com contas achadas pela busca do servidor (ex.: sem empresa, só superadmin). */
export function mergeUsers(base, extra) {
  return dedupeUsers([...(base || []), ...(extra || [])]);
}

export function userEmpresaLabel(user) {
  if (!user?.empresaId) return user?.empresaName === 'SEM VÍNCULO' ? 'Sem vínculo' : 'Sem empresa';
  return String(user?.empresaName || '').trim() || 'Empresa sem nome';
}

/** MEI do usuário: só faz sentido com vínculo; null = sem informação. */
export function userMeiLabel(user) {
  if (user?.mei === true) return 'MEI habilitado';
  if (user?.mei === false) return 'MEI desativado';
  return null;
}

export function userRoleLabel(user) {
  if (user?.role === 'n/a') return 'Sem perfil';
  return roleLabel(user?.role);
}

/** Chips de limites da empresa (texto curto + explicação para leitor de tela e detalhes). */
export function empresaLimitChips(empresa) {
  const maxMei = Math.trunc(Number(empresa?.max_mei || 0));
  const naoMei = empresa?.max_usuarios_nao_mei;
  const naoMeiUnlimited = naoMei === null || naoMei === undefined || Number(naoMei) === 0;
  return [
    maxMei > 0
      ? {
          key: 'mei',
          label: `MEI: ${fmtInt(maxMei)} ${maxMei === 1 ? 'vaga' : 'vagas'}`,
          tone: 'accent',
          description: `Até ${fmtInt(maxMei)} ${maxMei === 1 ? 'usuário ativo' : 'usuários ativos'} com MEI habilitado.`,
        }
      : { key: 'mei', label: 'MEI desligado', tone: 'muted', description: 'Módulo MEI desligado nesta empresa.' },
    naoMeiUnlimited
      ? { key: 'naoMei', label: 'Não MEI: sem limite', tone: 'neutral', description: 'Usuários sem MEI: sem limite.' }
      : {
          key: 'naoMei',
          label: `Não MEI: até ${fmtInt(naoMei)}`,
          tone: 'neutral',
          description: `Até ${fmtInt(naoMei)} ${Number(naoMei) === 1 ? 'usuário ativo' : 'usuários ativos'} sem MEI.`,
        },
  ];
}

export function countMeiActive(empresas) {
  return (Array.isArray(empresas) ? empresas : []).filter(isEmpresaMeiActive).length;
}

/** Busca de empresas por nome, nome fantasia ou CNPJ (com ou sem pontuação). */
export function filterEmpresasBySearch(empresas, rawTerm) {
  const list = Array.isArray(empresas) ? empresas : [];
  const term = String(rawTerm || '').trim().toLowerCase();
  if (!term) return list;
  const digits = term.replace(/\D/g, '');
  return list.filter(
    (e) =>
      [e?.empresa, e?.nome_fantasia, e?.razao_social].some((f) => String(f || '').toLowerCase().includes(term)) ||
      (digits.length >= 2 && String(e?.cnpj || '').replace(/\D/g, '').includes(digits)),
  );
}

export function empresaNameById(empresas, id) {
  const found = (empresas || []).find((e) => e.id === id);
  return found ? empresaDisplayName(found) : null;
}

/* ---------- Formulário de usuário (mesmas regras do site: UserFormDialog + actions) ---------- */

export function userFormInitial(user) {
  if (!user) return { email: '', password: '', displayName: '', phone: '', role: 'usuario', empresaId: '', mei: false, expiresAt: '' };
  return {
    email: user.email || '',
    password: '',
    displayName: user.displayName || '',
    phone: user.phone || '',
    role: user.role || 'usuario',
    empresaId: user.empresaId || '',
    mei: user.mei === true,
    expiresAt: toDateInputValue(user.expiresAt),
  };
}

/** O que o formulário mostra/permite para quem está editando. */
export function userFormRules({ user, actorRole, actorUserId }) {
  const isEdit = Boolean(user?.id);
  const isSelf = isEdit && user.id === actorUserId;
  const isSuperadmin = actorRole === 'superadmin';
  return {
    isEdit,
    isSelf,
    isSuperadmin,
    roleOptions: isEdit && user.role === 'superadmin' ? ['superadmin'] : ROLE_OPTIONS_SUPERADMIN,
    roleLocked: isSelf || (!isSuperadmin && isEdit) || (isEdit && user.role === 'superadmin'),
    showRole: isSuperadmin || isEdit,
    showEmpresa: isSuperadmin && !isSelf,
    showMei: isEdit,
  };
}

/** "dd/mm/aaaa" → "aaaa-mm-dd"; aceita também "aaaa-mm-dd". */
export function parseDateInput(raw) {
  const s = String(raw || '').trim();
  if (!s) return '';
  let m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  return m ? s : null;
}

export function formatDateInputBr(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
  return m ? `${m[3]}/${m[2]}/${m[1]}` : '';
}

/**
 * Valida e monta o corpo de `POST /users` (criar) ou `PUT /users/:id` (editar).
 * Devolve `{ error }` ou `{ body }`.
 */
export function buildUserPayload(form, { user, actorRole, actorUserId }) {
  const rules = userFormRules({ user, actorRole, actorUserId });
  const text = (v, max = 200) => String(v ?? '').trim().slice(0, max);
  const showExpiry = rules.isEdit && form.role === 'usuario';

  if (!rules.isEdit) {
    const email = text(form.email).toLowerCase();
    if (!email) return { error: 'Informe o e-mail do usuário.' };
    if (!EMAIL_RE.test(email)) return { error: 'Informe um e-mail válido.' };
    const password = text(form.password, 128);
    if (password) {
      const pwd = validateStrongPassword(password);
      if (!pwd.ok) return { error: pwd.message };
    }
    const body = {
      email,
      password: password || undefined,
      displayName: text(form.displayName, 120) || undefined,
      phone: text(form.phone, 32) || undefined,
      role: 'usuario',
      mei: false,
    };
    if (rules.isSuperadmin) {
      if (!ROLE_OPTIONS_SUPERADMIN.includes(form.role)) return { error: 'Escolha o perfil do usuário.' };
      if (!UUIDISH_RE.test(String(form.empresaId || ''))) return { error: 'Escolha a empresa.' };
      body.role = form.role;
      body.empresaId = text(form.empresaId, 64);
    }
    return { body };
  }

  const body = {};
  const displayName = text(form.displayName, 120);
  if (displayName) body.displayName = displayName;
  const phone = text(form.phone, 32);
  if (phone) body.phone = phone;
  const email = text(form.email).toLowerCase();
  if (email && email !== String(user.email || '').toLowerCase()) {
    if (!EMAIL_RE.test(email)) return { error: 'Informe um e-mail de login válido.' };
    body.email = email;
  }
  body.mei = form.mei === true;
  if (showExpiry) {
    const iso = parseDateInput(form.expiresAt);
    if (iso === null) return { error: 'Data de validade inválida. Use dd/mm/aaaa.' };
    if (!iso) body.expiresAt = null;
    else {
      const d = new Date(`${iso}T23:59:59`);
      if (Number.isNaN(d.getTime())) return { error: 'Data de validade inválida. Use dd/mm/aaaa.' };
      body.expiresAt = d.toISOString();
    }
  }
  if (!rules.isSelf) {
    const allowed = rules.isSuperadmin ? ROLE_OPTIONS_SUPERADMIN : ['usuario'];
    const role = rules.isSuperadmin ? form.role : 'usuario';
    if (user.role !== 'superadmin') {
      if (!allowed.includes(role)) return { error: 'Perfil não permitido para o seu nível de acesso.' };
      body.role = role;
    }
    if (rules.isSuperadmin) {
      if (!UUIDISH_RE.test(String(form.empresaId || ''))) return { error: 'Escolha a empresa.' };
      body.empresaId = text(form.empresaId, 64);
    }
  }
  return { body, emailChanged: Boolean(body.email) };
}

export function validateResetPassword(raw) {
  const password = String(raw || '').trim();
  if (!password) return { password: undefined };
  const pwd = validateStrongPassword(password);
  return pwd.ok ? { password } : { error: pwd.message };
}

/* ---------- Formulário de empresa (mesmas regras do site: EmpresaFormDialog) ---------- */

export const REGIMES = ['Simples Nacional', 'Lucro Presumido', 'Lucro Real', 'MEI'];

const EMPTY_EMPRESA = {
  cnpj: '', nome_fantasia: '', empresa: '', razao_social: '', inscricao_estadual: '', regime_tributario: '',
  logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', cep: '', telefone: '', email: '',
  meiEnabled: false, meiSlots: '1', naoMeiUnlimited: true, maxNaoMei: '10',
};

export function formatCnpj(value) {
  const d = String(value || '').replace(/\D/g, '').slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

export function empresaFormInitial(rec) {
  if (!rec) return { ...EMPTY_EMPRESA };
  const maxMei = Number(rec.max_mei || 0);
  const naoMei = rec.max_usuarios_nao_mei;
  const out = { ...EMPTY_EMPRESA };
  for (const key of Object.keys(EMPTY_EMPRESA)) {
    if (typeof EMPTY_EMPRESA[key] === 'string' && rec[key] != null) out[key] = String(rec[key]);
  }
  return {
    ...out,
    cnpj: formatCnpj(rec.cnpj || ''),
    meiEnabled: maxMei > 0,
    meiSlots: String(maxMei > 0 ? Math.trunc(maxMei) : 1),
    naoMeiUnlimited: naoMei === null || naoMei === undefined || Number(naoMei) === 0,
    maxNaoMei: String(naoMei && Number(naoMei) > 0 ? Number(naoMei) : 10),
  };
}

/** Dados do CNPJ (backend `cnpj-lookup`) sobre o formulário, sem apagar o que já foi digitado. */
export function applyCnpjLookup(form, d) {
  const tel = d?.telefone ? `${d.telefone.ddd || ''}${d.telefone.numero || ''}` : '';
  return {
    ...form,
    empresa: d?.razaoSocial || form.empresa,
    razao_social: d?.razaoSocial || form.razao_social,
    nome_fantasia: form.nome_fantasia || d?.nomeFantasia || '',
    inscricao_estadual: d?.inscricaoEstadual || form.inscricao_estadual,
    logradouro: d?.endereco?.logradouro || form.logradouro,
    numero: d?.endereco?.numero || form.numero,
    complemento: d?.endereco?.complemento || form.complemento,
    bairro: d?.endereco?.bairro || form.bairro,
    cidade: d?.endereco?.descricaoCidade || form.cidade,
    estado: d?.endereco?.estado || form.estado,
    cep: d?.endereco?.cep || form.cep,
    telefone: tel || form.telefone,
    email: d?.email || form.email,
  };
}

/** Valida e monta o corpo de `POST/PUT /users/empresas`. Devolve `{ error }` ou `{ body }`. */
export function buildEmpresaPayload(form, { isEdit }) {
  const digits = String(form.cnpj || '').replace(/\D/g, '');
  if (digits && digits.length !== 14) return { error: 'CNPJ deve ter 14 dígitos ou ficar em branco.' };
  const meiSlots = Number.parseInt(form.meiSlots, 10);
  if (form.meiEnabled && (!Number.isFinite(meiSlots) || meiSlots < 1)) {
    return { error: 'Informe ao menos 1 vaga MEI (módulo ligado não pode ficar zerado).' };
  }
  const maxNaoMei = Number.parseInt(form.maxNaoMei, 10);
  if (!form.naoMeiUnlimited && (!Number.isFinite(maxNaoMei) || maxNaoMei < 1)) {
    return { error: 'Informe o máximo de usuários sem MEI (mínimo 1).' };
  }
  if (!isEdit && !String(form.nome_fantasia || '').trim() && !String(form.empresa || '').trim()) {
    return { error: 'Informe o nome da empresa.' };
  }
  if (form.email && !EMAIL_RE.test(String(form.email).trim())) return { error: 'E-mail da empresa inválido.' };
  const t = (k) => String(form[k] || '').trim();
  return {
    body: {
      cnpj: digits,
      nome_fantasia: t('nome_fantasia'),
      empresa: t('empresa'),
      razao_social: t('razao_social') || t('empresa'),
      inscricao_estadual: t('inscricao_estadual'),
      regime_tributario: t('regime_tributario'),
      logradouro: t('logradouro'),
      numero: t('numero'),
      complemento: t('complemento'),
      bairro: t('bairro'),
      cidade: t('cidade'),
      estado: t('estado').toUpperCase(),
      cep: t('cep'),
      telefone: t('telefone'),
      email: t('email'),
      max_mei: form.meiEnabled ? meiSlots : 0,
      max_usuarios_nao_mei: form.naoMeiUnlimited ? null : maxNaoMei,
    },
  };
}

/* ---------- Mensagens de confirmação (o que o backend realmente faz) ---------- */

export const deleteUserMessage = (user) =>
  `Excluir ${userDisplayName(user)}? A conta de login e todos os dados dessa pessoa (lançamentos, categorias, contas) são apagados. Não dá para desfazer.`;

export const blockUserMessage = (user) =>
  `Bloquear ${userDisplayName(user)}? A pessoa não consegue mais usar o app até ser liberada. Os dados continuam guardados.`;

export const deleteEmpresaMessage = (empresa, linkedCount) =>
  `Excluir ${empresaDisplayName(empresa)}? Os vínculos dos usuários${
    linkedCount ? ` (${linkedCount} ${linkedCount === 1 ? 'usuário' : 'usuários'})` : ''
  } com esta empresa e os convites pendentes dela são removidos. As contas e os dados financeiros das pessoas continuam; elas ficam sem empresa.`;

export const revokeInviteMessage =
  'Revogar este convite? O link deixa de funcionar na hora. Quem já se cadastrou por ele continua com a conta.';
