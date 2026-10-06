import React from 'react';
import { Text } from 'react-native';
import renderer, { act } from 'react-test-renderer';
import { AuthBottomText, AuthButton, AuthDivider } from '../auth/AuthFormControls';
import { getAuthPalette } from '../auth/authTokens';
import { lightTheme, darkTheme } from '../../lib/theme';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

const palette = getAuthPalette(false);

describe('getAuthPalette', () => {
  it('usa as cores do tema do site', () => {
    expect(getAuthPalette(false).primaryButton).toBe(lightTheme.primary);
    expect(getAuthPalette(false).bgCanvas).toBe(lightTheme.background);
    expect(getAuthPalette(true).primaryButton).toBe(darkTheme.primary);
    expect(getAuthPalette(true).bgCanvas).toBe(darkTheme.background);
  });
});

describe('AuthDivider', () => {
  it('mostra "ou" por padrão', () => {
    let root!: renderer.ReactTestRenderer;
    act(() => {
      root = renderer.create(<AuthDivider palette={palette} />);
    });
    expect(root.root.findByType(Text).props.children).toBe('ou');
  });
});

describe('AuthBottomText', () => {
  it('dispara o link ao tocar', () => {
    const onLinkPress = jest.fn();
    let root!: renderer.ReactTestRenderer;
    act(() => {
      root = renderer.create(
        <AuthBottomText
          palette={palette}
          text="Ainda não tem conta?"
          linkLabel="Cadastre-se"
          onLinkPress={onLinkPress}
        />
      );
    });
    const link = root.root.find(
      (n) => n.props?.accessibilityRole === 'link' && n.props?.children === 'Cadastre-se'
    );
    act(() => {
      link.props.onPress();
    });
    expect(onLinkPress).toHaveBeenCalledTimes(1);
  });

  it('funciona só com texto, sem link', () => {
    let root!: renderer.ReactTestRenderer;
    act(() => {
      root = renderer.create(<AuthBottomText palette={palette} text="Recebeu um convite?" />);
    });
    expect(root.root.findAll((n) => n.props?.accessibilityRole === 'link')).toHaveLength(0);
  });
});

describe('AuthButton', () => {
  it('mostra o texto de carregando e fica desativado', () => {
    let root!: renderer.ReactTestRenderer;
    act(() => {
      root = renderer.create(
        <AuthButton label="Entrar" loadingLabel="Entrando…" loading onPress={jest.fn()} palette={palette} />
      );
    });
    const button = root.root.find(
      (n) => n.props?.accessibilityRole === 'button' && n.props?.accessibilityState
    );
    expect(button.props.accessibilityState).toEqual({ disabled: true, busy: true });
    const texts = root.root.findAllByType(Text).map((t) => t.props.children);
    expect(texts).toContain('Entrando…');
  });
});
