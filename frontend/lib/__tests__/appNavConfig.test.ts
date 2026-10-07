import {
  APP_NAV_ITEMS,
  BOTTOM_NAV_SCREENS,
  getBottomNavItems,
  isBottomNavMenuActive,
  resolveAppScreenFromPath,
  SCREEN_TO_HREF,
} from '../appNavConfig';

describe('appNavConfig — menu inferior', () => {
  it('abas fixas: Início, Transações, Contas, Agenda', () => {
    const items = getBottomNavItems();
    expect(items.map((i) => i.screen)).toEqual(['Dashboard', 'Transacoes', 'Contas', 'Agenda']);
    expect(items.map((i) => i.shortLabel)).toEqual(['Início', 'Transações', 'Contas', 'Agenda']);
  });

  it('não tem área MEI no app', () => {
    expect(APP_NAV_ITEMS.some((i) => /mei/i.test(i.label))).toBe(false);
    expect(Object.values(SCREEN_TO_HREF).some((href) => href.includes('/mei'))).toBe(false);
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
