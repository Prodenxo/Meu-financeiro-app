import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Text } from 'react-native';
import { getOverviewTokens } from '../../Dashboard/overview/overviewTokens';
import { ContasList } from '../ContaRow';
import { ContasSummaryCard } from '../ContasSummaryCard';

jest.mock('@/components/contas/BankLogo', () => ({ BankLogo: () => null }));

const tokens = getOverviewTokens(false);
const rows = [
  {
    conta: { id: 'a', nome: 'Meu Financeiro', tipo: 'dinheiro', limite_credito: null },
    isDefault: true,
    saldo: 1500,
    tipoLabel: 'Dinheiro',
  },
  {
    conta: { id: 'b', nome: 'Visa', tipo: 'cartao_credito', limite_credito: 5000 },
    isDefault: false,
    saldo: -1227,
    tipoLabel: 'Cartão de crédito',
  },
];

const texts = (tree) => tree.root.findAllByType(Text).map((n) => [].concat(n.props.children).join(''));

const render = (element) => {
  let tree;
  act(() => {
    tree = renderer.create(element);
  });
  return tree;
};

describe('ContasList', () => {
  it('mostra nome, Padrão, tipo e saldo negativo', () => {
    const all = texts(render(<ContasList rows={rows} tokens={tokens} hidden={false} stacked={false} onOpenMenu={() => {}} />)).join('|');
    expect(all).toContain('Meu Financeiro');
    expect(all).toContain('Padrão');
    expect(all).toContain('Cartão de crédito');
    expect(all.replace(/\s/g, ' ')).toContain('− R$ 1.227,00');
  });

  it('ocultar valores esconde saldos e limite de cada conta', () => {
    const all = texts(render(<ContasList rows={rows} tokens={tokens} hidden stacked onOpenMenu={() => {}} />)).join('|');
    expect(all).not.toMatch(/1\.227|1\.500|5\.000/);
    expect(all.match(/R\$ ••••••/g)).toHaveLength(2);
  });

  it('o menu de cada linha entrega a conta tocada', () => {
    const onOpenMenu = jest.fn();
    const tree = render(<ContasList rows={rows} tokens={tokens} hidden={false} stacked={false} onOpenMenu={onOpenMenu} />);
    const button = tree.root.find((n) => n.props.accessibilityLabel === 'Ações da conta Visa' && n.props.onPress);
    act(() => button.props.onPress());
    expect(onOpenMenu).toHaveBeenCalledWith(rows[1]);
  });
});

describe('ContasSummaryCard', () => {
  it('total e quantidade vêm das props; oculto não mostra o valor', () => {
    const visible = texts(render(<ContasSummaryCard tokens={tokens} total={138953.9} activeCount={5} inactiveCount={0} hidden={false} onToggleHidden={() => {}} />)).join('|');
    expect(visible.replace(/\s/g, ' ')).toContain('R$ 138.953,90');
    expect(visible).toContain('5 contas ativas');
    const hidden = texts(render(<ContasSummaryCard tokens={tokens} total={138953.9} activeCount={5} inactiveCount={1} hidden onToggleHidden={() => {}} />)).join('|');
    expect(hidden).not.toContain('138.953');
    expect(hidden).toContain('1 conta desativada não entra no total.');
  });
});
