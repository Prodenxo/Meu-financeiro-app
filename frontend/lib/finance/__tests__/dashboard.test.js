import { buildDashboardModel, budgetTone, buildSaldoSeries, buildTodayFlow } from '../dashboard';
import { normalizeLancamentoRow } from '../normalize';
import { normalizeContaRow } from '../contas';
import { normalizeTransactionStatus, getTransactionStatusLabel } from '../status';

const month = { year: 2026, month: 9 };
const tx = (id, tipo, valor, data, status, conta_id = null) =>
  normalizeLancamentoRow({ id, user_id: 'u', tipo, valor, classificacao: 'Cat', data, status, conta_id, criado_em: `${data}T12:00:00Z` });

const contas = [
  normalizeContaRow({ id: 'c1', user_id: 'u', nome: 'Nubank', tipo: 'corrente', saldo_inicial: 1000, ativo: true }),
  normalizeContaRow({ id: 'c2', user_id: 'u', nome: 'Itaú', tipo: 'corrente', saldo_inicial: 500, ativo: false }),
];

const transactions = [
  tx(1, 'entrada', 4500, '2026-09-05', 'recebido', 'c1'),
  tx(2, 'saída', 1200, '2026-09-06', 'pago', 'c1'),
  tx(3, 'saída', 300, '2026-09-20', 'a_pagar', 'c1'),
  tx(4, 'saída', 100, '2026-09-21', 'pago', null),
  tx(5, 'saída', 900, '2026-08-10', 'pago', 'c1'),
  tx(6, 'saida', '250.50', '2026-09-22', 'pago', 'c1'),
];

const base = {
  transactions,
  contas,
  categoriasMap: {},
  categoriasTipoMap: {},
  budgetSummary: [],
  selectedMonth: month,
  today: new Date(2026, 8, 21, 12),
};

describe('buildDashboardModel (mesmos casos do site)', () => {
  it('separa saldo das contas (todas as datas) do resultado do mês (só realizado)', () => {
    const m = buildDashboardModel({ ...base, contaFilter: 'all' });
    expect(m.balance.mode).toBe('contas');
    expect(m.balance.value).toBe(3049.5);
    expect(m.balance.label).toBe('Saldo nas contas');
    expect(m.totals.income).toBe(4500);
    expect(m.totals.expenses).toBe(1550.5);
    expect(m.totals.countExpenses).toBe(3);
    expect(m.pending.total).toBe(300);
    expect(m.pending.items).toHaveLength(1);
    expect(m.monthCount).toBe(5);
    expect(m.contasComSaldo.map((c) => c.id)).toEqual(['c1']);
  });

  it('filtra por conta e por "sem conta" sem mudar a fórmula', () => {
    const c1 = buildDashboardModel({ ...base, contaFilter: 'c1' });
    expect(c1.balance.value).toBe(3149.5);
    expect(c1.balance.label).toBe('Nubank');
    expect(c1.totals.expenses).toBe(1450.5);

    const un = buildDashboardModel({ ...base, contaFilter: 'unassigned' });
    expect(un.balance.mode).toBe('unassigned');
    expect(un.balance.value).toBe(-100);
    expect(un.totals.expenses).toBe(100);
  });

  it('sem contas cadastradas usa o saldo geral pelos lançamentos', () => {
    const m = buildDashboardModel({ ...base, contas: [], contaFilter: 'all' });
    expect(m.balance.mode).toBe('legacy');
    expect(m.balance.label).toBe('Saldo geral');
    expect(m.balance.value).toBe(4500 - 1200 - 100 - 900 - 250.5);
  });

  it('série do gráfico acumula só lançamentos realizados, em ordem de data', () => {
    const series = buildSaldoSeries(transactions.filter((t) => t.data.startsWith('2026-09')));
    expect(series.map((p) => [p.dayKey, p.saldo])).toEqual([
      ['2026-09-05', 4500],
      ['2026-09-06', 3300],
      ['2026-09-21', 3200],
      ['2026-09-22', 2949.5],
    ]);
  });

  it('fluxo de hoje usa a data de referência', () => {
    const m = buildDashboardModel({ ...base, contaFilter: 'all' });
    expect(m.todayFlow.dayKey).toBe('2026-09-21');
    expect(m.todayFlow.expense).toBe(100);
    expect(m.todayFlow.income).toBe(0);
  });

  it('insights trazem os títulos completos do resumo', () => {
    const m = buildDashboardModel({ ...base, contaFilter: 'all' });
    expect(m.insights.map((i) => i.label)).toEqual([
      'Resultado do mês',
      'Quanto sobrou',
      'Média diária',
      'A pagar',
      'Lançamentos',
      'Gastos vs mês passado',
    ]);
  });

  it('orçamentos usam recebido para entrada e gasto para saída', () => {
    const m = buildDashboardModel({
      ...base,
      contaFilter: 'all',
      categoriasMap: { 10: 'Salário', 20: 'Mercado' },
      categoriasTipoMap: { 10: 'entrada', 20: 'saida' },
      budgetSummary: [
        { categorias_id: 10, valor_orcado: 5000, valor_gasto: 0, valor_recebido: 4500 },
        { categorias_id: 20, valor_orcado: 1000, valor_gasto: 800, valor_recebido: 0 },
        { categorias_id: 30, valor_orcado: null, valor_gasto: 50, valor_recebido: 0 },
      ],
    });
    expect(m.budgets).toEqual([
      expect.objectContaining({ nome: 'Salário', tipo: 'entrada', realizado: 4500, percentual: 90 }),
      expect.objectContaining({ nome: 'Mercado', tipo: 'saida', realizado: 800, percentual: 80 }),
    ]);
  });
});

describe('buildTodayFlow', () => {
  it('agrega só movimentações realizadas do dia de referência', () => {
    const today = buildTodayFlow(
      [
        { data: '2026-05-25', tipo: 'entrada', valor: 1000, status: 'recebido' },
        { data: '2026-05-25', tipo: 'saida', valor: 200, status: 'pago' },
        { data: '2026-05-24', tipo: 'entrada', valor: 5000, status: 'recebido' },
        { data: '2026-05-25', tipo: 'entrada', valor: 9000, status: 'a_receber' },
      ],
      new Date(2026, 4, 25, 12),
    );
    expect(today.dayKey).toBe('2026-05-25');
    expect(today.income).toBe(1000);
    expect(today.expense).toBe(200);
    expect(today.items).toHaveLength(2);
  });

  it('retorna zeros quando não há movimentação no dia', () => {
    const today = buildTodayFlow(
      [{ data: '2026-05-24', tipo: 'entrada', valor: 100, status: 'recebido' }],
      new Date(2026, 4, 25, 12),
    );
    expect(today.income).toBe(0);
    expect(today.expense).toBe(0);
  });
});

describe('budgetTone', () => {
  it('saída: quanto mais gasto, pior', () => {
    expect(budgetTone({ tipo: 'saida', percentual: 20 })).toBe('success');
    expect(budgetTone({ tipo: 'saida', percentual: 50 })).toBe('warning');
    expect(budgetTone({ tipo: 'saida', percentual: 75 })).toBe('orange');
    expect(budgetTone({ tipo: 'saida', percentual: 76 })).toBe('danger');
  });
  it('entrada: quanto mais recebido, melhor', () => {
    expect(budgetTone({ tipo: 'entrada', percentual: 80 })).toBe('success');
    expect(budgetTone({ tipo: 'entrada', percentual: 10 })).toBe('danger');
  });
});

describe('status', () => {
  it('normaliza por tipo como no backend', () => {
    expect(normalizeTransactionStatus('entrada', '')).toBe('recebido');
    expect(normalizeTransactionStatus('saída', '')).toBe('pago');
    expect(normalizeTransactionStatus('saída', 'a_pagar')).toBe('a_pagar');
    expect(getTransactionStatusLabel('saída', 'a_pagar')).toBe('Pendente');
    expect(getTransactionStatusLabel('entrada', 'recebido')).toBe('Recebido');
  });
});
