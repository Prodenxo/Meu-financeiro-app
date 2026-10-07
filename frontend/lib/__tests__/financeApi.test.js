import {
  FinanceApiError,
  createConta,
  createTransaction,
  deleteConta,
  updateConta,
  deleteTransaction,
  updateTransaction,
  fetchContas,
  fetchTransactions,
  financeGet,
  toCategoryMaps,
} from '@/lib/financeApi';

const mockRefreshSession = jest.fn();
const mockGetSession = jest.fn();
const mockFrom = jest.fn();

jest.mock('@/lib/apiClient', () => ({
  getMeiApiUrl: (path) => `http://api.test/api${path}`,
  getMeiApiAuthHeaders: jest.fn(async () => ({ Authorization: 'Bearer token' })),
}));

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      refreshSession: (...args) => mockRefreshSession(...args),
      getSession: (...args) => mockGetSession(...args),
    },
    from: (...args) => mockFrom(...args),
  },
}));

const jsonResponse = (status, body) => ({
  status,
  ok: status >= 200 && status < 300,
  headers: { get: () => 'application/json' },
  json: async () => body,
});

beforeEach(() => {
  global.fetch = jest.fn();
  mockRefreshSession.mockReset();
  mockGetSession.mockReset();
  mockFrom.mockReset();
});

describe('financeGet', () => {
  it('devolve `data` do envelope do backend', async () => {
    global.fetch.mockResolvedValueOnce(jsonResponse(200, { success: true, data: [1, 2] }));
    await expect(financeGet('/x')).resolves.toEqual([1, 2]);
    expect(global.fetch).toHaveBeenCalledWith(
      'http://api.test/api/x',
      expect.objectContaining({ headers: { Authorization: 'Bearer token' } }),
    );
  });

  it('renova a sessão e repete uma vez em 401', async () => {
    global.fetch
      .mockResolvedValueOnce(jsonResponse(401, { success: false, message: 'Token inválido' }))
      .mockResolvedValueOnce(jsonResponse(200, { success: true, data: 'ok' }));
    mockRefreshSession.mockResolvedValueOnce({ data: { session: { access_token: 'novo' } }, error: null });
    await expect(financeGet('/x')).resolves.toBe('ok');
    expect(mockRefreshSession).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('sessão que não renova vira erro de autenticação', async () => {
    global.fetch.mockResolvedValueOnce(jsonResponse(401, { success: false }));
    mockRefreshSession.mockResolvedValueOnce({ data: { session: null }, error: new Error('x') });
    await expect(financeGet('/x')).rejects.toMatchObject({ kind: 'auth', status: 401 });
  });

  it('falha de rede é erro, nunca lista vazia', async () => {
    global.fetch.mockRejectedValueOnce(new TypeError('Network request failed'));
    await expect(fetchTransactions()).rejects.toMatchObject({ kind: 'network' });
  });

  it('erro HTTP usa a mensagem do servidor', async () => {
    global.fetch.mockResolvedValueOnce(jsonResponse(500, { success: false, message: 'Falhou' }));
    const error = await financeGet('/x').catch((e) => e);
    expect(error).toBeInstanceOf(FinanceApiError);
    expect(error).toMatchObject({ kind: 'http', status: 500, message: 'Falhou' });
  });
});

describe('gravações', () => {
  it('POST envia JSON e devolve a linha normalizada', async () => {
    global.fetch.mockResolvedValueOnce(
      jsonResponse(200, { success: true, data: { id: 9, tipo: 'saida', valor: '5', status: 'a_pagar' } }),
    );
    const row = await createTransaction({ tipo: 'saída', valor: 5 });
    expect(row).toMatchObject({ id: '9', tipo: 'saída', valor: 5 });
    const [, init] = global.fetch.mock.calls[0];
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({ tipo: 'saída', valor: 5 });
  });

  it('DELETE leva id e escopo na query', async () => {
    global.fetch.mockResolvedValueOnce(jsonResponse(200, { success: true, data: { success: true } }));
    await deleteTransaction('abc', 'futuros');
    const [url, init] = global.fetch.mock.calls[0];
    expect(url).toBe('http://api.test/api/transactions?id=abc&escopo=futuros');
    expect(init.method).toBe('DELETE');
    expect(init.body).toBeUndefined();
  });

  it('erro na gravação não é engolido', async () => {
    global.fetch.mockResolvedValueOnce(jsonResponse(400, { success: false, message: 'Conta não encontrada' }));
    await expect(updateTransaction('1', { conta_id: 'x' })).rejects.toMatchObject({
      kind: 'http',
      message: 'Conta não encontrada',
    });
  });
});

describe('fetchTransactions', () => {
  it('normaliza a linha como o site (id texto, valor número, saida → saída)', async () => {
    global.fetch.mockResolvedValueOnce(
      jsonResponse(200, {
        success: true,
        data: [{ id: 1, tipo: 'saida', valor: '10.5', data: '2026-09-01', status: null, conta_id: 7 }],
      }),
    );
    const [row] = await fetchTransactions();
    expect(row).toMatchObject({ id: '1', tipo: 'saída', valor: 10.5, status: '', conta_id: '7' });
  });
});

describe('fetchContas', () => {
  it('ordena por nome', async () => {
    global.fetch.mockResolvedValueOnce(
      jsonResponse(200, {
        success: true,
        data: [
          { id: 'b', nome: 'Nubank', saldo_inicial: '0' },
          { id: 'a', nome: 'Banco do Brasil', saldo_inicial: 10 },
        ],
      }),
    );
    const contas = await fetchContas();
    expect(contas.map((c) => c.nome)).toEqual(['Banco do Brasil', 'Nubank']);
  });

  it('servidor sem a rota (404) lê as contas com o token do usuário', async () => {
    global.fetch.mockResolvedValueOnce(jsonResponse(404, { success: false, message: 'Rota não encontrada' }));
    mockGetSession.mockResolvedValueOnce({ data: { session: { user: { id: 'u1' } } } });
    const order = jest.fn(async () => ({ data: [{ id: 'c1', nome: 'Inter', saldo_inicial: 5 }], error: null }));
    const eq = jest.fn(() => ({ order }));
    mockFrom.mockReturnValueOnce({ select: () => ({ eq }) });

    const contas = await fetchContas();
    expect(mockFrom).toHaveBeenCalledWith('contas_financeiras');
    expect(eq).toHaveBeenCalledWith('user_id', 'u1');
    expect(contas).toEqual([expect.objectContaining({ id: 'c1', nome: 'Inter', saldo_inicial: 5 })]);
  });

  it('outros erros não caem no plano B', async () => {
    global.fetch.mockResolvedValueOnce(jsonResponse(500, { success: false }));
    await expect(fetchContas()).rejects.toMatchObject({ status: 500 });
    expect(mockFrom).not.toHaveBeenCalled();
  });
});

const htmlNotFound = () => ({
  status: 404,
  ok: false,
  headers: { get: () => 'text/html' },
  json: async () => {
    throw new Error('html');
  },
});

const contaPayload = {
  bank_mode: 'catalog',
  instituicao_id: 'nubank',
  nome: 'Nubank',
  tipo: 'corrente',
  saldo_inicial: 10,
  limite_credito: null,
  dia_fechamento: null,
  dia_vencimento: null,
  cor: '#820AD1',
};

describe('contas: gravações', () => {
  it('POST /contas-financeiras envia o corpo e normaliza a resposta', async () => {
    global.fetch.mockResolvedValueOnce(
      jsonResponse(201, { success: true, data: { id: 'c9', nome: 'Nubank', saldo_inicial: '10', ativo: true } }),
    );
    const conta = await createConta(contaPayload);
    const [url, init] = global.fetch.mock.calls[0];
    expect(url).toBe('http://api.test/api/contas-financeiras');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual(contaPayload);
    expect(conta).toMatchObject({ id: 'c9', saldo_inicial: 10, ativo: true });
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('erro de validação traz as mensagens por campo', async () => {
    global.fetch.mockResolvedValueOnce(
      jsonResponse(400, { success: false, message: 'Revise os campos da conta.', errors: { nome: 'Informe um nome para a conta.' } }),
    );
    await expect(updateConta('c1', contaPayload)).rejects.toMatchObject({
      status: 400,
      errors: { nome: 'Informe um nome para a conta.' },
      routeMissing: false,
    });
  });

  it('conta inexistente (404 com JSON) não cai no plano B', async () => {
    global.fetch.mockResolvedValueOnce(jsonResponse(404, { success: false, message: 'Conta não encontrada.' }));
    await expect(deleteConta('x')).rejects.toMatchObject({ status: 404, message: 'Conta não encontrada.' });
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('servidor sem a rota grava com o token do usuário, sem campos internos', async () => {
    global.fetch.mockResolvedValueOnce(htmlNotFound());
    mockGetSession.mockResolvedValueOnce({ data: { session: { user: { id: 'u1' } } } });
    const single = jest.fn(async () => ({ data: { id: 'n1', nome: 'Nubank', saldo_inicial: 10 }, error: null }));
    const insert = jest.fn(() => ({ select: () => ({ single }) }));
    mockFrom.mockReturnValueOnce({ insert });

    const conta = await createConta(contaPayload);
    const row = insert.mock.calls[0][0];
    expect(row).toMatchObject({ nome: 'Nubank', instituicao_id: 'nubank', user_id: 'u1' });
    expect(row).not.toHaveProperty('bank_mode');
    expect(conta.id).toBe('n1');
  });

  it('DELETE usa o id na URL', async () => {
    global.fetch.mockResolvedValueOnce(jsonResponse(200, { success: true, data: { id: 'a b' } }));
    await deleteConta('a b');
    const [url, init] = global.fetch.mock.calls[0];
    expect(url).toBe('http://api.test/api/contas-financeiras/a%20b');
    expect(init.method).toBe('DELETE');
  });
});

describe('toCategoryMaps', () => {
  it('monta mapas de nome e tipo por id', () => {
    expect(toCategoryMaps([{ id: 3, nome: ' Mercado ', tipo: 'saida' }, { id: 0, nome: 'x' }])).toEqual({
      categoriasMap: { 3: 'Mercado' },
      categoriasTipoMap: { 3: 'saida' },
      list: [{ id: 3, nome: 'Mercado', tipo: 'saida' }],
    });
  });
});
