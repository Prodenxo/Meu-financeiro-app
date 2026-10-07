import { normalizeLancamentoRow } from '@/lib/finance/normalize';
import {
  activeFilterCount,
  buildCategoriasScreenModel,
  buildDistributionBar,
  categoryLines,
  countCategoryTransactions,
  deleteCategoriaMessage,
  formatShare,
  safeShare,
  validateCategoriaForm,
} from '@/lib/finance/categoriasScreen';

const userId = 'u1';
const cat = (id, nome, tipo = 'saida') => ({ id, nome, tipo, user_id: userId });
let seq = 0;
const tx = (data, classificacao, valor, tipo = 'saida', status = 'pago', extra = {}) =>
  normalizeLancamentoRow({ id: `t${(seq += 1)}`, data, classificacao, valor, tipo, status, user_id: userId, ...extra });

const categories = [
  cat(1, 'Alimentação'),
  cat(2, 'Transporte'),
  cat(3, 'Lazer'),
  cat(10, 'Salário', 'entrada'),
  cat(11, 'Freelas', 'entrada'),
];

const transactions = [
  tx('2026-10-03', 'Alimentação', 4000, 'saida', 'pago', { obs: 'mercado' }),
  tx('2026-10-07', 'alimentação ', 100, 'saida', 'a_pagar'),
  tx('2026-10-10', 'Conserto', 1895.48),
  tx('2026-09-15', 'Transporte', 300),
  tx('2026-10-05', 'Salário', 5000, 'entrada', 'recebido'),
  tx('2026-10-20', 'Freelas', 800, 'entrada', 'a_receber'),
];

const october = { year: 2026, month: 10 };
const model = (extra = {}) =>
  buildCategoriasScreenModel({ categories, transactions, selectedMonth: october, viewTipo: 'saida', ...extra });

describe('buildCategoriasScreenModel', () => {
  it('soma o mês e o tipo escolhidos e separa com/sem movimento', () => {
    const m = model();
    expect(m.total).toBeCloseTo(5995.48);
    expect(m.activeRows.map((r) => r.nome)).toEqual(['Alimentação', 'Sem categoria']);
    expect(m.activeRows[0].amount).toBe(4100);
    expect(m.idleRows.map((r) => r.nome)).toEqual(['Lazer', 'Transporte']);
    expect(m.counts).toEqual({ ofTipo: 3, withMovement: 2, idle: 2 });
  });

  it('muda de mês: setembro só tem Transporte', () => {
    const m = model({ selectedMonth: { year: 2026, month: 9 } });
    expect(m.total).toBe(300);
    expect(m.activeRows.map((r) => r.nome)).toEqual(['Transporte']);
  });

  it('entradas: por categoria conta o recebido; sem recebido usa o previsto (regra do site)', () => {
    const m = model({ viewTipo: 'entrada' });
    expect(m.total).toBe(5800);
    const byName = Object.fromEntries(m.activeRows.map((r) => [r.nome, r.amount]));
    expect(byName).toEqual({ Salário: 5000, Freelas: 800 });
  });

  it('busca sem acento encontra categoria zerada mesmo com o grupo recolhido', () => {
    const m = model({ search: 'LAZ' });
    expect(m.activeRows).toEqual([]);
    expect(m.idleRows.map((r) => r.nome)).toEqual(['Lazer']);
    expect(model({ search: 'alimentacao' }).activeRows.map((r) => r.nome)).toEqual(['Alimentação']);
    expect(model({ search: 'xyz' }).resultCount).toBe(0);
  });

  it('filtros: só com movimento, só sem movimento e ordem por nome', () => {
    expect(model({ filters: { sort: 'valor', show: 'com' } }).idleRows).toEqual([]);
    expect(model({ filters: { sort: 'valor', show: 'sem' } }).activeRows).toEqual([]);
    const byName = model({ filters: { sort: 'nome', show: 'todas' } });
    expect(byName.activeRows.map((r) => r.nome)).toEqual(['Alimentação', 'Sem categoria']);
    expect(activeFilterCount({ sort: 'nome', show: 'sem' })).toBe(2);
    expect(activeFilterCount({ sort: 'valor', show: 'todas' })).toBe(0);
  });

  it('estorno: categoria com lançamento mas soma negativa fica em "com movimento" e sem percentual', () => {
    const m = buildCategoriasScreenModel({
      categories,
      transactions: [tx('2026-10-02', 'Lazer', 50), tx('2026-10-03', 'Lazer', -80)],
      selectedMonth: october,
      viewTipo: 'saida',
    });
    expect(m.activeRows.map((r) => r.nome)).toEqual(['Lazer']);
    expect(m.total).toBe(-30);
    expect(safeShare(m.activeRows[0].amount, m.total)).toBe(0);
    expect(m.distribution).toEqual([]);
  });

  it('sem lançamentos no mês: total zero, nada com movimento, sem barra', () => {
    const m = model({ selectedMonth: { year: 2030, month: 1 } });
    expect(m.total).toBe(0);
    expect(m.activeRows).toEqual([]);
    expect(m.distribution).toEqual([]);
    expect(m.idleRows).toHaveLength(3);
  });
});

describe('percentuais', () => {
  it('safeShare nunca dá NaN, negativo ou acima de 100', () => {
    expect(safeShare(4100, 5995.48)).toBeCloseTo(68.38, 1);
    expect(safeShare(10, 0)).toBe(0);
    expect(safeShare(-10, 100)).toBe(0);
    expect(safeShare(10, -100)).toBe(0);
    expect(safeShare(200, 100)).toBe(100);
    expect(safeShare(Number.NaN, 100)).toBe(0);
  });

  it('formatShare', () => {
    expect(formatShare(68.384)).toBe('68,4%');
    expect(formatShare(0.01)).toBe('<0,1%');
    expect(formatShare(0)).toBe('0%');
  });
});

describe('buildDistributionBar', () => {
  const rows = (n) =>
    Array.from({ length: n }, (_, i) => ({ id: String(i), nome: `C${i}`, amount: 100 - i, color: '#000', isOrphan: false }));

  it('agrupa as menores em "Outras" só quando sobram 2 ou mais', () => {
    const seven = buildDistributionBar(rows(7), 1000);
    expect(seven.map((s) => s.nome)).toEqual(['C0', 'C1', 'C2', 'C3', 'Outras (3)']);
    expect(seven[4].valor).toBe(96 + 95 + 94);
    expect(buildDistributionBar(rows(5), 1000)).toHaveLength(5);
  });

  it('larguras somam no máximo 100% mesmo se o total for menor que a soma', () => {
    const segs = buildDistributionBar(rows(3), 50);
    const sum = segs.reduce((s, x) => s + x.width, 0);
    expect(sum).toBeCloseTo(100);
    segs.forEach((s) => expect(s.pct).toBeLessThanOrEqual(100));
  });

  it('"Sem categoria" fica sem cor própria (neutra na tela)', () => {
    const segs = buildDistributionBar([{ id: '-1', nome: 'Sem categoria', amount: 10, color: '#f00', isOrphan: true }], 10);
    expect(segs[0].color).toBeNull();
  });
});

describe('detalhes e exclusão', () => {
  it('categoryLines: lançamentos do mês, mais recentes primeiro, com descrição ou data', () => {
    const row = model().activeRows[0];
    const lines = categoryLines(row);
    expect(lines.map((l) => l.title)).toEqual(['07 out', 'mercado']);
    expect(lines[0].statusLabel).toBe('Pendente');
    expect(lines[0].realized).toBe(false);
    expect(lines[1].valor).toBe(4000);
  });

  it('countCategoryTransactions conta todos os meses pelo nome', () => {
    expect(countCategoryTransactions(transactions, 'Alimentação')).toBe(2);
    expect(countCategoryTransactions(transactions, 'Lazer')).toBe(0);
  });

  it('deleteCategoriaMessage', () => {
    expect(deleteCategoriaMessage('Lazer', 0)).toMatch(/Nenhum lançamento/);
    expect(deleteCategoriaMessage('Lazer', 1)).toMatch(/1 lançamento passa/);
    expect(deleteCategoriaMessage('Lazer', 3)).toMatch(/3 lançamentos passam/);
  });
});

describe('validateCategoriaForm', () => {
  it('apara o nome e devolve o payload', () => {
    expect(validateCategoriaForm({ nome: '  Pets ', tipo: 'saida' }, categories)).toEqual({
      errors: null,
      payload: { nome: 'Pets', tipo: 'saida' },
    });
  });

  it('recusa vazio, longo e duplicado (sem acento/caixa, mesmo tipo)', () => {
    expect(validateCategoriaForm({ nome: ' ', tipo: 'saida' }, categories).errors.nome).toBeTruthy();
    expect(validateCategoriaForm({ nome: 'x'.repeat(61), tipo: 'saida' }, categories).errors.nome).toBeTruthy();
    expect(validateCategoriaForm({ nome: 'alimentacao', tipo: 'saida' }, categories).errors.nome).toMatch(/Já existe/);
    expect(validateCategoriaForm({ nome: 'Alimentação', tipo: 'entrada' }, categories).errors).toBeNull();
  });

  it('na edição, a própria categoria não conta como duplicada', () => {
    expect(validateCategoriaForm({ nome: 'Alimentação', tipo: 'saida' }, categories, 1).errors).toBeNull();
  });
});
