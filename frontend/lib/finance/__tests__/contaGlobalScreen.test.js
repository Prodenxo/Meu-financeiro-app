import {
  buildContaGlobalScreen,
  countLabel,
  formatIsoDayBr,
  moedaFormInitial,
  moedaFractionDigits,
  parseMoedaInput,
  sanitizeMoedaInput,
  toMoedaInput,
  validateMoedaForm,
} from '../contaGlobalScreen';
import { buildCurrencyCatalog } from '../moedas';

const contas = [
  { id: 'b', moeda: 'EUR', nome: null, valor: 1500 },
  { id: 'a', moeda: 'aed', nome: 'Viagem', valor: 150 },
  { id: 'c', moeda: 'EUR', nome: 'Wise', valor: 10.5 },
];
const rates = { AED: 1.356134474294471, EUR: 5.595344673231871 };
const sources = [
  { name: 'Frankfurter (BCE)', date: '2026-10-06', codes: ['EUR'] },
  { name: 'ExchangeRate-API', date: '2026-10-07', codes: ['AED'] },
];

describe('precisão por moeda', () => {
  it('usa as casas da moeda, limitadas às 4 do banco', () => {
    expect(moedaFractionDigits('USD')).toBe(2);
    expect(moedaFractionDigits('JPY')).toBe(0);
    expect(moedaFractionDigits('KWD')).toBe(3);
  });

  it('campo aceita só números e um separador; moeda sem centavos não aceita separador', () => {
    expect(sanitizeMoedaInput('R$ 1.500,50', 'USD')).toBe('1.50050');
    expect(sanitizeMoedaInput('12,3,4', 'USD')).toBe('12,34');
    expect(sanitizeMoedaInput('1234,5', 'JPY')).toBe('12345');
  });

  it('lê vírgula ou ponto como decimal e conta as casas', () => {
    expect(parseMoedaInput('1500,5')).toEqual({ value: 1500.5, decimals: 1 });
    expect(parseMoedaInput('1500.25')).toEqual({ value: 1500.25, decimals: 2 });
    expect(parseMoedaInput('1.500,25')).toEqual({ value: 1500.25, decimals: 2 });
    expect(parseMoedaInput('abc').value).toBeNaN();
    expect(parseMoedaInput('').value).toBeNaN();
  });

  it('valor salvo volta para o campo com as casas da moeda', () => {
    expect(toMoedaInput(1500.5, 'USD')).toBe('1500,50');
    expect(toMoedaInput(1234, 'JPY')).toBe('1234');
    expect(moedaFormInitial({ moeda: 'eur', nome: 'Wise', valor: 10 })).toEqual({ moeda: 'EUR', nome: 'Wise', valor: '10,00' });
  });
});

describe('validateMoedaForm', () => {
  const catalog = buildCurrencyCatalog(['USD', 'EUR', 'JPY']);

  it('aceita saldo zero e apelido vazio', () => {
    expect(validateMoedaForm({ moeda: 'usd', nome: '  ', valor: '0' }, { catalog })).toEqual({
      errors: null,
      payload: { moeda: 'USD', nome: null, valor: 0 },
    });
  });

  it('recusa moeda vazia, BRL, fora do catálogo, valor vazio e casas demais', () => {
    expect(validateMoedaForm({ moeda: '', valor: '' }, { catalog }).errors).toEqual({
      moeda: 'Escolha uma moeda.',
      valor: 'Informe o saldo (pode ser zero).',
    });
    expect(validateMoedaForm({ moeda: 'BRL', valor: '1' }, { catalog }).errors.moeda).toMatch(/Reais/);
    expect(validateMoedaForm({ moeda: 'XYZ', valor: '1' }, { catalog }).errors.moeda).toMatch(/fora da lista/);
    expect(validateMoedaForm({ moeda: 'USD', valor: '1,234' }, { catalog }).errors.valor).toBe('USD aceita até 2 casas decimais.');
    expect(validateMoedaForm({ moeda: 'JPY', valor: '10,5' }, { catalog }).errors.valor).toBe('JPY não tem centavos.');
    expect(validateMoedaForm({ moeda: 'USD', valor: '-5' }, { catalog }).errors.valor).toBeTruthy();
    expect(validateMoedaForm({ moeda: 'USD', valor: '1', nome: 'x'.repeat(81) }, { catalog }).errors.nome).toBeTruthy();
  });
});

describe('buildContaGlobalScreen', () => {
  it('converte com a taxa completa e soma só valores em reais', () => {
    const m = buildContaGlobalScreen({ contas, rates, sources, ratesStatus: 'ready', today: '2026-10-07' });
    expect(m.total).toBe(150 * rates.AED + 1500 * rates.EUR + 10.5 * rates.EUR);
    expect(m.totalStatus).toBe('complete');
    expect(m.rows.map((r) => r.id)).toEqual(['a', 'b', 'c']);
    expect(m.rows[0].valorBrl).toBe(150 * rates.AED);
  });

  it('cotação resumida só na tela e data antiga identificada', () => {
    const m = buildContaGlobalScreen({ contas, rates, sources, ratesStatus: 'ready', today: '2026-10-07' });
    expect(m.rows[0].rateLabel.replace(/\u00a0/g, ' ')).toBe('1 AED ≈ R$ 1,36');
    expect(m.rows[0].rateIsOld).toBe(false);
    expect(m.rows[1].rateDate).toBe('2026-10-06');
    expect(m.rows[1].rateIsOld).toBe(false);
    expect(m.hasOldRate).toBe(false);
    expect(m.oldestRateDate).toBe('2026-10-06');

    const later = buildContaGlobalScreen({ contas, rates, sources, ratesStatus: 'ready', today: '2026-10-12' });
    expect(later.rows[1].rateIsOld).toBe(true);
    expect(later.rows[0].rateIsOld).toBe(true);
    expect(later.hasOldRate).toBe(true);
  });

  it('cotação faltando: total parcial, nunca zero no lugar', () => {
    const m = buildContaGlobalScreen({ contas, rates: { EUR: rates.EUR }, sources: [], ratesStatus: 'ready' });
    expect(m.totalStatus).toBe('partial');
    expect(m.missingRates).toEqual(['AED']);
    expect(m.rows[0].valorBrl).toBeNull();
    expect(m.rows[0].rateLabel).toBeNull();
    expect(m.rows[0].rateDate).toBeNull();
  });

  it('falha ao buscar cotações: nenhuma conversão; carregando: aguardando', () => {
    expect(buildContaGlobalScreen({ contas, rates, sources, ratesStatus: 'error' }).totalStatus).toBe('none');
    expect(buildContaGlobalScreen({ contas, rates: {}, sources: [], ratesStatus: 'loading' }).totalStatus).toBe('loading');
    expect(buildContaGlobalScreen({ contas: [], rates, sources, ratesStatus: 'ready' }).totalStatus).toBe('empty');
  });

  it('mostra todos os registros, inclusive a mesma moeda repetida', () => {
    const m = buildContaGlobalScreen({ contas, rates, sources, ratesStatus: 'ready' });
    expect(m.count).toBe(3);
    expect(m.countLabel).toBe('3 saldos em 2 moedas');
    expect(m.usedCodes).toEqual(['AED', 'EUR']);
  });
});

describe('rótulos', () => {
  it('contagem e data', () => {
    expect(countLabel([])).toBe('Nenhum saldo cadastrado');
    expect(countLabel([{ moeda: 'USD' }])).toBe('1 saldo cadastrado');
    expect(countLabel([{ moeda: 'USD' }, { moeda: 'EUR' }])).toBe('2 saldos cadastrados');
    expect(formatIsoDayBr('2026-10-06')).toBe('06/10/2026');
    expect(formatIsoDayBr(null)).toBeNull();
  });
});
