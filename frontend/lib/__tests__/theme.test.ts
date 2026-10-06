import {
  darkTheme,
  getFinanceSemanticColor,
  getFinanceSemanticTint,
  getTheme,
  lightTheme,
  mfAgendaPanelChrome,
  mfCardElevation,
  mfCardShadow,
  mfWebShadow,
} from '../theme';

describe('theme — paleta do site (etapa 1)', () => {
  it('claro usa fundo lilás-claro, cards brancos e marca roxa', () => {
    expect(lightTheme.background).toBe('#f5f5fa');
    expect(lightTheme.card).toBe('#ffffff');
    expect(lightTheme.primary).toBe('#5b4fe9');
    expect(lightTheme.border).toBe('#ececf3');
  });

  it('escuro usa azul-marinho profundo e marca lilás', () => {
    expect(darkTheme.background).toBe('#0f0f1c');
    expect(darkTheme.card).toBe('#181830');
    expect(darkTheme.primary).toBe('#8b82f2');
  });

  it('expõe os tokens novos em ambos os modos', () => {
    for (const t of [lightTheme, darkTheme]) {
      expect(t.cardMuted).toBeTruthy();
      expect(t.borderStrong).toBeTruthy();
      expect(t.primaryHover).toBeTruthy();
      expect(t.primarySoft).toBeTruthy();
      expect(t.info).toBeTruthy();
      expect(t.infoLight).toBeTruthy();
      expect(t.warningLight).toBeTruthy();
      expect(t.navy).toBeTruthy();
      expect(t.textOnDark).toBe('#ffffff');
    }
  });

  it('aliases antigos apontam para os tokens novos', () => {
    expect(lightTheme.primaryLight).toBe(lightTheme.primarySoft);
    expect(lightTheme.primaryDark).toBe(lightTheme.primaryHover);
    expect(lightTheme.backgroundMuted).toBe(lightTheme.cardMuted);
    expect(lightTheme.tabActive).toBe(lightTheme.primary);
  });

  it('expõe tokens financeiros em ambos os modos', () => {
    for (const t of [lightTheme, darkTheme]) {
      expect(t.financeOpen).toBe(t.info);
      expect(t.financeReceived).toBe(t.success);
      expect(t.financeOverdue).toBe(t.error);
      expect(t.financeForecast).toBe(t.primary);
    }
  });

  it('getFinanceSemanticColor / Tint mapeiam semântica', () => {
    expect(getFinanceSemanticColor(lightTheme, 'open')).toBe(lightTheme.financeOpen);
    expect(getFinanceSemanticColor(darkTheme, 'received')).toBe(darkTheme.financeReceived);
    expect(getFinanceSemanticTint(lightTheme, 'overdue')).toBe(lightTheme.financeOverdueLight);
  });

  it('getTheme alterna light/dark', () => {
    expect(getTheme(false).background).toBe(lightTheme.background);
    expect(getTheme(true).background).toBe(darkTheme.background);
  });

  it('sombras: card é mais suave que pop; dark mais forte que light', () => {
    const asNumber = (value: unknown) => (typeof value === 'number' ? value : 0);
    const cardLight = mfCardShadow(lightTheme, false);
    const popLight = mfCardElevation(lightTheme, false);
    expect(asNumber(cardLight.shadowOpacity)).toBeLessThan(asNumber(popLight.shadowOpacity));

    const light = mfCardElevation(lightTheme, false);
    const dark = mfCardElevation(darkTheme, true);
    expect(asNumber(dark.shadowOpacity)).toBeGreaterThan(asNumber(light.shadowOpacity));
  });

  it('mfWebShadow devolve box-shadow por nível', () => {
    expect(mfWebShadow(false, 'card')).toContain('rgba(20, 20, 43');
    expect(mfWebShadow(true, 'pop')).toContain('rgba(0, 0, 0, 0.55)');
  });

  it('mfAgendaPanelChrome não corta sombra', () => {
    const chrome = mfAgendaPanelChrome(true);
    expect(chrome.overflow).toBe('visible');
  });
});
