import {
  availableCategories,
  barWidth,
  budgetDateParam,
  budgetState,
  buildBudgetTotals,
  buildDuplicatePlan,
  buildOrcamentosModel,
  duplicateResultMessage,
  formatUsage,
  normalizeBudgetSummaryRow,
  usagePercent,
  validateBudgetForm,
} from '../orcamentosScreen';

const USER = 'u1';
const categories = [
  { id: '1', nome: 'Água', tipo: 'saida', user_id: USER },
  { id: '2', nome: 'Energia elétrica', tipo: 'saida', user_id: USER },
  { id: '3', nome: 'Salário', tipo: 'entrada', user_id: USER },
  { id: '4', nome: 'Mercado', tipo: 'saida', user_id: USER },
  { id: '9', nome: 'De outra pessoa', tipo: 'saida', user_id: 'outra' },
];
const row = (id, valor_orcado, valor_gasto = 0, valor_recebido = 0) =>
  normalizeBudgetSummaryRow({ categorias_id: id, valor_orcado, valor_gasto, valor_recebido });

describe('normalizeBudgetSummaryRow', () => {
  it('mantém nulo como "sem orçamento" e zero como limite zero', () => {
    expect(row(1, null).valor_orcado).toBeNull();
    expect(row(1, 0).valor_orcado).toBe(0);
    expect(row(1, '150.5').valor_orcado).toBe(150.5);
    expect(normalizeBudgetSummaryRow({ categorias_id: 1, valor_orcado: 'x', valor_gasto: 'y' })).toEqual({
      categorias_id: '1',
      valor_orcado: null,
      valor_gasto: 0,
      valor_recebido: 0,
    });
  });
});

describe('usagePercent / barWidth / formatUsage', () => {
  it('não gera NaN nem infinito', () => {
    expect(usagePercent(0, 100)).toBeNull();
    expect(usagePercent(0, 0)).toBeNull();
    expect(usagePercent(100, 0)).toBe(0);
    expect(usagePercent(100, -30)).toBe(0);
    expect(formatUsage(null)).toBe('—');
    expect(formatUsage(NaN)).toBe('—');
  });

  it('mantém o % real acima de 100 e limita só a barra', () => {
    const pct = usagePercent(200, 250);
    expect(pct).toBe(125);
    expect(formatUsage(pct)).toBe('125%');
    expect(barWidth(pct)).toBe(100);
    expect(formatUsage(usagePercent(300, 100))).toBe('33,3%');
    expect(formatUsage(0.04)).toBe('<0,1%');
  });

  it('limite zero com gasto enche a barra (estouro)', () => {
    expect(barWidth(null, { orcado: 0, realizado: 10 })).toBe(100);
    expect(barWidth(null, { orcado: 0, realizado: 0 })).toBe(0);
  });
});

describe('budgetState', () => {
  it('despesa zerada fica neutra (não é "economia")', () => {
    expect(budgetState({ tipo: 'saida', orcado: 100, realizado: 0 })).toMatchObject({ key: 'idle', tone: 'neutral' });
    expect(budgetState({ tipo: 'saida', orcado: 100, realizado: -20 }).key).toBe('idle');
  });

  it('faixas da despesa', () => {
    expect(budgetState({ tipo: 'saida', orcado: 100, realizado: 40 }).key).toBe('ok');
    expect(budgetState({ tipo: 'saida', orcado: 100, realizado: 80 }).key).toBe('near');
    expect(budgetState({ tipo: 'saida', orcado: 100, realizado: 100 }).key).toBe('limit');
    expect(budgetState({ tipo: 'saida', orcado: 100, realizado: 100.01 })).toMatchObject({ key: 'over', tone: 'danger' });
    expect(budgetState({ tipo: 'saida', orcado: 0, realizado: 5 }).key).toBe('over');
  });

  it('receita: meta atingida só com recebimento', () => {
    expect(budgetState({ tipo: 'entrada', orcado: 1000, realizado: 0 }).key).toBe('idle');
    expect(budgetState({ tipo: 'entrada', orcado: 1000, realizado: 500 }).key).toBe('progress');
    expect(budgetState({ tipo: 'entrada', orcado: 1000, realizado: 1200 }).key).toBe('reached');
  });
});

describe('buildOrcamentosModel', () => {
  const summary = [row(1, 100, 30), row(2, 1500, 0), row(3, 5000, 999, 6000), row(4, null, 400), row(9, 50, 10)];
  const model = buildOrcamentosModel({ summary, categories, userId: USER });

  it('só lista categorias do usuário com orçamento, em ordem alfabética', () => {
    expect(model.items.map((i) => i.nome)).toEqual(['Água', 'Energia elétrica', 'Salário']);
  });

  it('realizado de receita usa recebido; de despesa usa gasto', () => {
    expect(model.items.find((i) => i.id === '3').realizado).toBe(6000);
    expect(model.items.find((i) => i.id === '1').realizado).toBe(30);
  });

  it('categoria sem orçamento fica fora dos totais e vira opção de novo orçamento', () => {
    expect(model.totals.orcado).toBe(6600);
    expect(model.totals.realizado).toBe(6030);
    expect(model.available.map((c) => c.nome)).toEqual(['Mercado']);
  });

  it('totais sem realizado ficam neutros e sem orçamento não dividem por zero', () => {
    const empty = buildBudgetTotals([]);
    expect(empty).toMatchObject({ orcado: 0, realizado: 0, percent: null, bar: 0, tone: 'neutral', count: 0 });
    const zero = buildOrcamentosModel({ summary: [row(1, 100), row(2, 1500)], categories, userId: USER }).totals;
    expect(zero).toMatchObject({ percent: 0, tone: 'neutral' });
  });

  it('total acima do orçado fica vermelho e conta estouros', () => {
    const over = buildOrcamentosModel({ summary: [row(1, 100, 250), row(2, 100, 10)], categories, userId: USER }).totals;
    expect(over.percent).toBe(130);
    expect(over.tone).toBe('danger');
    expect(over.overCount).toBe(1);
  });

  it('ignora categoria que não veio na lista', () => {
    expect(availableCategories([row(77, null)], categories, USER)).toEqual([]);
  });
});

describe('buildDuplicatePlan', () => {
  const plan = buildDuplicatePlan({
    sourceSummary: [row(1, 100), row(2, 1500), row(3, 5000), row(4, null)],
    targetSummary: [row(1, 100), row(2, 1200), row(4, null)],
    categories,
    userId: USER,
    targetMonth: { year: 2026, month: 1 },
  });

  it('mostra origem e destino (virada de ano)', () => {
    expect(plan.sourceLabel).toBe('Dezembro de 2025');
    expect(plan.targetLabel).toBe('Janeiro de 2026');
    expect(plan.sourceCount).toBe(3);
  });

  it('separa novos, iguais e os que mudariam de valor', () => {
    expect(plan.fresh.map((f) => f.nome)).toEqual(['Salário']);
    expect(plan.same.map((f) => f.nome)).toEqual(['Água']);
    expect(plan.changed).toEqual([{ id: '2', nome: 'Energia elétrica', atual: 1200, novo: 1500 }]);
  });

  it('mensagem do resultado', () => {
    expect(duplicateResultMessage(plan, 'replace')).toBe('2 limites copiados de Dezembro de 2025 · 1 substituído.');
    expect(duplicateResultMessage(plan, 'keep')).toBe('1 limite copiado de Dezembro de 2025 · 1 mantido como estava.');
  });
});

describe('validateBudgetForm', () => {
  const month = { year: 2026, month: 10 };
  const available = [{ id: '4', nome: 'Mercado', tipo: 'saida' }];

  it('aceita valor brasileiro e arredonda em centavos', () => {
    const { errors, payload } = validateBudgetForm({ categoriaId: '4', valor: 'R$ 1.500,555', month }, { isEdit: false, available });
    expect(errors).toBeNull();
    expect(payload).toEqual({ categoriaId: '4', valor: 1500.56, month });
  });

  it('recusa vazio, texto, negativo e categoria já orçada', () => {
    expect(validateBudgetForm({ categoriaId: '', valor: '', month }, { isEdit: false, available }).errors).toEqual({
      categorias_id: 'Escolha uma categoria.',
      valor_orcado: 'Informe o valor orçado.',
    });
    expect(validateBudgetForm({ categoriaId: '4', valor: 'abc', month }, { available }).errors.valor_orcado).toMatch(/inválido/);
    expect(validateBudgetForm({ categoriaId: '4', valor: '-10', month }, { available }).errors.valor_orcado).toMatch(/negativo/);
    expect(validateBudgetForm({ categoriaId: '1', valor: '10', month }, { isEdit: false, available }).errors.categorias_id).toMatch(
      /já tem orçamento/,
    );
  });

  it('na edição a categoria atual vale; em outro mês o servidor confere a duplicidade', () => {
    expect(validateBudgetForm({ categoriaId: '1', valor: '0', month }, { isEdit: true, available }).errors).toBeNull();
    expect(validateBudgetForm({ categoriaId: '1', valor: '10', month }, { isEdit: false, available: null }).errors).toBeNull();
  });
});

describe('budgetDateParam', () => {
  it('envia meio-dia sem fuso para o servidor não trocar de mês', () => {
    expect(budgetDateParam({ year: 2026, month: 10 })).toBe('2026-10-01T12:00:00');
  });
});
