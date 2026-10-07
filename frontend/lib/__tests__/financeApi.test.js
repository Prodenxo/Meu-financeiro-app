import {
  FinanceApiError,
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

describe('toCategoryMaps', () => {
  it('monta mapas de nome e tipo por id', () => {
    expect(toCategoryMaps([{ id: 3, nome: ' Mercado ', tipo: 'saida' }, { id: 0, nome: 'x' }])).toEqual({
      categoriasMap: { 3: 'Mercado' },
      categoriasTipoMap: { 3: 'saida' },
      list: [{ id: 3, nome: 'Mercado', tipo: 'saida' }],
    });
  });
});
