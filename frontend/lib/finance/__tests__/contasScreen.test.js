import { normalizeContaRow } from '../contas';
import {
  activeCountLabel,
  applyBankToForm,
  applyCustomToForm,
  buildContasScreenModel,
  contaFormInitial,
  countLinkedTransactions,
  deleteContaMessage,
  formatSaldo,
  inactiveCountLabel,
  isSyncedConta,
  saldoAccessibilityLabel,
  validateContaForm,
} from '../contasScreen';
import { findBankById } from '../bankCatalog';

const conta = (over) =>
  normalizeContaRow({ id: 'x', nome: 'Conta', tipo: 'corrente', saldo_inicial: 0, ativo: true, criado_em: '2026-01-01', ...over });

const tx = (over) => ({ id: Math.random().toString(36), tipo: 'saída', valor: 0, status: 'pago', data: '2026-09-01', ...over });

describe('buildContasScreenModel', () => {
  const contas = [
    conta({ id: 'nu', nome: 'Nubank', saldo_inicial: 1000, criado_em: '2026-02-01' }),
    conta({ id: 'mf', nome: 'Meu Financeiro', tipo: 'dinheiro', saldo_inicial: 50, criado_em: '2026-03-01' }),
    conta({ id: 'cc', nome: 'Visa', tipo: 'cartao_credito', saldo_inicial: -1000 }),
    conta({ id: 'old', nome: 'Antiga', saldo_inicial: 999, ativo: false }),
  ];
  const transactions = [
    tx({ conta_id: 'nu', tipo: 'entrada', valor: 200, status: 'recebido' }),
    tx({ conta_id: 'nu', valor: 50, status: 'a_pagar' }),
    tx({ conta_id: 'cc', valor: 227 }),
    tx({ conta_id: 'old', valor: 1 }),
  ];
  const model = buildContasScreenModel(contas, transactions);

  it('soma só as contas ativas, com lançamentos realizados', () => {
    expect(model.total).toBe(1200 + 50 - 1227);
    expect(model.activeCount).toBe(3);
    expect(model.inactiveCount).toBe(1);
  });

  it('põe a conta padrão primeiro e preserva o tipo cadastrado', () => {
    expect(model.rows[0]).toMatchObject({ isDefault: true, conta: expect.objectContaining({ id: 'mf' }) });
    const visa = model.rows.find((r) => r.conta.id === 'cc');
    expect(visa).toMatchObject({ saldo: -1227, tipoLabel: 'Cartão de crédito', isDefault: false });
  });

  it('não inventa conta quando não há dados', () => {
    expect(buildContasScreenModel([], [])).toEqual({ rows: [], total: 0, activeCount: 0, inactiveCount: 0 });
  });
});

describe('textos', () => {
  it('quantidade de contas no singular e plural', () => {
    expect(activeCountLabel(1)).toBe('1 conta ativa');
    expect(activeCountLabel(5)).toBe('5 contas ativas');
    expect(inactiveCountLabel(0)).toBe('');
    expect(inactiveCountLabel(2)).toMatch(/2 contas desativadas/);
  });

  it('saldo negativo com sinal separado e leitura acessível', () => {
    expect(formatSaldo(-1227).replace(/\s/g, ' ')).toBe('− R$ 1.227,00');
    expect(saldoAccessibilityLabel(-10, false)).toMatch(/negativo/);
    expect(saldoAccessibilityLabel(-10, true)).toBe('Saldo oculto');
  });

  it('confirmação de exclusão diz quantos lançamentos ficam sem conta', () => {
    const list = [tx({ conta_id: 'a' }), tx({ conta_id: 'a' }), tx({ conta_id: 'b' })];
    expect(countLinkedTransactions(list, 'a')).toBe(2);
    expect(deleteContaMessage('Nubank', 2)).toMatch(/2 lançamentos vinculados ficarão sem conta/);
    expect(deleteContaMessage('Nubank', 0)).toMatch(/Nenhum lançamento/);
  });

  it('sincronizada só com provedor e id externo', () => {
    expect(isSyncedConta({ of_provider: 'pluggy', of_external_id: 'x' })).toBe(true);
    expect(isSyncedConta({ of_provider: 'pluggy', of_external_id: null })).toBe(false);
  });
});

describe('formulário', () => {
  it('banco do catálogo preenche nome, cor e tipo', () => {
    const form = applyBankToForm(contaFormInitial(null), findBankById('nubank'));
    expect(form).toMatchObject({ mode: 'catalog', bankId: 'nubank', nome: 'Nubank', cor: '#820AD1' });
    const { errors, payload } = validateContaForm({ ...form, saldo: '1.500,50' });
    expect(errors).toBeNull();
    expect(payload).toMatchObject({ bank_mode: 'catalog', instituicao_id: 'nubank', saldo_inicial: 1500.5, limite_credito: null });
  });

  it('"Outra conta" usa o nome padrão e não grava instituição', () => {
    const form = applyCustomToForm(contaFormInitial(null), 'Meu Financeiro');
    const { payload } = validateContaForm({ ...form, saldo: '0' });
    expect(payload).toMatchObject({ bank_mode: 'custom', instituicao_id: null, nome: 'Meu Financeiro', tipo: 'dinheiro' });
  });

  it('edição carrega os valores atuais', () => {
    const form = contaFormInitial(
      conta({ nome: 'Visa', tipo: 'cartao_credito', saldo_inicial: -12.5, limite_credito: 3000, dia_fechamento: 5, cor: '#123456' }),
    );
    expect(form).toMatchObject({ mode: 'custom', saldo: '-12,50', limite: '3000,00', fechamento: '5', vencimento: '' });
  });

  it('mesmas mensagens do site', () => {
    const { errors } = validateContaForm({
      mode: null,
      nome: '',
      tipo: 'cartao_credito',
      saldo: '',
      limite: '-1',
      fechamento: '40',
      vencimento: '',
      cor: '',
    });
    expect(errors).toEqual({
      bank: 'Escolha um banco ou "Outra conta".',
      nome: 'Informe um nome para a conta.',
      saldo_inicial: 'Informe um saldo válido.',
      limite_credito: 'Informe um limite válido.',
      dia_fechamento: 'Dia entre 1 e 31.',
      cor: 'Escolha uma cor.',
    });
  });
});
