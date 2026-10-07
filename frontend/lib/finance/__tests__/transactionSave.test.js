import {
  GOOGLE_NOT_CONNECTED_WARNING,
  RECURRENCE_FAILED_WARNING,
  saveTransaction,
} from '../transactionSave';

const values = (over = {}) => ({
  tipo: 'saida',
  valorNumber: 4000,
  classificacao: ' Alimentação ',
  data: '2026-10-22',
  realizado: false,
  obs: ' mercado ',
  conta_id: null,
  recorrente: false,
  maxOcorrencias: null,
  google: false,
  ...over,
});

const makeApi = (over = {}) => ({
  createTransaction: jest.fn(async (p) => ({ id: 't1', ...p })),
  updateTransaction: jest.fn(async (id, p) => ({ id, ...p })),
  createRecorrencia: jest.fn(async () => ({ id: 'r1' })),
  createCalendarEvent: jest.fn(async () => ({ success: true })),
  promptGoogleAuth: jest.fn(async () => true),
  ...over,
});

describe('saveTransaction', () => {
  it('nova saída pendente sem conta vai como "Sem conta"', async () => {
    const api = makeApi();
    await saveTransaction(values(), { mode: 'create' }, api);
    expect(api.createTransaction).toHaveBeenCalledWith({
      tipo: 'saída',
      valor: 4000,
      classificacao: 'Alimentação',
      data: '2026-10-22',
      status: 'a_pagar',
      obs: 'mercado',
      sem_conta: true,
    });
  });

  it('entrada realizada vira "recebido" e leva a conta', async () => {
    const api = makeApi();
    await saveTransaction(values({ tipo: 'entrada', realizado: true, conta_id: 'c1' }), { mode: 'create' }, api);
    expect(api.createTransaction.mock.calls[0][0]).toMatchObject({ tipo: 'entrada', status: 'recebido', conta_id: 'c1' });
  });

  it('recorrência nova cria a regra e vincula o lançamento ao mês', async () => {
    const api = makeApi();
    await saveTransaction(values({ recorrente: true, maxOcorrencias: 6 }), { mode: 'create' }, api);
    expect(api.createRecorrencia.mock.calls[0][0]).toMatchObject({ dia_do_mes: 22, max_ocorrencias: 6, status: 'a_pagar' });
    expect(api.createTransaction.mock.calls[0][0]).toMatchObject({ recorrencia_id: 'r1', recorrencia_ano_mes: '2026-10' });
  });

  it('falha na recorrência salva avulso e avisa', async () => {
    const api = makeApi({ createRecorrencia: jest.fn(async () => { throw new Error('x'); }) });
    const { warnings } = await saveTransaction(values({ recorrente: true }), { mode: 'create' }, api);
    expect(warnings).toEqual([RECURRENCE_FAILED_WARNING]);
    expect(api.createTransaction.mock.calls[0][0].recorrencia_id).toBeUndefined();
  });

  it('lançar previsão mantém o vínculo com a recorrência', async () => {
    const api = makeApi();
    const draft = { mode: 'launch', tx: { recorrencia_id: 'r9', recorrencia_ano_mes: '2026-11' } };
    await saveTransaction(values({ recorrente: true }), draft, api);
    expect(api.createRecorrencia).not.toHaveBeenCalled();
    expect(api.createTransaction.mock.calls[0][0]).toMatchObject({ recorrencia_id: 'r9', recorrencia_ano_mes: '2026-11' });
  });

  it('edição usa PUT e permite tirar a conta', async () => {
    const api = makeApi();
    await saveTransaction(values({ realizado: true }), { mode: 'edit', tx: { id: 't5' } }, api);
    expect(api.updateTransaction).toHaveBeenCalledWith('t5', expect.objectContaining({ status: 'pago', conta_id: null }));
    expect(api.createTransaction).not.toHaveBeenCalled();
  });

  it('Google sem conexão pede autorização e tenta de novo', async () => {
    const createCalendarEvent = jest
      .fn()
      .mockResolvedValueOnce({ success: false, error: 'GOOGLE_AUTH_REQUIRED' })
      .mockResolvedValueOnce({ success: true });
    const api = makeApi({ createCalendarEvent });
    const { warnings } = await saveTransaction(values({ google: true }), { mode: 'create' }, api);
    expect(api.promptGoogleAuth).toHaveBeenCalledTimes(1);
    expect(createCalendarEvent).toHaveBeenCalledTimes(2);
    expect(warnings).toEqual([]);
  });

  it('Google recusado não desfaz o lançamento', async () => {
    const api = makeApi({
      createCalendarEvent: jest.fn(async () => ({ success: false, error: 'GOOGLE_AUTH_REQUIRED' })),
      promptGoogleAuth: jest.fn(async () => false),
    });
    const { warnings, transaction } = await saveTransaction(values({ google: true }), { mode: 'create' }, api);
    expect(transaction.id).toBe('t1');
    expect(warnings).toEqual([GOOGLE_NOT_CONNECTED_WARNING]);
  });

  it('lançamento já pago não cria lembrete', async () => {
    const api = makeApi();
    await saveTransaction(values({ google: true, realizado: true }), { mode: 'create' }, api);
    expect(api.createCalendarEvent).not.toHaveBeenCalled();
  });
});
