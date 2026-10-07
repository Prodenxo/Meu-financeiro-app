/**
 * Gravação do formulário de transação — mesma sequência do `saveTransactionAction` do site:
 * recorrência nova (se pedida) → lançamento → lembrete no Google (se pendente).
 * As chamadas de rede chegam por `api` para manter a regra testável.
 */
import { normalizeTransactionStatus } from './status.js';
import { buildRecurrenceRow } from './transactionModal.js';

export const RECURRENCE_FAILED_WARNING = 'Não foi possível criar a recorrência. O lançamento foi salvo como avulso.';
export const GOOGLE_NOT_CONNECTED_WARNING = 'Lançamento salvo. Conecte o Google Agenda para criar o lembrete.';

export function buildTransactionPayload(values) {
  const tipo = values.tipo === 'entrada' ? 'entrada' : 'saída';
  const pendente = tipo === 'entrada' ? 'a_receber' : 'a_pagar';
  const payload = {
    tipo,
    valor: values.valorNumber,
    classificacao: values.classificacao.trim(),
    data: values.data,
    status: normalizeTransactionStatus(tipo, values.realizado ? '' : pendente),
    obs: values.obs.trim() || null,
  };
  return payload;
}

/** @returns {Promise<{ transaction: object, warnings: string[] }>} */
export async function saveTransaction(values, draft, api) {
  const mode = draft?.mode || 'create';
  const payload = buildTransactionPayload(values);
  const warnings = [];

  if (mode === 'edit') {
    const transaction = await api.updateTransaction(draft.tx.id, { ...payload, conta_id: values.conta_id || null });
    return { transaction, warnings };
  }

  const createPayload = { ...payload };
  if (values.conta_id) createPayload.conta_id = values.conta_id;
  else createPayload.sem_conta = true;

  if (mode === 'launch' && draft.tx?.recorrencia_id && draft.tx?.recorrencia_ano_mes) {
    createPayload.recorrencia_id = draft.tx.recorrencia_id;
    createPayload.recorrencia_ano_mes = draft.tx.recorrencia_ano_mes;
  } else if (values.recorrente) {
    try {
      const rec = await api.createRecorrencia(
        buildRecurrenceRow({
          tipo: values.tipo,
          valor: payload.valor,
          classificacao: payload.classificacao,
          data: payload.data,
          obs: payload.obs,
          maxOcorrencias: values.maxOcorrencias ?? null,
        }),
      );
      if (rec?.id) {
        createPayload.recorrencia_id = String(rec.id);
        createPayload.recorrencia_ano_mes = payload.data.slice(0, 7);
      } else {
        warnings.push(RECURRENCE_FAILED_WARNING);
      }
    } catch {
      warnings.push(RECURRENCE_FAILED_WARNING);
    }
  }

  const transaction = await api.createTransaction(createPayload);

  if (values.google && (payload.status === 'a_pagar' || payload.status === 'a_receber')) {
    const warning = await createGoogleReminder(payload, api);
    if (warning) warnings.push(warning);
  }
  return { transaction, warnings };
}

async function createGoogleReminder(payload, api) {
  const event = {
    tipo: payload.tipo,
    valor: payload.valor,
    classificacao: payload.classificacao,
    status: payload.status,
    data: payload.data,
    obs: payload.obs,
  };
  try {
    let result = await api.createCalendarEvent(event);
    if (result?.error === 'GOOGLE_AUTH_REQUIRED') {
      const connected = await api.promptGoogleAuth();
      if (!connected) return GOOGLE_NOT_CONNECTED_WARNING;
      result = await api.createCalendarEvent(event);
    }
    if (!result?.success) {
      return `Lançamento salvo, mas o lembrete no Google Agenda falhou: ${result?.error || 'erro desconhecido'}.`;
    }
    return null;
  } catch (error) {
    return `Lançamento salvo, mas o lembrete no Google Agenda falhou: ${error?.message || 'erro desconhecido'}.`;
  }
}
