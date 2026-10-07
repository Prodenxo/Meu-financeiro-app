/**
 * Regras da tela Contas do app (sem UI). Saldo, total, conta padrão e ordem vêm de
 * `./contasPage.js` (cópia do site); validação do formulário igual ao `saveContaAction`
 * do site e à rota `POST/PUT /api/contas-financeiras`.
 */
import { buildContaCards, CONTA_COR_PRESETS } from './contasPage.js';
import { CUSTOM_BANK_ID, findBankById } from './bankCatalog.js';
import { formatBrl } from './format.js';
import { parseMoney, toMoneyInput } from './money.js';

export const HIDDEN_VALUE = 'R$ ••••••';

/** Contas ativas com saldo atual (padrão primeiro), total e contagens. Sem moeda por conta: tudo em R$. */
export function buildContasScreenModel(contas, transactions) {
  const rows = buildContaCards(contas, transactions);
  return {
    rows,
    total: rows.reduce((sum, r) => sum + r.saldo, 0),
    activeCount: rows.length,
    inactiveCount: contas.filter((c) => !c.ativo).length,
  };
}

export function activeCountLabel(n) {
  return n === 1 ? '1 conta ativa' : `${n} contas ativas`;
}

export function inactiveCountLabel(n) {
  if (!n) return '';
  return n === 1
    ? '1 conta desativada não entra no total.'
    : `${n} contas desativadas não entram no total.`;
}

/** "R$ 1.200,00" / "− R$ 1.227,00" (sinal separado, como no site). */
export function formatSaldo(value) {
  if (value < 0) return `− ${formatBrl(Math.abs(value))}`;
  return formatBrl(value);
}

export function saldoAccessibilityLabel(value, hidden) {
  if (hidden) return 'Saldo oculto';
  return value < 0 ? `Saldo negativo de ${formatBrl(Math.abs(value))}` : `Saldo de ${formatBrl(value)}`;
}

/** Conta ligada à sincronização automática (mesma condição do site). */
export function isSyncedConta(conta) {
  return conta?.of_provider === 'pluggy' && Boolean(conta?.of_external_id);
}

export function countLinkedTransactions(transactions, contaId) {
  const id = String(contaId);
  return transactions.reduce((n, t) => (String(t.conta_id || '') === id ? n + 1 : n), 0);
}

export function deleteContaMessage(nome, linked) {
  const vinculo =
    linked === 0
      ? 'Nenhum lançamento está vinculado a ela.'
      : linked === 1
        ? '1 lançamento vinculado ficará sem conta (ele não será apagado).'
        : `${linked} lançamentos vinculados ficarão sem conta (eles não serão apagados).`;
  return `Remover “${nome}”? ${vinculo} Esta ação não pode ser desfeita.`;
}

/** Estado inicial do formulário (igual ao `initialState` do `ContaModal` do site). */
export function contaFormInitial(conta) {
  if (!conta) {
    return {
      mode: null,
      bankId: '',
      nome: '',
      tipo: 'corrente',
      cor: CONTA_COR_PRESETS[0],
      saldo: '',
      limite: '',
      fechamento: '',
      vencimento: '',
    };
  }
  const bank = findBankById(conta.instituicao_id);
  return {
    mode: bank ? 'catalog' : 'custom',
    bankId: bank ? bank.id : '',
    nome: conta.nome,
    tipo: conta.tipo,
    cor: conta.cor || CONTA_COR_PRESETS[0],
    saldo: toMoneyInput(conta.saldo_inicial),
    limite: conta.limite_credito != null ? toMoneyInput(conta.limite_credito) : '',
    fechamento: conta.dia_fechamento != null ? String(conta.dia_fechamento) : '',
    vencimento: conta.dia_vencimento != null ? String(conta.dia_vencimento) : '',
  };
}

const TIPOS = ['corrente', 'poupanca', 'cartao_credito', 'dinheiro', 'outro'];

function parseDay(raw) {
  const s = String(raw || '').trim();
  if (!s) return { value: null, ok: true };
  const n = Number(s);
  return Number.isInteger(n) && n >= 1 && n <= 31 ? { value: n, ok: true } : { value: null, ok: false };
}

/**
 * @returns {{ errors: Record<string, string> | null, payload: Record<string, unknown> | null }}
 * `payload` é o corpo de `POST/PUT /api/contas-financeiras`.
 */
export function validateContaForm(form) {
  const bank = form.mode === 'catalog' ? findBankById(form.bankId) : null;
  const nome = String(form.nome || '').trim();
  const isCartao = form.tipo === 'cartao_credito';
  const saldo = parseMoney(form.saldo);
  const limiteRaw = String(form.limite || '').trim();
  const limite = limiteRaw ? parseMoney(limiteRaw) : null;
  const fechamento = parseDay(form.fechamento);
  const vencimento = parseDay(form.vencimento);

  const errors = {};
  if (form.mode !== 'catalog' && form.mode !== 'custom') errors.bank = 'Escolha um banco ou "Outra conta".';
  if (form.mode === 'catalog' && !bank) errors.bank = 'Banco não encontrado. Escolha novamente.';
  if (!nome) errors.nome = 'Informe um nome para a conta.';
  else if (nome.length > 60) errors.nome = 'Use no máximo 60 caracteres.';
  if (!TIPOS.includes(form.tipo)) errors.tipo = 'Escolha o tipo da conta.';
  if (!Number.isFinite(saldo)) errors.saldo_inicial = 'Informe um saldo válido.';
  if (isCartao && limiteRaw && (!Number.isFinite(limite) || limite < 0)) errors.limite_credito = 'Informe um limite válido.';
  if (isCartao && !fechamento.ok) errors.dia_fechamento = 'Dia entre 1 e 31.';
  if (isCartao && !vencimento.ok) errors.dia_vencimento = 'Dia entre 1 e 31.';
  if (!/^#[0-9a-fA-F]{6}$/.test(String(form.cor || ''))) errors.cor = 'Escolha uma cor.';
  if (Object.keys(errors).length > 0) return { errors, payload: null };

  return {
    errors: null,
    payload: {
      bank_mode: form.mode,
      instituicao_id: bank ? bank.id : null,
      nome,
      tipo: form.tipo,
      saldo_inicial: saldo,
      limite_credito: isCartao ? limite : null,
      dia_fechamento: isCartao ? fechamento.value : null,
      dia_vencimento: isCartao ? vencimento.value : null,
      cor: form.cor,
    },
  };
}

/** Banco do catálogo escolhido: preenche nome, cor e tipo sugerido (como no site). */
export function applyBankToForm(form, bank) {
  return { ...form, mode: 'catalog', bankId: bank.id, nome: bank.nome, cor: bank.cor, tipo: bank.defaultTipo || 'corrente' };
}

export function applyCustomToForm(form, defaultNome) {
  return {
    ...form,
    mode: 'custom',
    bankId: '',
    nome: form.mode === 'custom' ? form.nome : defaultNome,
    tipo: 'dinheiro',
  };
}

export { CUSTOM_BANK_ID };
