import {
  APP_NAV_ITEMS,
  BOTTOM_NAV_SCREENS,
  getBottomNavItems,
  isBottomNavMenuActive,
  resolveAppScreenFromPath,
} from '../appNavConfig';

describe('appNavConfig — menu inferior', () => {
  it('abas fixas: Início, Transações, Contas, Agenda (sem MEI)', () => {
    const items = getBottomNavItems();
    expect(items.map((i) => i.screen)).toEqual(['Dashboard', 'Transacoes', 'Contas', 'Agenda']);
    expect(items.map((i) => i.shortLabel)).toEqual(['Início', 'Transações', 'Contas', 'Agenda']);
    expect(items.some((i) => i.screen === 'MeuMei')).toBe(false);
  });

  it('ignora itens que não existem no catálogo', () => {
    const semContas = APP_NAV_ITEMS.filter((i) => i.screen !== 'Contas');
    expect(getBottomNavItems(semContas).map((i) => i.screen)).toEqual([
      'Dashboard',
      'Transacoes',
      'Agenda',
    ]);
  });

  it('"Mais" fica ativo nas telas sem aba própria', () => {
    for (const screen of BOTTOM_NAV_SCREENS) {
      expect(isBottomNavMenuActive(screen)).toBe(false);
    }
    expect(isBottomNavMenuActive('Categorias')).toBe(true);
    expect(isBottomNavMenuActive('Orcamentos')).toBe(true);
    expect(isBottomNavMenuActive('Configuracoes')).toBe(true);
    expect(isBottomNavMenuActive('ContaGlobal')).toBe(true);
  });

  it('resolveAppScreenFromPath continua a mapear rotas', () => {
    expect(resolveAppScreenFromPath('/(app)/transacoes')).toBe('Transacoes');
    expect(resolveAppScreenFromPath('/contas')).toBe('Contas');
    expect(resolveAppScreenFromPath('/configuracoes/usuarios')).toBe('Configuracoes');
    expect(resolveAppScreenFromPath('/')).toBe('Dashboard');
  });
});
