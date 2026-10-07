import {
  SCREEN_DEFAULT_FILTERS,
  buildTransactionsScreenModel,
  categoriesForTipo,
  chipForFilters,
  countPanelFilters,
  formatDayHeader,
  groupRowsByDay,
  matchesValueSearch,
  rowSubtitle,
  summaryCaption,
  transactionStatusLabel,
} from '../transactionsScreen';

const tx = (over) => ({
  id: over.id,
  tipo: 'saída',
  valor: 10,
  classificacao: 'Alimentação',
  status: 'pago',
  data: '2026-10-10',
  criado_em: '2026-10-10T10:00:00Z',
  obs: null,
  conta_id: null,
  ...over,
});

const base = {
  selectedMonth: { year: 2026, month: 10 },
  today: new Date(2026, 9, 7, 12),
  sort: 'recentes',
};

describe('buildTransactionsScreenModel', () => {
  const transactions = [
    tx({ id: '1', valor: 4000, status: 'a_pagar', data: '2026-10-22', obs: 'mercado' }),
    tx({ id: '2', tipo: 'entrada', valor: 22, status: 'recebido', data: '2026-10-22', classificacao: 'Salário' }),
    tx({ id: '3', valor: 50, data: '2026-10-05', classificacao: 'Transporte' }),
    tx({ id: '4', valor: 999, data: '2026-09-30' }),
  ];

  it('totais usam a base inteira do mês e incluem pendentes', () => {
    const model = buildTransactionsScreenModel({ ...base, transactions, filters: SCREEN_DEFAULT_FILTERS });
    expect(model.kpis).toMatchObject({ entradas: 22, saidas: 4050, countEntradas: 1, countSaidas: 2 });
    expect(model.rows.map((r) => r.id)).toEqual(['1', '2', '3']);
  });

  it('chip Pendentes filtra a lista, mas não os totais', () => {
    const filters = { ...SCREEN_DEFAULT_FILTERS, statusFilter: 'pendente' };
    const model = buildTransactionsScreenModel({ ...base, transactions, filters });
    expect(model.rows.map((r) => r.id)).toEqual(['1']);
    expect(model.kpis.saidas).toBe(4050);
    expect(model.totalsIgnorePills).toBe(true);
  });

  it('busca por valor e categoria entram nos totais', () => {
    const byValue = buildTransactionsScreenModel({
      ...base,
      transactions,
      filters: { ...SCREEN_DEFAULT_FILTERS, search: '4.000,00' },
    });
    expect(byValue.rows.map((r) => r.id)).toEqual(['1']);
    expect(byValue.kpis.saidas).toBe(4000);

    const byCategoria = buildTransactionsScreenModel({
      ...base,
      transactions,
      filters: { ...SCREEN_DEFAULT_FILTERS, categoria: 'transporte' },
    });
    expect(byCategoria.rows.map((r) => r.id)).toEqual(['3']);
  });

  it('previsões de recorrência aparecem na lista sem entrar nos totais nem na exportação', () => {
    const recorrencias = [
      {
        id: 'r1', user_id: 'u', dia_do_mes: 15, valor: 100, classificacao: 'Aluguel', tipo: 'saida',
        status: 'a_pagar', obs: null, categoria: null, ativo: true, max_ocorrencias: null, criado_em: '2026-01-01',
      },
    ];
    const model = buildTransactionsScreenModel({ ...base, transactions, recorrencias, filters: SCREEN_DEFAULT_FILTERS });
    expect(model.rows.some((r) => r.id === 'proj_r1_2026-10')).toBe(true);
    expect(model.exportRows.some((r) => r.id === 'proj_r1_2026-10')).toBe(false);
    expect(model.kpis.saidas).toBe(4050);
  });
});

describe('matchesValueSearch', () => {
  it('aceita formatos brasileiros e ignora texto', () => {
    const t = { valor: 4000 };
    expect(matchesValueSearch(t, '4000')).toBe(true);
    expect(matchesValueSearch(t, '4.000')).toBe(true);
    expect(matchesValueSearch(t, 'R$ 4.000,00')).toBe(true);
    expect(matchesValueSearch(t, 'mercado')).toBe(false);
    expect(matchesValueSearch(t, '')).toBe(false);
  });
});

describe('agrupamento por dia', () => {
  it('um cabeçalho por dia, sem repetir', () => {
    const rows = [tx({ id: 'a', data: '2026-10-22' }), tx({ id: 'b', data: '2026-10-22' }), tx({ id: 'c', data: '2026-10-05' })];
    const sections = groupRowsByDay(rows, 'recentes');
    expect(sections.map((s) => s.key)).toEqual(['2026-10-22', '2026-10-05']);
    expect(sections[0].title).toBe('22 de outubro • quinta-feira');
    expect(sections[0].data).toHaveLength(2);
  });

  it('ordenação por valor vira uma lista única', () => {
    const sections = groupRowsByDay([tx({ id: 'a' })], 'maior');
    expect(sections).toEqual([{ key: 'todas', title: null, data: [expect.objectContaining({ id: 'a' })] }]);
    expect(groupRowsByDay([], 'maior')).toEqual([]);
  });

  it('formatDayHeader tolera data inválida', () => {
    expect(formatDayHeader('')).toBe('');
  });
});

describe('apresentação', () => {
  it('rótulos de situação como na referência', () => {
    expect(transactionStatusLabel({ tipo: 'saída', status: 'a_pagar' })).toBe('A pagar');
    expect(transactionStatusLabel({ tipo: 'entrada', status: 'a_receber' })).toBe('A receber');
    expect(transactionStatusLabel({ tipo: 'entrada', status: 'recebido' })).toBe('Recebido');
    expect(transactionStatusLabel({ tipo: 'saída', status: 'pago' })).toBe('Pago');
  });

  it('segunda linha mostra observação e conta', () => {
    expect(rowSubtitle({ obs: 'mercado', conta_id: null })).toBe('mercado • Sem conta');
    expect(rowSubtitle({ obs: '', conta_id: 'c1' }, { c1: 'PagSeguro' })).toBe('PagSeguro');
  });

  it('chips mapeiam tipo/situação', () => {
    expect(chipForFilters({ typeFilter: 'all', statusFilter: 'pendente' })).toBe('pendentes');
    expect(chipForFilters({ typeFilter: 'entrada', statusFilter: 'pago' })).toBeNull();
  });

  it('selo de filtros conta só o que está no painel', () => {
    expect(countPanelFilters(SCREEN_DEFAULT_FILTERS, 'recentes')).toBe(0);
    expect(countPanelFilters({ ...SCREEN_DEFAULT_FILTERS, contaFilter: 'c1', categoria: 'X' }, 'maior')).toBe(3);
  });

  it('legenda do resumo explica o escopo dos totais', () => {
    const caption = summaryCaption(
      { period: { mode: 'month', label: 'Outubro 2026' }, totalsIgnorePills: true },
      { ...SCREEN_DEFAULT_FILTERS, search: 'x', contaFilter: 'c1' },
    );
    expect(caption).toBe(
      'Totais de Outubro 2026, com busca e conta. Inclui lançamentos pendentes; previsões de recorrência não entram. O filtro de tipo/situação muda só a lista, não os totais.',
    );
  });

  it('categorias do formulário seguem o tipo', () => {
    const list = [{ nome: 'A', tipo: 'saida' }, { nome: 'B', tipo: 'saída' }, { nome: 'C', tipo: 'entrada' }];
    expect(categoriesForTipo(list, 'saída').map((c) => c.nome)).toEqual(['A', 'B']);
    expect(categoriesForTipo(list, 'entrada').map((c) => c.nome)).toEqual(['C']);
  });
});
