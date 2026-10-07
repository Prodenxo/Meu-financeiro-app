/**
 * Extras da tela Conta global do app (as regras de cálculo vêm de `contaGlobal.js`/`moedas.js`, cópias do site).
 * Banco: `contas_moeda_global.valor` NUMERIC(18,4) com `valor >= 0`; várias linhas na mesma moeda são permitidas;
 * BRL fica de fora. O saldo daqui não entra na Visão geral.
 */
import { buildContaGlobalModel } from './contaGlobal.js';
import { formatCotacaoBrl, getMoedaNomePt, isMoedaCode, normalizeMoedaCode } from './moedas.js';

export const APELIDO_MAX = 80;
/** Casas guardadas pelo banco (NUMERIC(18,4)). */
export const DB_FRACTION_DIGITS = 4;
/** NUMERIC(18,4): até 14 dígitos inteiros. */
export const MOEDA_VALOR_MAX = 99_999_999_999_999.9999;

/** Casas decimais da moeda (USD 2, JPY 0, KWD 3), limitadas ao que o banco guarda. */
export function moedaFractionDigits(moeda) {
  const code = normalizeMoedaCode(moeda);
  try {
    const digits = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: code }).resolvedOptions().maximumFractionDigits;
    return Number.isInteger(digits) ? Math.min(digits, DB_FRACTION_DIGITS) : 2;
  } catch {
    return 2;
  }
}

/** Mantém só dígitos e um separador decimal (vírgula ou ponto); moeda sem centavos não aceita separador. */
export function sanitizeMoedaInput(raw, moeda) {
  const digits = moedaFractionDigits(moeda);
  let s = String(raw || '').replace(/[^\d.,]/g, '');
  if (digits === 0) return s.replace(/[.,]/g, '');
  const idx = s.search(/[.,]/);
  if (idx >= 0) s = s.slice(0, idx + 1) + s.slice(idx + 1).replace(/[.,]/g, '');
  return s;
}

/** Número → texto do campo ("1500,5" → "1500,50"; JPY sem casas). */
export function toMoedaInput(valor, moeda) {
  const n = Number(valor);
  if (!Number.isFinite(n)) return '';
  return n.toFixed(moedaFractionDigits(moeda)).replace('.', ',');
}

/** Lê o campo: um separador só = decimal (vírgula ou ponto); com os dois, o ponto é milhar. */
export function parseMoedaInput(raw) {
  const s = String(raw || '').trim().replace(/\s/g, '');
  if (!s) return { value: NaN, decimals: 0 };
  const normalized = s.includes(',') ? s.replace(/\./g, '').replace(',', '.') : s;
  if (!/^\d+(\.\d*)?$/.test(normalized)) return { value: NaN, decimals: 0 };
  const decimals = normalized.includes('.') ? normalized.split('.')[1].length : 0;
  return { value: Number(normalized), decimals };
}

export function moedaFormInitial(conta) {
  return {
    moeda: conta ? normalizeMoedaCode(conta.moeda) : '',
    nome: conta?.nome || '',
    valor: conta ? toMoedaInput(conta.valor, conta.moeda) : '',
  };
}

/** Mesmas regras do site (`saveMoedaGlobalAction`): ISO de 3 letras, sem BRL, valor ≥ 0, apelido até 80. */
export function validateMoedaForm(form, { catalog } = {}) {
  const errors = {};
  const moeda = normalizeMoedaCode(form.moeda);
  if (!isMoedaCode(moeda)) errors.moeda = 'Escolha uma moeda.';
  else if (moeda === 'BRL') errors.moeda = 'Reais ficam nas suas contas; a Conta global é só para moedas estrangeiras.';
  else if (catalog && !catalog[moeda]) errors.moeda = 'Moeda fora da lista de moedas com cotação.';

  const raw = String(form.valor || '').trim();
  const { value, decimals } = parseMoedaInput(raw);
  if (!raw) errors.valor = 'Informe o saldo (pode ser zero).';
  else if (!Number.isFinite(value)) errors.valor = 'Valor inválido. Use só números e vírgula.';
  else if (value < 0) errors.valor = 'O saldo não pode ser negativo.';
  else if (value > MOEDA_VALOR_MAX) errors.valor = 'Valor alto demais.';
  else if (isMoedaCode(moeda) && decimals > moedaFractionDigits(moeda)) {
    const digits = moedaFractionDigits(moeda);
    errors.valor = digits === 0 ? `${moeda} não tem centavos.` : `${moeda} aceita até ${digits} casas decimais.`;
  }

  const nome = String(form.nome || '').trim();
  if (nome.length > APELIDO_MAX) errors.nome = `Use até ${APELIDO_MAX} caracteres.`;

  if (Object.keys(errors).length) return { errors, payload: null };
  return { errors: null, payload: { moeda, nome: nome || null, valor: value } };
}

const pluralize = (n, one, many) => `${n} ${n === 1 ? one : many}`;

/** "2 saldos cadastrados" / "3 saldos em 2 moedas" — cada registro é um saldo; a moeda pode repetir. */
export function countLabel(rows) {
  const n = rows.length;
  const moedas = new Set(rows.map((r) => r.moeda)).size;
  if (n === 0) return 'Nenhum saldo cadastrado';
  if (moedas === n) return pluralize(n, 'saldo cadastrado', 'saldos cadastrados');
  return `${pluralize(n, 'saldo', 'saldos')} em ${pluralize(moedas, 'moeda', 'moedas')}`;
}

/** "06/10/2026" a partir de "2026-10-06". */
export function formatIsoDayBr(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ''));
  return m ? `${m[3]}/${m[2]}/${m[1]}` : null;
}

/** O BCE não publica em fins de semana e feriados: só é "antiga" a cotação com mais dias que isso. */
export const RATE_OLD_AFTER_DAYS = 4;

const isoDayNumber = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ''));
  return m ? Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) / 86_400_000 : null;
};

export function localIsoDay(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function isRateOld(date, today) {
  const d = isoDayNumber(date);
  const t = isoDayNumber(today);
  return d !== null && t !== null && t - d > RATE_OLD_AFTER_DAYS;
}

/** Data da cotação de uma moeda, quando o servidor informou a fonte. */
export function rateInfoFor(moeda, sources) {
  const src = (sources || []).find((s) => Array.isArray(s.codes) && s.codes.includes(moeda));
  return src ? { name: src.name || null, date: src.date || null } : null;
}

/**
 * Modelo da tela. `ratesStatus`: 'loading' | 'ready' | 'error'.
 * Total: `complete` (todas convertidas), `partial` (faltou alguma), `none` (nenhuma), `loading`, `empty`.
 */
export function buildContaGlobalScreen({ contas, rates, sources, ratesStatus, today }) {
  const model = buildContaGlobalModel({ contas, rates: ratesStatus === 'ready' ? rates : {} });
  const rows = [...model.rows]
    .sort((a, b) => a.moeda.localeCompare(b.moeda) || a.label.localeCompare(b.label, 'pt-BR'))
    .map((r) => {
      const info = rateInfoFor(r.moeda, sources);
      return {
        ...r,
        rateLabel: r.rate != null ? `1 ${r.moeda} ≈ ${formatCotacaoBrl(r.rate)}` : null,
        rateDate: info?.date || null,
        rateIsOld: isRateOld(info?.date, today),
      };
    });

  let totalStatus = 'complete';
  if (rows.length === 0) totalStatus = 'empty';
  else if (ratesStatus === 'loading') totalStatus = 'loading';
  else if (model.convertidasCount === 0) totalStatus = 'none';
  else if (model.missingRates.length > 0) totalStatus = 'partial';

  const dates = [...new Set((sources || []).map((s) => s.date).filter(Boolean))].sort();
  return {
    rows,
    count: rows.length,
    countLabel: countLabel(rows),
    total: model.total,
    totalStatus,
    missingRates: model.missingRates,
    missingNames: model.missingRates.map((c) => `${c} (${getMoedaNomePt(c)})`),
    /** Data mais antiga entre as cotações usadas (quando o servidor informa). */
    oldestRateDate: dates[0] || null,
    hasOldRate: rows.some((r) => r.rateIsOld),
    usedCodes: [...new Set(rows.map((r) => r.moeda))],
  };
}

export const deleteMoedaMessage = (row) =>
  `Excluir o saldo de ${row.nome ? `“${row.nome}” ` : ''}${row.moeda} (${row.nomeMoeda})? Ele sai da Conta global. Suas contas em reais e os lançamentos não mudam.`;
