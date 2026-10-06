import React from 'react';
import { Text } from 'react-native';
import renderer, { act } from 'react-test-renderer';
import { MfButton } from '../ui/MfButton';
import { MfCard } from '../ui/MfCard';

jest.mock('../../store/themeStore', () => ({
  useThemeStore: (selector?: (s: { isDarkMode: boolean }) => unknown) => {
    const state = { isDarkMode: false };
    return selector ? selector(state) : state;
  },
}));

describe('MfButton', () => {
  it('renderiza o rótulo e dispara onPress', () => {
    const onPress = jest.fn();
    let root!: renderer.ReactTestRenderer;
    act(() => {
      root = renderer.create(<MfButton label="Salvar" onPress={onPress} testID="btn" />);
    });
    const btn = root.root.find(
      (n) => n.props?.testID === 'btn' && n.props?.accessibilityRole === 'button'
    );
    act(() => {
      btn.props.onPress();
    });
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(root.root.findAllByType(Text)[0].props.children).toBe('Salvar');
  });

  it('não dispara onPress quando desativado ou carregando', () => {
    const onPress = jest.fn();
    let root!: renderer.ReactTestRenderer;
    act(() => {
      root = renderer.create(
        <>
          <MfButton label="A" onPress={onPress} disabled testID="a" />
          <MfButton label="B" onPress={onPress} loading testID="b" />
        </>
      );
    });
    const pressable = (id: string) =>
      root.root.find((n) => n.props?.testID === id && n.props?.accessibilityRole === 'button');
    expect(pressable('a').props.disabled).toBe(true);
    expect(pressable('a').props.onPress).toBeUndefined();
    expect(pressable('b').props.disabled).toBe(true);
    expect(pressable('b').props.onPress).toBeUndefined();
    expect(pressable('b').props.accessibilityState.busy).toBe(true);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('aceita todas as variantes e tamanhos sem erro', () => {
    act(() => {
      const root = renderer.create(
        <>
          <MfButton label="1" variant="primary" />
          <MfButton label="2" variant="outline" size="sm" />
          <MfButton label="3" variant="ghost" block />
          <MfButton label="4" variant="danger" />
        </>
      );
      root.unmount();
    });
  });
});

describe('MfCard', () => {
  it('mostra cabeçalho quando há título', () => {
    let root!: renderer.ReactTestRenderer;
    act(() => {
      root = renderer.create(
        <MfCard title="Resumo" subtitle="Este mês">
          <></>
        </MfCard>
      );
    });
    const texts = root.root.findAllByType(Text).map((t) => t.props.children);
    expect(texts).toEqual(['Resumo', 'Este mês']);
  });

  it('aceita todas as variantes', () => {
    act(() => {
      const root = renderer.create(
        <>
          <MfCard variant="default"><></></MfCard>
          <MfCard variant="elevated"><></></MfCard>
          <MfCard variant="outline"><></></MfCard>
          <MfCard variant="muted"><></></MfCard>
        </>
      );
      root.unmount();
    });
  });
});
